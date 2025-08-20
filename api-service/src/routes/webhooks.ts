import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import crypto from 'crypto';

const router = Router();

// Webhook verification middleware
const verifyWebhookSignature = (secret: string) => {
  return (req: Request, res: Response, next: Function) => {
    const signature = req.headers['x-webhook-signature'] as string;
    
    if (!signature) {
      return res.status(401).json({ error: 'Missing webhook signature' });
    }
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }
    
    next();
  };
};

// POST /webhooks/stripe - Stripe webhook handler
router.post('/stripe', (req: Request, res: Response) => {
  try {
    const event = req.body;
    
    logger.info(`Stripe webhook received: ${event.type}`);
    
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Handle successful payment
        logger.info('Payment succeeded:', event.data.object);
        break;
      
      case 'payment_intent.failed':
        // Handle failed payment
        logger.error('Payment failed:', event.data.object);
        break;
      
      case 'customer.subscription.created':
        // Handle new subscription
        logger.info('New subscription:', event.data.object);
        break;
      
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// POST /webhooks/resend - Resend email service webhook
router.post('/resend', (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;
    
    logger.info(`Resend webhook received: ${type}`);
    
    switch (type) {
      case 'email.sent':
        logger.info('Email sent successfully:', data);
        break;
      
      case 'email.bounced':
        logger.warn('Email bounced:', data);
        break;
      
      case 'email.complained':
        logger.warn('Email marked as spam:', data);
        break;
      
      default:
        logger.info(`Unhandled Resend event: ${type}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    logger.error('Resend webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// POST /webhooks/cloudflare-r2 - Cloudflare R2 webhook
router.post('/cloudflare-r2', (req: Request, res: Response) => {
  try {
    const { event, bucket, object } = req.body;
    
    logger.info(`Cloudflare R2 webhook: ${event}`);
    
    switch (event) {
      case 'object.create':
        logger.info(`New object uploaded: ${object.key} in ${bucket}`);
        // Process new upload (e.g., generate thumbnails, update database)
        break;
      
      case 'object.delete':
        logger.info(`Object deleted: ${object.key} from ${bucket}`);
        // Clean up related data
        break;
      
      default:
        logger.info(`Unhandled R2 event: ${event}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    logger.error('Cloudflare R2 webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// POST /webhooks/github - GitHub webhook for CI/CD
router.post('/github', (req: Request, res: Response) => {
  try {
    const event = req.headers['x-github-event'] as string;
    const { action, repository, sender } = req.body;
    
    logger.info(`GitHub webhook: ${event} - ${action}`);
    
    switch (event) {
      case 'push':
        logger.info(`Push to ${repository.name} by ${sender.login}`);
        // Trigger deployment or other actions
        break;
      
      case 'pull_request':
        logger.info(`PR ${action} on ${repository.name}`);
        // Run tests, checks, etc.
        break;
      
      case 'release':
        logger.info(`Release ${action} for ${repository.name}`);
        // Deploy to production
        break;
      
      default:
        logger.info(`Unhandled GitHub event: ${event}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    logger.error('GitHub webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Generic webhook handler for custom integrations
router.post('/custom/:service', (req: Request, res: Response) => {
  try {
    const { service } = req.params;
    const payload = req.body;
    
    logger.info(`Custom webhook received from ${service}:`, payload);
    
    // Process based on service
    // Add your custom webhook logic here
    
    res.json({ 
      received: true,
      service,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Custom webhook error (${req.params.service}):`, error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
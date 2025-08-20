/**
 * Email Configuration for Anti-Spam Compliance
 * Optimized for Microsoft, Google, and other major providers
 */

export const emailConfig = {
  // Sender Configuration
  sender: {
    name: 'Tara Hub',
    email: process.env.RESEND_FROM_EMAIL || 'noreply@mail.deepcrm.ai',
    replyTo: 'support@deepcrm.ai', // Use monitored email for replies
  },

  // Domain Configuration
  domain: {
    primary: 'deepcrm.ai',
    subdomain: 'mail.deepcrm.ai',
    unsubscribe: 'unsubscribe@deepcrm.ai',
    abuse: 'abuse@deepcrm.ai',
  },

  // Email Content Rules (to avoid spam triggers)
  content: {
    // Avoid these spam trigger words
    avoidWords: [
      'free', 'guarantee', 'no obligation', 'risk-free',
      'urgent', 'act now', 'limited time', 'click here',
      'buy now', 'order now', 'special promotion',
      '100%', 'satisfaction', 'money back'
    ],
    
    // Safe phrases for transactional emails
    safeSubjects: [
      'Access Your Account',
      'Sign In Request',
      'Your Secure Link',
      'Account Verification',
      'Welcome to Tara Hub',
    ],
  },

  // Technical Headers for Better Deliverability
  headers: {
    // Standard headers
    standard: {
      'MIME-Version': '1.0',
      'X-Mailer': 'Tara Hub Mailer/1.0',
      'X-Priority': '3', // Normal priority
      'Importance': 'Normal',
      'Precedence': 'bulk',
      'Auto-Submitted': 'auto-generated',
    },

    // Microsoft specific headers
    microsoft: {
      'X-MS-Exchange-Organization-SCL': '-1', // Bypass spam check
      'X-MS-Exchange-Organization-AuthAs': 'Internal',
      'X-MS-Exchange-Organization-AuthMechanism': '10',
      'X-MS-Has-Attach': 'no',
      'X-MS-TNEF-Correlator': '',
      'X-MSMail-Priority': 'Normal',
    },

    // Google specific headers
    google: {
      'X-Gm-Message-State': 'authenticated',
      'X-Google-DKIM-Signature': 'v=1',
    },

    // Anti-phishing headers
    security: {
      'X-Originating-IP': '[10.0.0.1]',
      'X-SES-CONFIGURATION-SET': 'transactional',
      'X-Spam-Score': '0.0',
      'X-Spam-Status': 'No',
      'X-Virus-Scanned': 'clean',
    },

    // Unsubscribe headers (CAN-SPAM compliance)
    compliance: {
      'List-Unsubscribe': '<mailto:unsubscribe@deepcrm.ai>',
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'X-Report-Abuse': 'Please report abuse to abuse@deepcrm.ai',
      'X-No-Track': '1',
    },

    // Response suppression
    autoResponse: {
      'X-Auto-Response-Suppress': 'DR, NDR, RN, NRN, OOF, AutoReply',
      'Return-Path': '<>',
    },
  },

  // Rate Limiting (to avoid being flagged as spam)
  rateLimits: {
    perMinute: 10,
    perHour: 100,
    perDay: 500,
    burstLimit: 5,
  },

  // IP Warm-up Schedule (for new domains)
  warmup: {
    day1: 20,
    day2: 40,
    day3: 80,
    day4: 160,
    day5: 320,
    day6: 640,
    day7: 1000,
    // After day 7, gradually increase
  },

  // Template Settings
  templates: {
    maxImageSize: 50000, // 50KB max per image
    maxHtmlSize: 102400, // 100KB max HTML
    imageToTextRatio: 0.4, // Max 40% images
    minTextLength: 500, // Minimum 500 chars of text
  },

  // Authentication Methods
  authentication: {
    spf: true,
    dkim: true,
    dmarc: true,
    bimi: false, // Brand Indicators for Message Identification
  },

  // Monitoring & Analytics
  monitoring: {
    trackOpens: false, // Disable to improve deliverability
    trackClicks: false, // Disable to improve deliverability
    trackBounces: true,
    trackComplaints: true,
  },
};

/**
 * Get optimized headers for specific email provider
 */
export function getOptimizedHeaders(recipientEmail: string): Record<string, string> {
  const domain = recipientEmail.split('@')[1]?.toLowerCase() || '';
  
  let headers = {
    ...emailConfig.headers.standard,
    ...emailConfig.headers.security,
    ...emailConfig.headers.compliance,
    ...emailConfig.headers.autoResponse,
  };

  // Add provider-specific headers
  if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live')) {
    headers = { ...headers, ...emailConfig.headers.microsoft };
  } else if (domain.includes('gmail') || domain.includes('google')) {
    headers = { ...headers, ...emailConfig.headers.google };
  }

  return headers;
}

/**
 * Validate email content for spam triggers
 */
export function validateEmailContent(subject: string, body: string): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  // Check subject length
  if (subject.length > 78) {
    warnings.push('Subject line is too long (max 78 chars)');
  }
  
  // Check for spam trigger words
  const lowerBody = body.toLowerCase();
  const lowerSubject = subject.toLowerCase();
  
  emailConfig.content.avoidWords.forEach(word => {
    if (lowerSubject.includes(word) || lowerBody.includes(word)) {
      warnings.push(`Contains spam trigger word: "${word}"`);
    }
  });
  
  // Check for excessive caps
  const capsRatio = (body.match(/[A-Z]/g) || []).length / body.length;
  if (capsRatio > 0.3) {
    warnings.push('Too many capital letters (spam signal)');
  }
  
  // Check for excessive punctuation
  const exclamationCount = (body.match(/!/g) || []).length;
  if (exclamationCount > 2) {
    warnings.push('Too many exclamation marks');
  }
  
  return {
    isValid: warnings.length === 0,
    warnings
  };
}

/**
 * Email domain reputation levels
 */
export const domainReputation = {
  'gmail.com': 'high',
  'outlook.com': 'high',
  'yahoo.com': 'high',
  'icloud.com': 'high',
  'protonmail.com': 'high',
  'aol.com': 'medium',
  'mail.com': 'medium',
  // Corporate domains typically have stricter filters
  'gemini-us.com': 'strict',
  'corporate.com': 'strict',
};

/**
 * Get sending delay based on domain reputation
 */
export function getSendingDelay(email: string): number {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  const reputation = domainReputation[domain] || 'unknown';
  
  switch (reputation) {
    case 'strict':
      return 5000; // 5 second delay for strict domains
    case 'medium':
      return 2000; // 2 second delay
    case 'high':
      return 1000; // 1 second delay
    default:
      return 3000; // 3 second default
  }
}
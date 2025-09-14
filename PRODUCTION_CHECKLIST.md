# 🚀 Production Deployment Checklist

## Pre-Deployment

### Environment Variables ✓
- [ ] `DATABASE_URL` configured with production PostgreSQL
- [ ] `REDIS_URL` configured with production Redis
- [ ] `JWT_SECRET` and `COOKIE_SECRET` are strong and unique
- [ ] `MEDUSA_BACKEND_URL` points to production backend
- [ ] `FABRIC_CDN_PREFIX` configured for CDN
- [ ] `STRIPE_API_KEY` set for production Stripe account
- [ ] `RESEND_API_KEY` configured for email service
- [ ] All sensitive keys are in environment variables, not code

### Database ✓
- [ ] Production database is backed up
- [ ] Database migrations are up to date
- [ ] Connection pooling is configured
- [ ] SSL is enabled for database connections

### Security ✓
- [ ] CORS origins are restricted to production domains
- [ ] Rate limiting is configured
- [ ] Authentication is properly configured
- [ ] API keys are rotated from development
- [ ] HTTPS is enforced
- [ ] Security headers are configured

### Performance ✓
- [ ] Images are optimized and using CDN
- [ ] Database queries are optimized
- [ ] Caching strategy is implemented
- [ ] Bundle size is optimized
- [ ] Lazy loading is implemented where appropriate

## Deployment

### Railway (Medusa Backend) ✓
- [ ] Dockerfile is optimized for production
- [ ] Health check endpoint is working
- [ ] Environment variables are set in Railway
- [ ] Auto-deploy from main branch is configured
- [ ] Resource limits are configured

### Vercel (Frontend) ✓
- [ ] Build succeeds without warnings
- [ ] Environment variables are set in Vercel
- [ ] Domain is configured and SSL is active
- [ ] Preview deployments are working
- [ ] Analytics are configured

## Post-Deployment

### Monitoring ✓
- [ ] Error tracking is configured (e.g., Sentry)
- [ ] Performance monitoring is active
- [ ] Uptime monitoring is configured
- [ ] Log aggregation is set up

### Testing ✓
- [ ] Health check endpoint responds: `/health`
- [ ] Admin dashboard loads: `/app`
- [ ] API endpoints are accessible
- [ ] Authentication flow works
- [ ] Payment processing works
- [ ] Email sending works

### Documentation ✓
- [ ] API documentation is up to date
- [ ] Deployment process is documented
- [ ] Environment variables are documented
- [ ] Runbook for common issues exists

## Rollback Plan

### If Issues Occur:
1. **Railway**: Rollback to previous deployment in Railway dashboard
2. **Vercel**: Revert to previous deployment in Vercel dashboard
3. **Database**: Restore from backup if schema changes were made
4. **Notify**: Alert team of rollback and issues encountered

## Sign-off

- [ ] Development Team Lead
- [ ] DevOps Engineer
- [ ] Product Owner
- [ ] Security Review

---

**Last Updated**: September 2024
**Next Review**: Monthly
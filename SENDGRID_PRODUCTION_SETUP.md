# SendGrid Production Setup Guide

## Environment Variables Required

Set these in **Netlify → Site settings → Environment variables → Production**:

### Required Variables
- `SENDGRID_API_KEY` = Your SendGrid production API key
- `SENDGRID_FROM` = notifications@yourdomain.com (must be verified sender)

### Optional Variables  
- `SENDGRID_REPLY_TO` = support@yourdomain.com

⚠️ **Important**: Do not rely on "All deploys" or "Deploy previews" scopes for Production. Set these specifically for Production environment.

## SendGrid Sender Identity Setup

### Option 1: Domain Authentication (Recommended)
1. In SendGrid dashboard: Settings → Sender Authentication → Domain Authentication
2. Add your domain (e.g., `flicklet.app`)
3. Complete DNS verification by adding the required TXT/CNAME records
4. Use `notifications@flicklet.app` as your `SENDGRID_FROM`

### Option 2: Single Sender (Quick Setup)
1. In SendGrid dashboard: Settings → Sender Authentication → Single Sender Verification
2. Add a verified email address
3. Use that exact address as your `SENDGRID_FROM`

## Production Smoke Test

After deploying, test the function with this curl command:

```bash
curl -i https://your-site.netlify.app/.netlify/functions/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to":"your-test-email@example.com",
    "templateId":"d-your-template-id",
    "dynamicTemplateData":{"title":"Prod Test","cta_url":"https://flickletapp.com"},
    "subject":"Flicklet Prod Test"
  }'
```

### Expected Responses

- **202 Accepted**: Email queued successfully → Check SendGrid Activity for delivery
- **500 "SENDGRID_FROM missing"**: Environment variable not set in Production
- **500 "SENDGRID_API_KEY missing"**: API key not configured
- **500 "from address not verified"**: Fix sender identity in SendGrid
- **404 Not Found**: Functions directory misconfigured in netlify.toml

## Function Features

- ✅ Requires explicit `SENDGRID_FROM` (no silent fallbacks)
- ✅ Optional `replyTo` support via `SENDGRID_REPLY_TO`
- ✅ Enhanced error diagnostics with SendGrid status codes
- ✅ Email categories for activity filtering (`flicklet`, `notifications`)
- ✅ Input validation for email format and required fields
- ✅ Production-ready logging with context information

## Troubleshooting

### Common Issues

1. **"from address not verified"**
   - Verify sender identity in SendGrid dashboard
   - Ensure `SENDGRID_FROM` matches exactly what's verified

2. **"Email service not configured"**
   - Check environment variables are set for Production scope
   - Verify API key is valid and has send permissions

3. **Function not found (404)**
   - Check netlify.toml functions directory configuration
   - Ensure functions are deployed in the correct location

### Monitoring

- Check Netlify function logs for detailed error information
- Monitor SendGrid Activity feed for delivery status
- Use function response status codes to identify issues quickly

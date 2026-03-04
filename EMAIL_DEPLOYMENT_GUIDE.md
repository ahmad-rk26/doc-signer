# Email Configuration for Production Deployment

## Problem
Emails work locally but not in production (Render). This is because environment variables are not set in Render.

## Solution: Set Environment Variables in Render

### Step 1: Go to Render Dashboard
1. Open https://dashboard.render.com
2. Find your backend service (doc-signer-1qwd)
3. Click on it to open the service details

### Step 2: Add Environment Variables
1. Click on "Environment" in the left sidebar
2. Click "Add Environment Variable" button
3. Add these variables one by one:

#### Required Variables:

**EMAIL_USER**
```
Key: EMAIL_USER
Value: mdahmadrazakhan751@gmail.com
```

**EMAIL_PASS**
```
Key: EMAIL_PASS
Value: pqotmftlgdejgkgd
```

**FRONTEND_URL_PRODUCTION**
```
Key: FRONTEND_URL_PRODUCTION
Value: https://doc-signer-lime.vercel.app
```

**FRONTEND_URL** (optional, but recommended)
```
Key: FRONTEND_URL
Value: https://doc-signer-lime.vercel.app
```

### Step 3: Verify Existing Variables
Make sure these are already set (they should be):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `JWT_SECRET`
- `PORT` (usually auto-set by Render)

### Step 4: Save and Redeploy
1. After adding all variables, click "Save Changes"
2. Render will automatically redeploy your service
3. Wait for deployment to complete (usually 2-5 minutes)

### Step 5: Verify Email Configuration
After deployment completes:

1. **Check Render Logs**:
   - Go to "Logs" tab in Render dashboard
   - Look for these startup messages:
   ```
   📧 Email configuration: { host: 'smtp.gmail.com', port: 587, user: 'mda***', passConfigured: true }
   ✅ Email server is ready to send messages
   ```

2. **If you see error**:
   ```
   ❌ Email transporter verification failed
   ```
   This means the Gmail credentials are incorrect.

### Step 6: Test Email Sending
1. Go to your deployed app: https://doc-signer-lime.vercel.app
2. Upload a document
3. Click "Share" and enter an email
4. Click "Send Link"
5. Check Render logs for:
   ```
   📧 Attempting to send email to: recipient@example.com
   ✅ Email sent successfully
   ```

## Troubleshooting

### Issue: "Email transporter verification failed"

**Cause**: Gmail App Password is incorrect or not set

**Solution**:
1. Go to https://myaccount.google.com/apppasswords
2. Make sure 2-Step Verification is enabled
3. Generate a new App Password:
   - Select app: "Mail"
   - Select device: "Other (Custom name)"
   - Name it: "DoSign App"
4. Copy the 16-character password (no spaces)
5. Update `EMAIL_PASS` in Render with the new password
6. Redeploy

### Issue: "EAUTH" error in logs

**Cause**: Gmail is blocking the login

**Solutions**:
1. **Use App Password** (recommended):
   - Follow steps above to generate App Password
   
2. **Enable Less Secure Apps** (not recommended):
   - Go to https://myaccount.google.com/lesssecureapps
   - Turn on "Allow less secure apps"
   - Note: This is less secure and may not work with 2FA

### Issue: Emails still not sending

**Check these**:
1. ✅ Environment variables are set in Render
2. ✅ Render service has been redeployed after adding variables
3. ✅ Gmail account has 2-Step Verification enabled
4. ✅ App Password is correctly copied (no spaces)
5. ✅ Check Render logs for detailed error messages

### Issue: "ECONNECTION" error

**Cause**: Network/firewall blocking SMTP connection

**Solution**:
- This is rare on Render, but if it happens:
- Try using port 465 with secure: true
- Contact Render support if issue persists

## Alternative: Use a Different Email Service

If Gmail continues to have issues, consider these alternatives:

### SendGrid (Recommended for Production)
```javascript
// Free tier: 100 emails/day
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your_api_key
```

### Mailgun
```javascript
// Free tier: 5,000 emails/month
EMAIL_SERVICE=mailgun
MAILGUN_API_KEY=your_api_key
MAILGUN_DOMAIN=your_domain
```

### AWS SES
```javascript
// Very cheap, highly reliable
EMAIL_SERVICE=ses
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
```

## Quick Verification Checklist

Before testing, verify:
- [ ] EMAIL_USER is set in Render
- [ ] EMAIL_PASS is set in Render
- [ ] FRONTEND_URL_PRODUCTION is set in Render
- [ ] Service has been redeployed
- [ ] Logs show "✅ Email server is ready"
- [ ] No errors in startup logs

## Expected Behavior After Fix

1. **When sharing a link**:
   - Frontend shows "Sending..." toast
   - Request completes in 1-2 seconds
   - Shows "Signing link created" success message
   - Session appears in the list immediately
   - Email is sent in background (check logs)

2. **In Render logs**:
   ```
   📧 Attempting to send email to: recipient@example.com
   ✅ Email sent successfully
      Message ID: <some-id>
      Recipient: recipient@example.com
   ```

3. **Recipient receives**:
   - Professional email with DoSign branding
   - "Sign Document" button
   - Link expires in 7 days notice

## Need Help?

If emails still don't work after following this guide:
1. Check Render logs for specific error messages
2. Copy the exact error message
3. Verify all environment variables are set correctly
4. Try generating a new Gmail App Password
5. Consider using SendGrid or another email service for production

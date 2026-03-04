# Test Email Configuration

## Quick Test Steps

### 1. Check Health Endpoint
Open this URL in your browser:
```
https://doc-signer-1qwd.onrender.com/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "config": {
    "emailConfigured": true,
    "emailUser": "mda***",
    "frontendUrl": "https://doc-signer-lime.vercel.app",
    "supabaseConfigured": true
  }
}
```

**If `emailConfigured` is `false`**:
- EMAIL_USER or EMAIL_PASS is not set in Render
- Go to Render dashboard → Environment → Add the variables
- Redeploy the service

### 2. Check Render Logs
1. Go to https://dashboard.render.com
2. Click on your backend service
3. Click "Logs" tab
4. Look for these lines when the service starts:

**Good (Email configured correctly)**:
```
📧 Email configuration: { host: 'smtp.gmail.com', port: 587, user: 'mda***', passConfigured: true }
✅ Email server is ready to send messages
```

**Bad (Email not configured)**:
```
📧 Email configuration: { host: 'smtp.gmail.com', port: 587, user: 'NOT SET', passConfigured: false }
❌ Email transporter verification failed
```

### 3. Test Sending Email
1. Go to https://doc-signer-lime.vercel.app
2. Login
3. Upload a document
4. Click "Share"
5. Enter your own email address
6. Click "Send Link"
7. Watch for:
   - Success message appears
   - Session shows in the list
   - Check your email inbox

### 4. Check Logs After Sending
Go back to Render logs and look for:

**Success**:
```
📧 Attempting to send email to: your@email.com
✅ Email sent successfully
   Message ID: <some-id>
   Recipient: your@email.com
   Response: 250 2.0.0 OK
```

**Failure**:
```
📧 Attempting to send email to: your@email.com
❌ Email sending failed
   Recipient: your@email.com
   Error: Invalid login: 535-5.7.8 Username and Password not accepted
   Code: EAUTH
```

## Common Issues and Fixes

### Issue 1: emailConfigured is false

**Fix**: Add environment variables in Render
1. Go to Render dashboard
2. Click your service
3. Click "Environment"
4. Add:
   - `EMAIL_USER` = `mdahmadrazakhan751@gmail.com`
   - `EMAIL_PASS` = `pqotmftlgdejgkgd`
5. Click "Save Changes"
6. Wait for redeploy

### Issue 2: EAUTH error (Invalid login)

**Fix**: Generate new Gmail App Password
1. Go to https://myaccount.google.com/apppasswords
2. If you see "2-Step Verification is not turned on":
   - Enable 2-Step Verification first
   - Then come back to App Passwords
3. Click "Select app" → "Mail"
4. Click "Select device" → "Other"
5. Type "DoSign"
6. Click "Generate"
7. Copy the 16-character password (e.g., "abcd efgh ijkl mnop")
8. Remove spaces: "abcdefghijklmnop"
9. Update `EMAIL_PASS` in Render with this new password
10. Redeploy

### Issue 3: Email sends locally but not in production

**Possible causes**:
1. Environment variables not set in Render
2. Different Gmail App Password needed
3. Gmail blocking the IP address

**Fix**:
1. Verify environment variables are set
2. Generate a fresh App Password
3. Check Render logs for specific error
4. If Gmail continues blocking, consider using SendGrid

### Issue 4: Request hangs/times out

**This is now fixed** - The backend responds immediately and sends email in background.

If still hanging:
1. Check browser console for errors
2. Check Network tab for failed requests
3. Verify CORS is allowing your domain
4. Check Render logs for crashes

## Environment Variables Checklist

In Render, you should have:
- [x] `EMAIL_USER` = mdahmadrazakhan751@gmail.com
- [x] `EMAIL_PASS` = (your Gmail App Password)
- [x] `FRONTEND_URL_PRODUCTION` = https://doc-signer-lime.vercel.app
- [x] `SUPABASE_URL` = https://epxgyaslkiqyozvdnaec.supabase.co
- [x] `SUPABASE_SERVICE_ROLE_KEY` = (your key)
- [x] `SUPABASE_ANON_KEY` = (your key)
- [x] `JWT_SECRET` = (your secret)

## Testing Checklist

- [ ] Health endpoint shows emailConfigured: true
- [ ] Render logs show "✅ Email server is ready"
- [ ] Can share link to single recipient
- [ ] Session appears in list immediately
- [ ] Email arrives in inbox (check spam folder)
- [ ] Can share to multiple recipients
- [ ] Can resend signing link
- [ ] Can revoke signing link

## Still Not Working?

If you've followed all steps and emails still don't send:

1. **Copy the exact error from Render logs**
2. **Verify Gmail settings**:
   - 2-Step Verification is ON
   - App Password is generated
   - No spaces in the password
3. **Try a test email service**:
   - Use a service like Mailtrap for testing
   - Or switch to SendGrid for production

## Alternative: Use SendGrid (Recommended)

If Gmail continues to have issues, switch to SendGrid:

1. Sign up at https://sendgrid.com (free tier: 100 emails/day)
2. Get API key
3. Update backend code to use SendGrid
4. Much more reliable for production use

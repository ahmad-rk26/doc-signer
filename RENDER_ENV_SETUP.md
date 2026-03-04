# Render Environment Variables Setup Guide

## Step-by-Step Instructions with Screenshots

### Step 1: Access Render Dashboard
1. Go to https://dashboard.render.com
2. Login to your account
3. You should see your services list

### Step 2: Select Your Backend Service
1. Find the service named something like "doc-signer" or "backend"
2. The URL should be: `doc-signer-1qwd.onrender.com`
3. Click on the service name to open it

### Step 3: Navigate to Environment Tab
1. On the left sidebar, click **"Environment"**
2. You'll see a list of existing environment variables
3. At the bottom, there's an **"Add Environment Variable"** button

### Step 4: Add EMAIL_USER
1. Click **"Add Environment Variable"**
2. In the **Key** field, type: `EMAIL_USER`
3. In the **Value** field, type: `mdahmadrazakhan751@gmail.com`
4. Click **"Add"** or press Enter

### Step 5: Add EMAIL_PASS
1. Click **"Add Environment Variable"** again
2. In the **Key** field, type: `EMAIL_PASS`
3. In the **Value** field, type: `pqotmftlgdejgkgd`
4. Click **"Add"** or press Enter

**IMPORTANT**: This should be a Gmail App Password, not your regular Gmail password!

### Step 6: Add FRONTEND_URL_PRODUCTION
1. Click **"Add Environment Variable"** again
2. In the **Key** field, type: `FRONTEND_URL_PRODUCTION`
3. In the **Value** field, type: `https://doc-signer-lime.vercel.app`
4. Click **"Add"** or press Enter

### Step 7: Verify All Variables
Your environment variables should now include:

```
EMAIL_USER = mdahmadrazakhan751@gmail.com
EMAIL_PASS = pqotmftlgdejgkgd
FRONTEND_URL_PRODUCTION = https://doc-signer-lime.vercel.app
SUPABASE_URL = https://epxgyaslkiqyozvdnaec.supabase.co
SUPABASE_SERVICE_ROLE_KEY = sb_secret_...
SUPABASE_ANON_KEY = sb_publishable_...
JWT_SECRET = your-jwt-secret
```

### Step 8: Save and Deploy
1. After adding all variables, Render will show a banner at the top
2. Click **"Save Changes"** or **"Manual Deploy"** → **"Deploy latest commit"**
3. Wait for the deployment to complete (2-5 minutes)
4. Watch the logs during deployment

### Step 9: Verify Deployment
1. Click on **"Logs"** tab
2. Look for these messages:
   ```
   📧 Email configuration: { host: 'smtp.gmail.com', port: 587, user: 'mda***', passConfigured: true }
   ✅ Email server is ready to send messages
   Server running on port 10000
   ```

### Step 10: Test the Configuration
1. Open in browser: `https://doc-signer-1qwd.onrender.com/health`
2. You should see:
   ```json
   {
     "status": "ok",
     "config": {
       "emailConfigured": true,
       "emailUser": "mda***",
       "frontendUrl": "https://doc-signer-lime.vercel.app",
       "supabaseConfigured": true
     }
   }
   ```

## Troubleshooting

### "Environment variable not found" error
- Make sure you clicked "Save Changes" after adding variables
- Redeploy the service manually if auto-deploy didn't trigger

### Variables not showing up
- Refresh the Render dashboard page
- Check if you're looking at the correct service
- Make sure you're in the "Environment" tab, not "Environment Groups"

### Deployment failed after adding variables
- Check the logs for specific error messages
- Verify the variable values don't have extra spaces
- Make sure EMAIL_PASS is the App Password, not regular password

### Still showing "emailConfigured: false"
- Double-check the variable names (case-sensitive):
  - `EMAIL_USER` (not `email_user` or `Email_User`)
  - `EMAIL_PASS` (not `email_pass` or `Email_Pass`)
- Verify the values are correct
- Redeploy the service

## Gmail App Password Setup

If you need to generate a new Gmail App Password:

### Prerequisites
1. You must have 2-Step Verification enabled
2. You must be the account owner (not a delegated account)

### Steps
1. Go to https://myaccount.google.com/apppasswords
2. You might need to sign in again
3. Click **"Select app"** dropdown → Choose **"Mail"**
4. Click **"Select device"** dropdown → Choose **"Other (Custom name)"**
5. Type: **"DoSign Backend"**
6. Click **"Generate"**
7. You'll see a 16-character password like: `abcd efgh ijkl mnop`
8. **Copy this password** (you won't see it again)
9. **Remove all spaces**: `abcdefghijklmnop`
10. Use this as your `EMAIL_PASS` value in Render

### If you can't access App Passwords
- Make sure 2-Step Verification is enabled
- Go to https://myaccount.google.com/security
- Scroll to "2-Step Verification" and turn it on
- Then try accessing App Passwords again

## Quick Reference

### Environment Variables to Add
```bash
EMAIL_USER=mdahmadrazakhan751@gmail.com
EMAIL_PASS=pqotmftlgdejgkgd
FRONTEND_URL_PRODUCTION=https://doc-signer-lime.vercel.app
```

### Health Check URL
```
https://doc-signer-1qwd.onrender.com/health
```

### Expected Log Output
```
📧 Email configuration: { host: 'smtp.gmail.com', port: 587, user: 'mda***', passConfigured: true }
✅ Email server is ready to send messages
```

## Next Steps After Setup

1. ✅ Verify health endpoint shows emailConfigured: true
2. ✅ Check logs show "Email server is ready"
3. ✅ Test sending a signing link
4. ✅ Check recipient's email inbox
5. ✅ Verify session appears in UI
6. ✅ Test resend and revoke functions

## Need More Help?

If you're still having issues:
1. Take a screenshot of your Render environment variables (hide sensitive values)
2. Copy the exact error message from logs
3. Check if the health endpoint shows correct configuration
4. Verify Gmail App Password is correct
5. Try generating a new App Password

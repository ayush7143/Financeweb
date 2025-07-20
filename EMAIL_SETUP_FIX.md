# 📧 Gmail App Password Setup Instructions

## The Issue
Your current Gmail app password `cnqxdpubfqevdwyo` is being rejected by Gmail. This means it's either:
1. Not a valid app password
2. Expired
3. Generated incorrectly

## How to Fix

### Step 1: Enable 2-Factor Authentication
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click on "Security" in the left sidebar
3. Enable "2-Step Verification" if it's not already enabled

### Step 2: Generate App Password
1. Still in Security settings, find "App passwords"
2. Click "App passwords" (you might need to sign in again)
3. Select "Mail" from the dropdown
4. Click "Generate"
5. **Copy the 16-character password exactly** (no spaces)

### Step 3: Update Your .env File
Replace your current email password in `backend/.env`:

```env
EMAIL_APP_PASSWORD=your-new-16-char-password
```

### Step 4: Restart Your Server
```bash
cd backend
npm start
```

## Alternative: Test with a Different Email Service

If Gmail continues to cause issues, you can temporarily use a different email service for testing:

### Using Ethereal Email (for testing only)
Update your `backend/utils/emailService.js` to use Ethereal:

```javascript
// For testing only - creates a temporary email account
const testAccount = await nodemailer.createTestAccount();
const transporter = nodemailer.createTransporter({
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false,
  auth: {
    user: testAccount.user,
    pass: testAccount.pass
  }
});
```

This will give you preview URLs instead of actually sending emails, perfect for testing the reset flow.

## Current Status
- ✅ Google OAuth setup complete
- ✅ Forgot password UI improved
- ❌ Email sending needs Gmail app password fix
- ✅ Twitter/GitHub buttons removed, Google login added

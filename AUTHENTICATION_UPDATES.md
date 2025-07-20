# Finance Tracker - Authentication Updates

## New Features Added

### 🔐 Google OAuth Login
- Users can now sign in using their Google account
- Seamless integration with existing user accounts
- Automatic account linking for users with matching email addresses

### 📧 Enhanced Password Reset
- Email-based password reset functionality
- Secure token-based reset system
- Professional email templates
- Token expiration for security

## Updated Components

### Frontend Changes

1. **Login Page (`frontend/src/components/auth/Login.jsx`)**
   - Added Google OAuth button
   - Removed GitHub and Twitter social login icons
   - Added forgot password link
   - Added registration link
   - Enhanced error handling for OAuth failures

2. **New Components:**
   - `GoogleOAuthButton.jsx` - Google sign-in button
   - `AuthSuccess.jsx` - Handles OAuth callback
   - Updated `ResetPassword.jsx` - Email-based password reset

3. **Updated Routes (`frontend/src/routes/index.jsx`)**
   - Added `/auth-success` route for OAuth callback
   - Added `/reset-password` route for password reset

4. **Enhanced AuthContext (`frontend/src/context/AuthContext.jsx`)**
   - Added `loginWithToken` function for OAuth
   - Better error handling
   - Token-based authentication support

### Backend Changes

1. **User Model (`backend/src/models/User.js`)**
   - Added `googleId` field for OAuth users
   - Added `authProvider` field to track login method
   - Made password optional for OAuth users

2. **Authentication Controller (`backend/src/controllers/authController.js`)**
   - Added Google OAuth callback handling
   - Enhanced forgot password with email sending
   - Added `googleCallback` and `getGoogleUser` functions

3. **New Files:**
   - `passport.js` - Passport configuration for Google OAuth
   - Updated auth routes with Google OAuth endpoints

4. **Enhanced Email Service (`backend/utils/emailService.js`)**
   - Already configured for Gmail SMTP
   - Professional password reset email templates

## Setup Instructions

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install passport passport-google-oauth20 express-session
```

**Frontend:**
```bash
cd frontend
npm install @react-oauth/google
```

### 2. Environment Configuration

**Backend (.env):**
```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SESSION_SECRET=your-session-secret

# Email Configuration
EMAIL_USER=your-gmail@gmail.com
EMAIL_APP_PASSWORD=your-gmail-app-password

# URLs
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### 3. Google Cloud Console Setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`

### 4. Gmail App Password Setup

1. Enable 2FA on your Gmail account
2. Generate an App Password in Google Account settings
3. Use this password in your EMAIL_APP_PASSWORD environment variable

## API Endpoints

### New Endpoints Added:

- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Handle OAuth callback
- `GET /api/auth/google/user` - Get OAuth user info
- `POST /api/auth/forgot-password` - Send password reset email (enhanced)
- `POST /api/auth/reset-password` - Reset password with token

## Features Overview

### 🔑 Authentication Options:
1. **Traditional Email/Password** - Existing functionality
2. **Google OAuth** - New one-click sign-in
3. **Password Reset** - Enhanced email-based reset

### 🎨 UI Improvements:
- Clean, modern login interface
- Google branding compliance
- Responsive design
- Better error messaging
- Loading states and transitions

### 🔒 Security Features:
- Secure token-based password reset
- OAuth state management
- Session-based authentication for OAuth
- JWT tokens for API access
- Password encryption with bcrypt

## Usage

1. **Regular Login:** Enter email and password
2. **Google Login:** Click "Continue with Google" button
3. **Forgot Password:** Click link, enter email, check inbox for reset link
4. **Reset Password:** Click link in email, enter new password

## Notes

- Google OAuth accounts don't require passwords
- Existing users can link their Google accounts
- All authentication methods integrate seamlessly
- Secure email delivery for password resets
- Mobile-responsive design

For detailed setup instructions, see `GOOGLE_OAUTH_SETUP.md`.

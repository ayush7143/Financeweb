# Google OAuth Setup Guide

## Setting up Google OAuth for Finance Tracker

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Select "Web application"
   - Add authorized redirect URIs:
     - For development: `http://localhost:5000/api/auth/google/callback`
     - For production: `https://yourdomain.com/api/auth/google/callback`

### 2. Environment Variables

Add these variables to your `.env` file in the backend directory:

```env
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
SESSION_SECRET=your-random-session-secret
FRONTEND_URL=http://localhost:3000
```

### 3. Email Configuration for Password Reset

To enable email-based password reset, you'll need to configure Gmail:

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security > 2-Step Verification > App passwords
   - Generate a password for "Mail"
3. Add to your `.env` file:

```env
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_APP_PASSWORD=your-16-character-app-password
```

### 4. Frontend Configuration

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
```

### 5. Testing

1. Start the backend server: `npm run dev`
2. Start the frontend server: `npm run dev`
3. Navigate to the login page
4. Click "Continue with Google" to test OAuth
5. Try the "Forgot Password" feature to test email functionality

## Important Notes

- Make sure your MongoDB database is running
- The Google OAuth callback URL must match exactly what you set in Google Cloud Console
- For production, update the URLs to use HTTPS and your actual domain
- Keep your client secrets secure and never commit them to version control

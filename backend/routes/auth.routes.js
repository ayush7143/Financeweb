const express = require('express');
const router = express.Router();
const passport = require('passport');
require('../src/config/passport'); // Ensure Passport config is loaded
const authController = require('../src/controllers/authController');
const { protect } = require('../src/middleware/authMiddleware');

// ⛔ Public Auth Routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// 🔐 Google OAuth Login (Step 1: Redirect to Google)
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// ✅ Google Callback (Step 2: Handle after Google login)
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: process.env.FRONTEND_URL + '/login' }),
  authController.googleCallback
);

// 🔍 Get Google user data from session
router.get('/google/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json({ user: req.user });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

// 🚪 Logout user
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: 'Logout failed' });
    res.clearCookie('connect.sid'); // Clear session cookie
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

// 👤 Protected Routes
router.get('/me', protect, authController.getCurrentUser);
router.put('/profile', protect, authController.updateProfile);
router.post('/change-password', protect, authController.changePassword);

module.exports = router;
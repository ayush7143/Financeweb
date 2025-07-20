const express = require('express');
const router = express.Router();
const passport = require('passport');
require('../src/config/passport'); // Initialize passport configuration
const authController = require('../src/controllers/authController');
const { protect } = require('../src/middleware/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Google OAuth routes
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  authController.googleCallback
);

router.get('/google/user', authController.getGoogleUser);

// Protected routes
router.get('/me', protect, authController.getCurrentUser);
router.put('/profile', protect, authController.updateProfile);
router.post('/change-password', protect, authController.changePassword);

module.exports = router; 
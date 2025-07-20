const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAllUsers,
  updateUserRole,
  deleteUser,
  getUserStats
} = require('../controllers/adminController');

// GET /api/admin/users - Get all users
router.get('/users', protect, authorize('admin'), getAllUsers);

// GET /api/admin/stats - Get user statistics
router.get('/stats', protect, authorize('admin'), getUserStats);

// PUT /api/admin/users/:userId/role - Update user role
router.put('/users/:userId/role', protect, authorize('admin'), updateUserRole);

// DELETE /api/admin/users/:userId - Delete user
router.delete('/users/:userId', protect, authorize('admin'), deleteUser);

module.exports = router;

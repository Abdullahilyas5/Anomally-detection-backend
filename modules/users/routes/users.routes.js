const express = require('express');
const userController = require('../controllers/user.controllers');
const { authenticateToken, authorizeAdmin } = require('../../middleware/auth.middleware');

const router = express.Router();

// ========== PUBLIC ROUTES (No authentication required) ==========

// User registration
router.post('/register', userController.registerUser);

// User login
router.post('/login', userController.loginUser);

// Refresh token
router.post('/refresh-token', userController.refreshToken);


// ========== PROTECTED ROUTES (Authentication required) ==========

// Get own profile
router.get('/profile', authenticateToken, userController.getProfile);

// Update own profile
router.put('/profile', authenticateToken, userController.updateProfile);

// Change password
router.put('/change-password', authenticateToken, userController.changePassword);


// ========== ADMIN ROUTES (Authentication + Admin role required) ==========

// Get all users
router.get('/', authenticateToken, authorizeAdmin, userController.getAllUsers);

// Get user by ID
router.get('/:id', authenticateToken, authorizeAdmin, userController.getUserById);

// Get users by role
router.get('/role/:role', authenticateToken, authorizeAdmin, userController.getUsersByRole);

// Change user role
router.put('/:id/role', authenticateToken, authorizeAdmin, userController.changeUserRole);

// Change user status (block/unblock)
router.put('/:id/status', authenticateToken, authorizeAdmin, userController.changeUserStatus);

// Delete user
router.delete('/:id', authenticateToken, authorizeAdmin, userController.deleteUser);


module.exports = router;












module.exports = router;
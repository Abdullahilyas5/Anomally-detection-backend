const express = require('express');
const userController = require('../controllers/user.controllers');
const { authenticateToken, authorizeAdmin } = require('../../middleware/auth.middleware');
const dashboardController = require('../controllers/dashboard.controller')
const router = express.Router();

// ========== PUBLIC ROUTES (No authentication required) ==========


// Get all users
router.get('/admin/dashboard', authenticateToken, authorizeAdmin, dashboardController.admin);
router.get('/citizen/dashboard', authenticateToken, dashboardController.citizen);
router.get('/reviewed/report', authenticateToken, dashboardController.reportstats);
router.get('/auditor/dashboard', authenticateToken, dashboardController.auditor);

router.post('/admin/decline', authenticateToken, authorizeAdmin , dashboardController.declineUser);
router.post('/admin/block', authenticateToken,   authorizeAdmin ,dashboardController.blockUser);
router.post('/admin/approve', authenticateToken, authorizeAdmin , dashboardController.approveUser);

router.get('/get-all-users', authenticateToken, authorizeAdmin, userController.getAllUsers);

// Get user by ID
router.get('/get-user/:id', authenticateToken, authorizeAdmin, userController.getUserById);

// User registration
router.post('/register', userController.registerUser);

// User login
router.post('/login', userController.loginUser);


// Refresh token
router.post('/refresh-token', userController.refreshToken);

// Forgot & Reset Password
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);


// ========== PROTECTED ROUTES (Authentication required) ==========

// Get own profile
router.get('/profile', authenticateToken, userController.getProfile);

// Update own profile
router.put('/profile', authenticateToken, userController.updateProfile);

// Change password
router.put('/change-password', authenticateToken, userController.changePassword);


// ========== ADMIN ROUTES (Authentication + Admin role required) ==========



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
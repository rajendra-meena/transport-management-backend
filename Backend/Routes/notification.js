const express = require('express');
const {
    sendNotification,
    getAdminNotifications,
    getDriverNotifications
} = require('../Controllers/NotificationController');

const router = express.Router();
const { protect, authorize } = require('../Middleware/auth');

// All notification routes are protected
router.use(protect);

// Admin endpoints
router.post('/', authorize('admin'), sendNotification);
router.get('/admin', authorize('admin'), getAdminNotifications);

// Driver endpoints
router.get('/driver', authorize('driver'), getDriverNotifications);

module.exports = router;

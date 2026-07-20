const Notification = require('../Models/NotificationModel');
const User = require('../Models/UserModel');
const { sendPushNotification, sendMulticastNotification } = require('../utils/firebase');

// @desc    Send notification (Create)
// @route   POST /api/v1/notifications
// @access  Private (Admin)
exports.sendNotification = async (req, res, next) => {
    try {
        const { title, description, targetType, recipientDriverId } = req.body;

        if (targetType === 'SELECTED') {
            if (!recipientDriverId) {
                return res.status(400).json({ success: false, error: 'Please provide a recipient driver ID' });
            }

            const driver = await User.findById(recipientDriverId);
            if (!driver || driver.role !== 'driver') {
                return res.status(404).json({ success: false, error: 'Recipient driver not found' });
            }
        }

        const notificationData = {
            title,
            description,
            targetType,
            recipientDriverId: targetType === 'SELECTED' ? recipientDriverId : undefined,
            createdBy: req.user.id
        };

        const notification = await Notification.create(notificationData);

        // Push Notification Logic
        if (targetType === 'SELECTED' && recipientDriverId) {
            const driver = await User.findById(recipientDriverId);
            if (driver && driver.fcmToken) {
                await sendPushNotification(driver.fcmToken, title, description, {
                    notificationId: notification._id.toString()
                });
            }
        } else if (targetType === 'ALL') {
            const drivers = await User.find({ role: 'driver', fcmToken: { $exists: true, $ne: null } });
            const tokens = drivers.map(d => d.fcmToken).filter(t => t);
            if (tokens.length > 0) {
                await sendMulticastNotification(tokens, title, description, {
                    notificationId: notification._id.toString()
                });
            }
        }

        res.status(201).json({ success: true, data: notification });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all notifications (For Admin Panel)
// @route   GET /api/v1/notifications/admin
// @access  Private (Admin)
exports.getAdminNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find()
            .sort({ createdAt: -1 })
            .populate('recipientDriverId', 'name email phone vehicleNumber')
            .populate('createdBy', 'name email');

        res.status(200).json({ success: true, count: notifications.length, data: notifications });
    } catch (err) {
        next(err);
    }
};

// @desc    Get driver specific notifications
// @route   GET /api/v1/notifications/driver
// @access  Private (Driver)
exports.getDriverNotifications = async (req, res, next) => {
    try {
        const driverId = req.user.id;

        const notifications = await Notification.find({
            $or: [
                { targetType: 'ALL' },
                { targetType: 'SELECTED', recipientDriverId: driverId }
            ]
        }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: notifications.length, data: notifications });
    } catch (err) {
        next(err);
    }
};

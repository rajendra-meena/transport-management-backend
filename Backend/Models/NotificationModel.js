const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a notification title'],
    },
    description: {
        type: String,
        required: [true, 'Please add a notification description'],
    },
    targetType: {
        type: String,
        enum: ['ALL', 'SELECTED'],
        default: 'ALL',
    },
    recipientDriverId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Notification', notificationSchema);

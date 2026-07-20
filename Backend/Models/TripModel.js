const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
    pickupLocation: {
        type: String,
        required: [true, 'Please add a pickup location'],
    },
    dropLocation: {
        type: String,
        required: [true, 'Please add a drop location'],
    },
    customerName: {
        type: String,
        required: [true, 'Please add a customer name'],
    },
    customerPhone: {
        type: String,
        required: [true, 'Please add a customer phone'],
    },
    driverId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
    status: {
        type: String,
        enum: ['CREATED', 'ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'COMPLETED', 'CANCELLED'],
        default: 'CREATED',
    },
    distance: {
        type: Number,
        default: 0,
    },
    fare: {
        type: Number,
        default: 0,
    },
    driverEarning: {
        type: Number,
        default: 0,
    },
    startTime: Date,
    endTime: Date,
    cancellationReason: String,
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

module.exports = mongoose.model('Trip', tripSchema);

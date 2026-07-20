const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    tripId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Trip',
        required: [true, 'Please associate a trip'],
    },
    driverId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Please associate a driver'],
    },
    amount: {
        type: Number,
        required: [true, 'Please add a payment amount'],
    },
    paymentType: {
        type: String,
        enum: ['CUSTOMER_PAYMENT', 'DRIVER_PAYOUT'],
        required: [true, 'Please specify payment type'],
    },
    paymentMethod: {
        type: String,
        enum: ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER'],
        default: 'CASH',
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED'],
        default: 'PENDING',
    },
    transactionId: {
        type: String,
    },
    processedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Payment', paymentSchema);

const Payment = require('../Models/PaymentModel');
const Trip = require('../Models/TripModel');
const User = require('../Models/UserModel');

// @desc    Get all payments
// @route   GET /api/v1/payments
// @access  Private (Admin)
exports.getPayments = async (req, res, next) => {
    try {
        const {
            driverId,
            status,
            paymentType,
            paymentMethod,
            transactionId,
            tripId,
            minAmount,
            maxAmount,
            startDate,
            endDate,
            search
        } = req.query;

        let query = {};

        if (driverId) query.driverId = driverId;
        if (status) query.status = status;
        if (paymentType) query.paymentType = paymentType;
        if (paymentMethod) query.paymentMethod = paymentMethod;
        if (tripId) query.tripId = tripId;

        if (transactionId) {
            query.transactionId = { $regex: transactionId, $options: 'i' };
        }

        // Amount range filter
        if (minAmount || maxAmount) {
            query.amount = {};
            if (minAmount) query.amount.$gte = Number(minAmount);
            if (maxAmount) query.amount.$lte = Number(maxAmount);
        }

        // Date range filter
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        // Search filter: matching user name/email/phone, transactionId or trip details
        if (search) {
            const matchingUsers = await User.find({
                role: 'driver',
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } },
                    { vehicleNumber: { $regex: search, $options: 'i' } }
                ]
            }).distinct('_id');

            const matchingTrips = await Trip.find({
                $or: [
                    { customerName: { $regex: search, $options: 'i' } },
                    { customerPhone: { $regex: search, $options: 'i' } },
                    { pickupLocation: { $regex: search, $options: 'i' } },
                    { dropLocation: { $regex: search, $options: 'i' } }
                ]
            }).distinct('_id');

            query.$or = [
                { transactionId: { $regex: search, $options: 'i' } },
                { driverId: { $in: matchingUsers } },
                { tripId: { $in: matchingTrips } }
            ];
        }

        const payments = await Payment.find(query)
            .sort({ createdAt: -1 })
            .populate('tripId', 'pickupLocation dropLocation customerName customerPhone')
            .populate('driverId', 'name email phone vehicleNumber')
            .populate('processedBy', 'name email');

        res.status(200).json({ success: true, count: payments.length, data: payments });
    } catch (err) {
        next(err);
    }
};

// @desc    Collect customer payment for trip
// @route   POST /api/v1/payments/collect
// @access  Private (Admin)
exports.collectCustomerPayment = async (req, res, next) => {
    try {
        const { tripId, paymentMethod, transactionId } = req.body;

        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({ success: false, error: 'Trip not found' });
        }

        if (trip.status !== 'COMPLETED') {
            return res.status(400).json({ success: false, error: 'Trip must be completed to collect payment' });
        }

        // Check if customer payment already collected
        const existingPayment = await Payment.findOne({
            tripId,
            paymentType: 'CUSTOMER_PAYMENT',
            status: 'COMPLETED'
        });

        if (existingPayment) {
            return res.status(400).json({ success: false, error: 'Customer payment already recorded for this trip' });
        }

        const payment = await Payment.create({
            tripId,
            driverId: trip.driverId,
            amount: trip.fare,
            paymentType: 'CUSTOMER_PAYMENT',
            paymentMethod: paymentMethod || 'CASH',
            status: 'COMPLETED',
            transactionId,
            processedBy: req.user.id
        });

        res.status(201).json({ success: true, data: payment });
    } catch (err) {
        next(err);
    }
};

// @desc    Process payout to driver
// @route   POST /api/v1/payments/payout
// @access  Private (Admin)
exports.payoutDriver = async (req, res, next) => {
    try {
        const { tripId, paymentMethod, transactionId } = req.body;

        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({ success: false, error: 'Trip not found' });
        }

        if (trip.status !== 'COMPLETED') {
            return res.status(400).json({ success: false, error: 'Trip must be completed to process payout' });
        }

        // Check if driver payout already processed
        const existingPayout = await Payment.findOne({
            tripId,
            paymentType: 'DRIVER_PAYOUT',
            status: 'COMPLETED'
        });

        if (existingPayout) {
            return res.status(400).json({ success: false, error: 'Driver payout already processed for this trip' });
        }

        const payout = await Payment.create({
            tripId,
            driverId: trip.driverId,
            amount: trip.driverEarning,
            paymentType: 'DRIVER_PAYOUT',
            paymentMethod: paymentMethod || 'BANK_TRANSFER',
            status: 'COMPLETED',
            transactionId,
            processedBy: req.user.id
        });

        res.status(201).json({ success: true, data: payout });
    } catch (err) {
        next(err);
    }
};

// @desc    Get billing and payments stats
// @route   GET /api/v1/payments/stats
// @access  Private (Admin)
exports.getPaymentStats = async (req, res, next) => {
    try {
        // Total collected customer payments
        const collections = await Payment.aggregate([
            { $match: { paymentType: 'CUSTOMER_PAYMENT', status: 'COMPLETED' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // Total processed driver payouts
        const payouts = await Payment.aggregate([
            { $match: { paymentType: 'DRIVER_PAYOUT', status: 'COMPLETED' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalCollected = collections.length > 0 ? collections[0].total : 0;
        const totalPaidOut = payouts.length > 0 ? payouts[0].total : 0;

        // Calculate pending payouts (driverEarnings from completed trips that do not have a completed DRIVER_PAYOUT recorded)
        const completedTrips = await Trip.find({ status: 'COMPLETED' });
        const paidTripIds = await Payment.find({
            paymentType: 'DRIVER_PAYOUT',
            status: 'COMPLETED'
        }).distinct('tripId');

        // Filter trips that are not paid out yet
        let pendingPayoutAmount = 0;
        let pendingPayoutCount = 0;

        completedTrips.forEach(trip => {
            if (!paidTripIds.some(id => id.toString() === trip._id.toString())) {
                pendingPayoutAmount += trip.driverEarning || 0;
                pendingPayoutCount++;
            }
        });

        res.status(200).json({
            success: true,
            data: {
                totalCollected: Math.round(totalCollected * 100) / 100,
                totalPaidOut: Math.round(totalPaidOut * 100) / 100,
                pendingPayouts: {
                    count: pendingPayoutCount,
                    amount: Math.round(pendingPayoutAmount * 100) / 100
                },
                estimatedRevenue: Math.round((totalCollected - totalPaidOut) * 100) / 100
            }
        });
    } catch (err) {
        next(err);
    }
};

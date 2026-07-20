const Trip = require('../Models/TripModel');
const User = require('../Models/UserModel');
const FareConfig = require('../Models/FareConfigModel');
const Notification = require('../Models/NotificationModel');
const { sendPushNotification, sendMulticastNotification } = require('../utils/firebase');

// Helper to get or create default fare configuration
const getOrCreateFareConfig = async () => {
    let config = await FareConfig.findOne();
    if (!config) {
        config = await FareConfig.create({
            baseFare: 50,
            perKmRate: 15,
            commissionRate: 20
        });
    }
    return config;
};

// @desc    Create new trip
// @route   POST /api/v1/trips
// @access  Private (Admin)
exports.createTrip = async (req, res, next) => {
    try {
        req.body.createdBy = req.user.id;
        const trip = await Trip.create(req.body);
        res.status(201).json({ success: true, data: trip });
    } catch (err) {
        next(err);
    }
};

// @desc    Assign driver to trip
// @route   PATCH /api/v1/trips/:id/assign
// @access  Private (Admin)
exports.assignDriver = async (req, res, next) => {
    try {
        const { driverId, distance } = req.body;

        if (distance === undefined || distance === null) {
            return res.status(400).json({ success: false, error: 'Please provide distance for the trip' });
        }

        const driver = await User.findById(driverId);

        if (!driver || driver.role !== 'driver') {
            return res.status(404).json({ success: false, error: 'Driver not found' });
        }

        if (driver.isAvailable === false) {
            return res.status(400).json({ success: false, error: 'Driver is not available' });
        }

        const trip = await Trip.findByIdAndUpdate(req.params.id, {
            driverId,
            distance,
            status: 'ASSIGNED'
        }, { new: true });

        // Automated Notification for Assignment
        const title = "New Trip Assigned";
        const description = `You have been assigned a new trip. Distance: ${distance} km.`;
        
        await Notification.create({
            title,
            description,
            targetType: 'SELECTED',
            recipientDriverId: driverId,
            createdBy: req.user.id
        });

        if (driver.fcmToken) {
            await sendPushNotification(driver.fcmToken, title, description, {
                tripId: trip._id.toString()
            });
        }

        res.status(200).json({ success: true, data: trip });
    } catch (err) {
        next(err);
    }
};

// @desc    Driver Accept Trip
// @route   PATCH /api/v1/trips/:id/accept
// @access  Private (Driver)
exports.acceptTrip = async (req, res, next) => {
    try {
        const trip = await Trip.findById(req.params.id);

        if (!trip || trip.driverId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Not authorized for this trip' });
        }

        trip.status = 'ACCEPTED';
        await trip.save();

        // Notify Admins
        const title = "Trip Accepted";
        const description = `Trip ID ${trip._id} was accepted by the driver.`;
        
        await Notification.create({
            title,
            description,
            targetType: 'ALL',
            createdBy: req.user.id
        });

        const admins = await User.find({ role: 'admin', fcmToken: { $exists: true, $ne: null } });
        const tokens = admins.map(a => a.fcmToken).filter(t => t);
        if (tokens.length > 0) {
            await sendMulticastNotification(tokens, title, description, {
                tripId: trip._id.toString()
            });
        }

        res.status(200).json({ success: true, data: trip });
    } catch (err) {
        next(err);
    }
};

// @desc    Start Trip
// @route   PATCH /api/v1/trips/:id/start
// @access  Private (Driver)
exports.startTrip = async (req, res, next) => {
    try {
        const trip = await Trip.findById(req.params.id);

        if (!trip || trip.driverId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Not authorized for this trip' });
        }

        trip.status = 'EN_ROUTE';
        trip.startTime = Date.now();
        await trip.save();

        // Notify Admins
        const title = "Trip Started";
        const description = `Trip ID ${trip._id} has been started by the driver.`;
        
        await Notification.create({
            title,
            description,
            targetType: 'ALL',
            createdBy: req.user.id
        });

        const admins = await User.find({ role: 'admin', fcmToken: { $exists: true, $ne: null } });
        const tokens = admins.map(a => a.fcmToken).filter(t => t);
        if (tokens.length > 0) {
            await sendMulticastNotification(tokens, title, description, {
                tripId: trip._id.toString()
            });
        }

        res.status(200).json({ success: true, data: trip });
    } catch (err) {
        next(err);
    }
};

// @desc    Complete Trip & Calculate Fare
// @route   PATCH /api/v1/trips/:id/complete
// @access  Private (Driver)
exports.completeTrip = async (req, res, next) => {
    try {
        const trip = await Trip.findById(req.params.id);

        if (!trip || trip.driverId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Not authorized for this trip' });
        }

        // Use the distance set by the admin during assignment
        const distance = trip.distance || 0;
        
        // Fetch dynamic fare configuration
        const config = await getOrCreateFareConfig();
        
        const baseFare = config.baseFare;
        const perKmRate = config.perKmRate;
        const commissionRate = config.commissionRate / 100; // convert percentage to decimal (e.g. 20 -> 0.20)

        const fare = baseFare + (distance * perKmRate);
        const driverEarning = fare - (fare * commissionRate);

        trip.status = 'COMPLETED';
        trip.endTime = Date.now();
        trip.fare = fare;
        trip.driverEarning = driverEarning;

        await trip.save();

        // Notify Admins
        const title = "Trip Completed";
        const description = `Trip ID ${trip._id} has been completed. Fare: ${fare}`;
        
        await Notification.create({
            title,
            description,
            targetType: 'ALL',
            createdBy: req.user.id
        });

        const admins = await User.find({ role: 'admin', fcmToken: { $exists: true, $ne: null } });
        const tokens = admins.map(a => a.fcmToken).filter(t => t);
        if (tokens.length > 0) {
            await sendMulticastNotification(tokens, title, description, {
                tripId: trip._id.toString()
            });
        }

        res.status(200).json({ success: true, data: trip });
    } catch (err) {
        next(err);
    }
};

// @desc    Get current fare configuration
// @route   GET /api/v1/trips/fare-config
// @access  Private (Admin/Driver)
exports.getFareConfig = async (req, res, next) => {
    try {
        const config = await getOrCreateFareConfig();
        res.status(200).json({ success: true, data: config });
    } catch (err) {
        next(err);
    }
};

// @desc    Update fare configuration
// @route   PATCH /api/v1/trips/fare-config
// @access  Private (Admin)
exports.updateFareConfig = async (req, res, next) => {
    try {
        let config = await FareConfig.findOne();
        if (!config) {
            config = new FareConfig(req.body);
        } else {
            if (req.body.baseFare !== undefined) config.baseFare = req.body.baseFare;
            if (req.body.perKmRate !== undefined) config.perKmRate = req.body.perKmRate;
            if (req.body.commissionRate !== undefined) config.commissionRate = req.body.commissionRate;
            config.updatedAt = Date.now();
        }
        
        await config.save();
        res.status(200).json({ success: true, data: config });
    } catch (err) {
        next(err);
    }
};

// @desc    Cancel Trip
// @route   PATCH /api/v1/trips/:id/cancel
// @access  Private (Admin/Driver)
exports.cancelTrip = async (req, res, next) => {
    try {
        const { reason } = req.body;
        const trip = await Trip.findByIdAndUpdate(req.params.id, {
            status: 'CANCELLED',
            cancellationReason: reason
        }, { new: true }).populate('driverId');

        // Automated Notification for Cancellation
        if (req.user.role === 'admin' && trip.driverId) {
            const title = "Trip Cancelled";
            const description = `Your assigned trip has been cancelled by the admin. Reason: ${reason || 'N/A'}`;
            
            await Notification.create({
                title,
                description,
                targetType: 'SELECTED',
                recipientDriverId: trip.driverId._id,
                createdBy: req.user.id
            });

            if (trip.driverId.fcmToken) {
                await sendPushNotification(trip.driverId.fcmToken, title, description, {
                    tripId: trip._id.toString()
                });
            }
        } else if (req.user.role === 'driver') {
            const title = "Trip Cancelled by Driver";
            const description = `Trip ID ${trip._id} was cancelled by the driver. Reason: ${reason || 'N/A'}`;
            
            await Notification.create({
                title,
                description,
                targetType: 'ALL',
                createdBy: req.user.id
            });

            const admins = await User.find({ role: 'admin', fcmToken: { $exists: true, $ne: null } });
            const tokens = admins.map(a => a.fcmToken).filter(t => t);
            if (tokens.length > 0) {
                await sendMulticastNotification(tokens, title, description, {
                    tripId: trip._id.toString()
                });
            }
        }

        res.status(200).json({ success: true, data: trip });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all trips
// @route   GET /api/v1/trips
// @access  Private (Admin)
exports.getTrips = async (req, res, next) => {
    try {
        const trips = await Trip.find().populate('driverId', 'name phone vehicleNumber');
        res.status(200).json({ success: true, data: trips });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single trip
// @route   GET /api/v1/trips/:id
// @access  Private
exports.getTrip = async (req, res, next) => {
    try {
        const trip = await Trip.findById(req.params.id).populate('driverId', 'name phone vehicleNumber');
        if (!trip) return res.status(404).json({ success: false, error: 'Trip not found' });
        res.status(200).json({ success: true, data: trip });
    } catch (err) {
        next(err);
    }
};

// @desc    Get Driver Trips
// @route   GET /api/v1/trips/driver/:driverId
// @access  Private
exports.getDriverTrips = async (req, res, next) => {
    try {
        const trips = await Trip.find({ driverId: req.params.driverId });
        res.status(200).json({ success: true, count: trips.length, data: trips });
    } catch (err) {
        next(err);
    }
};

// @desc    Update trip
// @route   PUT /api/v1/trips/:id
// @access  Private (Admin)
exports.updateTrip = async (req, res, next) => {
    try {
        const trip = await Trip.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!trip) return res.status(404).json({ success: false, error: 'Trip not found' });

        res.status(200).json({ success: true, data: trip });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete trip
// @route   DELETE /api/v1/trips/:id
// @access  Private (Admin)
exports.deleteTrip = async (req, res, next) => {
    try {
        const trip = await Trip.findByIdAndDelete(req.params.id);

        if (!trip) return res.status(404).json({ success: false, error: 'Trip not found' });

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};

// @desc    Get trip reports/statistics for admin
// @route   GET /api/v1/trips/reports
// @access  Private (Admin)
exports.getReports = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        // Build query filter based on date if provided
        let filter = {};
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                // Set end date to end of the day
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        // Fetch all trips matching filter
        const trips = await Trip.find(filter);

        let totalTrips = trips.length;
        let completedTripsCount = 0;
        let cancelledTripsCount = 0;
        let activeTripsCount = 0; // CREATED, ASSIGNED, ACCEPTED, EN_ROUTE
        
        let totalRevenue = 0; // Sum of fare for completed trips
        let totalDriverEarnings = 0; // Sum of driverEarning for completed trips
        let totalSystemCommission = 0; // Sum of commission (fare - driverEarning)

        // Status breakdown
        const statusBreakdown = {
            CREATED: 0,
            ASSIGNED: 0,
            ACCEPTED: 0,
            EN_ROUTE: 0,
            COMPLETED: 0,
            CANCELLED: 0
        };

        trips.forEach(trip => {
            // Count status
            if (statusBreakdown[trip.status] !== undefined) {
                statusBreakdown[trip.status]++;
            }

            if (trip.status === 'COMPLETED') {
                completedTripsCount++;
                totalRevenue += trip.fare || 0;
                totalDriverEarnings += trip.driverEarning || 0;
                totalSystemCommission += ((trip.fare || 0) - (trip.driverEarning || 0));
            } else if (trip.status === 'CANCELLED') {
                cancelledTripsCount++;
            } else {
                activeTripsCount++;
            }
        });

        res.status(200).json({
            success: true,
            data: {
                totalTrips,
                completedTripsCount,
                cancelledTripsCount,
                activeTripsCount,
                financials: {
                    totalRevenue: Math.round(totalRevenue * 100) / 100,
                    totalDriverEarnings: Math.round(totalDriverEarnings * 100) / 100,
                    totalSystemCommission: Math.round(totalSystemCommission * 100) / 100
                },
                statusBreakdown
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get dashboard statistics for Admin or Driver
// @route   GET /api/v1/trips/dashboard
// @access  Private (Admin/Driver)
exports.getDashboardData = async (req, res, next) => {
    try {
        const role = req.user.role;

        if (role === 'admin') {
            // --- ADMIN DASHBOARD ---
            const trips = await Trip.find();
            const totalDrivers = await User.countDocuments({ role: 'driver' });

            let totalTrips = trips.length;
            let completedTripsCount = 0;
            let cancelledTripsCount = 0;
            let activeTripsCount = 0;
            let totalRevenue = 0;
            let totalSystemCommission = 0;

            trips.forEach(trip => {
                if (trip.status === 'COMPLETED') {
                    completedTripsCount++;
                    totalRevenue += trip.fare || 0;
                    totalSystemCommission += ((trip.fare || 0) - (trip.driverEarning || 0));
                } else if (trip.status === 'CANCELLED') {
                    cancelledTripsCount++;
                } else {
                    activeTripsCount++;
                }
            });

            // Fetch 5 most recent trips
            const recentTrips = await Trip.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('driverId', 'name phone vehicleNumber');

            return res.status(200).json({
                success: true,
                role: 'admin',
                data: {
                    metrics: {
                        totalTrips,
                        completedTripsCount,
                        cancelledTripsCount,
                        activeTripsCount,
                        totalDrivers,
                        totalRevenue: Math.round(totalRevenue * 100) / 100,
                        totalSystemCommission: Math.round(totalSystemCommission * 100) / 100
                    },
                    recentTrips
                }
            });
        } else if (role === 'driver') {
            // --- DRIVER DASHBOARD ---
            const driverId = req.user.id;
            const trips = await Trip.find({ driverId });

            let totalTrips = trips.length;
            let completedTripsCount = 0;
            let cancelledTripsCount = 0;
            let activeTripsCount = 0;
            let totalEarnings = 0;

            trips.forEach(trip => {
                if (trip.status === 'COMPLETED') {
                    completedTripsCount++;
                    totalEarnings += trip.driverEarning || 0;
                } else if (trip.status === 'CANCELLED') {
                    cancelledTripsCount++;
                } else {
                    activeTripsCount++;
                }
            });

            // Find if there is an active trip right now
            const currentActiveTrip = await Trip.findOne({
                driverId,
                status: { $in: ['ASSIGNED', 'ACCEPTED', 'EN_ROUTE'] }
            });

            // Fetch 5 most recent trips for this driver
            const recentTrips = await Trip.find({ driverId })
                .sort({ createdAt: -1 })
                .limit(5);

            return res.status(200).json({
                success: true,
                role: 'driver',
                data: {
                    metrics: {
                        totalTrips,
                        completedTripsCount,
                        cancelledTripsCount,
                        activeTripsCount,
                        totalEarnings: Math.round(totalEarnings * 100) / 100
                    },
                    currentActiveTrip,
                    recentTrips
                }
            });
        } else {
            return res.status(403).json({ success: false, error: 'Unauthorized role' });
        }
    } catch (err) {
        next(err);
    }
};

// @desc    Get logged in driver's trips
// @route   GET /api/v1/trips/my-trips
// @access  Private (Driver)
exports.getMyTrips = async (req, res, next) => {
    try {
        const trips = await Trip.find({ driverId: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: trips.length, data: trips });
    } catch (err) {
        next(err);
    }
};

// @desc    Get logged in driver's earnings
// @route   GET /api/v1/trips/my-earnings
// @access  Private (Driver)
exports.getMyEarnings = async (req, res, next) => {
    try {
        const trips = await Trip.find({ driverId: req.user.id, status: 'COMPLETED' }).sort({ endTime: -1 });

        let totalEarnings = 0;
        let todaysEarnings = 0;

        // Start of today (local time)
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const breakdown = trips.map(trip => {
            const earning = trip.driverEarning || 0;
            totalEarnings += earning;

            // Check if trip was completed today
            if (trip.endTime && new Date(trip.endTime) >= startOfToday) {
                todaysEarnings += earning;
            }

            return {
                tripId: trip._id,
                pickupLocation: trip.pickupLocation,
                dropLocation: trip.dropLocation,
                distance: trip.distance,
                fare: trip.fare,
                driverEarning: earning,
                completedAt: trip.endTime
            };
        });

        res.status(200).json({
            success: true,
            data: {
                todaysEarnings: Math.round(todaysEarnings * 100) / 100,
                totalEarnings: Math.round(totalEarnings * 100) / 100,
                totalTripsCompleted: trips.length,
                count: trips.length,
                breakdown
            }
        });
    } catch (err) {
        next(err);
    }
};

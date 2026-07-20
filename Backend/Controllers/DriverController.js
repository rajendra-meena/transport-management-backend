const User = require('../Models/UserModel');

// @desc    Get all drivers
// @route   GET /api/v1/drivers
// @access  Private/Admin
exports.getDrivers = async (req, res, next) => {
    try {
        const drivers = await User.find({ role: 'driver' });
        res.status(200).json({ success: true, count: drivers.length, data: drivers });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single driver
// @route   GET /api/v1/drivers/:id
// @access  Private/Admin
exports.getDriver = async (req, res, next) => {
    try {
        const driver = await User.findById(req.params.id);

        if (!driver || driver.role !== 'driver') {
            return res.status(404).json({ success: false, error: 'Driver not found' });
        }

        res.status(200).json({ success: true, data: driver });
    } catch (err) {
        next(err);
    }
};

// @desc    Create driver
// @route   POST /api/v1/drivers
// @access  Private/Admin
exports.createDriver = async (req, res, next) => {
    try {
        const driverData = { ...req.body };
        driverData.role = 'driver';

        if (req.file) {
            driverData.license = req.file.path;
        }

        const driver = await User.create(driverData);
        res.status(201).json({ success: true, data: driver });
    } catch (err) {
        next(err);
    }
};

// @desc    Update driver
// @route   PUT /api/v1/drivers/:id
// @access  Private/Admin
exports.updateDriver = async (req, res, next) => {
    try {
        let driverData = { ...req.body };

        if (req.file) {
            driverData.license = req.file.path;
        }

        const driver = await User.findByIdAndUpdate(req.params.id, driverData, {
            new: true,
            runValidators: true
        });

        if (!driver || driver.role !== 'driver') {
            return res.status(404).json({ success: false, error: 'Driver not found' });
        }

        res.status(200).json({ success: true, data: driver });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete driver
// @route   DELETE /api/v1/drivers/:id
// @access  Private/Admin
exports.deleteDriver = async (req, res, next) => {
    try {
        const driver = await User.findByIdAndDelete(req.params.id);

        if (!driver || driver.role !== 'driver') {
            return res.status(404).json({ success: false, error: 'Driver not found' });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};

// @desc    Update driver availability
// @route   PATCH /api/v1/drivers/availability
// @access  Private/Driver
exports.updateAvailability = async (req, res, next) => {
    try {
        const { isAvailable } = req.body;

        if (isAvailable === undefined) {
            return res.status(400).json({ success: false, error: 'Please provide availability status' });
        }

        const driver = await User.findByIdAndUpdate(
            req.user.id,
            { isAvailable },
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({ success: true, data: driver });
    } catch (err) {
        next(err);
    }
};

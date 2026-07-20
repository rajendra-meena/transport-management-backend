const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email',
        ],
    },
    password: {
        type: String
    },
    role: {
        type: String,
        enum: ['admin', 'driver'],
        default: 'driver',
    },
    phone: {
        type: String,
    },
    // Driver Specific Fields
    license: {
        type: String,
        unique: true,
        sparse: true, // Allows multiple nulls (for non-drivers)
    },
    vehicleNumber: {
        type: String,
    },
    experience: {
        type: Number,
    },
    address: {
        type: String,
    },
    emergencyContact: {
        type: String,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isAvailable: {
        type: Boolean,
        default: true,
    },
    fcmToken: {
        type: String,
    },
    otp: String,
    otpExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Generate 6-digit OTP
userSchema.methods.getOtp = function () {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set to model
    this.otp = otp;

    // Set expire (10 mins)
    this.otpExpire = Date.now() + 10 * 60 * 1000;

    return otp;
};

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function () {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

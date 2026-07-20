const User = require('../Models/UserModel');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc    Register Driver
exports.register = async (req, res, next) => {
    try {
        const userData = { ...req.body };
        if (req.file) {
            userData.license = req.file.path;
        }
        const user = await User.create(userData);

        // Send welcome email with credentials
        try {
            const message = `
Dear ${user.name},

Welcome to the Transport Management System!

Your driver account has been created successfully. Below are your login credentials:

Email: ${user.email}
Password: ${req.body.password}

Click the link below to log in and start managing your trips:
http://localhost:5173/driver/my_trips

Best regards,
Transport Management System Team
            `;

            await sendEmail({
                email: user.email,
                subject: 'Welcome to Transport Management System - Account Created',
                message: message.trim()
            });
        } catch (emailErr) {
            // Log email error but don't fail the registration
            console.error('Welcome email could not be sent:', emailErr.message);
        }

        sendTokenResponse(user, 201, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Login User/Driver
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Please provide an email and password' });
        }
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Check if verified (Don't check for admins)
        if (user.role !== 'admin' && !user.isVerified) {
            return res.status(403).json({ success: false, error: 'Your account is under review. Please wait for admin approval.' });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Get current logged in user
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
};

// @desc    Forgot password (Send OTP)
exports.forgotPassword = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).json({ success: false, error: 'There is no user with that email' });
        }
        const otp = user.getOtp();
        await user.save({ validateBeforeSave: false });
        const message = `Your password reset OTP is: ${otp}. It will expire in 10 minutes.`;
        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset OTP',
                message
            });
            res.status(200).json({ success: true, data: 'OTP sent to email' });
        } catch (err) {
            user.otp = undefined;
            user.otpExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ success: false, error: 'Email could not be sent' });
        }
    } catch (err) {
        next(err);
    }
};

// @desc    Verify OTP & Get Reset Token
exports.verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({
            email,
            otp,
            otpExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
        }

        // Generate Reset Token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash and save to DB
        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Reset token valid for 10 mins
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

        // Clear OTP fields
        user.otp = undefined;
        user.otpExpire = undefined;

        await user.save({ validateBeforeSave: false });

        res.status(200).json({ 
            success: true, 
            message: 'OTP verified', 
            resetToken 
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Reset password (with Token)
exports.resetPassword = async (req, res, next) => {
    try {
        const { resetToken, password, confirmPassword } = req.body;

        // Validation
        if (!password || !confirmPassword) {
            return res.status(400).json({ success: false, error: 'Please provide both password and confirm password' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, error: 'Passwords do not match' });
        }

        // Get hashed token
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
        }

        // Update password
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({ success: true, message: 'Password reset successfully. You can now login.' });
    } catch (err) {
        next(err);
    }
};

// @desc    Update password (Logged-in user)
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ success: false, error: 'Please provide all password fields' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, error: 'New passwords do not match' });
        }

        // Get user and check password
        const user = await User.findById(req.user.id).select('+password');

        if (!(await user.matchPassword(currentPassword))) {
            return res.status(401).json({ success: false, error: 'Current password is incorrect' });
        }

        // Set new password
        user.password = newPassword;
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};
// @desc    Update FCM Token for Push Notifications
// @route   PUT /api/v1/auth/fcm-token
// @access  Private
exports.updateFcmToken = async (req, res, next) => {
    try {
        const { fcmToken } = req.body;

        if (!fcmToken) {
            return res.status(400).json({ success: false, error: 'Please provide an FCM token' });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { fcmToken },
            { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, data: 'FCM token updated successfully' });
    } catch (err) {
        next(err);
    }
};

const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            role: user.role   // 👈 sirf role
        });
};

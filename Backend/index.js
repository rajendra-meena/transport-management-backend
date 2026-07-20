const app = require('./app');
const connectDB = require('./Config/db');
const nodemailer = require('nodemailer');

// Connect to database
connectDB();

// Mail Server Configuration (Nodemailer)
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Verify mail server connection
transporter.verify((error, success) => {
    if (error) {
        console.log('Mail Server Error:', error);
    } else {
        console.log('Mail Server is ready to take messages');
    }
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});

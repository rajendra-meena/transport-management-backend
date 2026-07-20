const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Set static folder
app.use('/uploads', express.static('uploads'));

// Route files
const auth = require('./Routes/auth');
const drivers = require('./Routes/driver');
const trips = require('./Routes/trip');
const notifications = require('./Routes/notification');
const payments = require('./Routes/payment');

const errorHandler = require('./Middleware/error');

// Mount routers
app.get('/', (req, res) => {
    res.send('Transport Management System API is running...');
});

app.use('/api/v1/auth', auth);
app.use('/api/v1/drivers', drivers);
app.use('/api/v1/trips', trips);
app.use('/api/v1/notifications', notifications);
app.use('/api/v1/payments', payments);

// Error Handler
app.use(errorHandler);

module.exports = app;

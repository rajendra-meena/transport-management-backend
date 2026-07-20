const mongoose = require('mongoose');

const fareConfigSchema = new mongoose.Schema({
    baseFare: {
        type: Number,
        required: [true, 'Please add a base fare'],
        default: 50,
    },
    perKmRate: {
        type: Number,
        required: [true, 'Please add per km rate'],
        default: 15,
    },
    commissionRate: {
        type: Number,
        required: [true, 'Please add a commission rate'],
        default: 20, // percentage (e.g. 20 for 20%)
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('FareConfig', fareConfigSchema);

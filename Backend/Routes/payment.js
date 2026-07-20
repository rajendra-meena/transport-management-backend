const express = require('express');
const {
    getPayments,
    collectCustomerPayment,
    payoutDriver,
    getPaymentStats
} = require('../Controllers/PaymentController');

const router = express.Router();
const { protect, authorize } = require('../Middleware/auth');

// All payment routes are protected and restricted to Admin
router.use(protect);
router.use(authorize('admin'));

router.get('/', getPayments);
router.get('/stats', getPaymentStats);
router.post('/collect', collectCustomerPayment);
router.post('/payout', payoutDriver);

module.exports = router;

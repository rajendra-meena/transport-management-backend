const express = require('express');
const {
    createTrip,
    assignDriver,
    acceptTrip,
    startTrip,
    completeTrip,
    cancelTrip,
    getTrips,
    getTrip,
    getDriverTrips,
    updateTrip,
    deleteTrip,
    getFareConfig,
    updateFareConfig,
    getReports,
    getDashboardData,
    getMyTrips,
    getMyEarnings
} = require('../Controllers/TripController');

const router = express.Router();
const { protect, authorize } = require('../Middleware/auth');

// All trip routes are protected
router.use(protect);

router
    .route('/')
    .get(authorize('admin'), getTrips)
    .post(authorize('admin'), createTrip);

router.get('/driver/:driverId', getDriverTrips);

router
    .route('/fare-config')
    .get(getFareConfig)
    .patch(authorize('admin'), updateFareConfig);

router.get('/reports', authorize('admin'), getReports);

router.get('/dashboard', getDashboardData);

router.get('/my-trips', authorize('driver'), getMyTrips);
router.get('/my-earnings', authorize('driver'), getMyEarnings);

router
    .route('/:id')
    .get(getTrip)
    .put(authorize('admin'), updateTrip)
    .delete(authorize('admin'), deleteTrip);

router.patch('/:id/cancel', authorize('admin', 'driver'), cancelTrip);
router.patch('/:id/assign', authorize('admin'), assignDriver);
router.patch('/:id/accept', authorize('driver'), acceptTrip);
router.patch('/:id/start', authorize('driver'), startTrip);
router.patch('/:id/complete', authorize('driver'), completeTrip);

module.exports = router;

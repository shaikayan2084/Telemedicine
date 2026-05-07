const express = require('express');
const router = express.Router();
const {
  bookAppointment,
  getMyAppointments,
  getRoomToken,
  updateStatus,
} = require('../controllers/appointmentController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.post('/', restrictTo('patient'), bookAppointment);
router.get('/', getMyAppointments);
router.get('/:id/room-token', getRoomToken);
router.patch('/:id/status', updateStatus);

module.exports = router;

import express from 'express';
import TrainingBooking from '../models/TrainingBooking.js';

const router = express.Router();

// Fixed trainings list (same 9 services)
const TRAINING_COURSES = [
  { name: 'Plumbing', price: 8000 },
  { name: 'Carpentry', price: 9000 },
  { name: 'Painting', price: 7000 },
  { name: 'Tiling', price: 10000 },
  { name: 'Minor Electrical', price: 9000 },
  { name: 'Masonry', price: 11000 },
  { name: 'Roofing', price: 12000 },
  { name: 'Flooring', price: 9500 },
  { name: 'General Handyman', price: 6000 }
];

// GET /api/training/courses -> list all trainings with prices
router.get('/courses', (req, res) => {
  res.json(TRAINING_COURSES);
});

// POST /api/training/book -> create a training booking
router.post('/book', async (req, res) => {
  try {
    const { fullName, phone, email, trainingNames, preferredDate, message } = req.body;

    if (!fullName || !phone || !email) {
      return res
        .status(400)
        .json({ message: 'Full name, phone and email are required.' });
    }

    if (!Array.isArray(trainingNames) || trainingNames.length === 0) {
      return res
        .status(400)
        .json({ message: 'At least one training must be selected.' });
    }

    // Map names -> full course objects with price
    const selectedCourses = TRAINING_COURSES.filter(course =>
      trainingNames.includes(course.name)
    );

    if (selectedCourses.length === 0) {
      return res
        .status(400)
        .json({ message: 'No valid trainings selected.' });
    }

    const trainingBooking = await TrainingBooking.create({
      fullName,
      phone,
      email,
      trainings: selectedCourses,
      preferredDate: preferredDate || null,
      message: message || ''
    });

    res.status(201).json({
      message: 'Training booking created successfully.',
      booking: trainingBooking
    });
  } catch (error) {
    console.error('Training booking error:', error);
    res.status(500).json({ message: 'Server error while booking training.' });
  }
});

// GET /api/training/bookings -> admin can view all training bookings
router.get('/bookings', async (req, res) => {
  try {
    const list = await TrainingBooking.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (error) {
    console.error('Fetch training bookings error:', error);
    res.status(500).json({ message: 'Server error while loading training bookings.' });
  }
});

// PUT /api/training/update-status/:id -> mark training as done
router.put('/update-status/:id', async (req, res) => {
  try {
    const booking = await TrainingBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Training booking not found" });
    }

    booking.status = "done";
    await booking.save();

    res.json({
      message: "Training booking marked as done",
      booking
    });
  } catch (err) {
    console.error("Update training status error:", err);
    res.status(500).json({ message: "Server error while updating training status" });
  }
});

export default router;

import express from 'express';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import ServiceProvider from '../models/ServiceProvider.js';
import { authenticateToken, authenticateAppointer } from '../middleware/auth.js';

const router = express.Router();

// Create review
router.post('/create', authenticateToken, authenticateAppointer, async (req, res) => {
  try {
    const { bookingId, stars, comment } = req.body;

    if (!bookingId || !stars) {
      return res.status(400).json({ message: 'Booking ID and stars rating are required' });
    }

    if (stars < 1 || stars > 5) {
      return res.status(400).json({ message: 'Stars must be between 1 and 5' });
    }

    // Check if booking exists and belongs to user
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.customerPhone !== req.user.phone) {
      return res.status(403).json({ message: 'Not authorized to review this booking' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed bookings' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return res.status(400).json({ message: 'Review already exists for this booking' });
    }

    if (!booking.assignedProviderId) {
      return res.status(400).json({ message: 'No provider assigned to this booking' });
    }

    // Create review
    const review = new Review({
      bookingId,
      providerId: booking.assignedProviderId,
      customerPhone: booking.customerPhone,
      stars: parseInt(stars),
      comment: comment || ''
    });

    await review.save();

    // Update provider's rating and jobs completed
    const provider = await ServiceProvider.findById(booking.assignedProviderId);
    if (provider) {
      const allReviews = await Review.find({ providerId: provider._id });
      const totalStars = allReviews.reduce((sum, r) => sum + r.stars, 0);
      provider.rating.average = totalStars / allReviews.length;
      provider.rating.totalReviews = allReviews.length;
      
      // Increment jobs completed if this is the first review for this booking
      const existingReview = await Review.findOne({ bookingId });
      if (!existingReview) {
        provider.jobsCompleted = (provider.jobsCompleted || 0) + 1;
      }
      
      await provider.save();
    }

    res.status(201).json({
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get reviews for a provider
router.get('/provider/:providerId', async (req, res) => {
  try {
    const reviews = await Review.find({ providerId: req.params.providerId })
      .sort({ timestamp: -1 })
      .limit(50);

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get review for a booking
router.get('/booking/:bookingId', authenticateToken, async (req, res) => {
  try {
    const review = await Review.findOne({ bookingId: req.params.bookingId });
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;


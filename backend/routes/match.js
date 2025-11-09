import express from 'express';
import { matchProviders, findBestCombination } from '../services/matchService.js';
import ServiceProvider from '../models/ServiceProvider.js';

const router = express.Router();

// Match providers for a service type
router.post('/service', async (req, res) => {
  try {
    const { serviceType, limit, serviceLocation } = req.body;

    if (!serviceType) {
      return res.status(400).json({ message: 'Service type is required' });
    }

    // serviceLocation is optional: {latitude, longitude}
    const matchedProviders = await matchProviders(
      serviceType, 
      limit || 10, 
      serviceLocation || null
    );

    res.json({
      serviceType,
      providers: matchedProviders,
      count: matchedProviders.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Match providers for multiple service types (backtracking)
router.post('/multiple-services', async (req, res) => {
  try {
    const { serviceTypes, maxProviders } = req.body;

    if (!serviceTypes || !Array.isArray(serviceTypes) || serviceTypes.length === 0) {
      return res.status(400).json({ message: 'Service types array is required' });
    }

    // Get all verified providers
    const providers = await ServiceProvider.find({ verificationStatus: 'verified' });

    const bestCombination = await findBestCombination(
      serviceTypes,
      providers,
      maxProviders || 3
    );

    res.json({
      serviceTypes,
      providers: bestCombination,
      count: bestCombination.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Request a specific provider for a booking
router.post('/request-provider', async (req, res) => {
  try {
    const { bookingId, providerId } = req.body;

    if (!bookingId || !providerId) {
      return res.status(400).json({ message: 'Booking ID and Provider ID are required' });
    }

    const Booking = (await import('../models/Booking.js')).default;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const provider = await ServiceProvider.findById(providerId);
    if (!provider || provider.verificationStatus !== 'verified') {
      return res.status(404).json({ message: 'Provider not found or not verified' });
    }

    // Check if provider has the required skill
    if (!provider.skills.includes(booking.serviceType)) {
      return res.status(400).json({ message: 'Provider does not offer this service type' });
    }

    // Assign provider to booking
    booking.assignedProviderId = providerId;
    booking.status = 'pending'; // Provider needs to accept
    await booking.save();

    res.json({
      message: 'Provider requested successfully. Waiting for provider acceptance.',
      booking
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;


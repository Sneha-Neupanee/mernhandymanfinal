import express from 'express';
import bcrypt from 'bcryptjs';
import ServiceProvider from '../models/ServiceProvider.js';
import { upload } from '../middleware/upload.js';
import { authenticateToken, authenticateProvider } from '../middleware/auth.js';

const router = express.Router();

// Register new provider
router.post('/register', upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'portfolioPhotos', maxCount: 10 }
]), async (req, res) => {
  try {
    const { name, phone, password, skills, experienceYears, address } = req.body;

    if (!name || !phone || !password || !skills || !experienceYears || !address) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if provider already exists
    const existingProvider = await ServiceProvider.findOne({ phone });
    if (existingProvider) {
      return res.status(400).json({ message: 'Provider with this phone number already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Handle file uploads
    const profilePhotoUrl = req.files?.profilePhoto?.[0] 
      ? `/uploads/${req.files.profilePhoto[0].filename}` 
      : '';
    
    const portfolioPhotos = req.files?.portfolioPhotos 
      ? req.files.portfolioPhotos.map(file => `/uploads/${file.filename}`)
      : [];

    // Parse skills (assuming it comes as comma-separated string or array)
    const skillsArray = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());

    const provider = new ServiceProvider({
      name,
      phone,
      passwordHash,
      skills: skillsArray,
      experienceYears: parseInt(experienceYears),
      address,
      profilePhotoUrl,
      portfolioPhotos,
      verificationStatus: 'pending'
    });

    await provider.save();

    res.status(201).json({
      message: 'Provider registered successfully. Waiting for admin verification.',
      provider: {
        id: provider._id,
        name: provider.name,
        phone: provider.phone,
        verificationStatus: provider.verificationStatus
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get provider profile
router.get('/profile', authenticateToken, authenticateProvider, async (req, res) => {
  try {
    const provider = await ServiceProvider.findById(req.user.id);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    res.json(provider);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get provider dashboard data
router.get('/dashboard', authenticateToken, authenticateProvider, async (req, res) => {
  try {
    const provider = await ServiceProvider.findById(req.user.id);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Get pending bookings for this provider
    const Booking = (await import('../models/Booking.js')).default;
    const pendingBookings = await Booking.find({
      assignedProviderId: provider._id,
      status: 'pending'
    }).populate('assignedProviderId', 'name phone');

    // Get confirmed/completed bookings for this provider
    const confirmedBookings = await Booking.find({
      assignedProviderId: provider._id,
      status: { $in: ['confirmed', 'completed'] }
    }).populate('assignedProviderId', 'name phone skills rating profilePhotoUrl location')
      .sort({ createdAt: -1 });

    res.json({
      provider,
      pendingBookings,
      confirmedBookings
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Accept/Reject booking
router.put('/bookings/:bookingId/respond', authenticateToken, authenticateProvider, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    const Booking = (await import('../models/Booking.js')).default;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.assignedProviderId?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to respond to this booking' });
    }

    if (action === 'accept') {
      booking.status = 'confirmed';
      booking.providerStatus = 'accepted';
    } else if (action === 'reject') {
      booking.status = 'rejected';
      booking.assignedProviderId = null;
    } else {
      return res.status(400).json({ message: 'Invalid action. Use "accept" or "reject"' });
    }

    await booking.save();

    // Emit notification via Socket.IO if available
    const io = req.app.get('io');
    if (io && action === 'accept') {
      io.to(`booking-${bookingId}`).emit('booking-confirmed', {
        bookingId,
        providerId: req.user.id
      });
    }

    res.json({ message: `Booking ${action}ed successfully`, booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update provider location
router.put('/location', authenticateToken, authenticateProvider, async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const provider = await ServiceProvider.findById(req.user.id);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    provider.location = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address: address || provider.address
    };

    await provider.save();

    res.json({ message: 'Location updated', provider });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all verified providers (public)
router.get('/verified', async (req, res) => {
  try {
    const providers = await ServiceProvider.find({ verificationStatus: 'verified' })
      .select('name phone skills experienceYears address profilePhotoUrl rating')
      .sort({ 'rating.average': -1 });

    res.json(providers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;


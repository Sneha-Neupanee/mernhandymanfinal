import express from 'express';
import bcrypt from 'bcryptjs';
import Booking from '../models/Booking.js';
import { upload } from '../middleware/upload.js';
import { authenticateToken, authenticateAppointer } from '../middleware/auth.js';

const router = express.Router();

// Create new booking
router.post('/create', upload.single('serviceRequestPhoto'), async (req, res) => {
  try {
    const { 
      customerName, 
      customerPhone, 
      password, 
      serviceType, 
      preferredDateTime,
      serviceLocation // {latitude, longitude, addressText}
    } = req.body;

    if (!customerName || !customerPhone || !password || !serviceType || !preferredDateTime) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Handle file upload
    const serviceRequestPhotoUrl = req.file 
      ? `/uploads/${req.file.filename}` 
      : '';

    // Parse serviceLocation if provided
    let parsedLocation = null;
    if (serviceLocation) {
      try {
        parsedLocation = typeof serviceLocation === 'string' 
          ? JSON.parse(serviceLocation) 
          : serviceLocation;
      } catch (e) {
        // Invalid JSON, ignore
      }
    }

    const booking = new Booking({
      customerName,
      customerPhone,
      passwordHash,
      serviceType,
      serviceRequestPhotoUrl,
      preferredDateTime: new Date(preferredDateTime),
      status: 'pending',
      serviceLocation: parsedLocation ? {
        latitude: parseFloat(parsedLocation.latitude),
        longitude: parseFloat(parsedLocation.longitude),
        addressText: parsedLocation.addressText || ''
      } : null
    });

    await booking.save();

    res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        id: booking._id,
        customerName: booking.customerName,
        serviceType: booking.serviceType,
        preferredDateTime: booking.preferredDateTime,
        status: booking.status,
        serviceLocation: booking.serviceLocation
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get appointer dashboard (all their bookings)
router.get('/appointer', authenticateToken, authenticateAppointer, async (req, res) => {
  try {
    const bookings = await Booking.find({ customerPhone: req.user.phone })
      .populate('assignedProviderId', 'name phone skills rating')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark booking as completed
router.put('/:bookingId/complete', authenticateToken, authenticateAppointer, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.customerPhone !== req.user.phone) {
      return res.status(403).json({ message: 'Not authorized to complete this booking' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'Only confirmed bookings can be marked as completed' });
    }

    booking.status = 'completed';
    booking.completedAt = new Date();
    await booking.save();

    res.json({ message: 'Booking marked as completed', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single booking details
router.get('/:bookingId', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('assignedProviderId', 'name phone skills rating profilePhotoUrl location');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check authorization
    if (req.user.role === 'appointer' && booking.customerPhone !== req.user.phone) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (req.user.role === 'provider' && booking.assignedProviderId?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add additional service details (photos, description)
router.put('/:bookingId/additional-details', authenticateToken, authenticateAppointer, upload.array('photos', 5), async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { description } = req.body;
    
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.customerPhone !== req.user.phone) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Handle photo uploads
    const photoUrls = req.files 
      ? req.files.map(file => `/uploads/${file.filename}`)
      : [];

    // Update additional details
    if (!booking.additionalDetails) {
      booking.additionalDetails = {
        photos: [],
        description: '',
        updatedAt: null
      };
    }

    booking.additionalDetails.photos = [
      ...booking.additionalDetails.photos,
      ...photoUrls
    ];
    
    if (description) {
      booking.additionalDetails.description = description;
    }
    
    booking.additionalDetails.updatedAt = new Date();
    await booking.save();

    res.json({ message: 'Additional details updated', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update provider status (on-route, arrived, working, etc.)
router.put('/:bookingId/provider-status', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { providerStatus } = req.body; // 'on-route', 'arrived', 'working', etc.

    if (!['pending', 'accepted', 'on-route', 'arrived', 'working', 'completed'].includes(providerStatus)) {
      return res.status(400).json({ message: 'Invalid provider status' });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify user is the assigned provider
    if (req.user.role !== 'provider' || booking.assignedProviderId?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    booking.providerStatus = providerStatus;
    await booking.save();

    // Emit status update via Socket.IO if available
    const io = req.app.get('io');
    if (io) {
      io.to(`booking-${bookingId}`).emit('provider-status-update', {
        bookingId,
        providerStatus
      });
    }

    res.json({ message: 'Provider status updated', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;


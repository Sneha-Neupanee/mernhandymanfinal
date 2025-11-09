import express from 'express';
import bcrypt from 'bcryptjs';
import ServiceProvider from '../models/ServiceProvider.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import Admin from '../models/Admin.js';
import { authenticateToken, authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Initialize default admin (if not exists)
router.post('/init', async (req, res) => {
  try {
    const adminExists = await Admin.findOne({ username: 'admin' });
    if (adminExists) {
      return res.json({ message: 'Admin already exists' });
    }

    const passwordHash = await bcrypt.hash('admin123', 10);
    const admin = new Admin({
      username: 'admin',
      passwordHash
    });

    await admin.save();
    res.json({ message: 'Default admin created (username: admin, password: admin123)' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all providers
router.get('/providers', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const providers = await ServiceProvider.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    res.json(providers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify/Reject provider
router.put('/providers/:providerId/verify', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const { providerId } = req.params;
    const { action } = req.body; // 'verify' or 'reject'

    if (!['verify', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be "verify" or "reject"' });
    }

    const provider = await ServiceProvider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    provider.verificationStatus = action === 'verify' ? 'verified' : 'rejected';
    await provider.save();

    res.json({
      message: `Provider ${action}d successfully`,
      provider
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all bookings
router.get('/bookings', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('assignedProviderId', 'name phone')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get statistics
router.get('/statistics', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    // Total Service Providers
    const totalProviders = await ServiceProvider.countDocuments();

    // Total Appointers (unique phone numbers in bookings)
    const uniqueAppointers = await Booking.distinct('customerPhone');
    const totalAppointers = uniqueAppointers.length;

    // Total Appointments
    const totalAppointments = await Booking.countDocuments();

    // Appointments completed in past month
    const completedLastMonth = await Booking.countDocuments({
      status: 'completed',
      completedAt: { $gte: oneMonthAgo }
    });

    // Service providers verified in past month
    const verifiedLastMonth = await ServiceProvider.countDocuments({
      verificationStatus: 'verified',
      createdAt: { $gte: oneMonthAgo }
    });

    // Additional stats
    const pendingProviders = await ServiceProvider.countDocuments({ verificationStatus: 'pending' });
    const verifiedProviders = await ServiceProvider.countDocuments({ verificationStatus: 'verified' });
    const rejectedProviders = await ServiceProvider.countDocuments({ verificationStatus: 'rejected' });

    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });

    res.json({
      providers: {
        total: totalProviders,
        verified: verifiedProviders,
        pending: pendingProviders,
        rejected: rejectedProviders,
        verifiedLastMonth
      },
      appointers: {
        total: totalAppointers
      },
      appointments: {
        total: totalAppointments,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        completed: completedBookings,
        completedLastMonth
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;


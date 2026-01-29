import express from 'express';
import bcrypt from 'bcryptjs';
import ServiceProvider from '../models/ServiceProvider.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import Admin from '../models/Admin.js';
import { authenticateToken, authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

/* ============================
   INIT DEFAULT ADMIN
============================ */
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

/* ============================
   GET ALL PROVIDERS
============================ */
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

/* ============================
   VERIFY / REJECT PROVIDER
============================ */
router.put('/providers/:providerId/verify', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const { providerId } = req.params;
    const { action } = req.body;

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

/* ============================
   ALL BOOKINGS
============================ */
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

/* ============================
   STATISTICS (UPDATED WITH PROFIT)
============================ */
router.get('/statistics', authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const totalProviders = await ServiceProvider.countDocuments();

    const uniqueAppointers = await Booking.distinct('customerPhone');
    const totalAppointers = uniqueAppointers.length;

    const totalAppointments = await Booking.countDocuments();

    const completedLastMonth = await Booking.countDocuments({
      status: 'completed',
      completedAt: { $gte: oneMonthAgo }
    });

    const verifiedLastMonth = await ServiceProvider.countDocuments({
      verificationStatus: 'verified',
      createdAt: { $gte: oneMonthAgo }
    });

    const pendingProviders = await ServiceProvider.countDocuments({ verificationStatus: 'pending' });
    const verifiedProviders = await ServiceProvider.countDocuments({ verificationStatus: 'verified' });
    const rejectedProviders = await ServiceProvider.countDocuments({ verificationStatus: 'rejected' });

    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });

    /* ⭐ NEW: TOTAL PLATFORM PROFIT */
    const profitResult = await Booking.aggregate([
      { $group: { _id: null, totalProfit: { $sum: "$platformProfit" } } }
    ]);
    const totalPlatformProfit = profitResult[0]?.totalProfit || 0;

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
      },
      /* ⭐ include in response */
      totalProfit: totalPlatformProfit
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ============================
   NEW: TOTAL PROFIT PAGE
============================ */
router.get("/profit", authenticateToken, authenticateAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find({ status: "completed" });

    const totalProfit = bookings.reduce((sum, b) => {
      return sum + (b.platformProfit || 0);
    }, 0);

    res.json({
      totalProfit,
      count: bookings.length,
      bookings: bookings.map(b => ({
        id: b._id,
        serviceType: b.serviceType,
        pricePaid: b.pricePaidByCustomer,
        profit: b.platformProfit,
        completedAt: b.completedAt
      }))
    });

  } catch (err) {
    console.error("Profit fetch error:", err);
    res.status(500).json({ message: "Failed to fetch profit data" });
  }
});

export default router;

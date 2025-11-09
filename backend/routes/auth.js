import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import ServiceProvider from '../models/ServiceProvider.js';
import Booking from '../models/Booking.js';
import Admin from '../models/Admin.js';

const router = express.Router();

// Provider Login
router.post('/provider', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password are required' });
    }

    const provider = await ServiceProvider.findOne({ phone });
    if (!provider) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await provider.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: provider._id, role: 'provider', phone: provider.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
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

// Appointer Login
router.post('/appointer', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password are required' });
    }

    // Find a booking with this phone number
    const booking = await Booking.findOne({ customerPhone: phone });
    if (!booking) {
      return res.status(401).json({ message: 'No account found with this phone number' });
    }

    const isMatch = await booking.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: booking._id, role: 'appointer', phone: booking.customerPhone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      appointer: {
        phone: booking.customerPhone,
        name: booking.customerName
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Login
router.post('/admin', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, role: 'admin', username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        username: admin.username
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;


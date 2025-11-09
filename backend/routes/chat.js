import express from 'express';
import Chat from '../models/Chat.js';
import Booking from '../models/Booking.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Get chat history for a booking
 * Only accessible by appointer or assigned provider
 */
router.get('/booking/:bookingId', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findById(bookingId).populate('assignedProviderId');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify user has access
    const isAppointer = req.user.role === 'appointer' && 
                       booking.customerPhone === req.user.phone;
    const isProvider = req.user.role === 'provider' && 
                      booking.assignedProviderId?._id.toString() === req.user.id;

    if (!isAppointer && !isProvider) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Only allow chat if booking is confirmed
    if (booking.status !== 'confirmed' && booking.status !== 'completed') {
      return res.status(400).json({ message: 'Chat only available for confirmed bookings' });
    }

    // Get chat history
    const messages = await Chat.find({ bookingId })
      .sort({ timestamp: 1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get all chats for a provider (from active bookings)
 */
router.get('/provider', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Provider access required' });
    }

    // Get all confirmed bookings for this provider
    const bookings = await Booking.find({
      assignedProviderId: req.user.id,
      status: { $in: ['confirmed', 'completed'] }
    }).select('_id customerName serviceType status');

    // Get latest message for each booking
    const chats = await Promise.all(
      bookings.map(async (booking) => {
        const lastMessage = await Chat.findOne({ bookingId: booking._id })
          .sort({ timestamp: -1 });
        
        const unreadCount = await Chat.countDocuments({
          bookingId: booking._id,
          receiverId: req.user.id,
          read: false
        });

        return {
          booking,
          lastMessage,
          unreadCount
        };
      })
    );

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Mark messages as read
 */
router.put('/booking/:bookingId/read', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify user has access
    const isAppointer = req.user.role === 'appointer' && 
                       booking.customerPhone === req.user.phone;
    const isProvider = req.user.role === 'provider' && 
                      booking.assignedProviderId?.toString() === req.user.id;

    if (!isAppointer && !isProvider) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Mark messages as read
    await Chat.updateMany(
      {
        bookingId,
        receiverId: req.user.role === 'appointer' ? booking._id : booking.assignedProviderId,
        read: false
      },
      { read: true }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;


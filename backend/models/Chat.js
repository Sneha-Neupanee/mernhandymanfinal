import mongoose from 'mongoose';

/**
 * Chat Model
 * Stores messages between Appointer and Service Provider
 * Only accessible when booking is confirmed
 */
const chatSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  senderRole: {
    type: String,
    enum: ['appointer', 'provider'],
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  receiverRole: {
    type: String,
    enum: ['appointer', 'provider'],
    required: true
  },
  messageText: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  read: {
    type: Boolean,
    default: false
  }
});

// Compound index for efficient querying
chatSchema.index({ bookingId: 1, timestamp: 1 });

export default mongoose.model('Chat', chatSchema);


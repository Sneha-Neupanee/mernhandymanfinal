import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const bookingSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  serviceType: {
    type: String,
    required: true,
    trim: true
  },
  serviceRequestPhotoUrl: {
    type: String,
    default: ''
  },
  preferredDateTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'rejected'],
    default: 'pending'
  },
  assignedProviderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  serviceLocation: {
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
    addressText: {
      type: String,
      default: ''
    }
  },
  additionalDetails: {
    photos: [{
      type: String
    }],
    description: {
      type: String,
      default: ''
    },
    updatedAt: {
      type: Date,
      default: null
    }
  },
  providerStatus: {
    type: String,
    enum: ['pending', 'accepted', 'on-route', 'arrived', 'working', 'completed'],
    default: 'pending'
  }
});

// Method to compare password
bookingSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

export default mongoose.model('Booking', bookingSchema);


import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const serviceProviderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  skills: [{
    type: String,
    required: true
  }],
  experienceYears: {
    type: Number,
    required: true,
    min: 0
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  profilePhotoUrl: {
    type: String,
    default: ''
  },
  portfolioPhotos: [{
    type: String
  }],
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  jobsCompleted: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  location: {
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
    address: {
      type: String,
      default: ''
    }
  }
});

// Method to compare password
serviceProviderSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

export default mongoose.model('ServiceProvider', serviceProviderSchema);


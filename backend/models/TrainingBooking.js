import mongoose from 'mongoose';

const trainingBookingSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    trainings: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true }
      }
    ],
    preferredDate: {
      type: Date,
      default: null
    },
    // Just a note like “Want evening batch” etc.
    message: {
      type: String,
      default: ''
    },
    // Training booking status
    status: {
      type: String,
      enum: ['pending', 'done', 'confirmed', 'completed', 'cancelled'], // ← "done" added here
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

const TrainingBooking = mongoose.model('TrainingBooking', trainingBookingSchema);

export default TrainingBooking;

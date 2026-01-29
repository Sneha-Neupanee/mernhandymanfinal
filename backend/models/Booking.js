import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const bookingSchema = new mongoose.Schema(
  {
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

    /* ⭐ User enters how much they paid after service */
    pricePaidByCustomer: {
      type: Number,
      default: null
    },

    /* ⭐ Auto-stored 10% platform profit */
    platformProfit: {
      type: Number,
      default: 0
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

    /* ⭐ Timestamp when service is completed */
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
      photos: [
        {
          type: String
        }
      ],
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
    },

    /* ⭐ Allow review ONLY after entering price */
    canReview: {
      type: Boolean,
      default: false
    },

    /* ⭐ Did user already leave a review? */
    reviewSubmitted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/* ⭐ Virtual profit (not stored, just calculated) */
bookingSchema.virtual("calculatedProfit").get(function () {
  if (!this.pricePaidByCustomer) return 0;
  return Math.round(this.pricePaidByCustomer * 0.10);
});

/* ⭐ Virtual: Quick check for completion */
bookingSchema.virtual("isCompleted").get(function () {
  return this.status === "completed";
});

/* ⭐ Helpful indexes for admin dashboard speed */
bookingSchema.index({ status: 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ customerPhone: 1 });

/* ⭐ Compare password method */
bookingSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

export default mongoose.model('Booking', bookingSchema);

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import trainingRoutes from './routes/training.js';


// Import routes
import authRoutes from './routes/auth.js';
import providerRoutes from './routes/providers.js';
import bookingRoutes from './routes/bookings.js';
import reviewRoutes from './routes/reviews.js';
import adminRoutes from './routes/admin.js';
import matchRoutes from './routes/match.js';
import chatRoutes from './routes/chat.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Socket.IO setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/khandyman')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error'));
    }
    socket.user = decoded;
    next();
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.id} (${socket.user.role})`);

  // Join room for booking chat
  socket.on('join-booking', async (bookingId) => {
    try {
      const Booking = (await import('./models/Booking.js')).default;
      const booking = await Booking.findById(bookingId).populate('assignedProviderId');
      
      if (!booking) {
        socket.emit('error', { message: 'Booking not found' });
        return;
      }

      // Verify user has access to this booking
      const isAppointer = socket.user.role === 'appointer' && 
                         booking.customerPhone === socket.user.phone;
      const isProvider = socket.user.role === 'provider' && 
                        booking.assignedProviderId?._id.toString() === socket.user.id;

      if (!isAppointer && !isProvider) {
        socket.emit('error', { message: 'Unauthorized access' });
        return;
      }

      // Only allow chat if booking is confirmed
      if (booking.status !== 'confirmed' && booking.status !== 'completed') {
        socket.emit('error', { message: 'Chat only available for confirmed bookings' });
        return;
      }

      socket.join(`booking-${bookingId}`);
      socket.emit('joined-booking', { bookingId });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Handle sending messages
  socket.on('send-message', async (data) => {
    try {
      const Chat = (await import('./models/Chat.js')).default;
      const Booking = (await import('./models/Booking.js')).default;
      
      const { bookingId, messageText } = data;
      
      const booking = await Booking.findById(bookingId).populate('assignedProviderId');
      if (!booking) {
        socket.emit('error', { message: 'Booking not found' });
        return;
      }

      // Verify user has access
      const isAppointer = socket.user.role === 'appointer' && 
                         booking.customerPhone === socket.user.phone;
      const isProvider = socket.user.role === 'provider' && 
                        booking.assignedProviderId?._id.toString() === socket.user.id;

      if (!isAppointer && !isProvider) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      // Determine sender and receiver
      let senderId, senderRole, receiverId, receiverRole;
      
      if (isAppointer) {
        senderId = booking._id; // Using booking ID as appointer identifier
        senderRole = 'appointer';
        receiverId = booking.assignedProviderId._id;
        receiverRole = 'provider';
      } else {
        senderId = booking.assignedProviderId._id;
        senderRole = 'provider';
        receiverId = booking._id;
        receiverRole = 'appointer';
      }

      // Save message to database
      const chatMessage = new Chat({
        bookingId,
        senderId,
        senderRole,
        receiverId,
        receiverRole,
        messageText
      });

      await chatMessage.save();

      // Emit message to all users in the booking room
      io.to(`booking-${bookingId}`).emit('new-message', {
        _id: chatMessage._id,
        bookingId,
        senderId,
        senderRole,
        receiverId,
        receiverRole,
        messageText,
        timestamp: chatMessage.timestamp
      });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.id}`);
  });
});

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/training', trainingRoutes);


// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'K-Handyman API is running' });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server ready`);
});


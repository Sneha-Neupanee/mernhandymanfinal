# K-Handyman - Service Marketplace in Kathmandu

A full-stack MERN application for a local handyman-service marketplace in Kathmandu. The system connects customers (Appointers) with skilled service providers for various home repair and maintenance services.

## Features

- **Service Provider Registration**: Providers can register with their skills, experience, and portfolio
- **Appointer Booking**: Customers can book appointments with service providers
- **Live Chat System**: Real-time messaging between Appointers and Providers using Socket.IO (available for confirmed bookings)
- **Location Selection & Tracking**: Interactive map for selecting service location (Kathmandu only), with distance-based provider matching
- **Smart Matching**: Bayesian ranking algorithm with distance calculation matches customers with the best providers
- **Review & Rating System**: Customers can rate and review completed services
- **Admin Dashboard**: Admin can verify providers and view statistics
- **Image Uploads**: Support for profile photos and portfolio images
- **Provider Dashboard**: Messages tab, confirmed bookings with map view, and earnings tracking
- **Filtering & Sorting**: Sort providers by rating, distance, or match score
- **Notification System**: Toast notifications for booking updates and status changes
- **Responsive Design**: Fully responsive UI with royal/deep blue gradient theme (#2B3A8C, #1A2560)

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Authentication**: JWT
- **File Upload**: Multer
- **Real-time Communication**: Socket.IO
- **Maps**: Leaflet + React-Leaflet (OpenStreetMap)

## Project Structure

```
khandyman mern/
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth & upload middleware
│   ├── services/        # Business logic (matching algorithms)
│   ├── uploads/         # Uploaded images
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context (Auth)
│   │   └── utils/       # Utilities (API client)
│   └── package.json
└── README.md
```

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## Installation & Setup

### 1. Clone the repository

```bash
cd "khandyman mern"
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/khandyman
JWT_SECRET=your_jwt_secret_key_here_change_in_production
NODE_ENV=development
UPLOAD_PATH=./uploads
FRONTEND_URL=http://localhost:3000
```

**Note**: Replace `your_jwt_secret_key_here_change_in_production` with a strong random string for production.

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

### 4. Start MongoDB

Make sure MongoDB is running on your system. If using MongoDB Atlas, update the `MONGO_URI` in the `.env` file.

### 5. Initialize Admin Account

Start the backend server first, then make a POST request to initialize the default admin:

```bash
# After starting backend, run:
curl -X POST http://localhost:5000/api/admin/init
```

Or use Postman/Thunder Client to make a POST request to `http://localhost:5000/api/admin/init`

Default admin credentials:
- Username: `admin`
- Password: `admin123`

**Important**: Change the default admin password in production!

### 6. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

The backend will run on `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:3000`

## Usage

### For Customers (Appointers)

1. Click "Book an Appointment" from the home page or navbar
2. Fill in your details and select a service type
3. After booking, you'll see matched providers
4. Select a provider to send a request
5. Login with your phone number and password to view bookings
6. After service completion, mark as completed and leave a review

### For Service Providers

1. Click "Become a Service Provider" from the home page
2. Fill in registration form with your skills and experience
3. Upload profile photo and portfolio images
4. Wait for admin verification
5. Once verified, login to view and accept booking requests

### For Admins

1. Click "Admin Login" from the home page
2. Login with admin credentials (default: admin/admin123)
3. View statistics, verify/reject providers, and manage bookings

## API Endpoints

### Authentication
- `POST /api/auth/provider` - Provider login
- `POST /api/auth/appointer` - Appointer login
- `POST /api/auth/admin` - Admin login

### Providers
- `POST /api/providers/register` - Register new provider
- `GET /api/providers/dashboard` - Get provider dashboard (protected)
- `GET /api/providers/verified` - Get all verified providers (public)
- `PUT /api/providers/bookings/:id/respond` - Accept/reject booking (protected)
- `PUT /api/providers/location` - Update provider location (protected)

### Bookings
- `POST /api/bookings/create` - Create new booking (with optional serviceLocation)
- `GET /api/bookings/appointer` - Get appointer's bookings (protected)
- `GET /api/bookings/:id` - Get single booking details (protected)
- `PUT /api/bookings/:id/complete` - Mark booking as completed (protected)
- `PUT /api/bookings/:id/additional-details` - Add more service details (protected)
- `PUT /api/bookings/:id/provider-status` - Update provider status (protected)

### Chat (Socket.IO)
- `GET /api/chat/booking/:bookingId` - Get chat history (protected)
- `GET /api/chat/provider` - Get all chats for provider (protected)
- `PUT /api/chat/booking/:bookingId/read` - Mark messages as read (protected)
- Socket.IO events: `join-booking`, `send-message`, `new-message`, `booking-confirmed`

### Reviews
- `POST /api/reviews/create` - Create review (protected)
- `GET /api/reviews/provider/:id` - Get reviews for a provider
- `GET /api/reviews/booking/:id` - Get review for a booking

### Matching
- `POST /api/match/service` - Match providers for a service type (with optional serviceLocation)
- `POST /api/match/multiple-services` - Match for multiple services (backtracking)
- `POST /api/match/request-provider` - Request a specific provider

### Admin
- `POST /api/admin/init` - Initialize default admin
- `GET /api/admin/statistics` - Get statistics (protected)
- `GET /api/admin/providers` - Get all providers (protected)
- `GET /api/admin/bookings` - Get all bookings (protected)
- `PUT /api/admin/providers/:id/verify` - Verify/reject provider (protected)

## Algorithms

### Bayesian Ranking Algorithm
The system uses a Bayesian ranking algorithm to score providers based on:
- Average rating (with prior to handle new providers)
- Total number of reviews
- Experience years
- Trust factor (logarithmic boost for more reviews)
- **Distance factor**: Closer providers get higher scores (max 20km considered)

This ensures new providers aren't unfairly ranked higher just because they have few reviews, and prioritizes providers closer to the service location.

### Distance Calculation
Uses the Haversine formula to calculate distance between two coordinates:
- Service location (from booking)
- Provider location (or Kathmandu center as fallback)
- Distance in kilometers
- Max 20km considered for distance bonus

### Backtracking Algorithm
For bookings requiring multiple service types or multiple providers, a backtracking algorithm finds the best combination of providers based on:
- Skills match
- Availability
- Rating scores
- **Distance to service location**

## Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Environment (development/production)
- `UPLOAD_PATH` - Path for uploaded files
- `FRONTEND_URL` - Frontend URL for CORS and Socket.IO (default: http://localhost:3000)

### Frontend (.env - optional)
- `VITE_API_URL` - Backend API URL (default: http://localhost:5000)
- `VITE_SOCKET_URL` - Socket.IO server URL (default: http://localhost:5000)

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Protected routes with role-based access control
- Input validation and sanitization

## Image Uploads

Images are stored locally in the `backend/uploads` directory. For production, consider using:
- AWS S3
- Cloudinary
- Google Cloud Storage

Update the upload middleware in `backend/middleware/upload.js` accordingly.

## Responsive Design

The application is fully responsive and works on:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

## Color Theme

- Primary: Royal Blue (#2B3A8C)
- Deep Blue: (#1A2560)
- Gradients: Linear gradients using royal and deep blue
- Accent: White and light grey backgrounds for readability
- Modern glassy effects with backdrop-filter blur

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGO_URI` in `.env` file
- For MongoDB Atlas, whitelist your IP address

### Port Already in Use
- Change `PORT` in `.env` file
- Or kill the process using the port

### Image Upload Issues
- Ensure `uploads` directory exists in backend folder
- Check file size limits (5MB default)
- Verify file types (only images allowed)

### CORS Errors
- Backend CORS is configured to allow all origins in development
- For production, update CORS settings in `server.js`

## New Features (Latest Update)

### ✅ Live Chat System
- Real-time messaging using Socket.IO
- Chat available for confirmed bookings only
- Message history stored in MongoDB
- Unread message count
- Profile avatars and sender identification
- Modern chat UI with gradient styling

### ✅ Location Selection & Tracking
- Interactive map (Leaflet/OpenStreetMap) for selecting service location
- Constrained to Kathmandu bounds
- Distance-based provider matching
- Provider can view service location on map
- Google Maps navigation link

### ✅ Enhanced UI/UX
- Modern gradient-based design with royal blue (#2B3A8C) and deep blue (#1A2560)
- Glassy effects and subtle shadows
- Smooth animations and hover effects
- Professional, trust-based aesthetic
- Fully responsive across all devices

### ✅ Provider Dashboard Enhancements
- Messages tab showing all active chats
- Confirmed bookings with map view
- Jobs completed counter
- Provider status tracking
- Earnings display

### ✅ Appointer Dashboard Enhancements
- Chat button for confirmed bookings
- Provider status visibility
- Additional service details upload
- Improved booking cards

## Future Enhancements

- Email/SMS notifications
- Service history export
- Portfolio gallery page
- Admin CSV export
- Payment integration
- Advanced analytics

## License

This project is created for educational purposes.

## Support

For issues or questions, please check the codebase or create an issue in the repository.

---

**Built with ❤️ for Kathmandu**


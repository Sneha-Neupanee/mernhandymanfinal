# Quick Start Guide

## Prerequisites
- Node.js (v16+)
- MongoDB running locally or MongoDB Atlas account

## Setup Steps

### 1. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in `backend/` directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/khandyman
JWT_SECRET=your_secret_key_here_change_in_production
NODE_ENV=development
UPLOAD_PATH=./uploads
```

Initialize admin account:
```bash
npm run init-admin
```

Start backend:
```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Start frontend:
```bash
npm run dev
```

### 3. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### 4. Default Admin Credentials

- Username: `admin`
- Password: `admin123`

**⚠️ Change this in production!**

## First Steps

1. **As Admin**: Login and verify service providers
2. **As Provider**: Register and wait for admin verification
3. **As Appointer**: Book an appointment and select a provider

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGO_URI` in `.env` file
- For MongoDB Atlas, whitelist your IP

### Port Already in Use
- Change `PORT` in `.env` file
- Or kill the process using the port

### Image Upload Issues
- Ensure `backend/uploads/` directory exists
- Check file size limits (5MB default)


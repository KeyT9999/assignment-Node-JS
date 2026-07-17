const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Body parser middleware
app.use(express.json());

// Connect to MongoDB Database
connectDB();

// Import Routes
const authRoutes = require('./routes/authRoutes');
const registrationRoutes = require('./routes/registrationRoutes');

// Mount Routes
app.use('/auth', authRoutes);
app.use('/', registrationRoutes); // Mount registrations routes directly at root or under /registrations depending on requirements

// Default Route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the SDN302 PE - Thang_event Event Management API!',
    status: 'Running'
  });
});

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ message: `Route not found - ${req.originalUrl}` });
});

// Basic Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

// Define Port
const PORT = process.env.PORT || 9999;

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`- API URL: http://localhost:${PORT}`);
});

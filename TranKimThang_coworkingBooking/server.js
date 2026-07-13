const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

app.use(express.json());

connectDB();

const authRoutes = require('./routes/authRoutes');
const spaceRoutes = require('./routes/spaceRoutes');
const reservationRoutes = require('./routes/reservationRoutes');

app.use('/auth', authRoutes);
app.use('/spaces', spaceRoutes);
app.use('/reservations', reservationRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the SDN302 Practical Exam Generic Template API!',
    status: 'Running',
    pricingMode: process.env.PRICING_MODE || 'NORMAL',
    enableHappyHour: process.env.ENABLE_HAPPY_HOUR || 'false',
    enableWallet: process.env.ENABLE_WALLET || 'false'
  });
});

app.use((req, res, next) => {
  res.status(404).json({ message: `Route not found - ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 9999;

app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`- API URL: http://localhost:${PORT}`);
});

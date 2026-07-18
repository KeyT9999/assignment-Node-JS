const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
dotenv.config();
const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
connectDB();
app.get('/', (_req, res) => res.render('index', {
  title: 'Car Rental Management'
}));
app.use('/cars', require('./routes/carRoutes'));
app.use('/bookings', require('./routes/bookingRoutes'));
app.use((req, res) => res.status(404).json({
  message: `Route not found - ${req.originalUrl}`
}));
app.use((error, _req, res, _next) => res.status(error.status || 500).json({
  message: error.message
}));
const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

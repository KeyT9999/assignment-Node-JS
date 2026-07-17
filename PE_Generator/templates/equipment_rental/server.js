const express = require('express'); const dotenv = require('dotenv'); const connectDB = require('./config/db'); dotenv.config();
const app = express(); app.use(express.json()); connectDB();
app.use('/auth', require('./routes/authRoutes')); app.use('/users', require('./routes/userRoutes')); app.use('/equipment', require('./routes/equipmentRoutes')); app.use('/rentals', require('./routes/rentalRoutes'));
const { protect } = require('./middlewares/authMiddleware'); const rental = require('./controllers/rentalController'); app.get('/rentalsByDate', protect, rental.getRentalsByDate);
app.get('/', (_req, res) => res.json({ message: '__PROJECT_NAME__ API', status: 'Running' })); app.use((req, res) => res.status(404).json({ message: `Route not found - ${req.originalUrl}` }));
const PORT = process.env.PORT || 9999; app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

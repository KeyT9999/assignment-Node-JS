const express = require('express'), dotenv = require('dotenv'), connectDB = require('./config/db');
dotenv.config();
const app = express();
app.use(express.json());
connectDB();
app.use('/doctors', require('./routes/doctorRoutes'));
app.use('/appointments', require('./routes/appointmentRoutes'));
app.get('/', (_q, s) => s.json({
  message: 'FPT Hospital Appointment API',
  status: 'Running'
}));
app.use((q, s) => s.status(404).json({
  message: `Route not found - ${q.originalUrl}`
}));
const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`Hospital API running on ${PORT}`));

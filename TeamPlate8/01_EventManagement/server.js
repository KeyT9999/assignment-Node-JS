const express = require('express'), dotenv = require('dotenv'), connectDB = require('./config/db');
dotenv.config();
const app = express();
app.use(express.json());
connectDB();
app.use('/auth', require('./routes/authRoutes'));
app.use('/events', require('./routes/eventRoutes'));
app.use('/', require('./routes/registrationRoutes'));
app.get('/', (_q, s) => s.json({
  message: 'Event Management API',
  status: 'Running'
}));
app.use((q, s) => s.status(404).json({
  message: `Route not found - ${q.originalUrl}`
}));
const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`Event API running on ${PORT}`));

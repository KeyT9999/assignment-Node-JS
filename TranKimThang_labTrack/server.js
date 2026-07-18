require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const app = express();
app.use(express.json());
connectDB();
app.use('/auth', require('./routes/authRoutes'));
app.use('/laboratories', require('./routes/laboratoryRoutes'));
app.use('/test-catalogues', require('./routes/testCatalogueRoutes'));
app.use('', require('./routes/reagentRoutes'));
app.use('', require('./routes/sampleRoutes'));
app.use('/reports', require('./routes/reportRoutes'));
app.get('/', (_q, s) => s.json({
  message: 'Generic PE API',
  status: 'Running'
}));
app.use((q, s) => s.status(404).json({
  message: `Route not found - ${q.originalUrl}`
}));
const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));

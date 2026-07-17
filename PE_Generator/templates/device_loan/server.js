const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
const app = express();
app.use(express.json());

connectDB();

app.use('/auth', require('./routes/authRoutes'));
app.use('/users', require('./routes/userRoutes'));
app.use('/devices', require('./routes/deviceRoutes'));
app.use('/loans', require('./routes/loanRoutes'));

app.get('/', (req, res) => res.json({ message: 'Library Device Loan API Running', status: 'Running' }));

app.use((req, res) => res.status(404).json({ message: `Route not found - ${req.originalUrl}` }));

const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

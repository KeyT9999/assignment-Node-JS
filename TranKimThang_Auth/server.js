require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
app.use(express.json({ limit: '100kb' }));
app.use('/auth', require('./routes/authRoutes'));
app.use('/demo', require('./routes/demoRoutes'));
app.get('/', (_req, res) => res.json({ message: 'TranKimThang Auth API', status: 'Running' }));
app.use(notFound);
app.use(errorHandler);

let server;

async function startServer() {
  await connectDB();
  const port = Number(process.env.PORT) || 9999;
  await new Promise((resolve, reject) => {
    server = app.listen(port, () => {
      console.log(`Auth API running at http://localhost:${port}`);
      resolve();
    });
    server.once('error', reject);
  });
  return server;
}

async function stopServer() {
  if (server) await new Promise(resolve => server.close(resolve));
  if (mongoose.connection.readyState !== 0) await mongoose.connection.close();
}

if (require.main === module) {
  startServer().catch(error => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${process.env.PORT || 9999} is already in use. Run npm run dev for automatic fallback.`);
    } else {
      console.error(`Startup failed: ${error.message}`);
    }
    process.exit(1);
  });
}

module.exports = { app, startServer, stopServer };

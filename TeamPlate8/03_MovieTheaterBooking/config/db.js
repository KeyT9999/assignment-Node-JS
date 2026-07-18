const mongoose = require('mongoose');
module.exports = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/movieBooking');
    console.log('MongoDB connected')
  } catch (e) {
    console.error(e.message);
    process.exit(1)
  }
};

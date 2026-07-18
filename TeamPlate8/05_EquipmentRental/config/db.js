const mongoose = require('mongoose');
module.exports = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rental');
    console.log('MongoDB connected');
  }  catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

const mongoose = require('mongoose');

module.exports = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/job_portal';
  try {
    await mongoose.connect(uri);
    // Ensure Application indexes exist for duplicate protection
    await require('../models/Application').init();
    console.log(`✓ MongoDB connected successfully (${uri})`);
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.error('👉 Make sure MongoDB is running. On macOS run: brew services start mongodb-community');
    throw err;
  }
};

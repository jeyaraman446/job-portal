const mongoose = require('mongoose');

module.exports = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  // Make sure the unique indexes that block duplicate applications exist
  await require('../models/Application').init();
  console.log('MongoDB connected');
};

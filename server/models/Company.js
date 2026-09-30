const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  website: String,
  industry: String,
  size: String,
  location: String,
  logoUrl: String,
  description: String,
  registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verified: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);

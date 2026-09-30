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
  
  // Company ID Proof & Official Verification
  taxId: { type: String, trim: true }, // e.g., EIN, GSTIN, CIN, Business Registration No.
  companyEmailDomain: { type: String, lowercase: true, trim: true },
  idProofUrl: String, // Uploaded business ID proof document
  idProofFileName: String,
  idProofType: {
    type: String,
    enum: [
      'Certificate of Incorporation',
      'Tax Registration (EIN / GSTIN)',
      'Commercial Business License',
      'Official Corporate ID Badge',
    ],
    default: 'Certificate of Incorporation',
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  },
  verified: { type: Boolean, default: false },
  verifiedAt: Date,
  verificationNotes: String,
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);

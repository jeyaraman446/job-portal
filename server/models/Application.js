const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resumeUrl: String,
  resumeHash: String,
  matchScore: Number,
  matchBreakdown: Object,
  coverNote: String,
  feedback: String,
  reviewedAt: Date,
  status: {
    type: String,
    enum: ['applied', 'shortlisted', 'interview', 'rejected', 'hired'],
    default: 'applied',
  },
}, { timestamps: true });

// One user, one application per job (database-level guarantee)
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
// The same resume file cannot be submitted twice to the same job, even from another account
applicationSchema.index({ job: 1, resumeHash: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Application', applicationSchema);

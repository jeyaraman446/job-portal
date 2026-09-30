const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requiredSkills: [{ type: String, lowercase: true, trim: true }],
  preferredSkills: [{ type: String, lowercase: true, trim: true }],
  minExperience: { type: Number, default: 0 },
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Internship', 'Contract', 'Remote'],
    default: 'Full-time',
  },
  preferHackathons: { type: Boolean, default: false },
  location: String,
  salaryRange: { min: Number, max: Number },
  vacancies: { type: Number, default: 1 },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  deadline: Date,
}, { timestamps: true });

jobSchema.index({ requiredSkills: 1 });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ title: 'text', description: 'text' });
module.exports = mongoose.model('Job', jobSchema);

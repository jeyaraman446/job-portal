const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['seeker', 'hr', 'admin'], default: 'seeker' },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },

  headline: String,
  location: String,
  github: String,
  linkedin: String,
  skills: [{ type: String, lowercase: true, trim: true }],
  experienceYears: { type: Number, default: 0 },
  resumeUrl: String,
  resumeFileName: String,
  resumeHash: String,
  internships: [{
    company: String,
    role: String,
    durationMonths: Number,
    description: String,
    techStack: [String],
  }],
  competitiveExams: [{ name: String, rank: Number, score: Number, year: Number }],
  hackathons: [{ name: String, position: String, techUsed: [String], year: Number }],
  projects: [{ title: String, description: String, techStack: [String], link: String }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

const Job = require('../models/Job');
const User = require('../models/User');
const Application = require('../models/Application');
const { calculateMatch } = require('../utils/skillMatcher');

const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.postJob = async (req, res) => {
  try {
    const hr = await User.findById(req.user.id);
    if (!hr.company) {
      return res.status(400).json({ message: 'Please register your company profile before posting vacancies.' });
    }

    const b = req.body;
    if (!b.title) {
      return res.status(400).json({ message: 'Job title is required.' });
    }

    const job = await Job.create({
      title: b.title.trim(),
      description: b.description || '',
      location: b.location || 'Remote',
      jobType: b.jobType || 'Full-time',
      requiredSkills: Array.isArray(b.requiredSkills) ? b.requiredSkills : [],
      preferredSkills: Array.isArray(b.preferredSkills) ? b.preferredSkills : [],
      minExperience: Number(b.minExperience) || 0,
      salaryRange: {
        min: b.salaryRange?.min ? Number(b.salaryRange.min) : undefined,
        max: b.salaryRange?.max ? Number(b.salaryRange.max) : undefined,
      },
      vacancies: Number(b.vacancies) || 1,
      preferHackathons: Boolean(b.preferHackathons),
      deadline: b.deadline ? new Date(b.deadline) : undefined,
      company: hr.company,
      postedBy: hr._id,
      status: 'open',
    });

    res.status(201).json(job);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.jobId, postedBy: req.user.id });
    if (!job) return res.status(404).json({ message: 'Job vacancy not found' });

    const fields = ['title', 'description', 'location', 'jobType', 'requiredSkills',
      'preferredSkills', 'minExperience', 'salaryRange', 'vacancies', 'preferHackathons', 'deadline', 'status'];

    fields.forEach(f => {
      if (req.body[f] !== undefined) job[f] = req.body[f];
    });

    await job.save();
    res.json(job);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user.id }).sort({ createdAt: -1 }).lean();
    const counts = await Application.aggregate([
      { $match: { job: { $in: jobs.map(j => j._id) } } },
      { $group: { _id: '$job', n: { $sum: 1 } } },
    ]);
    const map = Object.fromEntries(counts.map(c => [String(c._id), c.n]));
    res.json(jobs.map(j => ({ ...j, applicantCount: map[String(j._id)] || 0 })));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.closeJob = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.jobId, postedBy: req.user.id });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    job.status = job.status === 'open' ? 'closed' : 'open';
    await job.save();
    res.json(job);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Seeker: browse open jobs, matching and ranking
exports.getJobsForSeeker = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { q, location, jobType, minScore = 0, skill, sortBy = 'match' } = req.query;

    const filter = {
      status: 'open',
      $or: [{ deadline: { $exists: false } }, { deadline: null }, { deadline: { $gte: new Date() } }],
    };

    if (location) filter.location = new RegExp(escapeRegex(location), 'i');
    if (jobType && jobType !== 'All') filter.jobType = jobType;
    if (q) {
      filter.$or = [
        { title: new RegExp(escapeRegex(q), 'i') },
        { description: new RegExp(escapeRegex(q), 'i') },
      ];
    }
    if (skill) {
      filter.requiredSkills = { $in: [new RegExp(escapeRegex(skill), 'i')] };
    }

    const jobs = await Job.find(filter)
      .populate('company', 'name industry website location size')
      .lean();

    const myApplications = await Application.find({
      applicant: user._id,
      job: { $in: jobs.map(j => j._id) },
    }).select('job status createdAt').lean();

    const appMap = new Map();
    myApplications.forEach(a => appMap.set(String(a.job), a));

    let scored = jobs.map(j => {
      const match = calculateMatch(user, j);
      const app = appMap.get(String(j._id));
      return {
        ...j,
        match,
        alreadyApplied: Boolean(app),
        applicationStatus: app ? app.status : null,
      };
    });

    if (minScore > 0) {
      scored = scored.filter(j => j.match.total >= Number(minScore));
    }

    if (sortBy === 'match') {
      scored.sort((a, b) => b.match.total - a.match.total);
    } else if (sortBy === 'salary') {
      scored.sort((a, b) => (b.salaryRange?.max || 0) - (a.salaryRange?.max || 0));
    } else if (sortBy === 'newest') {
      scored.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json(scored);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

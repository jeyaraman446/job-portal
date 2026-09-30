const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { calculateMatch } = require('../utils/skillMatcher');
const { hashFile, extractSkills } = require('../utils/resumeParser');

exports.apply = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job || job.status !== 'open') {
      return res.status(400).json({ message: 'This job vacancy is no longer accepting applications' });
    }
    if (job.deadline && new Date(job.deadline) < new Date()) {
      return res.status(400).json({ message: 'The deadline for this job vacancy has passed' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Explicit Duplicate Protection Check: One user per job
    const existingApplication = await Application.findOne({ job: job._id, applicant: user._id });
    if (existingApplication) {
      return res.status(409).json({ message: 'You have already applied to this job vacancy.' });
    }

    // Handle resume uploaded during application, or use profile resume
    let resumeUrl = user.resumeUrl;
    let resumeHash = user.resumeHash;

    if (req.file) {
      resumeUrl = req.file.path;
      resumeHash = hashFile(req.file.path);
      user.resumeUrl = req.file.path;
      user.resumeFileName = req.file.originalname;
      user.resumeHash = resumeHash;

      // Extract newly discovered skills from this resume
      const detected = await extractSkills(req.file.path);
      if (detected.length > 0) {
        user.skills = Array.from(new Set([...(user.skills || []), ...detected]));
      }
      await user.save();
    }

    if (!resumeUrl) {
      return res.status(400).json({ message: 'Please upload a PDF resume before applying.' });
    }

    // Duplicate Resume Protection: Check if this identical resume was submitted for this job
    if (resumeHash) {
      const duplicateFileApp = await Application.findOne({ job: job._id, resumeHash });
      if (duplicateFileApp) {
        return res.status(409).json({ message: 'This resume document has already been submitted for this job.' });
      }
    }

    const match = calculateMatch(user, job);

    const application = await Application.create({
      job: job._id,
      applicant: user._id,
      resumeUrl,
      resumeHash,
      matchScore: match.total,
      matchBreakdown: match.breakdown,
      coverNote: req.body.coverNote || '',
    });

    res.status(201).json({
      application,
      match,
      message: 'Application submitted successfully! Our matching engine has analyzed your profile.',
    });
  } catch (e) {
    if (e.code === 11000) {
      const which = e.keyPattern?.resumeHash
        ? 'This resume document has already been submitted for this job vacancy.'
        : 'You have already submitted an application for this job vacancy.';
      return res.status(409).json({ message: which });
    }
    res.status(500).json({ message: e.message });
  }
};

exports.getMyApplications = async (req, res) => {
  try {
    const apps = await Application.find({ applicant: req.user.id })
      .populate({
        path: 'job',
        select: 'title location company salaryRange jobType deadline status requiredSkills',
        populate: { path: 'company', select: 'name website location' },
      })
      .sort({ createdAt: -1 })
      .lean();

    res.json(apps);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getRankedApplicants = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.jobId, postedBy: req.user.id })
      .populate('company', 'name')
      .lean();
    if (!job) return res.status(404).json({ message: 'Job vacancy not found or unauthorized' });

    const { minScore = 0, status, search } = req.query;

    const query = { job: job._id, matchScore: { $gte: Number(minScore) || 0 } };
    if (status && status !== 'all') {
      query.status = status;
    }

    let apps = await Application.find(query)
      .populate(
        'applicant',
        'name email phone headline location github linkedin skills experienceYears internships projects hackathons competitiveExams resumeUrl'
      )
      .sort({ matchScore: -1, createdAt: 1 })
      .lean();

    // In-memory filter for search query by name, email, or skill if provided
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      apps = apps.filter(a => {
        const u = a.applicant;
        if (!u) return false;
        const nameMatch = u.name?.toLowerCase().includes(term);
        const emailMatch = u.email?.toLowerCase().includes(term);
        const skillMatch = (u.skills || []).some(s => s.toLowerCase().includes(term));
        return nameMatch || emailMatch || skillMatch;
      });
    }

    // Compute stats for HR dashboard
    const allJobApps = await Application.find({ job: job._id }).select('matchScore status').lean();
    const stats = {
      total: allJobApps.length,
      averageScore: allJobApps.length
        ? Math.round(allJobApps.reduce((acc, a) => acc + (a.matchScore || 0), 0) / allJobApps.length)
        : 0,
      highFit: allJobApps.filter(a => (a.matchScore || 0) >= 70).length,
      shortlisted: allJobApps.filter(a => a.status === 'shortlisted').length,
      interview: allJobApps.filter(a => a.status === 'interview').length,
      hired: allJobApps.filter(a => a.status === 'hired').length,
    };

    res.json({ job, applicants: apps, stats });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const validStatuses = ['applied', 'shortlisted', 'interview', 'rejected', 'hired'];
    const { status, feedback } = req.body;

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const app = await Application.findById(req.params.id).populate('job');
    if (!app || String(app.job.postedBy) !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden or application not found' });
    }

    if (status) app.status = status;
    if (feedback !== undefined) app.feedback = feedback;
    app.reviewedAt = new Date();
    await app.save();

    res.json(app);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

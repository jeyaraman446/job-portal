const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { hashFile, extractSkills } = require('../utils/resumeParser');

const sign = user => {
  const secret = process.env.JWT_SECRET || 'job_portal_fallback_jwt_secret_key_84920';
  return jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn: '7d' });
};

const publicUser = u => {
  const o = u.toObject ? u.toObject() : { ...u };
  delete o.password;
  return o;
};

const { isValidEmail, isCompanyEmail, extractEmailDomain } = require('../utils/emailValidator');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address (e.g. name@domain.com)' });
    }

    const safeRole = role === 'hr' ? 'hr' : 'seeker';

    // HR accounts must use a valid company domain (no gmail/yahoo/etc.)
    if (safeRole === 'hr' && !isCompanyEmail(cleanEmail)) {
      return res.status(400).json({
        message: 'HR & Employers must register with an official company work email (e.g. name@company.com). Free public emails like Gmail or Yahoo are not permitted for hiring accounts.',
      });
    }

    const domain = extractEmailDomain(cleanEmail);

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : undefined,
      role: safeRole,
      isCompanyEmail: safeRole === 'hr',
      companyEmailDomain: safeRole === 'hr' ? domain : undefined,
      password: await bcrypt.hash(password, 10),
    });
    res.status(201).json({ token: sign(user), user: publicUser(user) });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'Email or phone already registered' });
    res.status(500).json({ message: e.message });
  }
};

exports.login = async (req, res) => {
  try {
    const user = await User.findOne({ email: (req.body.email || '').trim().toLowerCase() }).populate('company');
    if (!user || !(await bcrypt.compare(req.body.password || '', user.password)))
      return res.status(401).json({ message: 'Invalid email or password' });
    res.json({ token: sign(user), user: publicUser(user) });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').populate('company');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const allowed = [
      'name', 'phone', 'headline', 'location', 'github', 'linkedin',
      'skills', 'experienceYears', 'internships', 'competitiveExams',
      'hackathons', 'projects',
    ];
    const update = {};
    allowed.forEach(k => {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    });

    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true, runValidators: true })
      .select('-password');
    res.json(user);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please attach a PDF resume file' });

    const detected = await extractSkills(req.file.path);
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.resumeUrl = req.file.path;
    user.resumeFileName = req.file.originalname;
    user.resumeHash = hashFile(req.file.path);

    // Merge detected skills
    if (detected.length > 0) {
      user.skills = Array.from(new Set([...(user.skills || []), ...detected]));
    }

    await user.save();
    res.json({
      resumeUrl: user.resumeUrl,
      resumeFileName: user.resumeFileName,
      detectedSkills: detected,
      skills: user.skills,
      message: `Resume parsed successfully. Found ${detected.length} relevant technical skills!`,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

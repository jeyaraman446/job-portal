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
const { generateOtp, sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mailer');

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
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : undefined,
      role: safeRole,
      isCompanyEmail: safeRole === 'hr',
      companyEmailDomain: safeRole === 'hr' ? domain : undefined,
      password: await bcrypt.hash(password, 10),
      isEmailVerified: false,
      otpCode: otp,
      otpExpiresAt: otpExpires,
      otpPurpose: 'verify_email',
    });

    // Dispatch verification email
    await sendVerificationEmail({ to: user.email, name: user.name, otp, role: user.role });

    res.status(201).json({
      message: `Registration successful! A 6-digit verification code has been dispatched to ${cleanEmail}.`,
      requiresOtp: true,
      email: user.email,
      role: user.role,
      devOtp: process.env.NODE_ENV === 'production' ? undefined : otp,
    });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'Email or phone already registered' });
    res.status(500).json({ message: e.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and 6-digit OTP code are required' });

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    const user = await User.findOne({ email: cleanEmail }).populate('company');
    if (!user) return res.status(404).json({ message: 'User account not found' });

    if (user.isEmailVerified) {
      return res.json({
        message: 'Email is already verified',
        token: sign(user),
        user: publicUser(user),
      });
    }

    if (user.otpPurpose !== 'verify_email') {
      return res.status(400).json({ message: 'Invalid OTP purpose. Please request a new verification code.' });
    }

    if (!user.otpCode || user.otpCode !== cleanOtp) {
      return res.status(400).json({ message: 'Incorrect OTP verification code. Please check and try again.' });
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired. Please click Resend OTP to get a new code.' });
    }

    // Activate account
    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    user.otpPurpose = undefined;
    await user.save();

    res.json({
      message: 'Email successfully verified! Welcome aboard.',
      token: sign(user),
      user: publicUser(user),
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { email, purpose } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(404).json({ message: 'No account found with this email' });

    const targetPurpose = purpose === 'reset_password' ? 'reset_password' : 'verify_email';
    const otp = generateOtp();
    user.otpCode = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.otpPurpose = targetPurpose;
    await user.save();

    if (targetPurpose === 'reset_password') {
      await sendPasswordResetEmail({ to: user.email, name: user.name, otp });
    } else {
      await sendVerificationEmail({ to: user.email, name: user.name, otp, role: user.role });
    }

    res.json({
      message: `A fresh 6-digit OTP code has been sent to ${cleanEmail}.`,
      email: user.email,
      devOtp: process.env.NODE_ENV === 'production' ? undefined : otp,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Please provide your registered email address' });

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(404).json({ message: 'No registered user found with this email address' });

    const otp = generateOtp();
    user.otpCode = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.otpPurpose = 'reset_password';
    await user.save();

    await sendPasswordResetEmail({ to: user.email, name: user.name, otp });

    res.json({
      message: `Password reset OTP has been dispatched to ${cleanEmail}.`,
      email: user.email,
      requiresOtp: true,
      devOtp: process.env.NODE_ENV === 'production' ? undefined : otp,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP code, and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    const user = await User.findOne({ email: cleanEmail }).populate('company');
    if (!user) return res.status(404).json({ message: 'User account not found' });

    if (user.otpPurpose !== 'reset_password') {
      return res.status(400).json({ message: 'No active password reset request found. Please request a new OTP.' });
    }

    if (!user.otpCode || user.otpCode !== cleanOtp) {
      return res.status(400).json({ message: 'Invalid password reset OTP code. Please check and try again.' });
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: 'Password reset code has expired. Please request a new code.' });
    }

    // Hash and update password
    user.password = await bcrypt.hash(newPassword, 10);
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    user.otpPurpose = undefined;
    user.isEmailVerified = true; // Proved ownership of the registered email address
    await user.save();

    res.json({
      message: 'Password successfully updated! You have been securely authenticated.',
      token: sign(user),
      user: publicUser(user),
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.login = async (req, res) => {
  try {
    const cleanEmail = (req.body.email || '').trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).populate('company');
    if (!user || !(await bcrypt.compare(req.body.password || '', user.password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    // Enforce email verification if unverified
    if (!user.isEmailVerified) {
      const otp = generateOtp();
      user.otpCode = otp;
      user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      user.otpPurpose = 'verify_email';
      await user.save();

      await sendVerificationEmail({ to: user.email, name: user.name, otp, role: user.role });

      return res.status(403).json({
        requiresOtp: true,
        message: 'Your email address is not yet verified. A 6-digit OTP code has been sent to your inbox.',
        email: user.email,
        role: user.role,
        devOtp: process.env.NODE_ENV === 'production' ? undefined : otp,
      });
    }

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

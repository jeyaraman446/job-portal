const router = require('express').Router();
const { protect, allow } = require('../middleware/auth');
const upload = require('../middleware/upload');
const auth = require('../controllers/authController');
const company = require('../controllers/companyController');
const jobs = require('../controllers/jobController');
const apps = require('../controllers/applicationController');

router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.post('/auth/verify-otp', auth.verifyOtp);
router.post('/auth/resend-otp', auth.resendOtp);
router.post('/auth/forgot-password', auth.forgotPassword);
router.post('/auth/reset-password', auth.resetPassword);
router.get('/auth/me', protect, auth.me);

router.post('/company', protect, allow('hr'), upload.single('idProof'), company.registerCompany);
router.put('/company', protect, allow('hr'), upload.single('idProof'), company.updateCompany);
router.post('/company/id-proof', protect, allow('hr'), upload.single('idProof'), company.uploadIdProof);
router.patch('/company/verify', protect, allow('hr'), company.verifyCompany);
router.get('/company/mine', protect, allow('hr'), company.getMyCompany);

router.post('/jobs', protect, allow('hr'), jobs.postJob);
router.put('/jobs/:jobId', protect, allow('hr'), jobs.updateJob);
router.get('/jobs/mine', protect, allow('hr'), jobs.getMyJobs);
router.patch('/jobs/:jobId/close', protect, allow('hr'), jobs.closeJob);
router.get('/jobs', protect, allow('seeker'), jobs.getJobsForSeeker);

router.post('/jobs/:jobId/apply', protect, allow('seeker'), upload.single('resume'), apps.apply);
router.get('/jobs/:jobId/applicants', protect, allow('hr'), apps.getRankedApplicants);
router.get('/applications/mine', protect, allow('seeker'), apps.getMyApplications);
router.patch('/applications/:id/status', protect, allow('hr'), apps.updateStatus);

router.put('/profile', protect, allow('seeker'), auth.updateProfile);
router.post('/profile/resume', protect, allow('seeker'), upload.single('resume'), auth.uploadResume);

module.exports = router;

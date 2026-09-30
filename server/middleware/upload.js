const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: 'uploads/resumes',
  filename: (req, file, cb) =>
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`),
});

module.exports = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    file.mimetype === 'application/pdf' ? cb(null, true) : cb(new Error('Only PDF allowed')),
});

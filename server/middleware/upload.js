const multer = require('multer');
const path = require('path');
const fs = require('fs');

const resumesDir = path.resolve(__dirname, '../uploads/resumes');
const companyDocsDir = path.resolve(__dirname, '../uploads/company_docs');

[resumesDir, companyDocsDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'idProof' || req.baseUrl.includes('company')) {
      cb(null, 'uploads/company_docs');
    } else {
      cb(null, 'uploads/resumes');
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.user?.id || 'anon'}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only PDF, PNG, or JPEG documents are allowed.'));
  }
};

module.exports = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter,
});

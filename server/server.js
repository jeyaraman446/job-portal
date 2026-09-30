const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const app = express();
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use('/api', require('./routes'));

// Serve frontend build if present (for single-server fullstack hosting)
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Multer / generic errors
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(400).json({ message: err.message });
});

const PORT = process.env.PORT || 5001;
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Smart Job Portal API running on http://localhost:${PORT}`);
      if (fs.existsSync(clientDist)) {
        console.log(`🌐 Full-stack Web Portal accessible at http://localhost:${PORT}`);
      }
    });
  })
  .catch(err => {
    console.error('Failed to initialize server:', err.message);
    process.exit(1);
  });

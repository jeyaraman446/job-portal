const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use('/api', require('./routes'));

// Multer / generic errors
app.use((err, req, res, next) => res.status(400).json({ message: err.message }));

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`)))
  .catch(err => { console.error(err); process.exit(1); });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('./routes/history');
const { predictSkinDisease } = require('./services/ai_service');
const History = require('./models/History');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage: storage });

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'https://skin-disease-app.vercel.app',
      'https://skin-disease-app-m3qr.vercel.app',
      'https://skin-disease-app-m3qr.onrender.com',
    ];
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error('CORS: Origin not allowed — ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads folder
app.use('/uploads', express.static(uploadDir));


// ========================
// MongoDB Connection
// ========================

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/skin_disease_db';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));


// ========================
// Routes
// ========================

// Direct /predict upload route (no auth required)
app.post('/predict', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No image uploaded',
      });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    let predictionResult;
    try {
      predictionResult = await predictSkinDisease(req.file.path);
    } catch (aiError) {
      console.error('AI Service Error:', aiError);
      return res.status(400).json({ message: aiError.message || 'Prediction failed' });
    }

    res.json({
      success: true,
      message: 'Image uploaded and analyzed successfully',
      imageUrl,
      prediction: predictionResult,
    });

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({
      error: 'Upload failed',
      details: error.message,
    });
  }
});


// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/history', require('./routes/history'));
app.use('/api/upload', require('./routes/upload'));


// ========================
// Basic Route
// ========================

app.get('/', (req, res) => {
  res.send('AI Skin Disease API is running');
});


// ========================
// Error Middleware
// ========================

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!'
  });
});


// ========================
// Start Server
// ========================

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
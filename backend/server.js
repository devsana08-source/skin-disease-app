const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads folder exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer setup
const upload = multer({ dest: uploadDir });

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://skin-this-app-m3qr.vercel.app"
  ],
  credentials: true
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

// Direct /predict upload route
app.post('/predict', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    res.json({
      message: "Image uploaded successfully",
      file: req.file
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Upload failed" });
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
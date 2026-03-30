const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('./history');
const { predictSkinDisease } = require('../services/ai_service');
const History = require('../models/History');

// Setup local storage for images (mocking Cloudinary)
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

const checkFileType = (file, cb) => {
  const filetypes = /jpg|jpeg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Images only!');
  }
};

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// @route   POST /api/upload
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    // Call the AI Prediction Service
    // In a real app, you'd pass the absolute path or stream to Python/TF model
    let predictionResult;
    try {
      predictionResult = await predictSkinDisease(req.file.path);
    } catch (aiError) {
      // Catch validation errors explicitly thrown by AI service
      return res.status(400).json({ message: aiError.message });
    }

    // Save history to DB
    const historyRecord = await History.create({
      user: req.user._id,
      imageUrl: imageUrl,
      predictionLabel: predictionResult.prediction, // fixed from main_prediction to prediction
      confidenceScore: predictionResult.confidence
    });

    res.json({
      message: 'Image uploaded and predicted successfully',
      imageUrl,
      prediction: predictionResult,
      historyId: historyRecord._id
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: error.message || 'Server error during upload/prediction' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const History = require('../models/History');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// @route   GET /api/history
router.get('/', protect, async (req, res) => {
  try {
    const history = await History.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/history/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const historyItem = await History.findById(req.params.id);

    if (!historyItem) {
      return res.status(404).json({ message: 'History not found' });
    }

    if (historyItem.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    try {
      const fs = require('fs');
      const path = require('path');
      
      // Fix Windows path resolution by removing leading slash from imageUrl
      const strippedUrl = historyItem.imageUrl && historyItem.imageUrl.startsWith('/') 
        ? historyItem.imageUrl.slice(1) 
        : historyItem.imageUrl;
        
      if (strippedUrl) {
        const imagePath = path.join(__dirname, '..', strippedUrl);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    } catch (fsError) {
      console.warn('Could not delete image file, continuing with DB deletion:', fsError);
    }

    await History.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'History removed' });
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
module.exports.protect = protect; // Export protect middleware for upload route

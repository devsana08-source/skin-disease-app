const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  imageUrl: { type: String, required: true },
  predictionLabel: { type: String, required: true },
  confidenceScore: { type: Number, required: true },
  topPredictions: { type: Array, default: [] },
  warning: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('History', historySchema);

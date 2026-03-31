const tf = require('@tensorflow/tfjs');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const CLASS_NAMES = [
  'Acne',
  'Actinic_Keratosis',
  'Benign_tumors',
  'Bullous',
  'Candidiasis',
  'DrugEruption',
  'Eczema',
  'Infestations_Bites',
  'Lichen',
  'Lupus',
  'Moles',
  'Psoriasis',
  'Rosacea',
  'Seborrh_Keratoses',
  'SkinCancer',
  'Sun_Sunlight_Damage',
  'Tinea',
  'Unknown_Normal',
  'Vascular_Tumors',
  'Vasculitis',
  'Vitiligo',
  'Warts',
];

let model = null;
const MODEL_JSON_PATH = path.join(__dirname, '../models/tfjs_model/model.json');

// Load model once and cache it (warm up on first request)
async function loadModel() {
  if (model) return model;

  console.log('[AI Service] Loading TF.js model from:', MODEL_JSON_PATH);

  if (!fs.existsSync(MODEL_JSON_PATH)) {
    throw new Error(
      'TF.js model not found. Expected: ' + MODEL_JSON_PATH
    );
  }

  // Use file:// scheme for local filesystem loading
  const modelUrl = 'file://' + MODEL_JSON_PATH.replace(/\\/g, '/');
  model = await tf.loadLayersModel(modelUrl);
  console.log('[AI Service] Model loaded and cached successfully');
  return model;
}

async function predictSkinDisease(imagePath) {
  // Load and preprocess image using sharp
  const imageBuffer = await sharp(imagePath)
    .resize(224, 224)
    .removeAlpha()
    .raw()
    .toBuffer();

  // Convert buffer to float32 tensor normalized to [0, 1]
  const floatArray = new Float32Array(imageBuffer.length);
  for (let i = 0; i < imageBuffer.length; i++) {
    floatArray[i] = imageBuffer[i] / 255.0;
  }

  const tensor = tf.tensor4d(floatArray, [1, 224, 224, 3]);

  // Run inference
  const loadedModel = await loadModel();
  const predictions = loadedModel.predict(tensor);
  const predArray = await predictions.data();

  // Cleanup tensors to avoid memory leaks
  tensor.dispose();
  predictions.dispose();

  // Rank all predictions by confidence
  const indexed = Array.from(predArray).map((conf, i) => ({
    label: CLASS_NAMES[i] || `Class_${i}`,
    confidence: Math.round(conf * 10000) / 100,
  }));
  indexed.sort((a, b) => b.confidence - a.confidence);

  const top4 = indexed.slice(0, 4);
  const best = top4[0];

  return {
    prediction: best.label,
    confidence: best.confidence,
    top_predictions: top4,
  };
}

module.exports = { predictSkinDisease };

import sys
import os
import json
import numpy as np  # type: ignore

# Suppress TensorFlow logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

import warnings
warnings.filterwarnings('ignore')

import logging
logging.getLogger('tensorflow').setLevel(logging.ERROR)

try:
    from tensorflow.keras.preprocessing import image  # type: ignore
    from tensorflow.keras.models import load_model  # type: ignore
except ImportError:
    print(json.dumps({"error": "TensorFlow or Pillow is not installed. Please run: pip install tensorflow pillow"}))
    sys.exit(1)


#  LOAD YOUR TRAINED MODEL
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "skin_model.h5")
model = load_model(MODEL_PATH, compile=False)

# IMPORTANT: Add ALL your class names in correct order
class_names = [
    "Acne",
    "Actinic_Keratosis",
    "Benign_tumors",
    "Bullous",
    "Candidiasis",
    "DrugEruption",
    "Eczema",
    "Infestations_Bites",
    "Lichen",
    "Lupus",
    "Moles",
    "Psoriasis",
    "Rosacea",
    "Seborrh_Keratoses",
    "SkinCancer",
    "Sun_Sunlight_Damage",
    "Tinea",
    "Unknown_Normal",
    "Vascular_Tumors",
    "Vasculitis",
    "Vitiligo",
    "Warts"
]


def predict_image(img_path):
    try:
        # Load image
        img = image.load_img(img_path, target_size=(224, 224))
        x = image.img_to_array(img)
        x = np.expand_dims(x, axis=0)

        # ✅ Normalize (VERY IMPORTANT)
        x = x / 255.0

        # Predict
        preds = model.predict(x)
        predicted_class = np.argmax(preds, axis=1)[0]
        confidence: float = float(np.max(preds)) * 100

        label = class_names[predicted_class]

        # Get top 4 predictions (1 main, 3 other possibilities)
        preds_array = preds[0]
        top_indices = np.argsort(preds_array)[::-1][:4]
        top_predictions = [
            {
                "label": class_names[idx],
                "confidence": round(float(preds_array[idx]) * 100, 2)  # type: ignore
            }
            for idx in top_indices
        ]

        output = {
            "prediction": label,
            "confidence": round(confidence, 2),  # type: ignore
            "top_predictions": top_predictions
        }

        print(json.dumps(output))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided."}))
        sys.exit(1)

    img_path = sys.argv[1]

    if not os.path.exists(img_path):
        print(json.dumps({"error": "Image file does not exist."}))
        sys.exit(1)

    predict_image(img_path)
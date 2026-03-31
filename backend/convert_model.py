"""
Manually convert h5 model to TensorFlow.js LayersModel format.
Uses only already-installed TensorFlow and numpy.
Run: py -3.10 convert_model.py
"""
import os
import sys
import json
import struct
import numpy as np

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

import warnings
warnings.filterwarnings('ignore')

from tensorflow.keras.models import load_model  # type: ignore

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
H5_PATH = os.path.join(BASE_DIR, "models", "skin_model.h5")
OUTPUT_DIR = os.path.join(BASE_DIR, "models", "tfjs_model")

os.makedirs(OUTPUT_DIR, exist_ok=True)

print("Loading model...")
model = load_model(H5_PATH, compile=False)
print(f"Model loaded: input={model.input_shape}, output={model.output_shape}")

# Get model architecture as JSON
model_json = model.to_json()
model_config = json.loads(model_json)

# Collect all weights
weights = model.get_weights()
print(f"Total weight arrays: {len(weights)}")

# Write weights to binary shard files (each up to 4MB)
SHARD_SIZE = 4 * 1024 * 1024  # 4MB

weight_specs = []
all_weight_data = bytearray()

for i, w in enumerate(weights):
    arr = w.flatten().astype(np.float32)
    byte_data = arr.tobytes()
    
    # Find matching layer name
    spec = {
        "name": f"weight_{i}",
        "shape": list(w.shape),
        "dtype": "float32",
        "byteLength": len(byte_data)
    }
    weight_specs.append(spec)
    all_weight_data.extend(byte_data)

# Write weight shards
num_shards = (len(all_weight_data) + SHARD_SIZE - 1) // SHARD_SIZE
print(f"Writing {num_shards} weight shard(s)...")

shard_paths = []
for i in range(num_shards):
    start = i * SHARD_SIZE
    end = min(start + SHARD_SIZE, len(all_weight_data))
    shard_name = f"group1-shard{i+1}of{num_shards}.bin"
    shard_path = os.path.join(OUTPUT_DIR, shard_name)
    with open(shard_path, 'wb') as f:
        f.write(all_weight_data[start:end])
    shard_paths.append(shard_name)
    print(f"  Written: {shard_name} ({end-start} bytes)")

# Build model.json weights manifest
weightsManifest = [{
    "paths": shard_paths,
    "weights": []
}]

# Map weights to layers
idx = 0
for layer in model.layers:
    layer_weights = layer.get_weights()
    for lw in layer_weights:
        spec = weight_specs[idx]
        weightsManifest[0]["weights"].append({
            "name": layer.name + "/" + (["kernel","bias","gamma","beta","moving_mean","moving_variance"][len(weightsManifest[0]["weights"]) % 6] if True else "weight"),
            "shape": spec["shape"],
            "dtype": "float32"
        })
        idx += 1

# Rebuild properly with correct names
weightsManifest[0]["weights"] = []
idx = 0
for layer in model.layers:
    weight_names = [w.name for w in layer.weights]
    for wname in weight_names:
        spec = weight_specs[idx]
        weightsManifest[0]["weights"].append({
            "name": wname,
            "shape": spec["shape"],
            "dtype": "float32"
        })
        idx += 1

# Build model.json
model_json_obj = {
    "format": "layers-model",
    "generatedBy": "manual-converter",
    "convertedBy": "TensorFlow.js v4.x",
    "modelTopology": json.loads(model.to_json()),
    "weightsManifest": weightsManifest
}

model_json_path = os.path.join(OUTPUT_DIR, "model.json")
with open(model_json_path, 'w') as f:
    json.dump(model_json_obj, f)

print(f"\nConversion complete!")
print(f"Output directory: {OUTPUT_DIR}")
print(f"Files: model.json + {len(shard_paths)} shard(s)")

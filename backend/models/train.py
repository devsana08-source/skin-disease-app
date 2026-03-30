import os
import tensorflow as tf  # type: ignore
from tensorflow.keras.applications import MobileNetV2  # type: ignore
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D  # type: ignore
from tensorflow.keras.models import Model  # type: ignore
from tensorflow.keras.preprocessing.image import ImageDataGenerator  # type: ignore

# Path where you will extract the downloaded dataset folders
# The folder should contain subfolders for each skin disease (e.g. dataset/ringworm/, dataset/melanoma/)
DATASET_DIR = "dataset/"

def create_model(num_classes):
    # 1. Load the pre-trained MobileNetV2 without the top prediction layer
    base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
    
    # Freeze the base layers so we don't destroy the pre-trained edge-detection features
    base_model.trainable = False
    
    # 2. Add our custom layers specifically for identifying skin diseases
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(128, activation='relu')(x)
    # Output layer matches the number of folders in your dataset!
    predictions = Dense(num_classes, activation='softmax')(x)
    
    model = Model(inputs=base_model.input, outputs=predictions)
    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
    return model

def train():
    # 3. Setup advanced data augmentation to improve accuracy
    datagen = ImageDataGenerator(
        rescale=1./255, # Normalize pixel values
        rotation_range=30,
        width_shift_range=0.2,
        height_shift_range=0.2,
        horizontal_flip=True,
        zoom_range=0.2,
        validation_split=0.2 # Use 20% of images for testing
    )
    
    train_generator = datagen.flow_from_directory(
        DATASET_DIR,
        target_size=(224, 224),
        batch_size=32,
        class_mode='categorical',
        subset='training'
    )
    
    val_generator = datagen.flow_from_directory(
        DATASET_DIR,
        target_size=(224, 224),
        batch_size=32,
        class_mode='categorical',
        subset='validation'
    )
    
    # Build model using the number of condition folders found in dataset/
    model = create_model(num_classes=train_generator.num_classes)
    
    print("Starting training...")
    # 4. Train the model
    model.fit(
        train_generator,
        validation_data=val_generator,
        epochs=10 # Change to 30-50 for much better accuracy
    )
    
    # 5. Save the final weights file
    model.save('skin_model.h5')
    print("Success! Model saved to skin_model.h5.")
    print("You can now update inference.py to load 'skin_model.h5' instead of MobileNet!")

if __name__ == "__main__":
    if not os.path.exists(DATASET_DIR):
        print(f"Error: Directory '{DATASET_DIR}' not found.")
        print("Please download a skin disease dataset, extract it, and place it in 'backend/models/dataset/'.")
    else:
        train()

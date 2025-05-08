#!/bin/bash

# Exit on error
set -e

echo "🔨 Building TypeScript files..."
npm run build

echo "📦 Creating distribution package..."

# Create a temporary directory for the distribution files
TEMP_DIR="dist"
mkdir -p $TEMP_DIR

# Copy only the necessary files
cp manifest.json $TEMP_DIR/
cp code.js $TEMP_DIR/
cp ui.html $TEMP_DIR/
cp ui.js $TEMP_DIR/

# Copy images directory if it exists and contains files
if [ -d "images" ] && [ "$(ls -A images)" ]; then
    cp -r images $TEMP_DIR/
fi

# Create the zip file
ZIP_FILE="figma-plugin-$(date +%Y%m%d).zip"
cd $TEMP_DIR
zip -r ../$ZIP_FILE ./*
cd ..

# Clean up
rm -rf $TEMP_DIR

echo "✅ Plugin package created: $ZIP_FILE"
echo "You can now install this plugin in Figma by:"
echo "1. Go to Plugins > Development > Import plugin from manifest"
echo "2. Select the manifest.json file from the zip package" 
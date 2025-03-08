#!/bin/bash
# RE:Q Build Script
# Creates browser-specific extension packages

# Create output directory if it doesn't exist
OUTPUT_DIR="dist"
mkdir -p "$OUTPUT_DIR"

# Function to create Chrome/Edge/Opera package
create_chromium_package() {
    echo "Creating package for Chrome/Edge/Opera..."
    
    # Create a temporary directory for the package
    TEMP_DIR="temp_chrome"
    rm -rf "$TEMP_DIR"
    mkdir -p "$TEMP_DIR"
    
    # Copy all required files
    cp manifest.json "$TEMP_DIR/manifest.json"
    cp background.js "$TEMP_DIR/background.js"
    cp content.js "$TEMP_DIR/content.js"
    cp popup.html "$TEMP_DIR/popup.html"
    cp popup.js "$TEMP_DIR/popup.js"
    cp README.md "$TEMP_DIR/README.md"
    
    # Create lib directory and copy polyfill
    mkdir -p "$TEMP_DIR/lib"
    cp lib/browser-polyfill.min.js "$TEMP_DIR/lib/browser-polyfill.min.js"
    
    # Create images directory and copy images
    mkdir -p "$TEMP_DIR/images"
    cp images/* "$TEMP_DIR/images/"
    
    # Create ZIP file
    ZIP_FILE="$OUTPUT_DIR/req-chrome.zip"
    rm -f "$ZIP_FILE"
    
    cd "$TEMP_DIR" || exit
    zip -r "../$ZIP_FILE" ./*
    cd .. || exit
    
    # Clean up
    rm -rf "$TEMP_DIR"
    
    echo "Chrome/Edge/Opera package created at: $ZIP_FILE"
}

# Function to create Firefox package
create_firefox_package() {
    echo "Creating package for Firefox..."
    
    # Create a temporary directory for the package
    TEMP_DIR="temp_firefox"
    rm -rf "$TEMP_DIR"
    mkdir -p "$TEMP_DIR"
    
    # Copy all required files
    cp manifest.firefox.json "$TEMP_DIR/manifest.json"
    cp background.js "$TEMP_DIR/background.js"
    cp content.js "$TEMP_DIR/content.js"
    cp popup.html "$TEMP_DIR/popup.html"
    cp popup.js "$TEMP_DIR/popup.js"
    cp README.md "$TEMP_DIR/README.md"
    
    # Create lib directory and copy polyfill
    mkdir -p "$TEMP_DIR/lib"
    cp lib/browser-polyfill.min.js "$TEMP_DIR/lib/browser-polyfill.min.js"
    
    # Create images directory and copy images
    mkdir -p "$TEMP_DIR/images"
    cp images/* "$TEMP_DIR/images/"
    
    # Create ZIP file
    ZIP_FILE="$OUTPUT_DIR/req-firefox.zip"
    rm -f "$ZIP_FILE"
    
    cd "$TEMP_DIR" || exit
    zip -r "../$ZIP_FILE" ./*
    cd .. || exit
    
    # Check if web-ext is installed for XPI creation
    if command -v web-ext &> /dev/null; then
        echo "Creating Firefox XPI using web-ext..."
        web-ext build --source-dir="$TEMP_DIR" --artifacts-dir="$OUTPUT_DIR" --overwrite-dest
        echo "Firefox XPI created in $OUTPUT_DIR"
    else
        echo "web-ext not found. To create a proper Firefox XPI file, install web-ext using: npm install --global web-ext"
    fi
    
    # Clean up
    rm -rf "$TEMP_DIR"
    
    echo "Firefox package created at: $ZIP_FILE"
}

# Execute builds
create_chromium_package
create_firefox_package

echo "Build process completed. Packages are available in the '$OUTPUT_DIR' directory." 
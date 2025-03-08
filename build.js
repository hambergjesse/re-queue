#!/usr/bin/env node
/**
 * RE:Q Build Script
 * Creates browser-specific extension packages with proper path separators
 */

const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const buildChrome = args.includes('--chrome') || args.includes('--all') || args.length === 0;
const buildFirefox = args.includes('--firefox') || args.includes('--all') || args.length === 0;

// Create output directory if it doesn't exist
const outputDir = 'dist';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

/**
 * Create a ZIP file with proper path separators
 * @param {string} sourceDir - Source directory to zip
 * @param {string} outputPath - Output ZIP file path
 * @returns {Promise} - Promise that resolves when ZIP is created
 */
function createZipWithProperPaths(sourceDir, outputPath) {
  return new Promise((resolve, reject) => {
    // Create a file to stream archive data to
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Listen for all archive data to be written
    output.on('close', () => {
      console.log(`Archive created: ${outputPath} (${archive.pointer()} bytes)`);
      resolve();
    });

    // Handle errors
    archive.on('error', (err) => {
      reject(err);
    });

    // Pipe archive data to the file
    archive.pipe(output);

    // Add files with forward slashes for paths
    archive.directory(sourceDir, false, (data) => {
      // Ensure path separators are forward slashes
      data.name = data.name.replace(/\\/g, '/');
      return data;
    });

    // Finalize the archive
    archive.finalize();
  });
}

/**
 * Create a browser-specific package
 * @param {string} browserName - Name of the browser (chrome or firefox)
 * @param {string} manifestSource - Path to the manifest file to use
 */
async function createPackage(browserName, manifestSource) {
  console.log(`Creating package for ${browserName}...`);
  
  // Create a temporary directory for the package
  const tempDir = `temp_${browserName}`;
  if (fs.existsSync(tempDir)) {
    fs.removeSync(tempDir);
  }
  fs.mkdirSync(tempDir);
  
  // Copy all required files
  fs.copyFileSync(manifestSource, path.join(tempDir, 'manifest.json'));
  fs.copyFileSync('background.js', path.join(tempDir, 'background.js'));
  fs.copyFileSync('content.js', path.join(tempDir, 'content.js'));
  fs.copyFileSync('popup.html', path.join(tempDir, 'popup.html'));
  fs.copyFileSync('popup.js', path.join(tempDir, 'popup.js'));
  fs.copyFileSync('README.md', path.join(tempDir, 'README.md'));
  
  // Create lib directory and copy polyfill
  fs.mkdirSync(path.join(tempDir, 'lib'));
  fs.copyFileSync('lib/browser-polyfill.min.js', path.join(tempDir, 'lib', 'browser-polyfill.min.js'));
  
  // Create images directory and copy images
  fs.mkdirSync(path.join(tempDir, 'images'));
  const imageFiles = fs.readdirSync('images');
  for (const imageFile of imageFiles) {
    fs.copyFileSync(path.join('images', imageFile), path.join(tempDir, 'images', imageFile));
  }
  
  // Create ZIP file with proper path separators
  const zipFilePath = path.join(outputDir, `req-${browserName}.zip`);
  if (fs.existsSync(zipFilePath)) {
    fs.unlinkSync(zipFilePath);
  }
  
  await createZipWithProperPaths(tempDir, zipFilePath);
  
  console.log(`${browserName} package created at: ${zipFilePath}`);
  
  // If it's Firefox, try to use web-ext if available
  if (browserName === 'firefox') {
    try {
      // Check if web-ext is installed
      execSync('web-ext --version', { stdio: 'ignore' });
      console.log('Creating Firefox XPI using web-ext...');
      execSync(`web-ext build --source-dir="${tempDir}" --artifacts-dir="${outputDir}" --overwrite-dest`);
      console.log(`Firefox XPI created in ${outputDir}`);
    } catch (error) {
      console.log('web-ext not found. To create a proper Firefox XPI file, install web-ext using: npm install --global web-ext');
    }
  }
  
  // Clean up
  fs.removeSync(tempDir);
}

// Main build process
async function build() {
  try {
    // Create packages based on arguments
    if (buildChrome) {
      await createPackage('chrome', 'manifest.json');
    }
    
    if (buildFirefox) {
      await createPackage('firefox', 'manifest.firefox.json');
    }
    
    console.log(`Build process completed. Packages are available in the '${outputDir}' directory.`);
  } catch (error) {
    console.error('Build error:', error);
    process.exit(1);
  }
}

// Start the build process
build(); 
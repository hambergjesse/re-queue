#!/usr/bin/env pwsh
# RE:Q Build Script
# Creates browser-specific extension packages

# Create output directory if it doesn't exist
$outputDir = "dist"
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir
}

# Function to create Chrome/Edge/Opera package
function Create-ChromiumPackage {
    Write-Output "Creating package for Chrome/Edge/Opera..."
    
    # Create a temporary directory for the package
    $tempDir = "temp_chrome"
    if (Test-Path $tempDir) {
        Remove-Item -Path $tempDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $tempDir
    
    # Copy all required files
    Copy-Item -Path "manifest.json" -Destination "$tempDir/manifest.json"
    Copy-Item -Path "background.js" -Destination "$tempDir/background.js"
    Copy-Item -Path "content.js" -Destination "$tempDir/content.js"
    Copy-Item -Path "popup.html" -Destination "$tempDir/popup.html"
    Copy-Item -Path "popup.js" -Destination "$tempDir/popup.js"
    Copy-Item -Path "README.md" -Destination "$tempDir/README.md"
    
    # Create lib directory and copy polyfill
    New-Item -ItemType Directory -Path "$tempDir/lib"
    Copy-Item -Path "lib/browser-polyfill.min.js" -Destination "$tempDir/lib/browser-polyfill.min.js"
    
    # Create images directory and copy images
    New-Item -ItemType Directory -Path "$tempDir/images"
    Copy-Item -Path "images/*" -Destination "$tempDir/images"
    
    # Create ZIP file
    $zipFilePath = "$outputDir/req-chrome.zip"
    if (Test-Path $zipFilePath) {
        Remove-Item -Path $zipFilePath -Force
    }
    
    Add-Type -Assembly System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $zipFilePath)
    
    # Clean up
    Remove-Item -Path $tempDir -Recurse -Force
    
    Write-Output "Chrome/Edge/Opera package created at: $zipFilePath"
}

# Function to create Firefox package
function Create-FirefoxPackage {
    Write-Output "Creating package for Firefox..."
    
    # Create a temporary directory for the package
    $tempDir = "temp_firefox"
    if (Test-Path $tempDir) {
        Remove-Item -Path $tempDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $tempDir
    
    # Copy all required files
    Copy-Item -Path "manifest.firefox.json" -Destination "$tempDir/manifest.json"
    Copy-Item -Path "background.js" -Destination "$tempDir/background.js"
    Copy-Item -Path "content.js" -Destination "$tempDir/content.js"
    Copy-Item -Path "popup.html" -Destination "$tempDir/popup.html"
    Copy-Item -Path "popup.js" -Destination "$tempDir/popup.js"
    Copy-Item -Path "README.md" -Destination "$tempDir/README.md"
    
    # Create lib directory and copy polyfill
    New-Item -ItemType Directory -Path "$tempDir/lib"
    Copy-Item -Path "lib/browser-polyfill.min.js" -Destination "$tempDir/lib/browser-polyfill.min.js"
    
    # Create images directory and copy images
    New-Item -ItemType Directory -Path "$tempDir/images"
    Copy-Item -Path "images/*" -Destination "$tempDir/images"
    
    # Create ZIP file
    $zipFilePath = "$outputDir/req-firefox.zip"
    if (Test-Path $zipFilePath) {
        Remove-Item -Path $zipFilePath -Force
    }
    
    # Use 7-Zip if available for better cross-platform compatibility
    $sevenZipPath = "C:\Program Files\7-Zip\7z.exe"
    if (Test-Path $sevenZipPath) {
        Write-Output "Using 7-Zip to create Firefox package with proper path separators..."
        Set-Location $tempDir
        & "$sevenZipPath" a -tzip "../$zipFilePath" "*" -r
        Set-Location ..
    } else {
        # Fall back to PowerShell compression, but may have path separator issues
        Write-Output "Warning: 7-Zip not found. Using PowerShell compression which may have path separator issues..."
        Write-Output "For Firefox compatibility, consider installing 7-Zip or using the bash script on WSL/Linux."
        
        Add-Type -Assembly System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $zipFilePath)
    }
    
    # Clean up
    Remove-Item -Path $tempDir -Recurse -Force
    
    Write-Output "Firefox package created at: $zipFilePath"
    
    # Check if web-ext is installed for XPI creation
    $webExtInstalled = $null
    try {
        $webExtInstalled = Get-Command web-ext -ErrorAction SilentlyContinue
    } catch {}
    
    if ($webExtInstalled) {
        Write-Output "Creating Firefox XPI using web-ext..."
        & web-ext build --source-dir="$tempDir" --artifacts-dir="$outputDir" --overwrite-dest
        Write-Output "Firefox XPI created in $outputDir"
    } else {
        Write-Output "web-ext not found. To create a proper Firefox XPI file, install web-ext using: npm install --global web-ext"
    }
}

# Execute builds
Create-ChromiumPackage
Create-FirefoxPackage

Write-Output "Build process completed. Packages are available in the '$outputDir' directory." 
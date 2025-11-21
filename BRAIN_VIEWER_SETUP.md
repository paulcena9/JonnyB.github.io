# Interactive Brain Viewer - Complete Setup Guide

This guide walks you through setting up and deploying the Interactive Brain Viewer application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step-by-Step Setup](#step-by-step-setup)
3. [Data Conversion](#data-conversion)
4. [Development](#development)
5. [Building for Production](#building-for-production)
6. [Deployment](#deployment)
7. [Integration with Portfolio](#integration-with-portfolio)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Python 3.7+** with pip
- **Node.js 16+** and npm
- **Git** (for version control)
- Modern web browser with WebGL 2.0 support

### Required Data

- FreeSurfer output files in `freesurfer_data/`:
  - `label/*.annot` - Parcellation annotations
  - `surf/*.thickness, *.curv, *.sulc` - Morphometry data
  - `stats/*.stats` - Regional statistics

---

## Step-by-Step Setup

### Step 1: Install Python Dependencies

```bash
# Install required Python packages
pip install nibabel numpy

# Verify installation
python3 -c "import nibabel; print('nibabel version:', nibabel.__version__)"
```

### Step 2: Convert FreeSurfer Data to JSON

```bash
# Navigate to project root
cd /Users/jbachman/Documents/GitHub/JonnyB.github.io

# Create output directory
mkdir -p public/brain-data

# Run conversion script
python3 scripts/convert_freesurfer.py \
  --input-dir freesurfer_data \
  --output-dir public/brain-data

# Expected output:
# ============================================================
# CONVERSION SUMMARY
# ============================================================
# Output directory: public/brain-data
# - Parcellations: 4 files
# - Morphometry: 6 files
# - Statistics: 1 files
# ============================================================
```

### Step 3: Verify Converted Data

```bash
# Check output structure
ls -R public/brain-data/

# Expected structure:
# public/brain-data/
# ├── parcellation/
# │   ├── lh.aparc.json
# │   ├── rh.aparc.json
# │   ├── lh.aparc.a2009s.json
# │   └── rh.aparc.a2009s.json
# ├── morphometry/
# │   ├── lh.thickness.json
# │   ├── rh.thickness.json
# │   ├── lh.curv.json
# │   ├── rh.curv.json
# │   ├── lh.sulc.json
# │   └── rh.sulc.json
# ├── statistics/
# │   └── all_stats.json
# └── metadata/
#     └── conversion_info.json
```

### Step 4: Install Node Dependencies

```bash
# Navigate to brain-viewer directory
cd brain-viewer

# Install dependencies
npm install

# This will install:
# - React 18
# - React Three Fiber
# - Three.js
# - Zustand (state management)
# - GSAP (animations)
# - Framer Motion (UI animations)
# - Vite (build tool)
```

### Step 5: Verify Installation

```bash
# Check package.json
cat package.json

# Run development server
npm run dev

# Server should start on http://localhost:3000
```

---

## Data Conversion

### Conversion Script Options

```bash
python3 scripts/convert_freesurfer.py [OPTIONS]

Options:
  --input-dir, -i   Input directory with FreeSurfer data (default: ../freesurfer_data)
  --output-dir, -o  Output directory for JSON files (default: ../public/brain-data)
  --quiet, -q       Suppress verbose output
```

### What the Converter Does

1. **Parcellation (.annot files)**
   - Extracts vertex-to-region mappings
   - Preserves region colors from color table
   - Generates region metadata

2. **Morphometry (.thickness, .curv, .sulc files)**
   - Converts binary per-vertex values to JSON
   - Calculates statistics (min, max, mean, std, percentiles)
   - Stores metadata about measurements

3. **Statistics (.stats files)**
   - Parses FreeSurfer text format
   - Extracts regional measurements
   - Combines into unified JSON structure

4. **Metadata**
   - Educational content for brain regions
   - Function descriptions
   - Clinical significance
   - Available data inventory

---

## Development

### Running Development Server

```bash
cd brain-viewer
npm run dev

# Development features:
# - Hot module replacement (instant updates)
# - React DevTools support
# - Source maps for debugging
# - Error overlay
```

### Development Workflow

1. **Start dev server**: `npm run dev`
2. **Make changes** to source files in `src/`
3. **See updates** automatically in browser
4. **Check console** for errors/warnings
5. **Test features** interactively

### Common Development Tasks

#### Adding a New Color Scheme

1. Edit `src/utils/colorMaps.js`
2. Add color scheme to `COLOR_SCHEMES` object
3. Update `SettingsPanel.jsx` to include new option

#### Modifying UI Panels

1. Edit components in `src/components/ui/`
2. Update Zustand store if adding new state
3. Test with different viewport sizes

#### Adjusting Camera Behavior

1. Edit `src/components/canvas/CameraController.jsx`
2. Modify GSAP animation parameters
3. Test smooth transitions

---

## Building for Production

### Build Process

```bash
cd brain-viewer

# Create production build
npm run build

# Output location: ../dist/brain-viewer/
```

### Build Output Structure

```
dist/brain-viewer/
├── index.html
├── js/
│   ├── brain-viewer.[hash].js
│   └── [chunks].[hash].js
└── assets/
    └── [assets].[hash].[ext]
```

### Build Optimization

The production build includes:
- **Code minification** - Smaller file sizes
- **Tree shaking** - Remove unused code
- **Asset optimization** - Compressed images/models
- **Code splitting** - Faster initial load
- **Source maps** - Optional debugging

### Preview Production Build

```bash
npm run preview

# Serves production build on http://localhost:4173
```

---

## Deployment

### Option 1: GitHub Pages (Recommended)

Since you're already using GitHub Pages:

```bash
# 1. Build the app
cd brain-viewer
npm run build

# 2. Copy build to root (or subdirectory)
cp -r ../dist/brain-viewer/* ../brain-viewer-app/

# 3. Commit and push
git add brain-viewer-app/
git commit -m "Deploy brain viewer app"
git push origin main

# Access at: https://jonnyb.github.io/brain-viewer-app/
```

### Option 2: Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project
firebase init hosting

# Select options:
# - Public directory: dist/brain-viewer
# - Single-page app: Yes
# - Automatic builds: No

# Deploy
firebase deploy

# Access at your Firebase URL
```

### Option 3: Standalone HTML File

Copy the production build to create a standalone page:

```bash
# After building, create brain-viewer.html
cp dist/brain-viewer/index.html brain-viewer.html

# Edit brain-viewer.html to update asset paths
# Change relative paths to point to dist/brain-viewer/
```

---

## Integration with Portfolio

### Add Link to index.html

Edit your main `index.html` to add a navigation link:

```html
<!-- Add to your navigation section -->
<div class="project-link">
  <a href="brain-viewer-app/index.html" class="contact-btn">
    🧠 Interactive Brain Explorer →
  </a>
  <p>Explore 3D brain anatomy with FreeSurfer data visualization</p>
</div>
```

### Create Dedicated Page

Or create a dedicated landing page:

```html
<!-- brain.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Brain Viewer | Jonathan Bachman</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div class="container">
    <h1>Interactive Brain Viewer</h1>
    <p>Explore the human brain in 3D with FreeSurfer data</p>

    <iframe
      src="brain-viewer-app/index.html"
      style="width:100%; height:800px; border:2px solid #111;">
    </iframe>

    <a href="index.html" class="contact-btn">← Back to Portfolio</a>
  </div>
</body>
</html>
```

### Update Navigation

Add brain viewer to your site navigation:

```html
<nav>
  <a href="index.html">Home</a>
  <a href="brain.html">Brain Viewer</a>
  <a href="paper.html">Research</a>
</nav>
```

---

## Troubleshooting

### Issue: Data Not Loading

**Symptoms:** White screen, "Loading..." message stuck

**Solutions:**
```bash
# Check if data files exist
ls -la public/brain-data/parcellation/

# Verify JSON format
python3 -m json.tool public/brain-data/parcellation/lh.aparc.json

# Check browser console (F12) for network errors

# Verify CORS headers if serving from different domain
```

### Issue: Model Not Displaying

**Symptoms:** Black screen, panels visible but no 3D model

**Solutions:**
```bash
# Check if GLB model exists
ls -la assets/model.glb

# Verify WebGL support in browser
# Visit: https://get.webgl.org/

# Check browser console for Three.js errors

# Try different browser (Chrome, Firefox, Safari)
```

### Issue: Build Fails

**Symptoms:** `npm run build` errors

**Solutions:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite

# Check Node version
node --version  # Should be 16+

# Rebuild
npm run build
```

### Issue: Slow Performance

**Symptoms:** Laggy interactions, low FPS

**Solutions:**
- Close other browser tabs
- Reduce browser zoom to 100%
- Disable browser extensions
- Update graphics drivers
- Use simpler visualization modes
- Reduce mesh quality in settings

### Issue: Python Conversion Errors

**Symptoms:** `nibabel` import errors, conversion failures

**Solutions:**
```bash
# Reinstall nibabel
pip uninstall nibabel
pip install nibabel --upgrade

# Check Python version
python3 --version  # Should be 3.7+

# Verify FreeSurfer data format
file freesurfer_data/label/lh.aparc.annot
# Should show: data

# Run with verbose output
python3 scripts/convert_freesurfer.py -i freesurfer_data -o public/brain-data
```

---

## Next Steps

1. **Test thoroughly** - Try all visualization modes and features
2. **Optimize performance** - Profile with browser DevTools
3. **Add features** - Guided tours, quizzes, comparisons
4. **Deploy** - Push to GitHub Pages or Firebase
5. **Share** - Add to portfolio, share with colleagues

---

## Support

For additional help:
- Check browser console for detailed errors
- Review React Three Fiber docs: https://docs.pmnd.rs/react-three-fiber
- FreeSurfer wiki: https://surfer.nmr.mgh.harvard.edu/

---

**Last Updated:** November 2024
**Version:** 1.0.0
**Author:** Jonathan Bachman

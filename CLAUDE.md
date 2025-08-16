# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is Jonathan Bachman's personal portfolio website hosted on GitHub Pages. It's a static site featuring:

- **Interactive Portfolio**: Main page with seasonal animated tree visualization using p5.js
- **Brain Visualization**: 3D brain layer viewer using Three.js with GLB model support
- **Research Paper Display**: Arctic research paper presentation with video integration
- **Responsive Design**: Works across desktop and mobile devices

## Architecture

### Core Structure
- `index.html` - Main portfolio page with two-column layout (content + animated tree)
- `brain.html` - 3D brain visualization viewer
- `paper.html` - Research paper presentation with embedded videos/PDF
- `css/style.css` - Main stylesheet with brutalist design and scroll animations
- `js/` - JavaScript modules for different features

### Key JavaScript Modules
- `js/main.js` - Scroll effects, progress bar, intersection observer animations
- `js/fractal-tree.js` - Seasonal animated tree canvas (separate from p5.js tree)
- `js/brain.js` - Three.js brain model viewer with layer switching

### Visual Features
- **Seasonal Tree Animation**: p5.js-powered tree with seasonal changes (spring flowers/bees, summer fireworks/fireflies, fall leaves, winter snow/snowmen)
- **3D Brain Model**: Interactive viewer for `assets/model.glb` with face/pial/white matter layers
- **Scroll Animations**: Intersection Observer-based fade/slide effects
- **Background Canvas**: Fractal tree visualization that grows as user scrolls through sections

## Development Workflow

### Local Development
```bash
# Serve locally (no build process required)
python -m http.server 8000
# or
npx serve .
```

### File Structure
```
├── index.html          # Main portfolio page
├── brain.html          # 3D brain viewer
├── paper.html          # Research paper display
├── css/
│   └── style.css       # Main styles with animations
├── js/
│   ├── main.js         # Scroll/animation effects
│   ├── brain.js        # Three.js brain viewer
│   └── fractal-tree.js # Background tree canvas
└── assets/
    ├── model.glb       # 3D brain model
    └── background.png  # Brain viewer background
```

## External Dependencies

### CDN Resources
- **p5.js**: 1.5.0 for main tree animation
- **SimplexNoise**: 2.4.0 for procedural effects
- **Three.js**: 0.165.0 with OrbitControls, GLTFLoader, DRACOLoader
- **Google Fonts**: Courier Prime for typography

### Model Requirements
- Brain model expects meshes named: `lh_white_corrected`, `rh_white_corrected`, `lh_pial`, `rh_pial`, `head_hollow_scooped`
- Supports DRACO compression and Meshopt optimization

## Key Features Implementation

### Seasonal Tree System
The main page tree responds to current month:
- Winter (Dec-Feb): Snow, snowmen building animation
- Spring (Mar-May): Flowers growing, bees
- Summer (Jun-Aug): Fireworks, fireflies, sunset background
- Fall (Sep-Nov): Falling leaves with ground pile accumulation

### Brain Layer Navigation
- Arrow keys or UI buttons cycle through: face → pial surface → white matter
- White matter layer allows hemisphere toggling (up/down arrows)
- Uses exact mesh name matching from GLB file

### Animation Performance
- Tree canvas capped at ~30fps with frame interval limiting
- Intersection Observer triggers tree spawning on section visibility
- Scroll effects use requestAnimationFrame with throttling

## Browser Compatibility

- Modern browsers with ES6 module support required
- WebGL support needed for brain visualization
- Canvas 2D support for tree animations
- Uses CSS Grid and Flexbox for responsive layout

## Deployment

Static site hosted on GitHub Pages. No build process required - direct file serving.
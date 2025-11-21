# Interactive Brain Viewer

A sophisticated 3D brain visualization application built with React, React Three Fiber, and FreeSurfer data integration. Features interactive region selection, multiple visualization modes, and educational content.

## Features

- **Interactive 3D Brain Model**: Explore brain anatomy with smooth controls
- **Multiple Visualization Modes**:
  - Parcellation (colored brain regions)
  - Cortical thickness heatmaps
  - Curvature visualization
  - Sulcal depth mapping
- **Region Selection**: Click on any brain region to see detailed information
- **Educational Content**: Learn about brain region functions and clinical significance
- **Dual Hemisphere Control**: Toggle left/right hemispheres independently
- **Multiple Atlases**: Desikan-Killiany and Destrieux parcellation atlases
- **Smooth Animations**: GSAP-powered camera movements and transitions
- **Customizable Color Maps**: Multiple color schemes for data visualization

## Prerequisites

- Node.js (v16 or higher)
- Python 3.x with pip (for data conversion)
- FreeSurfer data files (provided)

## Installation

### 1. Install Python Dependencies

```bash
pip install nibabel numpy
```

### 2. Convert FreeSurfer Data

From the project root directory:

```bash
python3 scripts/convert_freesurfer.py --input-dir freesurfer_data --output-dir public/brain-data
```

This will create JSON files in `public/brain-data/`:
- `parcellation/` - Region annotations
- `morphometry/` - Thickness, curvature, sulcal depth
- `statistics/` - Regional measurements
- `metadata/` - Educational content and metadata

### 3. Install Node Dependencies

```bash
cd brain-viewer
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Building for Production

```bash
npm run build
```

Build output will be in `dist/brain-viewer/`

To preview the production build:

```bash
npm run preview
```

## Project Structure

```
brain-viewer/
├── src/
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── BrainCanvas.jsx       # Main 3D scene
│   │   │   ├── BrainModel.jsx        # GLB model loader
│   │   │   └── CameraController.jsx  # Animated camera
│   │   ├── ui/
│   │   │   ├── NavigationPanel.jsx   # Layer/mode controls
│   │   │   ├── RegionInfoPanel.jsx   # Region details
│   │   │   └── SettingsPanel.jsx     # Color map settings
│   │   └── shared/
│   │       └── LoadingScreen.jsx     # Loading state
│   ├── store/
│   │   └── brainStore.js             # Zustand state management
│   ├── utils/
│   │   ├── colorMaps.js              # Color mapping utilities
│   │   └── dataProcessing.js         # Data transformation
│   ├── hooks/
│   │   └── useFreeSurferData.js      # Data loading hook
│   ├── App.jsx                        # Main app component
│   ├── main.jsx                       # React entry point
│   └── index.css                      # Global styles
├── public/
│   └── brain-data/                    # Converted FreeSurfer JSON
├── index.html                          # HTML entry point
├── vite.config.js                      # Vite configuration
└── package.json                        # Dependencies
```

## Usage Guide

### Navigation

**Keyboard Shortcuts:**
- `← →` - Switch between layers (face/pial/white/all)
- `N` - Toggle navigation panel
- `I` - Toggle region info panel
- `S` - Toggle settings panel
- `ESC` - Clear region selection

**Mouse Controls:**
- **Click** - Select brain region
- **Drag** - Rotate view
- **Scroll** - Zoom in/out
- **Hover** - Preview region info

### Layers

1. **Face/Skin** - External head surface
2. **Pial Surface** - Outer cortical surface
3. **White Matter** - White matter surface
4. **All Layers** - Combined view

### Visualization Modes

1. **Parcellation** - Brain regions colored by atlas
   - Desikan-Killiany atlas (34 regions per hemisphere)
   - Destrieux atlas (75 regions per hemisphere)

2. **Cortical Thickness** - Heatmap of cortical thickness (1-5mm)

3. **Curvature** - Sulci (inward) and gyri (outward) visualization

4. **Sulcal Depth** - Depth of cortical folds

### Color Maps

Available for morphometry modes:
- Viridis (perceptually uniform)
- Plasma (warm colors)
- Cool-Warm (diverging)
- Jet (rainbow)
- Hot (heat map)
- Grayscale

## Data Formats

### Parcellation JSON
```json
{
  "hemisphere": "lh",
  "atlas": "aparc",
  "num_vertices": 163842,
  "vertex_labels": [0, 0, 1, 1, ...],
  "regions": [
    {
      "id": 0,
      "name": "superiorfrontal",
      "color": {"r": 25, "g": 100, "b": 40},
      "vertex_count": 5432
    }
  ]
}
```

### Morphometry JSON
```json
{
  "hemisphere": "lh",
  "measure": "thickness",
  "num_vertices": 163842,
  "values": [2.5, 2.8, 3.1, ...],
  "statistics": {
    "min": 1.2,
    "max": 4.8,
    "mean": 2.6,
    "std": 0.5
  }
}
```

## Performance Optimization

- **Lazy Loading**: FreeSurfer data loaded progressively
- **Vertex Colors**: Efficient GPU-based coloring
- **Mesh Optimization**: DRACO compression for GLB models
- **React Three Fiber**: Optimized WebGL rendering
- **Code Splitting**: Vite dynamic imports

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- WebGL 2.0 required

## Troubleshooting

### Data Not Loading

1. Ensure FreeSurfer conversion completed successfully
2. Check browser console for network errors
3. Verify `public/brain-data/` contains JSON files
4. Try clearing browser cache

### Performance Issues

1. Close other browser tabs
2. Reduce browser zoom level
3. Disable high-quality rendering in settings
4. Update graphics drivers

### Model Not Displaying

1. Verify `assets/model.glb` exists
2. Check browser WebGL support
3. Try different browser
4. Check browser console for errors

## Development

### Adding New Visualization Modes

1. Add mode to `brainStore.js` visualizationMode options
2. Implement color mapping in `BrainModel.jsx`
3. Add UI button in `NavigationPanel.jsx`
4. Update documentation

### Adding New Atlases

1. Place `.annot` files in `freesurfer_data/label/`
2. Run conversion script with new atlas name
3. Add atlas option in `NavigationPanel.jsx`
4. Update `brainStore.js` atlas options

## Credits

- **FreeSurfer** - Cortical parcellation and morphometry
- **React Three Fiber** - React renderer for Three.js
- **Drei** - Useful helpers for R3F
- **Zustand** - State management
- **GSAP** - Smooth animations
- **Framer Motion** - UI animations

## License

This project is part of Jonathan Bachman's portfolio.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Contact: [Your email/contact info]

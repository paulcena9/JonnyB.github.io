# Brain Visualization Project Context

## Current Implementation
- Basic 3D viewer with OBJ meshes (lh/rh pial, lh/rh white matter, face)
- React 18 + React Three Fiber + Three.js
- Firebase hosting (already configured)
- Tailwind CSS

## Data Format Reference

### Parcellation (.annot files)
- Binary format from FreeSurfer
- Contains: vertex labels (which region each vertex belongs to), color table, region names
- Need to convert to JSON with structure:
```json
  {
    "vertex_labels": [0, 0, 1, 1, 2, ...],  // Array length = num vertices
    "regions": [
      {
        "id": 0,
        "name": "superiorfrontal",
        "color": {"r": 25, "g": 100, "b": 40},
        "vertex_indices": [0, 1, 45, 67, ...]
      }
    ]
  }
```

### Morphometry (.thickness, .curv, .sulc files)
- Binary format with one float value per vertex
- Need to convert to JSON:
```json
  {
    "name": "cortical_thickness",
    "values": [2.5, 2.8, 3.1, ...],  // One per vertex
    "min": 1.2,
    "max": 4.8,
    "mean": 2.6
  }
```

### Statistics (.stats files)
- Text format with measurements per region
- Parse into JSON with region name as key

## Vertex Counts
- Left hemisphere: ~163,842 vertices
- Right hemisphere: ~164,618 vertices

## Educational Requirements
- Each brain region should have: name, function, clinical significance
- Display statistics when region is selected
- Smooth camera transitions between regions
- Multiple visualization modes (parcellation, thickness heatmap, curvature)

## Performance Considerations
- Meshes are large (~5-6 MB each)
- Need efficient vertex color updates
- Consider LOD for performance
- Lazy load data when needed

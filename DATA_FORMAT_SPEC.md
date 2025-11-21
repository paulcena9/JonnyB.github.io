# FreeSurfer JSON Data Format Specification

This document describes the JSON data formats used by the Interactive Brain Viewer.

## Table of Contents

1. [Parcellation Data](#parcellation-data)
2. [Morphometry Data](#morphometry-data)
3. [Statistics Data](#statistics-data)
4. [Metadata](#metadata)

---

## Parcellation Data

**Files:** `public/brain-data/parcellation/{hemisphere}.{atlas}.json`

Examples:
- `lh.aparc.json` - Left hemisphere, Desikan-Killiany atlas
- `rh.aparc.a2009s.json` - Right hemisphere, Destrieux atlas

### Schema

```typescript
interface ParcellationData {
  hemisphere: "lh" | "rh";           // Hemisphere identifier
  atlas: string;                      // Atlas name (e.g., "aparc", "aparc.a2009s")
  num_vertices: number;               // Total number of vertices in mesh
  num_regions: number;                // Number of brain regions
  vertex_labels: number[];            // Array of region IDs (one per vertex)
  regions: Region[];                  // Array of region objects
  metadata: {
    source_file: string;              // Original .annot filename
    has_color_table: boolean;         // Whether color table was present
  };
}

interface Region {
  id: number;                         // Unique region ID (0-based index)
  name: string;                       // Region name (e.g., "superiorfrontal")
  label: number;                      // FreeSurfer label value
  color: {
    r: number;                        // Red (0-255)
    g: number;                        // Green (0-255)
    b: number;                        // Blue (0-255)
    a: number;                        // Alpha (0-255)
  };
  vertex_count: number;               // Number of vertices in this region
  vertex_indices: number[];           // Array of vertex indices belonging to region
}
```

### Example

```json
{
  "hemisphere": "lh",
  "atlas": "aparc",
  "num_vertices": 163842,
  "num_regions": 34,
  "vertex_labels": [0, 0, 0, 1, 1, 1, ...],
  "regions": [
    {
      "id": 0,
      "name": "superiorfrontal",
      "label": 1001,
      "color": {
        "r": 25,
        "g": 100,
        "b": 40,
        "a": 255
      },
      "vertex_count": 5432,
      "vertex_indices": [0, 1, 2, 45, 67, ...]
    }
  ],
  "metadata": {
    "source_file": "lh.aparc.annot",
    "has_color_table": true
  }
}
```

### Notes

- `vertex_labels[i]` contains the region ID for vertex `i`
- Region ID `-1` indicates unknown/medial wall (not part of any region)
- Vertex indices in `vertex_indices` array can be used to map back to 3D mesh vertices

---

## Morphometry Data

**Files:** `public/brain-data/morphometry/{hemisphere}.{measure}.json`

Examples:
- `lh.thickness.json` - Left hemisphere cortical thickness
- `rh.curv.json` - Right hemisphere curvature
- `lh.sulc.json` - Left hemisphere sulcal depth

### Schema

```typescript
interface MorphometryData {
  hemisphere: "lh" | "rh";            // Hemisphere identifier
  measure: string;                    // Measure type ("thickness", "curv", "sulc")
  num_vertices: number;               // Total number of vertices
  values: number[];                   // Per-vertex measurements
  statistics: {
    min: number;                      // Minimum value (excluding zeros)
    max: number;                      // Maximum value
    mean: number;                     // Average value
    std: number;                      // Standard deviation
    median: number;                   // Median value
    percentile_5: number;             // 5th percentile
    percentile_95: number;            // 95th percentile
  };
  metadata: {
    source_file: string;              // Original FreeSurfer filename
    num_non_zero: number;             // Number of non-zero values
  };
}
```

### Example

```json
{
  "hemisphere": "lh",
  "measure": "thickness",
  "num_vertices": 163842,
  "values": [2.543, 2.812, 3.104, ...],
  "statistics": {
    "min": 1.234,
    "max": 4.876,
    "mean": 2.634,
    "std": 0.523,
    "median": 2.589,
    "percentile_5": 1.789,
    "percentile_95": 3.654
  },
  "metadata": {
    "source_file": "lh.thickness",
    "num_non_zero": 163842
  }
}
```

### Measurement Units

- **Thickness**: Millimeters (mm), typically 1-5mm
- **Curvature**: Radians/mm, negative = sulci (inward), positive = gyri (outward)
- **Sulcal Depth**: Millimeters (mm), depth of cortical folds

### Notes

- Zero values indicate medial wall or invalid measurements
- Statistics exclude zero values
- Values array length equals `num_vertices`

---

## Statistics Data

**File:** `public/brain-data/statistics/all_stats.json`

Contains regional measurements from FreeSurfer's `*.stats` files.

### Schema

```typescript
interface AllStatistics {
  [key: string]: HemisphereStatistics;  // Key format: "{hemisphere}.{atlas}"
}

interface HemisphereStatistics {
  regions: {
    [regionName: string]: RegionStatistics;
  };
  metadata: {
    [key: string]: string;              // Global measurements
  };
  source_file: string;
}

interface RegionStatistics {
  name: string;                         // Region name
  num_vertices: number;                 // Number of vertices
  surface_area: number;                 // Surface area in mm²
  gray_volume: number;                  // Gray matter volume in mm³
  avg_thickness: number;                // Average thickness in mm
  std_thickness: number;                // Thickness standard deviation in mm
}
```

### Example

```json
{
  "lh.aparc": {
    "regions": {
      "superiorfrontal": {
        "name": "superiorfrontal",
        "num_vertices": 5432,
        "surface_area": 3421.5,
        "gray_volume": 12543.7,
        "avg_thickness": 2.634,
        "std_thickness": 0.432
      }
    },
    "metadata": {
      "BrainSegVolNotVent": "1234567.0",
      "eTIV": "1567890.0"
    },
    "source_file": "lh.aparc.stats"
  }
}
```

### Notes

- Keys use format `{hemisphere}.{atlas}` (e.g., "lh.aparc", "rh.aparc.a2009s")
- Region names match those in parcellation data
- Measurements are from FreeSurfer's surface reconstruction

---

## Metadata

**File:** `public/brain-data/metadata/conversion_info.json`

Contains conversion metadata and educational content.

### Schema

```typescript
interface ConversionMetadata {
  conversion_date: string;              // ISO timestamp
  input_directory: string;              // Source data path
  output_directory: string;             // Output data path
  available_data: {
    parcellations: string[];            // List of parcellation files
    morphometry: string[];              // List of morphometry files
    statistics: string[];               // List of statistics files
  };
  region_descriptions: {
    [regionName: string]: RegionDescription;
  };
}

interface RegionDescription {
  name: string;                         // Full anatomical name
  function: string;                     // Brain region function
  clinical: string;                     // Clinical significance
}
```

### Example

```json
{
  "conversion_date": "2024-11-21",
  "input_directory": "./freesurfer_data",
  "output_directory": "./public/brain-data",
  "available_data": {
    "parcellations": ["lh.aparc", "rh.aparc", "lh.aparc.a2009s", "rh.aparc.a2009s"],
    "morphometry": ["lh.thickness", "rh.thickness", "lh.curv", "rh.curv"],
    "statistics": ["all_stats"]
  },
  "region_descriptions": {
    "superiorfrontal": {
      "name": "Superior Frontal Gyrus",
      "function": "Executive function, working memory, self-awareness",
      "clinical": "Damage may cause executive dysfunction, personality changes"
    }
  }
}
```

---

## Data Flow in Application

### Loading Sequence

1. **App Start** → Load metadata to check available data
2. **User Action** → Load parcellation data for current atlas
3. **Visualization Mode** → Load morphometry data as needed
4. **Region Selection** → Lookup statistics for selected region

### Data Usage

#### Parcellation Mode
```javascript
// Get region for clicked vertex
const regionId = parcellationData.vertex_labels[vertexIndex];
const region = parcellationData.regions.find(r => r.id === regionId);

// Color all vertices by region
const colors = parcellationData.vertex_labels.map(regionId => {
  const region = parcellationData.regions.find(r => r.id === regionId);
  return region.color;
});
```

#### Morphometry Mode
```javascript
// Map thickness values to colors
const thicknessData = morphometryData['lh']['thickness'];
const colors = thicknessData.values.map(value => {
  return heatmapColor(value, thicknessData.statistics.min, thicknessData.statistics.max);
});
```

#### Statistics Display
```javascript
// Show region statistics
const stats = statisticsData['lh.aparc'].regions[regionName];
console.log(`Surface Area: ${stats.surface_area} mm²`);
console.log(`Average Thickness: ${stats.avg_thickness} mm`);
```

---

## File Size Estimates

- **Parcellation JSON**: ~2-5 MB per hemisphere
- **Morphometry JSON**: ~1-2 MB per measure per hemisphere
- **Statistics JSON**: ~50-100 KB total
- **Metadata JSON**: ~20-50 KB

**Total Dataset Size**: ~15-30 MB

---

## Validation

### Python Validation Script

```python
import json

def validate_parcellation(data):
    assert 'hemisphere' in data
    assert data['hemisphere'] in ['lh', 'rh']
    assert len(data['vertex_labels']) == data['num_vertices']
    assert len(data['regions']) == data['num_regions']
    for region in data['regions']:
        assert 'id' in region and 'name' in region
        assert 'color' in region and 'r' in region['color']

def validate_morphometry(data):
    assert 'measure' in data
    assert len(data['values']) == data['num_vertices']
    assert 'statistics' in data
    assert data['statistics']['min'] <= data['statistics']['max']

# Usage
with open('public/brain-data/parcellation/lh.aparc.json') as f:
    validate_parcellation(json.load(f))
```

---

## Version History

- **v1.0** (2024-11) - Initial format specification
  - Parcellation, morphometry, statistics formats
  - Educational metadata integration
  - Multi-atlas support

---

**Maintained by:** Jonathan Bachman
**Last Updated:** November 2024

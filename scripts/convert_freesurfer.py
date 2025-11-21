#!/usr/bin/env python3
"""
FreeSurfer Data Converter to JSON
==================================
Converts FreeSurfer binary data files to web-friendly JSON formats.
Supports .annot, .thickness, .curv, .sulc, and .stats files.

Requirements:
    pip install nibabel numpy

Usage:
    python convert_freesurfer.py --input-dir ../freesurfer_data --output-dir ../public/brain-data
"""

import os
import sys
import json
import struct
import argparse
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple, Any
from datetime import datetime
import re

try:
    import nibabel.freesurfer as fs
except ImportError:
    print("Error: nibabel is required. Install with: pip install nibabel")
    sys.exit(1)


class FreeSurferConverter:
    """Converts FreeSurfer data files to JSON format."""

    def __init__(self, input_dir: str, output_dir: str, verbose: bool = True):
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.verbose = verbose

        # Create output directories
        self.output_dir.mkdir(parents=True, exist_ok=True)
        (self.output_dir / 'parcellation').mkdir(exist_ok=True)
        (self.output_dir / 'morphometry').mkdir(exist_ok=True)
        (self.output_dir / 'statistics').mkdir(exist_ok=True)
        (self.output_dir / 'metadata').mkdir(exist_ok=True)

    def log(self, message: str):
        """Print message if verbose mode is enabled."""
        if self.verbose:
            print(f"[INFO] {message}")

    def convert_annot_file(self, annot_path: Path, hemisphere: str, atlas: str = 'aparc') -> Dict:
        """
        Convert FreeSurfer .annot file to JSON format.

        Returns:
            Dictionary with vertex labels and region information
        """
        self.log(f"Converting annotation file: {annot_path}")

        # Read annotation file using nibabel
        labels, ctab, names = fs.read_annot(str(annot_path))

        # Create region dictionary
        regions = []
        vertex_to_region = {}

        for idx, (region_name, region_label) in enumerate(zip(names, np.unique(labels))):
            if region_label == -1:  # Skip unknown/medial wall
                continue

            # Get vertices for this region
            vertex_indices = np.where(labels == region_label)[0].tolist()

            # Get color from color table if available
            if ctab is not None and idx < len(ctab):
                color = {
                    "r": int(ctab[idx, 0]),
                    "g": int(ctab[idx, 1]),
                    "b": int(ctab[idx, 2]),
                    "a": int(ctab[idx, 3]) if ctab.shape[1] > 3 else 255
                }
            else:
                # Generate a color based on index if no color table
                np.random.seed(idx)
                color = {
                    "r": int(np.random.randint(50, 200)),
                    "g": int(np.random.randint(50, 200)),
                    "b": int(np.random.randint(50, 200)),
                    "a": 255
                }

            # Store region info
            region_info = {
                "id": idx,
                "name": region_name.decode('utf-8') if isinstance(region_name, bytes) else str(region_name),
                "label": int(region_label),
                "color": color,
                "vertex_count": len(vertex_indices),
                "vertex_indices": vertex_indices  # Store for detailed analysis
            }
            regions.append(region_info)

            # Map vertices to region ID
            for v_idx in vertex_indices:
                vertex_to_region[v_idx] = idx

        # Create vertex labels array (region ID for each vertex)
        num_vertices = len(labels)
        vertex_labels = [-1] * num_vertices
        for v_idx, region_id in vertex_to_region.items():
            vertex_labels[v_idx] = region_id

        result = {
            "hemisphere": hemisphere,
            "atlas": atlas,
            "num_vertices": num_vertices,
            "num_regions": len(regions),
            "vertex_labels": vertex_labels,
            "regions": regions,
            "metadata": {
                "source_file": annot_path.name,
                "has_color_table": ctab is not None
            }
        }

        # Save to JSON
        output_path = self.output_dir / 'parcellation' / f"{hemisphere}.{atlas}.json"
        with open(output_path, 'w') as f:
            json.dump(result, f, separators=(',', ':'))

        self.log(f"Saved parcellation to: {output_path}")
        return result

    def convert_morphometry_file(self, morph_path: Path, hemisphere: str, measure: str) -> Dict:
        """
        Convert FreeSurfer morphometry file (.thickness, .curv, .sulc) to JSON.

        Returns:
            Dictionary with per-vertex scalar values
        """
        self.log(f"Converting morphometry file: {morph_path}")

        # Read morphometry data
        values = fs.read_morph_data(str(morph_path))

        # Calculate statistics
        valid_values = values[values != 0]  # Exclude zero values (medial wall)

        result = {
            "hemisphere": hemisphere,
            "measure": measure,
            "num_vertices": len(values),
            "values": values.tolist(),
            "statistics": {
                "min": float(np.min(valid_values)) if len(valid_values) > 0 else 0,
                "max": float(np.max(valid_values)) if len(valid_values) > 0 else 0,
                "mean": float(np.mean(valid_values)) if len(valid_values) > 0 else 0,
                "std": float(np.std(valid_values)) if len(valid_values) > 0 else 0,
                "median": float(np.median(valid_values)) if len(valid_values) > 0 else 0,
                "percentile_5": float(np.percentile(valid_values, 5)) if len(valid_values) > 0 else 0,
                "percentile_95": float(np.percentile(valid_values, 95)) if len(valid_values) > 0 else 0
            },
            "metadata": {
                "source_file": morph_path.name,
                "num_non_zero": int(np.sum(values != 0))
            }
        }

        # Save to JSON
        output_path = self.output_dir / 'morphometry' / f"{hemisphere}.{measure}.json"
        with open(output_path, 'w') as f:
            json.dump(result, f, separators=(',', ':'))

        self.log(f"Saved morphometry to: {output_path}")
        return result

    def parse_stats_file(self, stats_path: Path) -> Dict:
        """
        Parse FreeSurfer .stats file to extract regional measurements.

        Returns:
            Dictionary with regional statistics
        """
        self.log(f"Parsing stats file: {stats_path}")

        regions = {}
        metadata = {}

        with open(stats_path, 'r') as f:
            lines = f.readlines()

        # Parse metadata from header
        for line in lines:
            if line.startswith('# Measure'):
                parts = line.strip().split(',')
                if len(parts) >= 2:
                    key = parts[0].replace('# Measure', '').strip()
                    value = parts[1].strip()
                    metadata[key] = value
            elif not line.startswith('#') and line.strip():
                # Parse data lines (skip header lines)
                parts = line.strip().split()
                if len(parts) >= 5:  # Typical stats line format
                    try:
                        region_name = parts[0]
                        num_vertices = int(parts[1])
                        surface_area = float(parts[2])
                        gray_vol = float(parts[3])
                        avg_thickness = float(parts[4])
                        std_thickness = float(parts[5]) if len(parts) > 5 else 0.0

                        regions[region_name] = {
                            "name": region_name,
                            "num_vertices": num_vertices,
                            "surface_area": surface_area,
                            "gray_volume": gray_vol,
                            "avg_thickness": avg_thickness,
                            "std_thickness": std_thickness
                        }
                    except (ValueError, IndexError):
                        continue

        return {
            "regions": regions,
            "metadata": metadata,
            "source_file": stats_path.name
        }

    def convert_stats_files(self):
        """Convert all .stats files in the stats directory."""
        stats_dir = self.input_dir / 'stats'
        if not stats_dir.exists():
            self.log("No stats directory found")
            return

        all_stats = {}

        for stats_file in stats_dir.glob('*.stats'):
            stats_data = self.parse_stats_file(stats_file)

            # Determine hemisphere and type from filename
            filename = stats_file.stem
            if filename.startswith('lh.'):
                hemisphere = 'lh'
                atlas = filename.replace('lh.', '')
            elif filename.startswith('rh.'):
                hemisphere = 'rh'
                atlas = filename.replace('rh.', '')
            else:
                hemisphere = 'both'
                atlas = filename

            key = f"{hemisphere}.{atlas}" if hemisphere != 'both' else atlas
            all_stats[key] = stats_data

        # Save combined statistics
        output_path = self.output_dir / 'statistics' / 'all_stats.json'
        with open(output_path, 'w') as f:
            json.dump(all_stats, f, indent=2)

        self.log(f"Saved statistics to: {output_path}")
        return all_stats

    def create_metadata_file(self):
        """Create a metadata file with information about the conversion."""
        metadata = {
            "conversion_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "input_directory": str(self.input_dir),
            "output_directory": str(self.output_dir),
            "available_data": {
                "parcellations": [],
                "morphometry": [],
                "statistics": []
            }
        }

        # List available data files
        parc_dir = self.output_dir / 'parcellation'
        if parc_dir.exists():
            metadata['available_data']['parcellations'] = [
                f.stem for f in parc_dir.glob('*.json')
            ]

        morph_dir = self.output_dir / 'morphometry'
        if morph_dir.exists():
            metadata['available_data']['morphometry'] = [
                f.stem for f in morph_dir.glob('*.json')
            ]

        stats_dir = self.output_dir / 'statistics'
        if stats_dir.exists():
            metadata['available_data']['statistics'] = [
                f.stem for f in stats_dir.glob('*.json')
            ]

        # Brain region descriptions (educational content)
        metadata['region_descriptions'] = self.get_region_descriptions()

        # Save metadata
        output_path = self.output_dir / 'metadata' / 'conversion_info.json'
        with open(output_path, 'w') as f:
            json.dump(metadata, f, indent=2)

        self.log(f"Saved metadata to: {output_path}")
        return metadata

    def get_region_descriptions(self) -> Dict:
        """Return educational descriptions for common brain regions."""
        return {
            "superiorfrontal": {
                "name": "Superior Frontal Gyrus",
                "function": "Executive function, working memory, self-awareness",
                "clinical": "Damage may cause executive dysfunction, personality changes"
            },
            "middlefrontal": {
                "name": "Middle Frontal Gyrus",
                "function": "Attention, working memory, cognitive control",
                "clinical": "Associated with ADHD, depression when dysfunctional"
            },
            "inferiorfrontal": {
                "name": "Inferior Frontal Gyrus",
                "function": "Language production (Broca's area), inhibition",
                "clinical": "Damage causes Broca's aphasia, difficulty with speech production"
            },
            "precentral": {
                "name": "Precentral Gyrus",
                "function": "Primary motor cortex, voluntary movement control",
                "clinical": "Damage causes paralysis or weakness on opposite side of body"
            },
            "postcentral": {
                "name": "Postcentral Gyrus",
                "function": "Primary somatosensory cortex, touch and proprioception",
                "clinical": "Damage causes loss of sensation on opposite side of body"
            },
            "superiortemporal": {
                "name": "Superior Temporal Gyrus",
                "function": "Auditory processing, language comprehension (Wernicke's area)",
                "clinical": "Damage may cause Wernicke's aphasia, auditory hallucinations"
            },
            "middletemporal": {
                "name": "Middle Temporal Gyrus",
                "function": "Language, semantic memory, visual processing",
                "clinical": "Associated with semantic dementia, word-finding difficulties"
            },
            "inferiortemporal": {
                "name": "Inferior Temporal Gyrus",
                "function": "Object recognition, face processing, visual memory",
                "clinical": "Damage may cause prosopagnosia (face blindness)"
            },
            "superiorparietal": {
                "name": "Superior Parietal Lobule",
                "function": "Spatial awareness, attention, sensorimotor integration",
                "clinical": "Damage causes spatial neglect, difficulty with coordination"
            },
            "inferiorparietal": {
                "name": "Inferior Parietal Lobule",
                "function": "Language, mathematical cognition, body image",
                "clinical": "Damage may cause Gerstmann syndrome, dyscalculia"
            },
            "precuneus": {
                "name": "Precuneus",
                "function": "Self-consciousness, episodic memory, visuospatial processing",
                "clinical": "Early affected in Alzheimer's disease"
            },
            "cuneus": {
                "name": "Cuneus",
                "function": "Basic visual processing",
                "clinical": "Damage causes visual field defects"
            },
            "lateraloccipital": {
                "name": "Lateral Occipital Cortex",
                "function": "Object recognition, motion processing",
                "clinical": "Damage may cause object agnosia"
            },
            "lingual": {
                "name": "Lingual Gyrus",
                "function": "Visual processing, color perception, word recognition",
                "clinical": "Damage may cause alexia (reading difficulty), color agnosia"
            },
            "fusiform": {
                "name": "Fusiform Gyrus",
                "function": "Face recognition, object categorization, reading",
                "clinical": "Damage causes prosopagnosia, difficulty recognizing faces"
            },
            "parahippocampal": {
                "name": "Parahippocampal Gyrus",
                "function": "Memory encoding, spatial navigation, scene processing",
                "clinical": "Critical for memory formation, affected in Alzheimer's"
            },
            "entorhinal": {
                "name": "Entorhinal Cortex",
                "function": "Memory, navigation, time perception",
                "clinical": "First area affected in Alzheimer's disease"
            },
            "temporalpole": {
                "name": "Temporal Pole",
                "function": "Social and emotional processing, semantic memory",
                "clinical": "Damage associated with behavioral changes, semantic dementia"
            },
            "frontalpole": {
                "name": "Frontal Pole",
                "function": "Complex reasoning, planning, multitasking",
                "clinical": "Damage affects abstract thinking and planning abilities"
            },
            "cingulate": {
                "name": "Cingulate Cortex",
                "function": "Emotion, attention, cognitive control, pain processing",
                "clinical": "Associated with depression, chronic pain, ADHD"
            },
            "insula": {
                "name": "Insular Cortex",
                "function": "Interoception, emotion, empathy, taste",
                "clinical": "Damage affects emotional awareness, addiction vulnerability"
            }
        }

    def convert_all(self):
        """Convert all FreeSurfer data files."""
        self.log("Starting FreeSurfer data conversion...")

        # Convert annotation files
        label_dir = self.input_dir / 'label'
        if label_dir.exists():
            for annot_file in label_dir.glob('*.annot'):
                filename = annot_file.stem
                if filename.startswith('lh.'):
                    hemisphere = 'lh'
                    atlas = filename.replace('lh.', '')
                elif filename.startswith('rh.'):
                    hemisphere = 'rh'
                    atlas = filename.replace('rh.', '')
                else:
                    continue

                self.convert_annot_file(annot_file, hemisphere, atlas)

        # Convert morphometry files
        surf_dir = self.input_dir / 'surf'
        if surf_dir.exists():
            morph_types = ['thickness', 'curv', 'sulc']
            for morph_type in morph_types:
                for hemi in ['lh', 'rh']:
                    morph_file = surf_dir / f"{hemi}.{morph_type}"
                    if morph_file.exists():
                        self.convert_morphometry_file(morph_file, hemi, morph_type)

        # Convert statistics files
        self.convert_stats_files()

        # Create metadata file
        self.create_metadata_file()

        self.log("Conversion complete!")

        # Print summary
        print("\n" + "="*60)
        print("CONVERSION SUMMARY")
        print("="*60)
        print(f"Output directory: {self.output_dir}")
        print(f"- Parcellations: {len(list((self.output_dir / 'parcellation').glob('*.json')))} files")
        print(f"- Morphometry: {len(list((self.output_dir / 'morphometry').glob('*.json')))} files")
        print(f"- Statistics: {len(list((self.output_dir / 'statistics').glob('*.json')))} files")
        print("="*60)


def main():
    parser = argparse.ArgumentParser(
        description='Convert FreeSurfer data files to JSON format'
    )
    parser.add_argument(
        '--input-dir', '-i',
        default='../freesurfer_data',
        help='Input directory containing FreeSurfer data'
    )
    parser.add_argument(
        '--output-dir', '-o',
        default='../public/brain-data',
        help='Output directory for JSON files'
    )
    parser.add_argument(
        '--quiet', '-q',
        action='store_true',
        help='Suppress verbose output'
    )

    args = parser.parse_args()

    # Check if input directory exists
    if not Path(args.input_dir).exists():
        print(f"Error: Input directory does not exist: {args.input_dir}")
        sys.exit(1)

    # Create converter and run
    converter = FreeSurferConverter(
        input_dir=args.input_dir,
        output_dir=args.output_dir,
        verbose=not args.quiet
    )

    try:
        converter.convert_all()
    except Exception as e:
        print(f"Error during conversion: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
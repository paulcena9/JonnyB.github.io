# Quick Start Guide - Interactive Brain Viewer

Get the brain viewer running in 5 minutes!

## Step 1: Install Python Package (30 seconds)

```bash
pip install nibabel numpy
```

## Step 2: Convert FreeSurfer Data (2 minutes)

```bash
# From project root
mkdir -p public/brain-data

python3 scripts/convert_freesurfer.py \
  --input-dir freesurfer_data \
  --output-dir public/brain-data
```

You should see:
```
[INFO] Converting annotation file: freesurfer_data/label/lh.aparc.annot
[INFO] Converting annotation file: freesurfer_data/label/rh.aparc.annot
...
============================================================
CONVERSION SUMMARY
============================================================
Output directory: public/brain-data
- Parcellations: 4 files
- Morphometry: 6 files
- Statistics: 1 files
============================================================
```

## Step 3: Install Node Packages (1 minute)

```bash
cd brain-viewer
npm install
```

## Step 4: Run Development Server (10 seconds)

```bash
npm run dev
```

Visit http://localhost:3000 and start exploring! 🧠

---

## Troubleshooting

**"nibabel not found"**
```bash
pip install nibabel
```

**"npm: command not found"**
- Install Node.js from https://nodejs.org/

**Data not loading in browser**
- Check browser console (F12)
- Verify `public/brain-data/` contains JSON files

---

## What's Next?

1. **Click on brain regions** to see information
2. **Try different visualization modes** (thickness, curvature)
3. **Switch between layers** (face/pial/white matter)
4. **Read full documentation** in BRAIN_VIEWER_SETUP.md

---

## Build for Production

```bash
npm run build
```

Output: `dist/brain-viewer/`

Deploy to GitHub Pages, Firebase, or any static host!

---

**Need Help?** Check BRAIN_VIEWER_SETUP.md for detailed troubleshooting.

// js/fractal-tree.js
window.addEventListener('DOMContentLoaded', () => {
  const canvas   = document.getElementById('tree-canvas');
  const ctx      = canvas.getContext('2d');
  const noise    = new SimplexNoise();
  let   width, height, baseY, trunkLen;

  // configuration
  const SECTION_IDS         = ['intro','writings','projects','contact'];
  const MAX_SKELETON_DEPTH  = 4;        // super-complex trunk
  const SKELETON_SPREAD     = 25;       // branch angle base
  const LEAF_DEPTH          = 8;        // recursive leaf depth
  const FAN_ANGLES          = [-0.8, 0, 0.8]; // leaf-fan spread (rad)
  const BREATHE_SPEED       = 1.5;      // leaf pulsing speed
  const FRAME_INTERVAL      = 1000 / 30; // cap ~30fps

  // ————————————————————————————————————————————
  // SEASON DETECTION
  // ————————————————————————————————————————————
  const month = new Date().getMonth();  // 0 = Jan … 11 = Dec
  let season;
  if (month === 11 || month <= 1) season = 'winter';
  else if (month <= 4)           season = 'spring';
  else if (month <= 7)           season = 'summer';
  else                            season = 'fall';

  // state
  const trees            = [];        // array of {off,offCtx,midX,depth,tipPoints}
  const seenSections     = new Set(); // to avoid dup trees
  let   lastFrameTime    = 0;
  let   t                = 0;

  // ——————————————————————————————————————————————————
  // 1) CANVAS/RESIZE SETUP
  // ——————————————————————————————————————————————————
  function resize() {
    width    = canvas.clientWidth;
    height   = canvas.clientHeight;
    canvas.width  = width;
    canvas.height = height;
    baseY    = height - 2;
    trunkLen = height * 0.4;

    // rebuild each tree’s skeleton (sizes changed)
    trees.forEach(buildSkeleton);
  }
  window.addEventListener('resize', resize);
  resize();

  // ——————————————————————————————————————————————————
  // 2) BUILD A TREE’S OFFSCREEN SKELETON & RECORD TIPS
  // ——————————————————————————————————————————————————
  function buildSkeleton(tree) {
    const { offCtx, midX, depth } = tree;
    tree.tipPoints = [];

    // clear the offscreen canvas
    offCtx.clearRect(0, 0, width, height);

    // recursive draw function
    (function drawNode(x, y, len, angle, d) {
      if (d > depth) {
        tree.tipPoints.push({ x, y });
        return;
      }

      const rad = (angle * Math.PI) / 180;
      const x2  = x + Math.cos(rad) * len;
      const y2  = y - Math.sin(rad) * len;

      // 1) draw a slightly thicker, lighter border
      offCtx.beginPath();
      offCtx.moveTo(x, y);
      offCtx.lineTo(x2, y2);
      offCtx.strokeStyle = '#3a2a1a';
      offCtx.lineWidth   = 14;
      offCtx.stroke();

      // 2) draw the normal branch on top
      offCtx.beginPath();
      offCtx.moveTo(x, y);
      offCtx.lineTo(x2, y2);
      offCtx.strokeStyle = '#4b2e11';
      offCtx.lineWidth   = 12;
      offCtx.stroke();

      // recurse
      const nextLen = len * 0.7;
      const spread  = SKELETON_SPREAD + (Math.random() * 10 - 5);
      drawNode(x2, y2, nextLen, angle - spread, d + 1);
      drawNode(x2, y2, nextLen, angle + spread, d + 1);
    })(
      tree.midX,   // start x
      baseY,       // start y (bottom)
      trunkLen,    // initial length
      90,          // straight up
      0            // depth = 0
    );
  }

  function addTree() {
    const off    = document.createElement('canvas');
    off.width    = width;
    off.height   = height;
    const offCtx = off.getContext('2d');
    const midX   = Math.random() * (width * 0.8) + width * 0.1;
    const tree   = { off, offCtx, midX, depth: MAX_SKELETON_DEPTH, tipPoints: [] };
    buildSkeleton(tree);
    trees.push(tree);
  }

  // initial tree
  addTree();

  // ——————————————————————————————————————————————————
  // 3) OBSERVE SECTIONS → SPAWN NEW TREES
  // ——————————————————————————————————————————————————
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const id = entry.target.id;
      if (entry.isIntersecting && SECTION_IDS.includes(id) && !seenSections.has(id)) {
        seenSections.add(id);
        addTree();
      }
    });
  }, { threshold: 0.5 });
  SECTION_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });

  // ——————————————————————————————————————————————————
  // 4) RECURSIVE LEAF DRAW
  // ——————————————————————————————————————————————————
  function drawLeaf(x, y, len, angle, depth, hue) {
    if (depth < 0 || len < 2) return;
    ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.strokeStyle = `hsl(${hue},70%,50%)`;
      ctx.lineWidth   = depth + 1;
      ctx.shadowColor = `hsla(${hue},70%,60%,0.4)`;
      ctx.shadowBlur  = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -len);
      ctx.stroke();
    ctx.restore();

    const rad  = angle;
    const nx   = x + Math.cos(rad) * len;
    const ny   = y - Math.sin(rad) * len;
    const sway = noise.noise2D(t + depth, depth) * 0.5;
    const next = len * 0.6;

    drawLeaf(nx, ny, next, angle - 0.5 + sway, depth - 1, hue);
    drawLeaf(nx, ny, next, angle + 0.5 + sway, depth - 1, hue);
  }

  // ————————————————————————————————————————————
  // PICK LEAF HUE FOR SPRING/SUMMER vs FALL
  // ————————————————————————————————————————————
  function getLeafHue(timeOffset) {
    if (season === 'fall') {
      // reds → golds
      return ((noise.noise2D(timeOffset * 0.7, timeOffset * 1.3) + 1) / 2) * 40 + 10;
    }
    // spring/summer greens
    return ((noise.noise2D(timeOffset * 0.7, timeOffset * 1.3) + 1) / 2) * 60 + 80;
  }

  // ——————————————————————————————————————————————————
  // 5) MAIN RENDER LOOP (~30 FPS)
  // ——————————————————————————————————————————————————
  function render(now) {
    requestAnimationFrame(render);
    const delta = now - lastFrameTime;
    if (delta < FRAME_INTERVAL) return;
    lastFrameTime = now - (delta % FRAME_INTERVAL);
    t = now * 0.001;

    ctx.clearRect(0, 0, width, height);

    // draw all branch skeletons
    trees.forEach(tree => {
      ctx.drawImage(tree.off, 0, 0);
    });

    // draw leaves on every tip, unless it's winter
    const pulse = Math.sin(t * BREATHE_SPEED) * 5;

    trees.forEach(tree => {
      tree.tipPoints.forEach(pt => {
        if (season === 'winter') return;
        FAN_ANGLES.forEach(a => {
          const hue = getLeafHue(t + pt.x * 0.001);
          drawLeaf(
            pt.x,
            pt.y,
            trunkLen * 0.1 + pulse,
            a + Math.sin(t + pt.x * 0.001) * 0.3,
            LEAF_DEPTH,
            hue
          );
        });
      });
    });
  }

  requestAnimationFrame(render);
});
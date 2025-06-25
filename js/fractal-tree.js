// js/fractal-tree.js
window.addEventListener('DOMContentLoaded', () => {
  // —————————————————————————————————————————————
  // SETUP
  // —————————————————————————————————————————————
  const canvas = document.getElementById('tree-canvas');
  const ctx    = canvas.getContext('2d');
  const noise  = new SimplexNoise();
  let width, height, midX, baseY, trunkLen;

  // offscreen for the static skeleton
  const off = document.createElement('canvas');
  const offCtx = off.getContext('2d');
  let tipPoints = [];  // store all branch tips

  function resize() {
    width  = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width  = width;
    canvas.height = height;
    off.width  = width;
    off.height = height;

    midX     = width / 2;
    baseY    = height - 2;
    trunkLen = height * 0.4;  // 40% height

    buildSkeleton();
  }
  window.addEventListener('resize', resize);
  resize();

  console.log('🔧 fractal-tree.js loaded, tips=', tipPoints.length);

  // —————————————————————————————————————————————
  // 1) BUILD & DRAW THE STATIC FRACTAL SKELETON
  // —————————————————————————————————————————————
  const SKELETON_DEPTH = 6;
  const SKELETON_SPREAD = 25;  // base branch angle

  function buildSkeleton() {
    tipPoints = [];
    offCtx.clearRect(0, 0, width, height);
    offCtx.strokeStyle = '#4b2e11';
    offCtx.lineWidth   = 12;

    // recursive draw into offscreen + record tips
    (function drawNode(x, y, len, angle, depth) {
      if (depth < 0) {
        tipPoints.push({ x, y });
        return;
      }
      // compute end
      const rad = (angle * Math.PI) / 180;
      const x2  = x + Math.cos(rad) * len;
      const y2  = y + Math.sin(rad) * len * -1; // invert Y

      // draw segment
      offCtx.beginPath();
      offCtx.moveTo(x, y);
      offCtx.lineTo(x2, y2);
      offCtx.stroke();

      // recurse children
      const nextLen = len * 0.7;
      const spread  = SKELETON_SPREAD + (Math.random() * 10 - 5);
      drawNode(x2, y2, nextLen, angle - spread, depth - 1);
      drawNode(x2, y2, nextLen, angle + spread, depth - 1);
    })(midX, baseY, trunkLen, 90, SKELETON_DEPTH); // 90° = straight up
  }

  // —————————————————————————————————————————————
  // 2) DYNAMIC BLOOM: BREATHING FRACTAL LEAVES PER TIP
  // —————————————————————————————————————————————
  const LEAF_DEPTH     = 3;
  const BASE_LEAF_SIZE = trunkLen * 0.1;  // 10% of trunk
  const FAN_ANGLES     = [-1.2, -0.6, 0, 0.6, 1.2]; // radians

  function drawLeaf(x, y, len, angle, depth, hue) {
    if (depth < 0 || len < 2) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // glowing stroke
    ctx.strokeStyle = `hsl(${hue}, 70%, 50%)`;
    ctx.lineWidth   = depth + 1;
    ctx.shadowColor = `hsla(${hue},70%,60%,0.4)`;
    ctx.shadowBlur  = 4;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -len);
    ctx.stroke();
    ctx.restore();

    // compute next tip
    const rad    = angle;
    const nx     = x + Math.sin(rad) * len;
    const ny     = y - Math.cos(rad) * len;
    const next   = len * 0.6;
    const sway   = (noise.noise2D(t + depth, depth) * 0.5);

    drawLeaf(nx, ny, next, angle - 0.5 + sway, depth - 1, hue);
    drawLeaf(nx, ny, next, angle + 0.5 + sway, depth - 1, hue);
  }

  // —————————————————————————————————————————————
  // 3) MAIN LOOP (~30FPS CAP)
  // —————————————————————————————————————————————
  let t = 0;
  const FPS_INTERVAL = 1000 / 30;
  let lastTime = 0;

  function render(now) {
    requestAnimationFrame(render);
    const delta = now - lastTime;
    if (delta < FPS_INTERVAL) return;
    lastTime = now - (delta % FPS_INTERVAL);
    t = now * 0.001;

    // clear & draw static skeleton
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(off, 0, 0);

    // compute leaf params
    const pulse    = (noise.noise2D(t, t * 0.5) * 5);
    const leafSize = BASE_LEAF_SIZE + pulse;
    const hueShift = ((noise.noise2D(t * 0.7, t * 1.3) + 1) / 2) * 60 + 80;

    // bloom a fractal fan at *each* tip
    for (const { x, y } of tipPoints) {
      FAN_ANGLES.forEach(a => {
        drawLeaf(x, y, leafSize, a + Math.sin(t + x*0.001)*0.3, LEAF_DEPTH, hueShift);
      });
    }
  }

  requestAnimationFrame(render);
});
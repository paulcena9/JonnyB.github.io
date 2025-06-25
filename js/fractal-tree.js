// js/fractal-tree.js
window.addEventListener('DOMContentLoaded', () => {
  // —————————————————————————————————————————————
  // 0) SETUP + OFFSCREEN TRUNK CACHE
  // —————————————————————————————————————————————
  const canvas = document.getElementById('tree-canvas');
  const ctx    = canvas.getContext('2d');
  const noise  = new SimplexNoise();
  let width, height, midX, baseY, trunkLen;

  // offscreen canvas for static trunk
  const off = document.createElement('canvas');
  const offCtx = off.getContext('2d');

  function init() {
    // match sizes
    width  = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width  = width;
    canvas.height = height;
    off.width  = width;
    off.height = height;

    midX     = width / 2;
    baseY    = height - 2;
    trunkLen = height * 0.5;   // 50% height

    // draw one fat trunk with a gradient
    offCtx.clearRect(0, 0, width, height);
    const g = offCtx.createLinearGradient(midX, baseY, midX, baseY - trunkLen);
    g.addColorStop(0, '#4b2e11');
    g.addColorStop(1, '#8b4513');
    offCtx.strokeStyle = g;
    offCtx.lineWidth = 16;
    offCtx.beginPath();
    offCtx.moveTo(midX, baseY);
    offCtx.lineTo(midX, baseY - trunkLen);
    offCtx.stroke();
  }
  window.addEventListener('resize', init);
  init();

  console.log('🔧 fractal-tree.js loaded');

  // —————————————————————————————————————————————
  // 1) LEAF-DRAWING (NOISE + RECURSION + GLOW)
  // —————————————————————————————————————————————
  function drawLeaf(x, y, len, angle, depth, hue) {
    if (depth < 0 || len < 2) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // glowing leaf stroke
    ctx.strokeStyle = `hsl(${hue}, 60%, 50%)`;
    ctx.lineWidth   = depth + 1;
    ctx.shadowColor = `hsla(${hue}, 60%, 70%, 0.6)`;
    ctx.shadowBlur  = 4;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -len);
    ctx.stroke();
    ctx.restore();

    // two smaller sub-leaves
    const nx = x + Math.cos(angle) * len;
    const ny = y + Math.sin(angle) * len * -1; // canvas Y downwards

    const nlen = len * 0.6;
    const sway = noise.noise2D(t + depth, depth) * 0.4; // ±0.4 rad
    drawLeaf(nx, ny, nlen, angle - 0.6 + sway, depth - 1, hue);
    drawLeaf(nx, ny, nlen, angle + 0.6 + sway, depth - 1, hue);
  }

  // —————————————————————————————————————————————
  // 2) MAIN LOOP (ONLY LEAVES EACH FRAME)
  // —————————————————————————————————————————————
  let t = 0;
  function render(now) {
    t = now * 0.001; // seconds

    // clear and copy trunk
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(off, 0, 0);

    // compute dynamic leaf parameters
    const pulse    = noise.noise2D(t, t * 0.5) * 5;        // ±5px
    const baseSize = trunkLen * 0.15 + pulse;             // ~75px ±
    const hueShift = (noise.noise2D(t * 1.2, t * 0.7) +1)/2 * 40 + 100;

    // bloom a radial fan of 5 leaves at the top
    const angles = [-1.2, -0.6, 0, 0.6, 1.2]; // in radians
    angles.forEach(a => {
      drawLeaf(midX, baseY - trunkLen, baseSize, a, 3, hueShift);
    });

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
});
// js/fractal-tree.js
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('tree-canvas');
  const ctx    = canvas.getContext('2d');
  let   t      = 0;

  // 1) Resize to container
  function resize() {
    canvas.width  = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  console.log('🔧 fractal-tree.js loaded');

  // 2) Recursive branch + leaf logic (same as before)
  function drawBranch(x, y, len, angle, depth) {
    if (depth < 0) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle * Math.PI/180);

    // trunk gradient
    const grad = ctx.createLinearGradient(0, 0, 0, -len);
    grad.addColorStop(0, '#4b2e11');
    grad.addColorStop(1, '#8b4513');
    ctx.strokeStyle = grad;
    ctx.lineWidth   = depth * 1.8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -len);
    ctx.stroke();

    ctx.translate(0, -len);
    if (depth > 0) {
      const sway = Math.sin(t + depth) * 15;
      const spread = 20 + sway;
      const nextLen = len * 0.75;
      drawBranch(0, 0, nextLen, -spread, depth - 1);
      drawBranch(0, 0, nextLen,  spread, depth - 1);
    } else {
      drawLeaves(0, 0);
    }
    ctx.restore();
  }

  function drawLeaves(x, y) {
    const count    = 8;
    const baseSize = 12 + Math.sin(t * 3) * 4;
    for (let i = 0; i < count; i++) {
      const ang = (360 / count) * i + (Math.random() * 20 - 10);
      const hue = 120 + Math.random() * 40;  // green-yellow
      drawLeafFractal(x, y, baseSize, ang, 3, `hsl(${hue}, 70%, 50%)`);
    }
  }

  function drawLeafFractal(x, y, len, angle, depth, color) {
    if (depth === 0 || len < 2) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle * Math.PI/180);
    ctx.strokeStyle = color;
    ctx.lineWidth   = depth;
    ctx.filter      = 'blur(1px)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -len);
    ctx.stroke();
    ctx.filter = 'none';
    ctx.translate(0, -len);
    const next = len * 0.6;
    drawLeafFractal(0, 0, next, -25 + Math.random()*10, depth-1, color);
    drawLeafFractal(0, 0, next,  25 + Math.random()*10, depth-1, color);
    ctx.restore();
  }

  // 3) Animation & clipping
  function render(timeMs) {
    t = timeMs * 0.001;

    // clear & clip
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.clip();

    // center trunk at 50% width, bottom of canvas
    const sx = canvas.width  * 0.5;
    const sy = canvas.height;
    const trunkLen = canvas.height * 0.3;
    drawBranch(sx, sy, trunkLen, 0, 9);

    ctx.restore();
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
});
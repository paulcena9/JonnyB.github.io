// js/fractal-tree.js
(() => {
  const canvas = document.getElementById('tree-canvas');
  const ctx    = canvas.getContext('2d');
  const noise  = new SimplexNoise();
  let  t       = 0;

  // responsive
  function resize() {
    canvas.width  = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // build a green→yellow leaf color scale
  const leafScale = chroma.scale(['#2d6a4f', '#95d5b2', '#ffc300']).mode('lch');

  // GSAP timeline to pulse the tree every 4s
  const tl = gsap.timeline({ repeat: -1, defaults: { ease: 'sine.inOut' } });
  tl.to({}, { duration: 2 }); // placeholder
  tl.to(this, {
    t: 10, // animate our time offset
    duration: 4,
    onUpdate: () => {}, // t is driving noise below
  });

  function drawBranch(x, y, len, angle, depth) {
    if (depth < 0) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((angle + noise.noise2D(x * 0.001, t) * 15) * Math.PI / 180);

    // gradient trunk
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
      const spread = 20 + noise.noise2D(depth, t * 0.5) * 20;
      const nextLen = len * 0.75;
      drawBranch(0, 0, nextLen, -spread, depth - 1);
      drawBranch(0, 0, nextLen,  spread, depth - 1);
    } else {
      drawLeaves(0, 0);
    }

    ctx.restore();
  }

  function drawLeaves(x, y) {
    const count = 8;
    const baseSize = 12 + noise.noise2D(x, t) * 6;
    for (let i = 0; i < count; i++) {
      const ang = (360 / count) * i + noise.noise3D(i, x, t) * 30;
      const size = baseSize * (0.7 + Math.random() * 0.6);
      const hue  = leafScale(Math.random()).hex();
      drawLeafFractal(x, y, size, ang, 3, hue);
    }
  }

  function drawLeafFractal(x, y, len, angle, depth, color) {
    if (depth === 0 || len < 2) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle * Math.PI/180);
    ctx.strokeStyle = color;
    ctx.lineWidth   = depth;

    // glow effect
    ctx.filter = 'blur(1.5px)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -len);
    ctx.stroke();
    ctx.filter = 'none';

    ctx.translate(0, -len);
    const next = len * 0.6;
    drawLeafFractal(0, 0, next, -25 + Math.random()*20, depth-1, color);
    drawLeafFractal(0, 0, next,  25 + Math.random()*20, depth-1, color);
    ctx.restore();
  }

  // main render
  function render(timeMs) {
    t = timeMs * 0.001; // seconds
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw one big tree in center-left
    const startX   = canvas.width * 0.3;
    const startY   = canvas.height;
    const trunkLen = canvas.height * 0.3;
    drawBranch(startX, startY, trunkLen, 0, 9);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
})();
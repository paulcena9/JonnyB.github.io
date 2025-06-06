/**
 * fractal-bg.js (Randomized Bloom Edition)
 *
 * Instead of reacting to mouse input, this version spawns fractal blooms
 * at random (x, y) coordinates on the canvas at a regular interval.
 */

(() => {
    // ——————————————————————————————————————
    // 1) SETUP CANVAS
    // ——————————————————————————————————————
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
  
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
  
    // ——————————————————————————————————————
    // 2) STORE “ACTIVE” LINE SEGMENTS FOR FADE-OUT
    // ——————————————————————————————————————
    const branches = [];
    const MAX_BRANCH_LIFETIME = 1500; // ms
  
    // ——————————————————————————————————————
    // 3) RECURSIVE BRANCH-DRAWING FUNCTION
    // ——————————————————————————————————————
    function drawBranch(x, y, length, angle, depth, color) {
      if (depth === 0 || length < 2) return;
  
      // Convert angle to radians
      const rad = (angle * Math.PI) / 180;
      const x2 = x + Math.cos(rad) * length;
      const y2 = y + Math.sin(rad) * length;
  
      // Record this line segment
      branches.push({
        x1: x,
        y1: y,
        x2: x2,
        y2: y2,
        color: color,
        startTime: performance.now(),
        depth: depth
      });
  
      // Recurse: spawn children
      const nextLen = length * (0.6 + Math.random() * 0.1); // 0.6–0.7 × parent
      const nextDepth = depth - 1;
      const childCount = 2 + Math.floor(Math.random() * 2); // 2 or 3 children
  
      for (let i = 0; i < childCount; i++) {
        // Angle offset ±(20°–45°) ± random 5°
        const offsetBase = 20 + Math.random() * 25;
        const childAngle =
          angle +
          (i % 2 === 0 ? offsetBase : -offsetBase) +
          (Math.random() * 10 - 5);
  
        // Alternate color each level
        const childColor = depth % 2 === 0 ? '#000' : '#444';
  
        drawBranch(x2, y2, nextLen, childAngle, nextDepth, childColor);
      }
    }
  
    // ——————————————————————————————————————
    // 4) SPAWN A FRACTAL “BLOOM” AT (x, y)
    // ——————————————————————————————————————
    function spawnFractal(x, y) {
      // Top‐level: length ~40–60px, depth = 5
      const initialLen = 40 + Math.random() * 20;
      const initialDepth = 5;
      // Roughly up, ±10°
      const initialAngle = -90 + (Math.random() * 20 - 10);
  
      drawBranch(x, y, initialLen, initialAngle, initialDepth, '#000');
    }
  
    // ——————————————————————————————————————
    // 5) RANDOMIZED SPAWNING LOOP
    // ——————————————————————————————————————
  
    // Interval in milliseconds between blooms (e.g., every 800ms)
    const BLOOM_INTERVAL = 800;
  
    setInterval(() => {
      // Choose a random (x, y) anywhere in the viewport:
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
  
      spawnFractal(x, y);
    }, BLOOM_INTERVAL);
  
    // ——————————————————————————————————————
    // 6) ANIMATION LOOP: FADE + REDRAW
    // ——————————————————————————————————————
    function animate() {
      const now = performance.now();
  
      // Fade background to white with low‐alpha fill
      ctx.fillStyle = 'rgba(255,255,255, 0.03)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  
      // Redraw all “live” branches with fading opacity
      for (let i = branches.length - 1; i >= 0; i--) {
        const br = branches[i];
        const age = now - br.startTime;
  
        if (age > MAX_BRANCH_LIFETIME) {
          branches.splice(i, 1);
          continue;
        }
        // Fade from α=1 (age=0) to α=0 (age=MAX_BRANCH_LIFETIME)
        const alpha = 1 - age / MAX_BRANCH_LIFETIME;
  
        ctx.strokeStyle = br.color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(br.x1, br.y1);
        ctx.lineTo(br.x2, br.y2);
        ctx.stroke();
      }
  
      ctx.globalAlpha = 1; // reset
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  })();
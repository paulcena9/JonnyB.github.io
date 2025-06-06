/**
 * fractal-bg.js
 *
 * Now only “blooms” fractals if the mouse is **outside**
 * the centered 800px column (i.e. in the white margins).
 * Each fractal spawns a small recursive “branching” of lines,
 * then fades out smoothly.
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
  
      // Record this line in branches[] for later fade-out
      branches.push({
        x1: x,
        y1: y,
        x2: x2,
        y2: y2,
        color: color,
        startTime: performance.now(),
        depth: depth
      });
  
      // Compute next‐level parameters
      const nextLen = length * (0.6 + Math.random() * 0.1); // 0.6–0.7 × parent
      const nextDepth = depth - 1;
  
      // 2 or 3 child branches randomly
      const childCount = 2 + Math.floor(Math.random() * 2); // 2 or 3
  
      for (let i = 0; i < childCount; i++) {
        // Angle offset: ±(20°–45°) ± random 5°
        const offsetBase = 20 + Math.random() * 25;
        const childAngle =
          angle +
          (i % 2 === 0 ? offsetBase : -offsetBase) +
          (Math.random() * 10 - 5);
  
        // Alternate color each level for a stark brutalist contrast
        const childColor = depth % 2 === 0 ? '#000' : '#444';
  
        drawBranch(x2, y2, nextLen, childAngle, nextDepth, childColor);
      }
    }
  
    // ——————————————————————————————————————
    // 4) SPAWN A FRACTAL “BLOOM” AROUND (x, y)
    // ——————————————————————————————————————
    function spawnFractal(x, y) {
      // Top-level length ~ 40–60 px, depth = 5
      const initialLen = 40 + Math.random() * 20;
      const initialDepth = 5;
      // Aim roughly “upward” but jitter ±10°
      const initialAngle = -90 + (Math.random() * 20 - 10);
  
      // Primary color black
      drawBranch(x, y, initialLen, initialAngle, initialDepth, '#000');
    }
  
    // ——————————————————————————————————————
    // 5) MOUSEMOVE → ONLY SPAWN WHEN OUTSIDE CONTENT EDGES
    // ——————————————————————————————————————
    let containerLeft = 0;
    let containerRight = window.innerWidth;
  
    function updateContainerBounds() {
      // Assume first .section-container is your centered 800px block
      const container = document.querySelector('.section-container');
      if (!container) return;
  
      const rect = container.getBoundingClientRect();
      containerLeft = rect.left;
      containerRight = rect.left + rect.width;
    }
    // Update once on load and again whenever you resize
    window.addEventListener('resize', updateContainerBounds);
    updateContainerBounds();
  
    window.addEventListener('mousemove', (evt) => {
      const x = evt.clientX;
      const y = evt.clientY;
  
      // Only spawn if cursor is **left** of containerLeft OR **right** of containerRight
      // (i.e. anywhere in those white margin columns)
      if (x < containerLeft || x > containerRight) {
        spawnFractal(x, y);
      }
    });
  
    // ——————————————————————————————————————
    // 6) ANIMATION LOOP: FADE + REDRAW
    // ——————————————————————————————————————
    function animate() {
      const now = performance.now();
  
      // 6a) Fade background to WHITE by drawing a low-alpha rectangle
      ctx.fillStyle = 'rgba(255,255,255, 0.03)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  
      // 6b) Redraw all “live” branches at reduced opacity
      for (let i = branches.length - 1; i >= 0; i--) {
        const br = branches[i];
        const age = now - br.startTime;
  
        if (age > MAX_BRANCH_LIFETIME) {
          // Too old → remove from array
          branches.splice(i, 1);
          continue;
        }
        // Fade from α=1 at age=0 to α=0 at age=MAX_BRANCH_LIFETIME
        const alpha = 1 - age / MAX_BRANCH_LIFETIME;
  
        ctx.strokeStyle = br.color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(br.x1, br.y1);
        ctx.lineTo(br.x2, br.y2);
        ctx.stroke();
      }
  
      ctx.globalAlpha = 1; // reset for next frame
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  })();
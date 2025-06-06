/**
 * fractal-bg.js
 *
 * Creates a full-screen Canvas that listens for mouse movement near
 * the left/right edges of a centered 800px column. Whenever the
 * cursor crosses into those “edge zones,” we draw a small recursive
 * fractal tree at that (x,y), then let it fade via low-alpha clearing.
 */

(() => {
    // 1) SETUP CANVAS
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
  
    // Resize canvas to fill viewport
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
  
    // 2) KEEP A LIST OF “ACTIVE” BRANCHES FOR FADE-OUT
    const branches = [];
    const MAX_BRANCH_LIFETIME = 1500; // ms
  
    // 3) UTILITY: DRAW A RECURSIVE BRANCH
    /**
     * drawBranch(x, y, length, angle, depth, color)
     *   - x,y: starting point
     *   - length: pixels for this segment
     *   - angle: in degrees (0 = right →; 90 = down ↓; -90 = up ↑)
     *   - depth: recursion depth
     *   - color: line color (#000 or #fff or any)
     */
    function drawBranch(x, y, length, angle, depth, color) {
      if (depth === 0 || length < 2) return;
  
      // Convert angle to radians
      const rad = (angle * Math.PI) / 180;
      const x2 = x + Math.cos(rad) * length;
      const y2 = y + Math.sin(rad) * length;
  
      // Record this line segment in the global branches array:
      branches.push({
        x1: x,
        y1: y,
        x2: x2,
        y2: y2,
        color: color,
        startTime: performance.now(),
        depth: depth
      });
  
      // Recurse: spawn 2–3 child branches at smaller lengths & rotated angles
      const nextLen = length * (0.6 + Math.random() * 0.1); // 0.6–0.7 of parent
      const nextDepth = depth - 1;
  
      // Choose 2 or 3 children randomly
      const childCount = 2 + Math.floor(Math.random() * 2); // 2 or 3
  
      for (let i = 0; i < childCount; i++) {
        // Angle offset = ±(20°–45°) ± random 5°
        const offsetBase = 20 + Math.random() * 25;
        const childAngle = angle + (i % 2 === 0 ? offsetBase : -offsetBase) + (Math.random() * 10 - 5);
  
        // Alternate color each level
        const childColor = (depth % 2 === 0) ? '#000' : '#444';
  
        drawBranch(x2, y2, nextLen, childAngle, nextDepth, childColor);
      }
    }
  
    // 4) SPAWN A FRACTAL AT (x, y)
    function spawnFractal(x, y) {
      // Top‐level: length ~ 40px, depth 5
      const initialLen = 40 + Math.random() * 20; // 40–60 px
      const initialDepth = 5;
      const initialAngle = -90 + (Math.random() * 20 - 10); // roughly straight up
  
      // Primary color is black
      drawBranch(x, y, initialLen, initialAngle, initialDepth, '#000');
    }
  
    // 5) MOUSEMOVE HANDLER: CHECK “EDGE ZONES”
    window.addEventListener('mousemove', (evt) => {
      const x = evt.clientX;
      const y = evt.clientY;
  
      // Compute left/right edges of a centered 800px container
      const containerWidth = 800;
      const leftEdge = (window.innerWidth - containerWidth) / 2;
      const rightEdge = leftEdge + containerWidth;
  
      // If mouse is within 20px of left or right edge, spawn fractal
      const EDGE_THRESHOLD = 20;
      if (Math.abs(x - leftEdge) < EDGE_THRESHOLD || Math.abs(x - rightEdge) < EDGE_THRESHOLD) {
        spawnFractal(x, y);
      }
    });
  
    // 6) ANIMATION LOOP: FADE & REDRAW
    function animate() {
      const now = performance.now();
  
      // 6a) Clear with low-alpha black to fade old branches over time
      ctx.fillStyle = 'rgba(255,255,255, 0.03)'; // white background fade
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  
      // 6b) Draw each “live” branch segment with computed opacity
      for (let i = branches.length - 1; i >= 0; i--) {
        const br = branches[i];
        const age = now - br.startTime;
  
        if (age > MAX_BRANCH_LIFETIME) {
          // Remove old branches
          branches.splice(i, 1);
          continue;
        }
        // Fade from full α=1 at age=0 to α=0 at age=MAX_BRANCH_LIFETIME
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
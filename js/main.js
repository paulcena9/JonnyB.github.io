// ------------------------------------------------------------
// SCROLL PROGRESS BAR + PARALLAX-ON-SCROLL
// ------------------------------------------------------------
(() => {
    let ticking = false;
  
    function updateParallax() {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = (scrollTop / scrollHeight) * 100;
      document.getElementById('progress-bar').style.width = progress + '%';
  
      document.querySelectorAll('.parallax-slow').forEach(el => {
        el.style.transform = `translate(-50%, -50%) translateY(${scrollTop * 0.02}px) rotate(${scrollTop * 0.01}deg)`;
      });
      document.querySelectorAll('.parallax-medium').forEach(el => {
        el.style.transform = `translate(-50%, -50%) translateY(${scrollTop * 0.04}px) rotate(-${scrollTop * 0.015}deg)`;
      });
      document.querySelectorAll('.parallax-fast').forEach(el => {
        el.style.transform = `translate(-50%, -50%) translateY(${scrollTop * 0.06}px) rotate(${scrollTop * 0.02}deg)`;
      });
  
      ticking = false;
    }
  
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    });
  })();
  
  // ------------------------------------------------------------
  // INTERSECTION OBSERVER FOR FADE/SLIDE-IN EFFECT
  // ------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15
    };
  
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Add classes to everything we want to fade/slide in
          entry.target.classList.add('in-view');
        }
      });
    }, options);
  
    // Observe containers, headings, paragraphs, etc.
    document.querySelectorAll('.section-container').forEach(el => observer.observe(el));
    document.querySelectorAll('h1, h2, h3').forEach(el => observer.observe(el));
    document.querySelectorAll('p').forEach(el => observer.observe(el));
    document.querySelectorAll('#intro ul').forEach(el => observer.observe(el));
    document.querySelectorAll('.writing-entry').forEach(el => observer.observe(el));
    document.querySelectorAll('.project-card').forEach(el => observer.observe(el));
    document.querySelectorAll('.contact-btn').forEach(el => observer.observe(el));
    document.querySelectorAll('footer p').forEach(el => observer.observe(el));

    // Initialize brain modal functionality
    initBrainModal();
  });

  // ------------------------------------------------------------
  // BRAIN MODAL FUNCTIONALITY
  // ------------------------------------------------------------
  let brainViewer = null;
  let brainModal = null;
  let isP5Paused = false;
  let brainPreloadPromise = null; // Store the preload promise

  async function initBrainModal() {
    brainModal = document.getElementById('brain-modal');
    const openBtn = document.getElementById('open-brain');
    const closeBtn = document.getElementById('brain-close');
    const backdrop = document.querySelector('.brain-modal-backdrop');

    // Brain navigation buttons
    const leftBtn = document.getElementById('brain-left');
    const rightBtn = document.getElementById('brain-right');
    const upBtn = document.getElementById('brain-up');
    const downBtn = document.getElementById('brain-down');

    if (!brainModal || !openBtn) {
      console.warn('Brain modal elements not found');
      return;
    }

    // Start preloading the brain model in the background
    // Delay slightly to prioritize initial page render
    setTimeout(() => {
      preloadBrainModel();
    }, 1000);

    // Open modal handler
    openBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await openBrainModal();
    });

    // Close modal handlers
    closeBtn?.addEventListener('click', closeBrainModal);
    backdrop?.addEventListener('click', closeBrainModal);

    // Brain navigation handlers
    leftBtn?.addEventListener('click', () => brainViewer?.changeLayer(-1));
    rightBtn?.addEventListener('click', () => brainViewer?.changeLayer(1));
    upBtn?.addEventListener('click', () => brainViewer?.toggleHemisphere('lh'));
    downBtn?.addEventListener('click', () => brainViewer?.toggleHemisphere('rh'));

    // ESC key handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && brainModal?.classList.contains('active')) {
        e.preventDefault();
        closeBrainModal();
      }
    });
  }

  async function preloadBrainModel() {
    // Start loading the brain model in the background
    if (!brainPreloadPromise) {
      brainPreloadPromise = (async () => {
        try {
          console.log('Starting background preload of brain model...');

          // Create a hidden container for preloading
          const preloadContainer = document.createElement('div');
          preloadContainer.style.cssText = `
            position: absolute;
            left: -9999px;
            width: 1px;
            height: 1px;
            overflow: hidden;
          `;
          document.body.appendChild(preloadContainer);

          // Dynamic import and initialize the brain viewer
          const { default: BrainViewer } = await import('./brain-modal.js');
          brainViewer = new BrainViewer(preloadContainer);
          await brainViewer.init();

          // Clean up the preload container but keep the viewer instance
          document.body.removeChild(preloadContainer);
          brainViewer.stopAnimation(); // Stop rendering while hidden

          console.log('Brain model preloaded successfully');
        } catch (error) {
          console.error('Error preloading brain model:', error);
          // Reset so it can be attempted again on click
          brainPreloadPromise = null;
          brainViewer = null;
        }
      })();
    }
    return brainPreloadPromise;
  }

  async function openBrainModal() {
    if (!brainModal) return;

    try {
      // Pause p5.js animation
      pauseP5();

      // Show modal and loading indicator
      brainModal.classList.add('active');
      document.body.style.overflow = 'hidden';

      const loadingEl = document.getElementById('brain-loading');
      const container = document.getElementById('brain-container');

      // Check if brain viewer is already loaded or being loaded
      if (brainViewer) {
        // Brain is already fully loaded, just move it to the modal container
        moveViewerToContainer(container);
        brainViewer.startAnimation();
        if (loadingEl) loadingEl.classList.remove('active');
      } else if (brainPreloadPromise) {
        // Brain is still loading in the background, show loading and wait
        if (loadingEl) loadingEl.classList.add('active');
        await brainPreloadPromise;

        if (brainViewer) {
          moveViewerToContainer(container);
          brainViewer.startAnimation();
        } else {
          // Preload failed, try loading directly
          const { default: BrainViewer } = await import('./brain-modal.js');
          brainViewer = new BrainViewer(container);
          await brainViewer.init();
        }
        if (loadingEl) loadingEl.classList.remove('active');
      } else {
        // No preload started (shouldn't happen), load directly
        if (loadingEl) loadingEl.classList.add('active');
        const { default: BrainViewer } = await import('./brain-modal.js');
        brainViewer = new BrainViewer(container);
        await brainViewer.init();
        if (loadingEl) loadingEl.classList.remove('active');
      }

    } catch (error) {
      console.error('Error opening brain modal:', error);
      const loadingEl = document.getElementById('brain-loading');
      if (loadingEl) loadingEl.classList.remove('active');
      alert('Failed to load brain viewer. Please try again.');
      closeBrainModal();
    }
  }

  function closeBrainModal() {
    if (!brainModal) return;

    // Hide modal
    brainModal.classList.remove('active');
    document.body.style.overflow = '';

    // Stop brain animation to save resources
    if (brainViewer) {
      brainViewer.stopAnimation();
    }

    // Resume p5.js animation
    resumeP5();
  }

  function moveViewerToContainer(container) {
    // Move the renderer canvas to the new container
    if (brainViewer && brainViewer.renderer && brainViewer.renderer.domElement) {
      container.appendChild(brainViewer.renderer.domElement);
      brainViewer.container = container;
      brainViewer.onWindowResize(); // Update size for new container
    }
  }

  function pauseP5() {
    // Pause the p5.js tree animation by setting a global flag
    if (typeof window.p5Instance !== 'undefined' && window.p5Instance.noLoop) {
      window.p5Instance.noLoop();
      isP5Paused = true;
    }
  }

  function resumeP5() {
    // Resume the p5.js tree animation
    if (isP5Paused && typeof window.p5Instance !== 'undefined' && window.p5Instance.loop) {
      window.p5Instance.loop();
      isP5Paused = false;
    }
  }
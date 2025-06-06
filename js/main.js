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
  });
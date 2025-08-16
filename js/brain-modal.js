import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

// Brain viewer class for modal integration
class BrainViewer {
  constructor(container) {
    this.container = container;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.meshes = {};
    this.layerIndex = 0;
    this.layers = ['face', 'pial', 'white'];
    this.lhEnabled = true;
    this.rhEnabled = true;
    this.loadingPhase = 0; // 0: face only, 1: + pial, 2: all loaded
    this.backgroundLoading = false;
    this.animationId = null;
    this.isInitialized = false;
    
    // Bind methods
    this.animate = this.animate.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  async init() {
    if (this.isInitialized) return;

    const MODEL_URL = 'assets/model.glb';
    
    // Setup renderer with transparent background
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      premultipliedAlpha: false
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0); // Transparent clear color
    this.container.appendChild(this.renderer.domElement);

    // Setup scene (no background - using blurred portfolio background)
    this.scene = new THREE.Scene();

    // Setup camera
    this.camera = new THREE.PerspectiveCamera(
      50, 
      this.container.clientWidth / this.container.clientHeight, 
      0.01, 
      100
    );
    this.camera.position.set(0, 0.6, 1.8);
    this.camera.lookAt(0, 0.2, 0);

    // Setup controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.target.set(0, 0.2, 0);

    // Setup lighting
    this.scene.add(new THREE.AmbientLight(0x606060, 0.6));

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(1, 1, 0.5);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffeedd, 0.4);
    fillLight.position.set(-1, 0.5, 1);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
    rimLight.position.set(-0.5, 1, -1);
    this.scene.add(rimLight);

    // Setup loaders
    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(draco);
    loader.setMeshoptDecoder(MeshoptDecoder);

    // Load model with progressive loading strategy
    try {
      const gltf = await new Promise((resolve, reject) => {
        loader.load(MODEL_URL, resolve, undefined, reject);
      });

      const root = gltf.scene || gltf.scenes[0];
      this.scene.add(root);

      // Map all meshes but only show face initially
      root.traverse(obj => {
        if (!obj.isMesh) return;
        const name = obj.name.toLowerCase();

        if (name === 'lh_white_corrected') {
          this.meshes.lh_white = obj;
          obj.visible = false; // Hide initially
        } else if (name === 'rh_white_corrected') {
          this.meshes.rh_white = obj;
          obj.visible = false; // Hide initially
        } else if (name.startsWith('lh_pial')) {
          this.meshes.lh_pial = obj;
          obj.visible = false; // Hide initially
        } else if (name.startsWith('rh_pial')) {
          this.meshes.rh_pial = obj;
          obj.visible = false; // Hide initially
        } else if (name === 'head_hollow_scooped') {
          this.meshes.face = obj;
          obj.visible = true; // Show face immediately
        }
      });

      // Face is loaded and visible - user can start interacting
      this.loadingPhase = 0;
      this.frame(root);
      this.startAnimation();

      // Start background loading of remaining meshes
      this.startBackgroundLoading();

    } catch (err) {
      console.error('Failed to load brain model:', err);
      throw new Error(`Failed to load brain.glb → ${err.message}`);
    }

    // Add event listeners
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('keydown', this.onKeyDown);

    this.isInitialized = true;
  }

  frame(object) {
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    const dist = maxDim * 1.7;
    
    this.camera.position.set(center.x, center.y, center.z + dist);
    this.camera.near = dist / 100;
    this.camera.far = dist * 100;
    this.camera.updateProjectionMatrix();
    this.controls.target.copy(center);
    this.controls.update();
  }

  changeLayer(delta) {
    this.layerIndex = (this.layerIndex + delta + this.layers.length) % this.layers.length;
    this.applyLayerVisibility();
  }

  startBackgroundLoading() {
    if (this.backgroundLoading) return;
    this.backgroundLoading = true;

    // Simulate progressive loading phases
    setTimeout(() => {
      // Phase 1: Pial surfaces become available
      this.loadingPhase = 1;
      console.log('Pial surfaces ready');
      
      setTimeout(() => {
        // Phase 2: White matter becomes available
        this.loadingPhase = 2;
        console.log('All brain layers ready');
      }, 1000); // Additional 1s delay for white matter
    }, 500); // 500ms delay for pial surfaces
  }

  applyLayerVisibility() {
    const layer = this.layers[this.layerIndex];
    
    // Reset hemisphere toggles when layer changes
    if (layer !== 'white') {
      this.lhEnabled = this.rhEnabled = true;
    }

    // Hide all meshes
    Object.values(this.meshes).forEach(m => m.visible = false);

    // Show relevant meshes based on loading phase and current layer
    switch (layer) {
      case 'face':
        if (this.meshes.face) this.meshes.face.visible = true;
        break;
      case 'pial':
        // Only show if pial surfaces are loaded
        if (this.loadingPhase >= 1) {
          if (this.meshes.lh_pial) this.meshes.lh_pial.visible = true;
          if (this.meshes.rh_pial) this.meshes.rh_pial.visible = true;
        } else {
          // Fall back to face if pial not ready
          if (this.meshes.face) this.meshes.face.visible = true;
          this.showLoadingMessage('pial');
        }
        break;
      case 'white':
        // Only show if white matter is loaded
        if (this.loadingPhase >= 2) {
          if (this.lhEnabled && this.meshes.lh_white) this.meshes.lh_white.visible = true;
          if (this.rhEnabled && this.meshes.rh_white) this.meshes.rh_white.visible = true;
        } else {
          // Fall back to best available layer
          if (this.loadingPhase >= 1) {
            if (this.meshes.lh_pial) this.meshes.lh_pial.visible = true;
            if (this.meshes.rh_pial) this.meshes.rh_pial.visible = true;
          } else {
            if (this.meshes.face) this.meshes.face.visible = true;
          }
          this.showLoadingMessage('white');
        }
        break;
    }

    // Update UI visibility for hemisphere controls
    const upArrow = document.getElementById('brain-up');
    const downArrow = document.getElementById('brain-down');
    if (upArrow && downArrow) {
      upArrow.style.display = layer === 'white' ? 'flex' : 'none';
      downArrow.style.display = layer === 'white' ? 'flex' : 'none';
    }
  }

  showLoadingMessage(layer) {
    // Briefly show a loading message for unavailable layers
    const loadingEl = document.getElementById('brain-loading');
    if (loadingEl) {
      loadingEl.innerHTML = `
        <div class="brain-spinner"></div>
        <p>Loading ${layer} layer...</p>
      `;
      loadingEl.classList.add('active');
      
      // Hide after 1 second
      setTimeout(() => {
        loadingEl.classList.remove('active');
      }, 1000);
    }
  }

  toggleHemisphere(side) {
    if (side === 'lh') {
      this.lhEnabled = !this.lhEnabled;
    } else if (side === 'rh') {
      this.rhEnabled = !this.rhEnabled;
    }
    this.applyLayerVisibility();
  }

  startAnimation() {
    if (this.animationId) return;
    this.animate();
  }

  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  animate() {
    this.animationId = requestAnimationFrame(this.animate);
    if (this.controls) this.controls.update();
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  onWindowResize() {
    if (!this.isInitialized || !this.container) return;
    
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  onKeyDown(event) {
    if (!this.isInitialized) return;
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.changeLayer(-1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.changeLayer(1);
        break;
      case 'ArrowUp':
        if (this.layerIndex === 2) {
          event.preventDefault();
          this.toggleHemisphere('lh');
        }
        break;
      case 'ArrowDown':
        if (this.layerIndex === 2) {
          event.preventDefault();
          this.toggleHemisphere('rh');
        }
        break;
    }
  }

  dispose() {
    this.stopAnimation();
    
    // Remove event listeners
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('keydown', this.onKeyDown);

    // Dispose Three.js resources
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }

    if (this.scene) {
      this.scene.traverse(object => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      this.scene.clear();
      this.scene = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
      if (this.container && this.renderer.domElement) {
        this.container.removeChild(this.renderer.domElement);
      }
      this.renderer = null;
    }

    this.camera = null;
    this.meshes = {};
    this.loadingPhase = 0;
    this.backgroundLoading = false;
    this.isInitialized = false;
  }
}

export default BrainViewer;
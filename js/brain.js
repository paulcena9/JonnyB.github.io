import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

// Paths & constants
const MODEL_URL = '/assets/brain.glb';
const BG_COLOR  = 0xffffff;   // paper white
const canvasContainer = document.getElementById('app');

// Three.js boilerplate
const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false });
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
canvasContainer.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(BG_COLOR);

const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.01, 100);
camera.position.set(0, 0.45, 1.2);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lighting (neutral, looks good on white bg)
const hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.9);
scene.add(hemi);

// GLTF + compression loaders
const loader = new GLTFLoader();
const draco = new DRACOLoader();
draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
loader.setDRACOLoader(draco);
GLTFLoader.setMeshoptDecoder(MeshoptDecoder);

// State vars
let meshes = {};                // map: key→mesh
let layerIndex = 0;             // 0: face, 1: pial, 2: white
const layers = ['face', 'pial', 'white'];
let lhEnabled = true, rhEnabled = true; // hemisphere toggles for white layer

// UI elements
const btnLeft  = document.getElementById('left');
const btnRight = document.getElementById('right');
const btnUp    = document.getElementById('up');
const btnDown  = document.getElementById('down');

btnLeft .onclick = () => changeLayer(-1);
btnRight.onclick = () => changeLayer(+1);
btnUp   .onclick = () => toggleHemisphere('lh');
btnDown .onclick = () => toggleHemisphere('rh');

// keyboard support
window.addEventListener('keydown', (e) => {
  switch(e.key){
    case 'ArrowLeft': changeLayer(-1); break;
    case 'ArrowRight': changeLayer(+1); break;
    case 'ArrowUp': if(layerIndex===2) toggleHemisphere('lh'); break;
    case 'ArrowDown': if(layerIndex===2) toggleHemisphere('rh'); break;
  }
});

// Load model
loader.load(
  MODEL_URL,
  (gltf) => {
    const root = gltf.scene || gltf.scenes[0];
    scene.add(root);

    // Grab meshes by heuristic name match
    // --- Map meshes by exact names discovered from modelcheck.py ---
    root.traverse(obj => {
      if (!obj.isMesh) return;
      const name = obj.name.toLowerCase();

      // exact names from your GLB
      if (name === 'lh_white_corrected') {
        meshes.lh_white = obj;
      } else if (name === 'rh_white_corrected') {
        meshes.rh_white = obj;
      } else if (name.startsWith('lh_pial')) { // matches lh_pial or lh_pial.001
        meshes.lh_pial = obj;
      } else if (name.startsWith('rh_pial')) {
        meshes.rh_pial = obj;
      } else if (name === 'head_hollow_scooped') {
        meshes.face = obj; // full head / skin mesh
      }
    });

    applyLayerVisibility();

    // Frame whole model
    frame(root);
    animate();
  },
  undefined,
  (err)=> alert('Failed to load brain.glb → '+err.message)
);

function frame(object){
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3(); box.getSize(size);
  const center = new THREE.Vector3(); box.getCenter(center);
  const maxDim = Math.max(size.x,size.y,size.z);
  const dist = maxDim*1.7;
  camera.position.set(center.x, center.y, center.z+dist);
  camera.near = dist/100; camera.far = dist*100; camera.updateProjectionMatrix();
  controls.target.copy(center);
  controls.update();
}

function changeLayer(delta){
  layerIndex = (layerIndex + delta + layers.length) % layers.length;
  applyLayerVisibility();
}

function applyLayerVisibility(){
  const layer = layers[layerIndex];
  // reset hemisphere toggles when layer changes
  if(layer!=='white'){ lhEnabled = rhEnabled = true; }

  // hide all
  Object.values(meshes).forEach(m=> m.visible = false);

  switch(layer){
    case 'face':
      meshes.face && (meshes.face.visible = true);
      break;
    case 'pial':
      meshes.lh_pial && (meshes.lh_pial.visible = true);
      meshes.rh_pial && (meshes.rh_pial.visible = true);
      break;
    case 'white':
      if(lhEnabled && meshes.lh_white) meshes.lh_white.visible = true;
      if(rhEnabled && meshes.rh_white) meshes.rh_white.visible = true;
      break;
  }

  // Toggle arrow vis
  btnUp.style.display   = layer==='white' ? 'flex' : 'none';
  btnDown.style.display = layer==='white' ? 'flex' : 'none';
}

function toggleHemisphere(side){
  if(side==='lh'){ lhEnabled = !lhEnabled; }
  else if(side==='rh'){ rhEnabled = !rhEnabled; }
  applyLayerVisibility();
}

// Render loop
function animate(){
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene,camera);
}

// Resize
window.addEventListener('resize', ()=>{
  camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
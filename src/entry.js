import { WebGLRenderer, PerspectiveCamera, Scene, Vector3 } from 'three';
import * as CANNON from 'cannon'
import * as TWEEN from '@tweenjs/tween.js'

import SeedScene from './objects/Scene.js';
import './fonts.css'
import './style.css'

let scene
let camera
let renderer
let seedScene
let world
let ui

const timeStep=1/60

function resize () {
  const windowResizeHanlder = () => { 
    const { innerHeight, innerWidth } = window;
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  };
  windowResizeHanlder();
  window.addEventListener('resize', windowResizeHanlder);
}


initCannon()
initThree()
animate()
resize()

function initCannon() {
  world = new CANNON.World();
  world.gravity.set(0, -120, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 1;

  world.defaultContactMaterial.contactEquationStiffness = 1e8;
  world.defaultContactMaterial.contactEquationRelaxation = 10;
}

function initThree () {
  scene = new Scene();
  camera = new PerspectiveCamera();
  renderer = new WebGLRenderer({
    antialias: true,
    alpha: true
  });
  seedScene = new SeedScene(camera, world);

  // scene
  scene.add(seedScene);

  // camera
  camera.position.set(6,3,-10);
  camera.lookAt(new Vector3(0,0,0));

  // renderer
  renderer.setPixelRatio(window.devicePixelRatio);

  // dom
  document.body.style.margin = 0;
  document.body.appendChild( renderer.domElement );
}

function updatePhysics() {
  // Step the physics world
  world.step(timeStep);
}

function updateTween(timeStamp) {
  TWEEN.update(timeStamp)
}

function animate () {
  const onAnimationFrameHandler = (timeStamp) => {
    renderer.render(scene, camera);
    updatePhysics()
    updateTween(timeStamp)
    seedScene.update && seedScene.update(timeStamp);
    window.requestAnimationFrame(onAnimationFrameHandler);
  }
  window.requestAnimationFrame(onAnimationFrameHandler);  
}

window.world = world
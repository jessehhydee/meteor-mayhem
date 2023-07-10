import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import openSimplexNoise from 'https://cdn.skypack.dev/open-simplex-noise';

const container = document.querySelector('.container');
const canvas    = document.querySelector('.canvas');

let
sizes,
scene,
camera,
controls,
renderer,
noise,
rocket,
sparkMeshes;

const setScene = async () => {

  sizes = {
    width:  container.offsetWidth,
    height: container.offsetHeight
  };

  scene             = new THREE.Scene();
  scene.background  = new THREE.Color(0xf5e6d3);

  camera = new THREE.PerspectiveCamera(60, sizes.width / sizes.height, 1, 300);
  camera.position.set(0, 0, 30);
  
  renderer = new THREE.WebGLRenderer({
    canvas:     canvas,
    antialias:  false
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  scene.add(new THREE.HemisphereLight(0xffffbb, 0x080820, 1.7));

  sparkMeshes = [];
  noise = openSimplexNoise.makeNoise3D(Date.now());

  setControls();
  createRocket();
  createAsteroid();
  resize();
  listenTo();
  render();

}

const setControls = () => {
  controls                = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping  = true;
};

const createRocket = async () => {

  rocket = new THREE.Object3D();

  const coneGeo = new THREE.ConeGeometry(1.4, 1.4, 4);
  const coneMat = new THREE.MeshStandardMaterial({
    color: 0xFF4B5A
  });
  const coneMesh = new THREE.Mesh(coneGeo, coneMat);
  coneMesh.position.set(0, 0, -10.7);
  coneMesh.rotation.x = -Math.PI / 2;
  coneMesh.rotation.y = Math.PI /4;

  const centerGeo = new THREE.BufferGeometry()
  const centerVertices = new Float32Array([
    // front
    -1, 1, 0, -1, -1, 0, 1, -1, 0,
    1, -1, 0, -1, 1, 0, 1, 1, 0,
    // back
    -2, 2, -4, -2, -2, -4, 2, -2, -4,
    2, -2, -4, -2, 2, -4, 2, 2, -4,
    // left
    -1, 1, 0, -1, -1, 0, -2, -2, -4,
    -2, -2, -4, -1, 1, 0, -2, 2, -4,
    // right
    1, 1, 0, 1, -1, 0, 2, -2, -4,
    1, 1, 0, 2, -2, -4, 2, 2, -4,
    // top
    -1, 1, 0, 1, 1, 0, -2, 2, -4,
    1, 1, 0, -2, 2, -4, 2, 2, -4,
    // bottom
    -1, -1, 0, 1, -1, 0, -2, -2, -4,
    1, -1, 0, -2, -2, -4, 2, -2, -4
  ])

  const centerAttr = new THREE.BufferAttribute(centerVertices, 3)
  centerGeo.setAttribute('position', centerAttr)
  const centerMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide
  });

  const centerMesh = new THREE.Mesh(centerGeo, centerMat);
  centerMesh.position.set(0, 0, -10);
  centerMesh.rotation.y = Math.PI;

  const baseGeo = new THREE.BufferGeometry()
  const baseVertices = new Float32Array([
    // front
    -1, 1, 0, -1, -1, 0, 1, -1, 0,
    1, -1, 0, -1, 1, 0, 1, 1, 0,
    // back
    -2, 2, -6, -2, -2, -6, 2, -2, -6,
    2, -2, -6, -2, 2, -6, 2, 2, -6,
    // left
    -1, 1, 0, -1, -1, 0, -2, -2, -6,
    -2, -2, -6, -1, 1, 0, -2, 2, -6,
    // right
    1, 1, 0, 1, -1, 0, 2, -2, -6,
    1, 1, 0, 2, -2, -6, 2, 2, -6,
    // top
    -1, 1, 0, 1, 1, 0, -2, 2, -6,
    1, 1, 0, -2, 2, -6, 2, 2, -6,
    // bottom
    -1, -1, 0, 1, -1, 0, -2, -2, -6,
    1, -1, 0, -2, -2, -6, 2, -2, -6
  ])

  const baseAttr = new THREE.BufferAttribute(baseVertices, 3)
  baseGeo.setAttribute('position', baseAttr)
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xFF4B5A,
    side: THREE.DoubleSide
  });

  const baseMesh = new THREE.Mesh(baseGeo, baseMat);

  const engineGeo = new THREE.BoxGeometry(2, 2, 4);
  const engineMat = new THREE.MeshStandardMaterial({
    color: 0x3D1229
  });
  const engineMesh = new THREE.Mesh(engineGeo, engineMat);
  engineMesh.position.set(0, 0, 0);

  const exhaustGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.3, 10); 
  const exhaustMat = new THREE.MeshStandardMaterial({
    color: 0x464646
  }); 
  const exhaustMesh = new THREE.Mesh(exhaustGeo, exhaustMat);
  exhaustMesh.position.set(0, 0, 2.1);
  exhaustMesh.rotation.x = Math.PI / 2;

  const legGeo = new THREE.BufferGeometry()
  const legVertices = new Float32Array([
    // front
    -0.1, 0.4, -1, -0.1, -0.4, 0, 0.1, -0.4, 0,
    0.1, -0.4, 0, -0.1, 0.4, -1, 0.1, 0.4, -1,
    // back
    -0.1, 0.4, -3, -0.1, -0.4, -2, 0.1, -0.4, -2,
    0.1, -0.4, -2, -0.1, 0.4, -3, 0.1, 0.4, -3,
    // left
    -0.1, 0.4, -1, -0.1, -0.4, 0, -0.1, -0.4, -2,
    -0.1, -0.4, -2, -0.1, 0.4, -1, -0.1, 0.4, -3,
    // right
    0.1, 0.4, -1, 0.1, -0.4, 0, 0.1, -0.4, -2,
    0.1, 0.4, -1, 0.1, -0.4, -2, 0.1, 0.4, -3,
    // // top
    -0.1, 0.4, -1, 0.1, 0.4, -1, -0.1, 0.4, -3,
    0.1, 0.4, -1, -0.1, 0.4, -3, 0.1, 0.4, -3,
    // // bottom
    -0.1, -0.4, 0, 0.1, -0.4, 0, -0.1, -0.4, -2,
    0.1, -0.4, 0, -0.1, -0.4, -2, 0.1, -0.4, -2
  ])

  const legAttr = new THREE.BufferAttribute(legVertices, 3)
  legGeo.setAttribute('position', legAttr)
  const legMat = new THREE.MeshStandardMaterial({
    color: 0xFF4B5A,
    side: THREE.DoubleSide
  });

  const legMeshOne = new THREE.Mesh(legGeo, legMat);
  legMeshOne.position.set(0, -1.4, 3.6);
  const legMeshTwo = new THREE.Mesh(legGeo, legMat);
  legMeshTwo.position.set(-1.4, 0, 3.6);
  legMeshTwo.rotation.z = -Math.PI / 2;
  const legMeshThree = new THREE.Mesh(legGeo, legMat);
  legMeshThree.position.set(0, 1.4, 3.6);
  legMeshThree.rotation.z = Math.PI;
  const legMeshFour = new THREE.Mesh(legGeo, legMat);
  legMeshFour.position.set(1.4, 0, 3.6);
  legMeshFour.rotation.z = Math.PI / 2;

  const sparkGeo = new THREE.BoxGeometry(1, 1, 1);
  const sparkMat = new THREE.MeshStandardMaterial({
    color: 0xF98C00
  });
  for(let i = 0; i < 4; i++) {
    sparkMeshes[i] = new THREE.Mesh(sparkGeo, sparkMat);
    sparkMeshes[i].position.set(0, 0, 3 + (i * 2));
    rocket.add(sparkMeshes[i]);
  }

  rocket.add(
    coneMesh,
    centerMesh,
    baseMesh,
    engineMesh,
    exhaustMesh,
    legMeshOne,
    legMeshTwo,
    legMeshThree,
    legMeshFour,
  );
  rocket.rotation.x = Math.PI / 2;
  scene.add(rocket);

}

// https://discourse.threejs.org/t/change-vertex-position-over-time/31309/3
const createAsteroid = () => {

  const asteroidGeo = new THREE.IcosahedronGeometry(1, 0);
  const vec         = new THREE.Vector3();
  const pos         = asteroidGeo.attributes.position;

  for(let i = 0; i < pos.count; i++) {

    vec
      .fromBufferAttribute(pos, i)
      .normalize();
    vec
      .copy(vec)
      .multiplyScalar(3)
      .addScaledVector(vec, noise(vec.x, vec.y, vec.z));
      
    pos.setXYZ(i, vec.x, vec.y, vec.z);

  }

  asteroidGeo.computeVertexNormals();
  pos.needsUpdate = true;

  const asteroidMat = new THREE.MeshStandardMaterial({
    color: 0xF98C00
  });

  const asteroidMesh = new THREE.Mesh(asteroidGeo, asteroidMat);
  asteroidMesh.position.set(-4, 0, 0);

  scene.add(asteroidMesh);

}

const resize = () => {

  sizes = {
    width:  container.offsetWidth,
    height: container.offsetHeight
  };

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);

}

const listenTo = () => {
  window.addEventListener('resize', resize.bind(this));
}

const flamesAnimation = () => {

  for(const spark of sparkMeshes) {
    if(spark.position.z < 10) {
      spark.position.z += 0.1;
      spark.scale.set(Math.sin(spark.position.z / 3.3), Math.sin(spark.position.z / 3.3), Math.sin(spark.position.z / 3.3));
    }
    else spark.position.z = 3;
  }

}

const render = () => {

  flamesAnimation();
  renderer.render(scene, camera);
  requestAnimationFrame(render.bind(this))

}

setScene();

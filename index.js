import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import openSimplexNoise from 'https://cdn.skypack.dev/open-simplex-noise';

const container = document.querySelector('.container');
const canvas    = document.querySelector('.canvas');

let
sizes,
scene,
tilesScene,
camera,
controls,
renderer,
noise2d,
rocket,
sparkMeshes,
allTiles,
centerTileFromTo,
centerTile,
tileWidth,
tileAngle,
amountOfHexInTile,
maxHeight,
snowHeight,
lightSnowHeight,
rockHeight,
forestHeight,
grassHeight,
sandHeight,
shallowWaterHeight,
waterHeight,
deepWaterHeight,
textures,
allAsteroids,
stars,
mousePos,
distance,
distanceEl,
asteroidSpeed,
asteroidSpeedTimeout;

const setScene = async () => {

  sizes = {
    width:  container.offsetWidth,
    height: container.offsetHeight
  };

  scene           = new THREE.Scene();
  tilesScene      = new THREE.Scene();
  tilesScene.fog  = new THREE.Fog(0xD8CFE9, 50, 130);

  camera = new THREE.PerspectiveCamera(60, sizes.width / sizes.height, 1, 800);
  camera.position.set(0, 200, 70);
  
  renderer = new THREE.WebGLRenderer({
    canvas:     canvas,
    antialias:  false,
    alpha:      true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  scene.add(new THREE.HemisphereLight(0xffffbb, 0x080820, 1.7));
  tilesScene.add(new THREE.HemisphereLight(0xffffbb, 0x080820, 1));

  sparkMeshes   = [];
  noise2d       = openSimplexNoise.makeNoise2D(Date.now());
  allAsteroids  = [];
  mousePos      = {
    x: 0, 
    y: 0
  };
  distance      = 0;
  distanceEl    = document.querySelector('.distance');
  asteroidSpeed = 3000;

  setControls();
  setTerrainValues();
  createRocket();
  asteroidEngine();
  createInitTiles();
  tileEngine();
  createStars();
  resize();
  listenTo();
  render();

}

const setControls = () => {

  controls                = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping  = true;
  controls.target.y       = 200;
  controls.update();

};

const setTerrainValues = () => {

  allTiles            = new THREE.Group();
  allTiles.rotation.z = (Math.PI / 6) * 13.5;
  allTiles.position.z = -50;
  centerTileFromTo    = 12;
  centerTile = {
    xFrom:  -centerTileFromTo,
    xTo:    centerTileFromTo,
    yFrom:  -centerTileFromTo * 2,
    yTo:    centerTileFromTo * 2
  };
  tileWidth             = centerTileFromTo * 2; // diff between xFrom - xTo (not accounting for 0)
  tileAngle             = 24;
  amountOfHexInTile     = ((centerTile.xTo + 1) - centerTile.xFrom) * ((centerTile.yTo + 1) - centerTile.yFrom); // +1 accounts for 0
  maxHeight             = 30;
  snowHeight            = maxHeight * 0.8;
  lightSnowHeight       = maxHeight * 0.6;
  rockHeight            = maxHeight * 0.5;
  forestHeight          = maxHeight * 0.4;
  grassHeight           = maxHeight * 0.2;
  sandHeight            = maxHeight * 0.15;
  shallowWaterHeight    = maxHeight * 0.1;
  waterHeight           = maxHeight * 0.05;
  deepWaterHeight       = maxHeight * 0;
  textures              = {
    snow:         new THREE.Color(0xE5E5E5),
    lightSnow:    new THREE.Color(0xf0f0f0),
    rock:         new THREE.Color(0xC8BA90),
    forest:       new THREE.Color(0xBCAE8D),
    grass:        new THREE.Color(0x8A846D),
    sand:         new THREE.Color(0x627C7C),
    shallowWater: new THREE.Color(0x3EA9BF),
    water:        new THREE.Color(0x00738B),
    deepWater:    new THREE.Color(0x015373)
  };
  
}

const createRocket = async () => {

  rocket = new THREE.Object3D();

  const createCone = () => {

    const coneGeo = new THREE.ConeGeometry(1.4, 1.4, 4);
    const coneMat = new THREE.MeshStandardMaterial({
      color: 0xFF4B5A
    });
    const coneMesh = new THREE.Mesh(coneGeo, coneMat);
    coneMesh.position.set(0, 0, -10.7);
    coneMesh.rotation.x = -Math.PI / 2;
    coneMesh.rotation.y = Math.PI /4;

    rocket.add(coneMesh);

  }

  const createCenter = () => {

    const centerGeo = new THREE.BufferGeometry();
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
    ]);

    const centerAttr = new THREE.BufferAttribute(centerVertices, 3);
    centerGeo.setAttribute('position', centerAttr);
    centerGeo.computeVertexNormals();
    const centerMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide
    });

    const centerMesh = new THREE.Mesh(centerGeo, centerMat);
    centerMesh.position.set(0, 0, -10);
    centerMesh.rotation.y = Math.PI;

    rocket.add(centerMesh);

  }

  const createBase = () => {

    const baseGeo = new THREE.BufferGeometry();
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
    ]);
  
    const baseAttr = new THREE.BufferAttribute(baseVertices, 3);
    baseGeo.setAttribute('position', baseAttr);
    baseGeo.computeVertexNormals();
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0xFF4B5A,
      side: THREE.DoubleSide
    });
  
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);

    rocket.add(baseMesh);

  }

  const createEngine = () => {

    const engineGeo = new THREE.BoxGeometry(2, 2, 4);
    const engineMat = new THREE.MeshStandardMaterial({
      color: 0x3D1229
    });
    const engineMesh = new THREE.Mesh(engineGeo, engineMat);
    engineMesh.position.set(0, 0, 0);

    rocket.add(engineMesh);

  }

  const createExhaust = () => {

    const exhaustGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.3, 10); 
    const exhaustMat = new THREE.MeshStandardMaterial({
      color: 0x464646
    }); 
    const exhaustMesh = new THREE.Mesh(exhaustGeo, exhaustMat);
    exhaustMesh.position.set(0, 0, 2.1);
    exhaustMesh.rotation.x = Math.PI / 2;

    rocket.add(exhaustMesh);

  }

  const createLegs = () => {

    const legGeo = new THREE.BufferGeometry();
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
    ]);
  
    const legAttr = new THREE.BufferAttribute(legVertices, 3);
    legGeo.setAttribute('position', legAttr);
    legGeo.computeVertexNormals();
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

    rocket.add(
      legMeshOne,
      legMeshTwo,
      legMeshThree,
      legMeshFour
    );

  }

  const createspark = () => {

    const sparkGeo = new THREE.BoxGeometry(1, 1, 1);
    const sparkMat = new THREE.MeshStandardMaterial({
      color: 0xF98C00
    });

    for(let i = 0; i < 4; i++) {
      sparkMeshes[i] = new THREE.Mesh(sparkGeo, sparkMat);
      sparkMeshes[i].position.set(0, 0, 3 + (i * 2));
      rocket.add(sparkMeshes[i]);
    }

  }

  createCone();
  createCenter();
  createBase();
  createEngine();
  createExhaust();
  createLegs();
  createspark();

  rocket.position.set(0, 200, 0);
  rocket.rotation.y = (Math.PI / 2) * 3;
  scene.add(rocket);

}

const asteroidEngine = () => {

  if(asteroidSpeedTimeout) clearTimeout(asteroidSpeedTimeout);

  const interval = () => {
    createAsteroid();
    asteroidSpeedTimeout = setTimeout(interval, asteroidSpeed);
  }

  interval();

}

// https://discourse.threejs.org/t/change-vertex-position-over-time/31309/3
const createAsteroid = () => {

  const asteroidGeo = new THREE.IcosahedronGeometry(1, 0);
  const vec         = new THREE.Vector3();
  const pos         = asteroidGeo.attributes.position;
  const noise3d     = openSimplexNoise.makeNoise3D(Math.random() * 100);
  const posMin      = 190;
  const posMax      = 230;

  for(let i = 0; i < pos.count; i++) {

    vec
      .fromBufferAttribute(pos, i)
      .normalize();
    vec
      .copy(vec)
      .multiplyScalar(3)
      .addScaledVector(vec, noise3d(vec.x, vec.y, vec.z));

    pos.setXYZ(i, vec.x, vec.y, vec.z);

  }

  asteroidGeo.computeVertexNormals();
  pos.needsUpdate   = true;

  const asteroidMat = new THREE.MeshStandardMaterial({
    color: 0x6e6e6e
  });

  const asteroidMesh  = new THREE.Mesh(asteroidGeo, asteroidMat);
  const asteroidGroup = new THREE.Group();
  asteroidGroup.add(asteroidMesh);

  asteroidMesh.position.set(0, Math.random() * (posMax - posMin) + posMin, 0);
  asteroidGroup.rotation.z = (Math.PI / 4) * 6.5;

  allAsteroids.push(asteroidGroup);
  scene.add(asteroidGroup);

}

const createInitTiles = () => {

  for(let i = 0; i < 6; i++) nextTile();
  tilesScene.add(allTiles);

}

const tileEngine = () => {

  setInterval(() => {

    cleanUp(allTiles.children[0]);
    nextTile();
    
  }, 850);

}

const nextTile = () => {

  centerTile.xFrom += tileWidth;
  centerTile.xTo += tileWidth;

  if(tileAngle > 0) tileAngle--;
  else tileAngle = 24;

  createTile();

}

const createTile = () => {

  const tileName = JSON.stringify({
    x: centerTile.xFrom,
    y: centerTile.yFrom
  });

  const tileToPosition = (tileX, tileY) => {
    return new THREE.Vector3((tileX + (tileY % 2) * 0.5) * 1.68, 150, tileY * 1.535);
  }

  const setHexMesh = () => {

    const geo   = new THREE.CylinderGeometry(1, 1, 1, 6, 1, false);
    const mat   = new THREE.MeshStandardMaterial();
    const mesh  = new THREE.InstancedMesh(geo, mat, amountOfHexInTile);
    mesh.rotation.z = ((Math.PI * 2) / 24) * tileAngle;
  
    return mesh;

  }

  let hexCounter        = 0;
  const hexManipulator  = new THREE.Object3D();

  const hex = setHexMesh();
  hex.name  = tileName;

  for(let i = centerTile.xFrom, ogI = -centerTileFromTo; i <= centerTile.xTo; i++, ogI++) {
    for(let j = centerTile.yFrom, ogJ = -centerTileFromTo; j <= centerTile.yTo; j++, ogJ++ ) {

      let noise1     = (noise2d(i * 0.07, j * 0.07) + 0.8) * 0.54;
      noise1         = Math.pow(noise1, 1.2);
      const height   = noise1 * maxHeight;

      hexManipulator.scale.y = height >= sandHeight ? height : sandHeight;

      const pos = tileToPosition(ogI, ogJ);
      hexManipulator.position.set(pos.x, pos.y, pos.z);

      hexManipulator.updateMatrix();
      hex.setMatrixAt(hexCounter, hexManipulator.matrix);

      if(height > snowHeight)               hex.setColorAt(hexCounter, textures.snow);
      else if(height > lightSnowHeight)     hex.setColorAt(hexCounter, textures.lightSnow);
      else if(height > rockHeight)          hex.setColorAt(hexCounter, textures.rock);
      else if(height > forestHeight)        hex.setColorAt(hexCounter, textures.forest);
      else if(height > grassHeight)         hex.setColorAt(hexCounter, textures.grass);
      else if(height > sandHeight)          hex.setColorAt(hexCounter, textures.sand);
      else if(height > shallowWaterHeight)  hex.setColorAt(hexCounter, textures.shallowWater);
      else if(height > waterHeight)         hex.setColorAt(hexCounter, textures.water);
      else if(height > deepWaterHeight)     hex.setColorAt(hexCounter, textures.deepWater);

      hexCounter++;

    }
  }

  allTiles.add(hex);

}

// https://discourse.threejs.org/t/create-circle-with-fuzzy-edge-made-of-individual-random-particles/30150/2
const createStars = () => {

  stars     = {};
  const vec = new THREE.Vector3();

  const randomPointCircle = (radius) => {
 
    const r = THREE.MathUtils.randFloat(0.7 * radius, 1.2 * radius);
    const phi = THREE.MathUtils.randFloat(0, Math.PI * 2);
    
    vec.x = r * Math.cos(phi);
    vec.y = r * Math.sin(phi);
    
    return vec;
    
  }

  const createPoints = (amountOfStars, starSize, color) => {

    const starGeo       = new THREE.BufferGeometry();
    const positions     = [];
    
    for (var i = 0; i < amountOfStars; i ++ ) {
      var vertex = randomPointCircle(260);
      positions.push(vertex.x, vertex.y, 0);
    }
    
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const smallStarMat = new THREE.PointsMaterial({ 
      color: color,
      size: starSize
    });
    const starMesh = new THREE.Points(starGeo, smallStarMat);
    starMesh.position.z = -20;

    return starMesh;

  }

  stars.small   = createPoints(4000, 0.2, 0xffffff);
  stars.medium  = createPoints(1200, 0.5, 0xcbbce3);
  stars.large   = createPoints(800, 0.7, 0xa5d8ec);

  scene.add(stars.small, stars.medium, stars.large);

}

const cleanUp = (obj) => {

  if(obj.geometry && obj.material) {
    obj.geometry.dispose();
    obj.material.dispose();
  }
  else {
    obj.traverse(el => {
      if(el.isMesh) {
        el.geometry.dispose();
        el.material.dispose();
      }
    });
  }

  allTiles.remove(obj);
  scene.remove(obj);
  renderer.renderLists.dispose();

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

const mouseMove = (event) => {
	
	const tx = -1 + (event.clientX / window.innerWidth) * 2;
	const ty = 1 - (event.clientY / window.innerHeight) * 2;

	mousePos = {
    x: tx, 
    y: ty
  };

}

const listenTo = () => {

  window.addEventListener('resize', resize.bind(this));
  document.addEventListener('mousemove', mouseMove.bind(this), false);
  
}

const normalize = (pos, vmin, vmax, tmin, tmax) => {

	const nv = Math.max(Math.min(pos, vmax), vmin);
	const dv = vmax - vmin;
	const pc = (nv - vmin) / dv;
	const dt = tmax - tmin;
	const tv = tmin + (pc * dt);

	return tv;

}

const updateRocket = () => {
	
	const targetX = normalize(mousePos.x, -1, 1, -40, 15);
	const targetY = normalize(mousePos.y, -1, 1, 190, 220);
	const targetZ = normalize(mousePos.y, -1, 1, -10, 3);
	const rotateY = normalize(mousePos.y, -1, 1, 0, 5);

	rocket.position.y = targetY;
	rocket.position.x = targetX;
	rocket.position.z = targetZ;
	rocket.rotation.x = -rotateY;

}

const flamesAnimation = () => {

  for(const spark of sparkMeshes) {
    if(spark.position.z < 10) {
      spark.position.z += 0.2;
      spark.scale.set(Math.sin(spark.position.z / 3.3), Math.sin(spark.position.z / 3.3), Math.sin(spark.position.z / 3.3));
    }
    else spark.position.z = 3;
  }

}

const asteroidAnimation = () => {
  
  for(const asteroid of allAsteroids) {
    if(asteroid.rotation.z < 7.5) {
      asteroid.rotation.z += 0.007;
      asteroid.children[0].rotation.z -= 0.05;
      asteroid.children[0].rotation.y -= 0.05;
    }
    else cleanUp(asteroid);
  }

}

const starAnimation = () => {

  stars.small.rotation.z  += 0.0005;
  stars.medium.rotation.z += 0.0006;
  stars.large.rotation.z  += 0.0008;

}

const setDistance = () => {
  
  distance++;
  distanceEl.textContent = distance;
  if(distance % 200 === 0 && asteroidSpeed > 500) asteroidSpeed -= 250;

}

const render = () => {

  updateRocket();
  flamesAnimation();
  asteroidAnimation();
  starAnimation();
  setDistance();

  allTiles.rotation.z   += 0.0065;

  renderer.autoClear = true;
  renderer.render(scene, camera);
  renderer.autoClear = false;
  renderer.render(tilesScene, camera);

  requestAnimationFrame(render.bind(this))

}

setScene();

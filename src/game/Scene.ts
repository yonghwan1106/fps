import * as THREE from 'three';

export function createScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 0, 150);
  return scene;
}

export function createCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(
    75,
    typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 16 / 9,
    0.1,
    1000
  );
  camera.position.set(0, 2, 0);
  return camera;
}

export function createRenderer(container: HTMLElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  return renderer;
}

export function createLighting(scene: THREE.Scene): void {
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  // Directional light (sun)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(50, 100, 50);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 500;
  directionalLight.shadow.camera.left = -100;
  directionalLight.shadow.camera.right = 100;
  directionalLight.shadow.camera.top = 100;
  directionalLight.shadow.camera.bottom = -100;
  scene.add(directionalLight);

  // Hemisphere light for better ambient
  const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x3a7d44, 0.3);
  scene.add(hemisphereLight);
}

export function createEnvironment(scene: THREE.Scene): void {
  // Ground
  const groundGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a7d44,
    roughness: 0.8,
    metalness: 0.1,
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Walls
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x808080,
    roughness: 0.7,
  });

  const wallPositions: Array<{ pos: [number, number, number]; size: [number, number, number] }> = [
    { pos: [0, 5, -50], size: [100, 10, 1] },
    { pos: [0, 5, 50], size: [100, 10, 1] },
    { pos: [-50, 5, 0], size: [1, 10, 100] },
    { pos: [50, 5, 0], size: [1, 10, 100] },
  ];

  wallPositions.forEach(({ pos, size }) => {
    const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
    const wall = new THREE.Mesh(geometry, wallMaterial);
    wall.position.set(pos[0], pos[1], pos[2]);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
  });

  // Obstacles
  createObstacles(scene);
}

function createObstacles(scene: THREE.Scene): void {
  const obstacleMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    roughness: 0.6,
  });

  const positions = [
    { x: -20, z: -20, size: 3 },
    { x: 20, z: -20, size: 4 },
    { x: -25, z: 15, size: 2.5 },
    { x: 25, z: 15, size: 3.5 },
    { x: 0, z: -30, size: 5 },
    { x: -35, z: 0, size: 3 },
    { x: 35, z: -10, size: 4 },
    { x: 10, z: 25, size: 3 },
    { x: -15, z: 35, size: 2 },
    { x: 30, z: 30, size: 4 },
    { x: -30, z: -35, size: 3.5 },
    { x: 15, z: -35, size: 2.5 },
  ];

  positions.forEach(({ x, z, size }) => {
    const geometry = new THREE.BoxGeometry(size, size, size);
    const obstacle = new THREE.Mesh(geometry, obstacleMaterial);
    obstacle.position.set(x, size / 2, z);
    obstacle.castShadow = true;
    obstacle.receiveShadow = true;
    scene.add(obstacle);
  });
}

export function handleResize(
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  container: HTMLElement
): void {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

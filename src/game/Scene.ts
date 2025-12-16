import * as THREE from 'three';

export function createScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xadd8e6); // 더 밝은 하늘색
  scene.fog = new THREE.Fog(0xadd8e6, 50, 200); // 안개 시작 거리 늘림
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
  // Ambient light - 더 밝게
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  // Directional light (sun) - 더 밝게
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
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

  // Hemisphere light for better ambient - 더 밝게
  const hemisphereLight = new THREE.HemisphereLight(0xadd8e6, 0x7ccd7c, 0.5);
  scene.add(hemisphereLight);
}

export function createEnvironment(scene: THREE.Scene): void {
  // Ground - 더 밝은 잔디색
  const groundGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x7ccd7c, // 밝은 초록색
    roughness: 0.8,
    metalness: 0.1,
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // 벽 제거됨 - 더 넓은 맵!

  // Obstacles
  createObstacles(scene);
}

function createObstacles(scene: THREE.Scene): void {
  const obstacleMaterial = new THREE.MeshStandardMaterial({
    color: 0xdeb887, // 밝은 나무색
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

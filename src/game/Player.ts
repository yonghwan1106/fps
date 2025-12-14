import * as THREE from 'three';

export interface PlayerControls {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
}

export class Player {
  camera: THREE.PerspectiveCamera;
  yaw: number = 0;
  pitch: number = 0;
  controls: PlayerControls = {
    forward: false,
    backward: false,
    left: false,
    right: false,
  };
  speed: number = 0.15;
  sensitivity: number = 0.002;
  bounds = { min: -45, max: 45 };

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.camera.rotation.order = 'YXZ';
  }

  setSensitivity(sensitivity: number): void {
    this.sensitivity = sensitivity;
  }

  handleMouseMove(movementX: number, movementY: number): void {
    this.yaw -= movementX * this.sensitivity;
    this.pitch -= movementY * this.sensitivity;
    this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));

    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  handleKeyDown(code: string): void {
    switch (code) {
      case 'KeyW':
        this.controls.forward = true;
        break;
      case 'KeyS':
        this.controls.backward = true;
        break;
      case 'KeyA':
        this.controls.left = true;
        break;
      case 'KeyD':
        this.controls.right = true;
        break;
    }
  }

  handleKeyUp(code: string): void {
    switch (code) {
      case 'KeyW':
        this.controls.forward = false;
        break;
      case 'KeyS':
        this.controls.backward = false;
        break;
      case 'KeyA':
        this.controls.left = false;
        break;
      case 'KeyD':
        this.controls.right = false;
        break;
    }
  }

  update(): void {
    const direction = new THREE.Vector3();

    if (this.controls.forward) direction.z -= 1;
    if (this.controls.backward) direction.z += 1;
    if (this.controls.left) direction.x -= 1;
    if (this.controls.right) direction.x += 1;

    if (direction.lengthSq() > 0) {
      direction.normalize();
      direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

      this.camera.position.x += direction.x * this.speed;
      this.camera.position.z += direction.z * this.speed;

      // Keep player in bounds
      this.camera.position.x = Math.max(
        this.bounds.min,
        Math.min(this.bounds.max, this.camera.position.x)
      );
      this.camera.position.z = Math.max(
        this.bounds.min,
        Math.min(this.bounds.max, this.camera.position.z)
      );
    }
  }

  getPosition(): THREE.Vector3 {
    return this.camera.position.clone();
  }

  getDirection(): THREE.Vector3 {
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.camera.quaternion);
    return direction;
  }

  reset(): void {
    this.camera.position.set(0, 2, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.camera.rotation.y = 0;
    this.camera.rotation.x = 0;
    this.controls = {
      forward: false,
      backward: false,
      left: false,
      right: false,
    };
  }
}

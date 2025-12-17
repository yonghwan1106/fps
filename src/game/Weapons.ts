import * as THREE from 'three';

export interface Bullet {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
}

export class WeaponSystem {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  bullets: Bullet[] = [];
  raycaster: THREE.Raycaster;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.scene = scene;
    this.camera = camera;
    this.raycaster = new THREE.Raycaster();
  }

  shoot(): THREE.Object3D | null {
    // Create visual bullet
    this.createBulletTrail();

    // Raycast for hit detection
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

    return null; // Return value not needed, hit detection done via raycaster
  }

  checkHit(targets: THREE.Object3D[]): THREE.Object3D | null {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const intersects = this.raycaster.intersectObjects(targets);

    if (intersects.length > 0) {
      return intersects[0].object;
    }

    return null;
  }

  // Spread를 적용한 히트 체크 (산탄총, 조준 시 정확도 등)
  checkHitWithSpread(targets: THREE.Object3D[], spread: number): THREE.Object3D | null {
    // 스프레드 적용
    const spreadX = (Math.random() - 0.5) * spread * 2;
    const spreadY = (Math.random() - 0.5) * spread * 2;

    this.raycaster.setFromCamera(new THREE.Vector2(spreadX, spreadY), this.camera);
    const intersects = this.raycaster.intersectObjects(targets);

    if (intersects.length > 0) {
      return intersects[0].object;
    }

    return null;
  }

  private createBulletTrail(): void {
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.camera.quaternion);

    const bulletGeometry = new THREE.SphereGeometry(0.05);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

    bullet.position.copy(this.camera.position);
    bullet.position.add(direction.clone().multiplyScalar(0.5));

    const bulletData: Bullet = {
      mesh: bullet,
      velocity: direction.clone().multiplyScalar(3),
      life: 60,
    };

    this.scene.add(bullet);
    this.bullets.push(bulletData);
  }

  update(): void {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.mesh.position.add(bullet.velocity);
      bullet.life--;

      if (bullet.life <= 0) {
        this.scene.remove(bullet.mesh);
        bullet.mesh.geometry.dispose();
        (bullet.mesh.material as THREE.Material).dispose();
        this.bullets.splice(i, 1);
      }
    }
  }

  clear(): void {
    this.bullets.forEach((bullet) => {
      this.scene.remove(bullet.mesh);
      bullet.mesh.geometry.dispose();
      (bullet.mesh.material as THREE.Material).dispose();
    });
    this.bullets = [];
  }
}

// Muzzle flash effect
export function createMuzzleFlash(
  scene: THREE.Scene,
  position: THREE.Vector3,
  direction: THREE.Vector3
): void {
  const flashGeometry = new THREE.SphereGeometry(0.1, 8, 8);
  const flashMaterial = new THREE.MeshBasicMaterial({
    color: 0xffaa00,
    transparent: true,
    opacity: 1,
  });
  const flash = new THREE.Mesh(flashGeometry, flashMaterial);

  flash.position.copy(position);
  flash.position.add(direction.clone().multiplyScalar(0.5));

  scene.add(flash);

  // Animate and remove
  let opacity = 1;
  const animate = () => {
    opacity -= 0.2;
    flashMaterial.opacity = opacity;

    if (opacity > 0) {
      requestAnimationFrame(animate);
    } else {
      scene.remove(flash);
      flashGeometry.dispose();
      flashMaterial.dispose();
    }
  };
  animate();
}

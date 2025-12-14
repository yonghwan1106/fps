import * as THREE from 'three';

export interface Target {
  mesh: THREE.Mesh;
  health: number;
  maxHealth: number;
  speed: number;
  direction: THREE.Vector3;
  type: 'normal' | 'fast' | 'tank';
}

const TARGET_CONFIGS = {
  normal: {
    color: 0xff0000,
    emissive: 0x440000,
    size: 1,
    health: 25,
    speed: 0.02,
    points: 100,
  },
  fast: {
    color: 0xffff00,
    emissive: 0x444400,
    size: 0.7,
    health: 15,
    speed: 0.05,
    points: 150,
  },
  tank: {
    color: 0x0000ff,
    emissive: 0x000044,
    size: 1.5,
    health: 100,
    speed: 0.01,
    points: 300,
  },
};

export class TargetManager {
  scene: THREE.Scene;
  targets: Target[] = [];
  maxTargets: number = 15;
  spawnBounds = { min: -40, max: 40 };

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  createTarget(type: 'normal' | 'fast' | 'tank' = 'normal'): Target {
    const config = TARGET_CONFIGS[type];

    const geometry = new THREE.SphereGeometry(config.size, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color: config.color,
      emissive: config.emissive,
      roughness: 0.5,
      metalness: 0.3,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      this.spawnBounds.min + Math.random() * (this.spawnBounds.max - this.spawnBounds.min),
      1.5 + Math.random() * 2,
      this.spawnBounds.min + Math.random() * (this.spawnBounds.max - this.spawnBounds.min)
    );
    mesh.castShadow = true;

    const direction = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      0,
      (Math.random() - 0.5) * 2
    ).normalize();

    const target: Target = {
      mesh,
      health: config.health,
      maxHealth: config.health,
      speed: config.speed,
      direction,
      type,
    };

    this.scene.add(mesh);
    this.targets.push(target);

    return target;
  }

  spawnInitialTargets(count: number = 10): void {
    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      let type: 'normal' | 'fast' | 'tank' = 'normal';
      if (rand > 0.9) type = 'tank';
      else if (rand > 0.7) type = 'fast';

      this.createTarget(type);
    }
  }

  update(deltaTime: number): void {
    const time = Date.now() * 0.001;

    this.targets.forEach((target) => {
      // Bobbing animation
      target.mesh.position.y = 1.5 + Math.sin(time * 2 + target.mesh.position.x) * 0.5;

      // Movement
      target.mesh.position.x += target.direction.x * target.speed;
      target.mesh.position.z += target.direction.z * target.speed;

      // Bounce off walls
      if (target.mesh.position.x <= this.spawnBounds.min || target.mesh.position.x >= this.spawnBounds.max) {
        target.direction.x *= -1;
      }
      if (target.mesh.position.z <= this.spawnBounds.min || target.mesh.position.z >= this.spawnBounds.max) {
        target.direction.z *= -1;
      }

      // Keep in bounds
      target.mesh.position.x = Math.max(this.spawnBounds.min, Math.min(this.spawnBounds.max, target.mesh.position.x));
      target.mesh.position.z = Math.max(this.spawnBounds.min, Math.min(this.spawnBounds.max, target.mesh.position.z));
    });
  }

  damageTarget(target: Target, damage: number): { destroyed: boolean; points: number } {
    target.health -= damage;

    // Flash effect
    const material = target.mesh.material as THREE.MeshStandardMaterial;
    const originalColor = material.color.getHex();
    material.color.setHex(0xffffff);
    setTimeout(() => {
      material.color.setHex(originalColor);
    }, 50);

    if (target.health <= 0) {
      return { destroyed: true, points: TARGET_CONFIGS[target.type].points };
    }

    return { destroyed: false, points: 0 };
  }

  removeTarget(target: Target): void {
    this.scene.remove(target.mesh);
    target.mesh.geometry.dispose();
    (target.mesh.material as THREE.Material).dispose();
    this.targets = this.targets.filter((t) => t !== target);
  }

  getTargets(): THREE.Object3D[] {
    return this.targets.map((t) => t.mesh);
  }

  findTarget(mesh: THREE.Object3D): Target | undefined {
    return this.targets.find((t) => t.mesh === mesh);
  }

  respawnTarget(): void {
    if (this.targets.length < this.maxTargets) {
      const rand = Math.random();
      let type: 'normal' | 'fast' | 'tank' = 'normal';
      if (rand > 0.9) type = 'tank';
      else if (rand > 0.7) type = 'fast';

      this.createTarget(type);
    }
  }

  clear(): void {
    this.targets.forEach((target) => {
      this.scene.remove(target.mesh);
      target.mesh.geometry.dispose();
      (target.mesh.material as THREE.Material).dispose();
    });
    this.targets = [];
  }
}

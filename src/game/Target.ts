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
    color: 0xff3333,
    emissive: 0xff0000,
    size: 1.2,
    health: 25,
    speed: 0.03,
    points: 100,
    playerDamage: 15, // 빨간색 구체가 주는 데미지
  },
  fast: {
    color: 0xffff00,
    emissive: 0xffaa00,
    size: 0.9,
    health: 15,
    speed: 0.06,
    points: 150,
    playerDamage: 10, // 노란색 구체가 주는 데미지
  },
  tank: {
    color: 0x3333ff,
    emissive: 0x0000ff,
    size: 1.8,
    health: 100,
    speed: 0.015,
    points: 300,
    playerDamage: 20, // 파란색 구체가 주는 데미지
  },
};

export class TargetManager {
  scene: THREE.Scene;
  targets: Target[] = [];
  maxTargets: number = 15;
  spawnBounds = { min: -35, max: 35 };

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  createTarget(type: 'normal' | 'fast' | 'tank' = 'normal', nearPlayer: boolean = false): Target {
    const config = TARGET_CONFIGS[type];

    const geometry = new THREE.SphereGeometry(config.size, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color: config.color,
      emissive: config.emissive,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.5,
    });

    const mesh = new THREE.Mesh(geometry, material);

    // 플레이어 근처에 스폰할지 랜덤 위치에 스폰할지 결정
    if (nearPlayer) {
      // 플레이어 앞쪽 (z가 음수 방향) 10~30 거리에 스폰
      const distance = 10 + Math.random() * 20;
      const angle = (Math.random() - 0.5) * Math.PI; // -90도 ~ +90도
      mesh.position.set(
        Math.sin(angle) * distance,
        1.5 + Math.random() * 2,
        -Math.cos(angle) * distance // 음수 = 플레이어 앞쪽
      );
    } else {
      mesh.position.set(
        this.spawnBounds.min + Math.random() * (this.spawnBounds.max - this.spawnBounds.min),
        1.5 + Math.random() * 2,
        this.spawnBounds.min + Math.random() * (this.spawnBounds.max - this.spawnBounds.min)
      );
    }

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
    // 처음 5개는 플레이어 앞에 스폰
    for (let i = 0; i < Math.min(5, count); i++) {
      const rand = Math.random();
      let type: 'normal' | 'fast' | 'tank' = 'normal';
      if (rand > 0.9) type = 'tank';
      else if (rand > 0.7) type = 'fast';

      this.createTarget(type, true);
    }

    // 나머지는 랜덤 위치에 스폰
    for (let i = 5; i < count; i++) {
      const rand = Math.random();
      let type: 'normal' | 'fast' | 'tank' = 'normal';
      if (rand > 0.9) type = 'tank';
      else if (rand > 0.7) type = 'fast';

      this.createTarget(type, false);
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

      // 50% 확률로 플레이어 근처에 스폰
      const nearPlayer = Math.random() > 0.5;
      this.createTarget(type, nearPlayer);
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

  // 플레이어와의 거리를 확인하고 가까운 적의 데미지를 반환
  checkPlayerDamage(playerPosition: THREE.Vector3, damageRange: number = 5): number {
    let totalDamage = 0;

    this.targets.forEach((target) => {
      const distance = target.mesh.position.distanceTo(playerPosition);
      if (distance < damageRange) {
        // 거리에 따라 데미지 비율 조정 (가까울수록 더 많은 데미지)
        const damageMultiplier = 1 - (distance / damageRange);
        const damage = TARGET_CONFIGS[target.type].playerDamage * damageMultiplier;
        totalDamage += damage;
      }
    });

    return totalDamage;
  }

  // 특정 타겟의 데미지 값 가져오기
  getTargetDamage(target: Target): number {
    return TARGET_CONFIGS[target.type].playerDamage;
  }
}

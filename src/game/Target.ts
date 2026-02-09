import * as THREE from 'three';
import { DIFFICULTY_CONFIG, Difficulty } from '@/store/gameStore';

// === 적 타입 정의 ===
export type EnemyType = 'normal' | 'charger' | 'tank' | 'shooter' | 'boss';

export interface Enemy {
  mesh: THREE.Mesh;
  health: number;
  maxHealth: number;
  speed: number;
  direction: THREE.Vector3;
  type: EnemyType;
  scoreValue: number;
  damage: number;
  alive: boolean;
  highlighted?: boolean;
  originalColor?: number;
  // Shooter 전용
  lastShootTime?: number;
  shootCooldown?: number;
  // Boss 전용
  attackCooldown?: number;
  lastAttackTime?: number;
  isCharging?: boolean;
  chargeTarget?: THREE.Vector3;
  ring?: THREE.Mesh;
}

// === 적 설정 ===
const ENEMY_CONFIGS: Record<EnemyType, {
  color: number;
  emissive: number;
  size: number;
  health: number;
  speed: number;
  scoreValue: number;
  damage: number;
}> = {
  normal: {
    color: 0xff3333,
    emissive: 0xff0000,
    size: 1.2,
    health: 100,
    speed: 1,
    scoreValue: 100,
    damage: 10,
  },
  charger: {
    color: 0xff0000,
    emissive: 0xff4400,
    size: 1.0,
    health: 50,
    speed: 1,
    scoreValue: 50,
    damage: 15,
  },
  tank: {
    color: 0x00ff00,
    emissive: 0x00aa00,
    size: 2.0,
    health: 400,
    speed: 1,
    scoreValue: 300,
    damage: 20,
  },
  shooter: {
    color: 0xff00ff,
    emissive: 0xaa00aa,
    size: 1.2,
    health: 80,
    speed: 1,
    scoreValue: 150,
    damage: 15,
  },
  boss: {
    color: 0xffff00,
    emissive: 0xaaaa00,
    size: 4.0,
    health: 2000,
    speed: 1,
    scoreValue: 1000,
    damage: 25,
  },
};

// === 아이템 타입 ===
export type ItemType = 'health' | 'ammo';

export interface Item {
  mesh: THREE.Mesh;
  type: ItemType;
  alive: boolean;
}

// === 적 총알 ===
export interface EnemyBullet {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
}

// === 타겟 매니저 클래스 ===
export class TargetManager {
  scene: THREE.Scene;
  enemies: Enemy[] = [];
  items: Item[] = [];
  enemyBullets: EnemyBullet[] = [];
  maxEnemies: number = 30;
  spawnBounds = { min: -100, max: 100 };
  difficulty: Difficulty = 'normal';
  playerPosition: THREE.Vector3 = new THREE.Vector3();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  setDifficulty(difficulty: Difficulty): void {
    this.difficulty = difficulty;
  }

  setPlayerPosition(position: THREE.Vector3): void {
    this.playerPosition.copy(position);
  }

  // === 적 생성 ===
  createEnemy(type: EnemyType = 'normal', position?: THREE.Vector3): Enemy {
    const config = ENEMY_CONFIGS[type];
    const diffConfig = DIFFICULTY_CONFIG[this.difficulty];

    // 메시 생성
    const geometry = type === 'boss'
      ? new THREE.BoxGeometry(config.size, config.size, config.size)
      : new THREE.SphereGeometry(config.size, 16, 16);

    const material = new THREE.MeshStandardMaterial({
      color: config.color,
      emissive: config.emissive,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.5,
    });

    const mesh = new THREE.Mesh(geometry, material);

    // 위치 설정
    if (position) {
      mesh.position.copy(position);
    } else {
      const angle = Math.random() * Math.PI * 2;
      const radius = 50 + Math.random() * 50;
      mesh.position.set(
        this.playerPosition.x + Math.cos(angle) * radius,
        config.size,
        this.playerPosition.z + Math.sin(angle) * radius
      );
    }

    mesh.castShadow = true;

    // Enemy 객체 생성
    const enemy: Enemy = {
      mesh,
      health: Math.round(config.health * diffConfig.enemyHealthMult),
      maxHealth: Math.round(config.health * diffConfig.enemyHealthMult),
      speed: config.speed,
      direction: new THREE.Vector3(),
      type,
      scoreValue: config.scoreValue,
      damage: config.damage,
      alive: true,
    };

    // Shooter 전용 속성
    if (type === 'shooter') {
      enemy.lastShootTime = performance.now();
      enemy.shootCooldown = 2000;
    }

    // Boss 전용 속성 및 링 추가
    if (type === 'boss') {
      enemy.attackCooldown = 3000;
      enemy.lastAttackTime = performance.now();
      enemy.isCharging = false;

      const ringGeo = new THREE.RingGeometry(config.size * 0.9, config.size, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: config.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.5;
      mesh.add(ring);
      enemy.ring = ring;
    }

    this.scene.add(mesh);
    this.enemies.push(enemy);

    return enemy;
  }

  // === 아이템 생성 ===
  spawnItem(position: THREE.Vector3): void {
    // 30% 확률로 아이템 드롭
    if (Math.random() > 0.3) return;

    const type: ItemType = Math.random() > 0.5 ? 'health' : 'ammo';
    const color = type === 'health' ? 0x00ff00 : 0xffff00;

    const geometry = new THREE.BoxGeometry(3, 3, 3);
    const material = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.position.y = 3;

    const item: Item = { mesh, type, alive: true };
    this.scene.add(mesh);
    this.items.push(item);
  }

  // === 적 총알 생성 (Shooter용) ===
  createEnemyBullet(position: THREE.Vector3, direction: THREE.Vector3): void {
    const geometry = new THREE.SphereGeometry(1, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xff00ff });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.copy(position);

    const bullet: EnemyBullet = {
      mesh,
      velocity: direction.clone().multiplyScalar(80),
      life: 5.0
    };

    this.scene.add(mesh);
    this.enemyBullets.push(bullet);
  }

  // === 초기 적 스폰 ===
  spawnInitialTargets(count: number = 10): void {
    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      let type: EnemyType = 'normal';
      if (rand > 0.95) type = 'tank';
      else if (rand > 0.85) type = 'shooter';
      else if (rand > 0.7) type = 'charger';

      this.createEnemy(type);
    }
  }

  // === 보스 스폰 ===
  spawnBoss(): void {
    const angle = Math.random() * Math.PI * 2;
    const radius = 80;
    const position = new THREE.Vector3(
      this.playerPosition.x + Math.cos(angle) * radius,
      ENEMY_CONFIGS.boss.size,
      this.playerPosition.z + Math.sin(angle) * radius
    );
    this.createEnemy('boss', position);
  }

  // === 업데이트 ===
  update(delta: number): void {
    const now = performance.now();

    // 적 업데이트
    this.enemies.forEach((enemy) => {
      if (!enemy.alive) return;

      const distToPlayer = enemy.mesh.position.distanceTo(this.playerPosition);

      // 타입별 행동
      switch (enemy.type) {
        case 'normal':
        case 'charger':
        case 'tank':
          // 플레이어 추적
          const dir = new THREE.Vector3()
            .subVectors(this.playerPosition, enemy.mesh.position)
            .normalize();
          dir.y = 0;
          enemy.mesh.position.add(dir.multiplyScalar(enemy.speed * delta));
          enemy.mesh.lookAt(this.playerPosition.x, enemy.mesh.position.y, this.playerPosition.z);
          break;

        case 'shooter':
          // 거리 유지하며 사격
          if (distToPlayer > 40) {
            const moveDir = new THREE.Vector3()
              .subVectors(this.playerPosition, enemy.mesh.position)
              .normalize();
            moveDir.y = 0;
            enemy.mesh.position.add(moveDir.multiplyScalar(enemy.speed * delta));
          } else if (distToPlayer < 25) {
            const moveDir = new THREE.Vector3()
              .subVectors(enemy.mesh.position, this.playerPosition)
              .normalize();
            moveDir.y = 0;
            enemy.mesh.position.add(moveDir.multiplyScalar(enemy.speed * delta));
          }
          enemy.mesh.lookAt(this.playerPosition.x, enemy.mesh.position.y, this.playerPosition.z);

          // 사격
          if (enemy.lastShootTime && enemy.shootCooldown) {
            if (now - enemy.lastShootTime > enemy.shootCooldown) {
              const bulletDir = new THREE.Vector3()
                .subVectors(this.playerPosition, enemy.mesh.position)
                .normalize();
              this.createEnemyBullet(enemy.mesh.position.clone(), bulletDir);
              enemy.lastShootTime = now;
            }
          }
          break;

        case 'boss':
          // 링 회전
          if (enemy.ring) {
            enemy.ring.rotation.z += delta * 2;
          }

          if (enemy.isCharging && enemy.chargeTarget) {
            // 차지 공격
            const chargeDir = new THREE.Vector3()
              .subVectors(enemy.chargeTarget, enemy.mesh.position);
            if (chargeDir.length() > 5) {
              chargeDir.normalize();
              enemy.mesh.position.add(chargeDir.multiplyScalar(enemy.speed * 3 * delta));
            } else {
              enemy.isCharging = false;
              enemy.chargeTarget = undefined;
            }
          } else {
            // 일반 추적
            const bossDir = new THREE.Vector3()
              .subVectors(this.playerPosition, enemy.mesh.position)
              .normalize();
            bossDir.y = 0;
            enemy.mesh.position.add(bossDir.multiplyScalar(enemy.speed * delta));
            enemy.mesh.lookAt(this.playerPosition.x, enemy.mesh.position.y, this.playerPosition.z);

            // 공격 패턴
            if (enemy.lastAttackTime && enemy.attackCooldown) {
              if (now - enemy.lastAttackTime > enemy.attackCooldown) {
                this.executeBossAttack(enemy);
                enemy.lastAttackTime = now;
              }
            }
          }
          break;
      }

      // Scanner 하이라이트 효과
      if (enemy.highlighted) {
        (enemy.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.0;
      }

      // Y 위치 고정
      enemy.mesh.position.y = ENEMY_CONFIGS[enemy.type].size;
    });

    // 적 총알 업데이트
    this.enemyBullets = this.enemyBullets.filter(bullet => {
      bullet.life -= delta;
      if (bullet.life <= 0) {
        this.scene.remove(bullet.mesh);
        bullet.mesh.geometry.dispose();
        (bullet.mesh.material as THREE.Material).dispose();
        return false;
      }

      bullet.mesh.position.add(bullet.velocity.clone().multiplyScalar(delta));
      return true;
    });

    // 아이템 업데이트
    this.items.forEach(item => {
      if (!item.alive) return;
      item.mesh.rotation.y += delta * 2;
      item.mesh.position.y = 3 + Math.sin(now * 0.005) * 1;
    });
  }

  // === 보스 공격 패턴 ===
  executeBossAttack(boss: Enemy): void {
    const attacks = ['charge', 'summon'];
    const attack = attacks[Math.floor(Math.random() * attacks.length)];

    switch (attack) {
      case 'charge':
        boss.isCharging = true;
        boss.chargeTarget = this.playerPosition.clone();
        break;
      case 'summon':
        // 미니언 소환
        for (let i = 0; i < 3; i++) {
          const angle = (i / 3) * Math.PI * 2;
          const spawnPos = new THREE.Vector3(
            boss.mesh.position.x + Math.cos(angle) * 20,
            ENEMY_CONFIGS.charger.size,
            boss.mesh.position.z + Math.sin(angle) * 20
          );
          this.createEnemy('charger', spawnPos);
        }
        break;
    }
  }

  // === 적에게 데미지 ===
  damageEnemy(enemy: Enemy, damage: number, isHeadshot: boolean = false): { destroyed: boolean; points: number } {
    const finalDamage = isHeadshot ? damage * 1.5 : damage;
    enemy.health -= finalDamage;

    // 피격 효과
    const material = enemy.mesh.material as THREE.MeshStandardMaterial;
    const originalColor = material.color.getHex();
    material.color.setHex(0xffffff);
    setTimeout(() => {
      if (enemy.alive) {
        material.color.setHex(originalColor);
      }
    }, 50);

    if (enemy.health <= 0) {
      enemy.alive = false;
      this.spawnItem(enemy.mesh.position.clone());
      return { destroyed: true, points: enemy.scoreValue + (isHeadshot ? 50 : 0) };
    }

    return { destroyed: false, points: 0 };
  }

  // === 적 제거 ===
  removeEnemy(enemy: Enemy): void {
    this.scene.remove(enemy.mesh);
    enemy.mesh.geometry.dispose();
    (enemy.mesh.material as THREE.Material).dispose();
    this.enemies = this.enemies.filter((e) => e !== enemy);
  }

  // === 아이템 수집 ===
  collectItem(item: Item): { type: ItemType } {
    item.alive = false;
    this.scene.remove(item.mesh);
    item.mesh.geometry.dispose();
    (item.mesh.material as THREE.Material).dispose();
    this.items = this.items.filter(i => i !== item);
    return { type: item.type };
  }

  // === 플레이어 데미지 체크 ===
  checkPlayerDamage(playerPosition: THREE.Vector3, damageRange: number = 5): number {
    let totalDamage = 0;

    this.enemies.forEach((enemy) => {
      if (!enemy.alive) return;
      const distance = enemy.mesh.position.distanceTo(playerPosition);
      if (distance < damageRange + ENEMY_CONFIGS[enemy.type].size) {
        totalDamage += enemy.damage;
      }
    });

    return totalDamage;
  }

  // === 적 총알 데미지 체크 ===
  checkBulletDamage(playerPosition: THREE.Vector3, hitRange: number = 2): number {
    let totalDamage = 0;

    this.enemyBullets = this.enemyBullets.filter(bullet => {
      const distance = bullet.mesh.position.distanceTo(playerPosition);
      if (distance < hitRange) {
        totalDamage += 15; // 적 총알 데미지
        this.scene.remove(bullet.mesh);
        bullet.mesh.geometry.dispose();
        (bullet.mesh.material as THREE.Material).dispose();
        return false;
      }
      return true;
    });

    return totalDamage;
  }

  // === 아이템 수집 체크 ===
  checkItemPickup(playerPosition: THREE.Vector3, pickupRange: number = 5): Item | null {
    for (const item of this.items) {
      if (!item.alive) continue;
      const distance = item.mesh.position.distanceTo(playerPosition);
      if (distance < pickupRange) {
        return item;
      }
    }
    return null;
  }

  // === Scanner 하이라이트 ===
  highlightAllEnemies(highlight: boolean): void {
    this.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      enemy.highlighted = highlight;
      if (!highlight) {
        (enemy.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5;
      }
    });
  }

  // === Getter ===
  getTargets(): THREE.Object3D[] {
    return this.enemies.filter(e => e.alive).map((e) => e.mesh);
  }

  findTarget(mesh: THREE.Object3D): Enemy | undefined {
    return this.enemies.find((e) => e.mesh === mesh && e.alive);
  }

  // === 리스폰 ===
  respawnTarget(): void {
    if (this.enemies.length < this.maxEnemies) {
      const rand = Math.random();
      let type: EnemyType = 'normal';
      if (rand > 0.95) type = 'tank';
      else if (rand > 0.85) type = 'shooter';
      else if (rand > 0.7) type = 'charger';

      this.createEnemy(type);
    }
  }

  // === 초기화 ===
  clear(): void {
    this.enemies.forEach((enemy) => {
      this.scene.remove(enemy.mesh);
      enemy.mesh.geometry.dispose();
      (enemy.mesh.material as THREE.Material).dispose();
    });
    this.enemies = [];

    this.items.forEach((item) => {
      this.scene.remove(item.mesh);
      item.mesh.geometry.dispose();
      (item.mesh.material as THREE.Material).dispose();
    });
    this.items = [];

    this.enemyBullets.forEach((bullet) => {
      this.scene.remove(bullet.mesh);
      bullet.mesh.geometry.dispose();
      (bullet.mesh.material as THREE.Material).dispose();
    });
    this.enemyBullets = [];
  }

  // === 기존 호환 메서드 ===
  get targets(): Enemy[] {
    return this.enemies;
  }

  damageTarget(target: Enemy, damage: number): { destroyed: boolean; points: number } {
    return this.damageEnemy(target, damage, false);
  }

  removeTarget(target: Enemy): void {
    this.removeEnemy(target);
  }

  getEnemyCount(): number {
    return this.enemies.filter(e => e.alive).length;
  }

  getBossCount(): number {
    return this.enemies.filter(e => e.alive && e.type === 'boss').length;
  }
}

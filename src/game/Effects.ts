import * as THREE from 'three';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  gravity: number;
}

export class EffectsManager {
  scene: THREE.Scene;
  particles: Particle[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  createExplosion(position: THREE.Vector3, color1: number = 0xff6600, color2: number = 0xffff00): void {
    const particleCount = 15;

    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.08 + Math.random() * 0.08);
      const material = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? color1 : color2,
        transparent: true,
        opacity: 1,
      });

      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(position);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        Math.random() * 0.3 + 0.1,
        (Math.random() - 0.5) * 0.4
      );

      this.scene.add(particle);
      this.particles.push({
        mesh: particle,
        velocity,
        life: 40 + Math.random() * 20,
        gravity: 0.01,
      });
    }
  }

  createHitEffect(position: THREE.Vector3): void {
    const particleCount = 8;

    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.04);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1,
      });

      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(position);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2
      );

      this.scene.add(particle);
      this.particles.push({
        mesh: particle,
        velocity,
        life: 20,
        gravity: 0,
      });
    }
  }

  createDustEffect(position: THREE.Vector3): void {
    const particleCount = 5;

    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.1);
      const material = new THREE.MeshBasicMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.5,
      });

      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(position);
      particle.position.y = 0.1;

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        Math.random() * 0.05,
        (Math.random() - 0.5) * 0.1
      );

      this.scene.add(particle);
      this.particles.push({
        mesh: particle,
        velocity,
        life: 30,
        gravity: -0.001,
      });
    }
  }

  update(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      particle.mesh.position.add(particle.velocity);
      particle.velocity.y -= particle.gravity;
      particle.life--;

      // Fade out
      const material = particle.mesh.material as THREE.MeshBasicMaterial;
      material.opacity = particle.life / 60;

      if (particle.life <= 0) {
        this.scene.remove(particle.mesh);
        particle.mesh.geometry.dispose();
        (particle.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
      }
    }
  }

  clear(): void {
    this.particles.forEach((particle) => {
      this.scene.remove(particle.mesh);
      particle.mesh.geometry.dispose();
      (particle.mesh.material as THREE.Material).dispose();
    });
    this.particles = [];
  }
}

// Screen shake effect
export function createScreenShake(
  camera: THREE.PerspectiveCamera,
  intensity: number = 0.1,
  duration: number = 100
): void {
  const originalPosition = camera.position.clone();
  const startTime = Date.now();

  const shake = () => {
    const elapsed = Date.now() - startTime;
    const progress = elapsed / duration;

    if (progress < 1) {
      const decay = 1 - progress;
      camera.position.x = originalPosition.x + (Math.random() - 0.5) * intensity * decay;
      camera.position.y = originalPosition.y + (Math.random() - 0.5) * intensity * decay;
      requestAnimationFrame(shake);
    } else {
      camera.position.copy(originalPosition);
    }
  };

  shake();
}

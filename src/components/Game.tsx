'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import { useGameStore, WEAPONS } from '@/store/gameStore';
import { createScene, createCamera, createRenderer, createLighting, createEnvironment, handleResize } from '@/game/Scene';
import { Player } from '@/game/Player';
import { TargetManager } from '@/game/Target';
import { WeaponSystem, createMuzzleFlash } from '@/game/Weapons';
import { EffectsManager, createScreenShake } from '@/game/Effects';
import { audioManager } from '@/game/Audio';
import { HUD } from './HUD';
import { StartMenu, PauseMenu, GameOverMenu } from './Menu';

interface GameRefs {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  player: Player;
  targetManager: TargetManager;
  weaponSystem: WeaponSystem;
  effectsManager: EffectsManager;
  animationId: number | null;
}

export function Game() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameRefs | null>(null);

  const {
    isPlaying,
    isPaused,
    isGameOver,
    currentWeapon,
    sensitivity,
    startGame,
    pauseGame,
    resumeGame,
    resetGame,
    switchWeapon,
    score,
    takeDamage,
  } = useGameStore();

  const [showStartMenu, setShowStartMenu] = useState(true);
  const isMouseDownRef = useRef(false);
  const autoFireIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastDamageTimeRef = useRef(0);
  const damageIntervalMs = 500; // 0.5초마다 데미지 체크

  // Initialize game
  useEffect(() => {
    if (!containerRef.current) return;

    // 이미 초기화된 경우 스킵 (React Strict Mode 대응)
    if (gameRef.current) {
      return;
    }

    const scene = createScene();
    const camera = createCamera();
    const renderer = createRenderer(containerRef.current);

    createLighting(scene);
    createEnvironment(scene);

    const player = new Player(camera);
    const targetManager = new TargetManager(scene);
    const weaponSystem = new WeaponSystem(scene, camera);
    const effectsManager = new EffectsManager(scene);

    gameRef.current = {
      scene,
      camera,
      renderer,
      player,
      targetManager,
      weaponSystem,
      effectsManager,
      animationId: null,
    };

    // Handle resize
    const onResize = () => {
      if (containerRef.current && gameRef.current) {
        handleResize(gameRef.current.camera, gameRef.current.renderer, containerRef.current);
      }
    };
    window.addEventListener('resize', onResize);

    // Initial render
    renderer.render(scene, camera);

    return () => {
      window.removeEventListener('resize', onResize);
      if (gameRef.current?.animationId) {
        cancelAnimationFrame(gameRef.current.animationId);
      }
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Game loop
  useEffect(() => {
    if (!gameRef.current) return;

    const { scene, camera, renderer, player, targetManager, weaponSystem, effectsManager } = gameRef.current;

    const animate = () => {
      if (isPlaying && !isPaused) {
        player.update();
        targetManager.update(1 / 60);
        weaponSystem.update();
        effectsManager.update();

        // 플레이어에게 데미지 체크
        const now = Date.now();
        if (now - lastDamageTimeRef.current >= damageIntervalMs) {
          const damage = targetManager.checkPlayerDamage(camera.position, 5);
          if (damage > 0) {
            useGameStore.getState().takeDamage(damage);
            lastDamageTimeRef.current = now;
          }
        }
      }

      renderer.render(scene, camera);
      gameRef.current!.animationId = requestAnimationFrame(animate);
    };

    gameRef.current.animationId = requestAnimationFrame(animate);

    return () => {
      if (gameRef.current?.animationId) {
        cancelAnimationFrame(gameRef.current.animationId);
      }
    };
  }, [isPlaying, isPaused]);

  // Update player sensitivity
  useEffect(() => {
    if (gameRef.current?.player) {
      gameRef.current.player.setSensitivity(sensitivity);
    }
  }, [sensitivity]);

  // Handle shooting - read state directly from store to avoid stale closures
  const handleShoot = useCallback(() => {
    if (!gameRef.current) return;

    // Get fresh state from store to avoid stale closure issues
    const state = useGameStore.getState();
    if (!state.isPlaying || state.isPaused) return;

    const { camera, targetManager, weaponSystem, effectsManager } = gameRef.current;
    const weapon = WEAPONS[state.currentWeapon];

    if (state.shoot()) {
      audioManager.playShoot(state.currentWeapon, state.volume);
      createMuzzleFlash(gameRef.current.scene, camera.position.clone(), new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion));
      createScreenShake(camera, 0.02 * (state.currentWeapon === 'shotgun' ? 3 : 1), 50);

      // Check hit
      const hitObject = weaponSystem.checkHit(targetManager.getTargets());
      if (hitObject) {
        const target = targetManager.findTarget(hitObject);
        if (target) {
          audioManager.playHit(state.volume);
          effectsManager.createHitEffect(target.mesh.position.clone());

          const result = targetManager.damageTarget(target, weapon.damage);
          if (result.destroyed) {
            audioManager.playExplosion(state.volume);
            effectsManager.createExplosion(target.mesh.position.clone());
            state.addScore(result.points);
            targetManager.removeTarget(target);

            // Respawn after delay
            setTimeout(() => {
              if (gameRef.current && useGameStore.getState().isPlaying) {
                targetManager.respawnTarget();
              }
            }, 1000);
          }
        }
      }
    } else {
      // Out of ammo or reloading - check why and auto-reload if empty
      const currentAmmo = state.ammo[state.currentWeapon];
      if (currentAmmo === 0 && !state.isReloading) {
        audioManager.playEmpty(state.volume);
        // Auto-reload when empty
        state.reload();
        audioManager.playReload(state.volume);
        const reloadTime = state.currentWeapon === 'shotgun' ? 2000 : state.currentWeapon === 'rifle' ? 1500 : 1000;
        setTimeout(() => {
          useGameStore.getState().setReloading(false);
        }, reloadTime);
      }
    }
  }, []); // No dependencies - always reads fresh state from store

  // Handle reload - read state directly from store
  const handleReload = useCallback(() => {
    const state = useGameStore.getState();
    if (!state.isPlaying || state.isPaused || state.isReloading) return;

    state.reload();
    audioManager.playReload(state.volume);

    // Reload time based on weapon
    const reloadTime = state.currentWeapon === 'shotgun' ? 2000 : state.currentWeapon === 'rifle' ? 1500 : 1000;
    setTimeout(() => {
      useGameStore.getState().setReloading(false);
    }, reloadTime);
  }, []); // No dependencies - always reads fresh state from store

  // Auto-fire for rifle - check state from store
  useEffect(() => {
    const checkAndStartAutoFire = () => {
      const state = useGameStore.getState();
      if (isMouseDownRef.current && state.isPlaying && !state.isPaused && WEAPONS[state.currentWeapon].automatic) {
        if (!autoFireIntervalRef.current) {
          autoFireIntervalRef.current = setInterval(() => {
            handleShoot();
          }, WEAPONS[state.currentWeapon].fireRate);
        }
      } else {
        if (autoFireIntervalRef.current) {
          clearInterval(autoFireIntervalRef.current);
          autoFireIntervalRef.current = null;
        }
      }
    };

    // Check on mount and when dependencies change
    checkAndStartAutoFire();

    return () => {
      if (autoFireIntervalRef.current) {
        clearInterval(autoFireIntervalRef.current);
        autoFireIntervalRef.current = null;
      }
    };
  }, [isPlaying, isPaused, currentWeapon, handleShoot]);

  // Event handlers - read state from store directly
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const state = useGameStore.getState();
      if (state.isPlaying && !state.isPaused && document.pointerLockElement) {
        gameRef.current?.player.handleMouseMove(e.movementX, e.movementY);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDownRef.current = true;
        const state = useGameStore.getState();
        if (state.isPlaying && !state.isPaused) {
          handleShoot();
          // Start auto-fire for automatic weapons
          if (WEAPONS[state.currentWeapon].automatic && !autoFireIntervalRef.current) {
            autoFireIntervalRef.current = setInterval(() => {
              handleShoot();
            }, WEAPONS[state.currentWeapon].fireRate);
          }
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDownRef.current = false;
        if (autoFireIntervalRef.current) {
          clearInterval(autoFireIntervalRef.current);
          autoFireIntervalRef.current = null;
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const state = useGameStore.getState();
      if (!state.isPlaying) return;

      if (e.code === 'Escape') {
        if (state.isPaused) {
          document.body.requestPointerLock();
          resumeGame();
        } else {
          document.exitPointerLock();
          pauseGame();
        }
        return;
      }

      if (state.isPaused) return;

      gameRef.current?.player.handleKeyDown(e.code);

      switch (e.code) {
        case 'KeyR':
          handleReload();
          break;
        case 'Digit1':
          switchWeapon('pistol');
          audioManager.playWeaponSwitch(state.volume);
          break;
        case 'Digit2':
          switchWeapon('rifle');
          audioManager.playWeaponSwitch(state.volume);
          break;
        case 'Digit3':
          switchWeapon('shotgun');
          audioManager.playWeaponSwitch(state.volume);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameRef.current?.player.handleKeyUp(e.code);
    };

    const handlePointerLockChange = () => {
      const state = useGameStore.getState();
      if (!document.pointerLockElement && state.isPlaying && !state.isPaused && !state.isGameOver) {
        pauseGame();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, [handleShoot, handleReload, switchWeapon, pauseGame, resumeGame]);

  // Start game
  const handleStart = useCallback(() => {
    if (!gameRef.current) return;

    setShowStartMenu(false);
    startGame();

    gameRef.current.player.reset();
    gameRef.current.targetManager.clear();
    gameRef.current.targetManager.spawnInitialTargets(10);
    gameRef.current.weaponSystem.clear();
    gameRef.current.effectsManager.clear();

    document.body.requestPointerLock();
  }, [startGame]);

  // Resume game
  const handleResume = useCallback(() => {
    document.body.requestPointerLock();
    resumeGame();
  }, [resumeGame]);

  // Quit to menu
  const handleQuit = useCallback(() => {
    document.exitPointerLock();
    resetGame();
    setShowStartMenu(true);
  }, [resetGame]);

  // Restart game
  const handleRestart = useCallback(() => {
    handleStart();
  }, [handleStart]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <div ref={containerRef} className="w-full h-full" />

      {isPlaying && !isPaused && !isGameOver && <HUD />}

      {showStartMenu && !isPlaying && !isGameOver && (
        <StartMenu onStart={handleStart} />
      )}

      {isPaused && !isGameOver && (
        <PauseMenu onResume={handleResume} onQuit={handleQuit} />
      )}

      {isGameOver && (
        <GameOverMenu score={score} onRestart={handleRestart} onQuit={handleQuit} />
      )}
    </div>
  );
}

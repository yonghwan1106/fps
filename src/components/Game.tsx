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
    isReloading,
    sensitivity,
    volume,
    startGame,
    pauseGame,
    resumeGame,
    endGame,
    resetGame,
    shoot,
    reload,
    setReloading,
    switchWeapon,
    addScore,
    score,
  } = useGameStore();

  const [showStartMenu, setShowStartMenu] = useState(true);
  const isMouseDownRef = useRef(false);
  const autoFireIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize game
  useEffect(() => {
    if (!containerRef.current) return;

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

  // Handle shooting
  const handleShoot = useCallback(() => {
    if (!gameRef.current || !isPlaying || isPaused || isReloading) return;

    const { camera, targetManager, weaponSystem, effectsManager } = gameRef.current;
    const weapon = WEAPONS[currentWeapon];

    if (shoot()) {
      audioManager.playShoot(currentWeapon, volume);
      createMuzzleFlash(gameRef.current.scene, camera.position.clone(), new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion));
      createScreenShake(camera, 0.02 * (currentWeapon === 'shotgun' ? 3 : 1), 50);

      // Check hit
      const hitObject = weaponSystem.checkHit(targetManager.getTargets());
      if (hitObject) {
        const target = targetManager.findTarget(hitObject);
        if (target) {
          audioManager.playHit(volume);
          effectsManager.createHitEffect(target.mesh.position.clone());

          const result = targetManager.damageTarget(target, weapon.damage);
          if (result.destroyed) {
            audioManager.playExplosion(volume);
            effectsManager.createExplosion(target.mesh.position.clone());
            addScore(result.points);
            targetManager.removeTarget(target);

            // Respawn after delay
            setTimeout(() => {
              if (gameRef.current && isPlaying) {
                targetManager.respawnTarget();
              }
            }, 1000);
          }
        }
      }
    } else {
      // Out of ammo
      const ammo = useGameStore.getState().ammo[currentWeapon];
      if (ammo === 0) {
        audioManager.playEmpty(volume);
      }
    }
  }, [isPlaying, isPaused, currentWeapon, isReloading, shoot, addScore, volume]);

  // Handle reload
  const handleReload = useCallback(() => {
    if (!isPlaying || isPaused || isReloading) return;

    reload();
    audioManager.playReload(volume);

    // Reload time based on weapon
    const reloadTime = currentWeapon === 'shotgun' ? 2000 : currentWeapon === 'rifle' ? 1500 : 1000;
    setTimeout(() => {
      setReloading(false);
    }, reloadTime);
  }, [isPlaying, isPaused, isReloading, currentWeapon, reload, setReloading, volume]);

  // Auto-fire for rifle
  useEffect(() => {
    if (isMouseDownRef.current && isPlaying && !isPaused && WEAPONS[currentWeapon].automatic) {
      autoFireIntervalRef.current = setInterval(() => {
        handleShoot();
      }, WEAPONS[currentWeapon].fireRate);
    }

    return () => {
      if (autoFireIntervalRef.current) {
        clearInterval(autoFireIntervalRef.current);
        autoFireIntervalRef.current = null;
      }
    };
  }, [isPlaying, isPaused, currentWeapon, handleShoot]);

  // Event handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isPlaying && !isPaused && document.pointerLockElement) {
        gameRef.current?.player.handleMouseMove(e.movementX, e.movementY);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDownRef.current = true;
        if (isPlaying && !isPaused) {
          handleShoot();
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
      if (!isPlaying) return;

      if (e.code === 'Escape') {
        if (isPaused) {
          document.body.requestPointerLock();
          resumeGame();
        } else {
          document.exitPointerLock();
          pauseGame();
        }
        return;
      }

      if (isPaused) return;

      gameRef.current?.player.handleKeyDown(e.code);

      switch (e.code) {
        case 'KeyR':
          handleReload();
          break;
        case 'Digit1':
          switchWeapon('pistol');
          audioManager.playWeaponSwitch(volume);
          break;
        case 'Digit2':
          switchWeapon('rifle');
          audioManager.playWeaponSwitch(volume);
          break;
        case 'Digit3':
          switchWeapon('shotgun');
          audioManager.playWeaponSwitch(volume);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameRef.current?.player.handleKeyUp(e.code);
    };

    const handlePointerLockChange = () => {
      if (!document.pointerLockElement && isPlaying && !isPaused && !isGameOver) {
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
  }, [isPlaying, isPaused, isGameOver, handleShoot, handleReload, switchWeapon, pauseGame, resumeGame, volume]);

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

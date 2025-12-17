'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import { useGameStore, WEAPONS, ABILITIES } from '@/store/gameStore';
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
  lastTime: number;
  spawnInterval: NodeJS.Timeout | null;
  dashRechargeInterval: NodeJS.Timeout | null;
}

export function Game() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameRefs | null>(null);

  const {
    isPlaying,
    isPaused,
    isGameOver,
    currentWeaponIndex,
    sensitivity,
    difficulty,
    gameMode,
    selectedAbility,
    isAbilityActive,
    abilityCooldownTimer,
    isSliding,
    isDashing,
    dashCharges,
    currentKillstreak,
    activeBuffs,
    speedBuffMultiplier,
    damageBuffMultiplier,
    perkMultipliers,
    waveNumber,
    enemiesRemainingInWave,
    waveIntermission,
    survivalTime,
    timeAttackTimer,
    startGame,
    pauseGame,
    resumeGame,
    resetGame,
    switchWeapon,
    switchSlot,
    score,
    takeDamage,
    heal,
    addScore,
    addKill,
    reload,
    setReloading,
    setADS,
    startSlide,
    endSlide,
    startDash,
    endDash,
    rechargeDash,
    useAbility,
    updateAbility,
    updateBuffs,
    updateGameMode,
    startWave,
    completeWave,
  } = useGameStore();

  const [showStartMenu, setShowStartMenu] = useState(true);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const isMouseDownRef = useRef(false);
  const autoFireIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastDamageTimeRef = useRef(0);
  const damageIntervalMs = 500;

  // Alert 메시지 표시
  const showAlert = useCallback((msg: string) => {
    setAlertMessage(msg);
    setTimeout(() => setAlertMessage(null), 1500);
  }, []);

  // Initialize game
  useEffect(() => {
    if (!containerRef.current) return;

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
      lastTime: performance.now(),
      spawnInterval: null,
      dashRechargeInterval: null,
    };

    const onResize = () => {
      if (containerRef.current && gameRef.current) {
        handleResize(gameRef.current.camera, gameRef.current.renderer, containerRef.current);
      }
    };
    window.addEventListener('resize', onResize);

    renderer.render(scene, camera);

    return () => {
      window.removeEventListener('resize', onResize);
      if (gameRef.current?.animationId) {
        cancelAnimationFrame(gameRef.current.animationId);
      }
      if (gameRef.current?.spawnInterval) {
        clearInterval(gameRef.current.spawnInterval);
      }
      if (gameRef.current?.dashRechargeInterval) {
        clearInterval(gameRef.current.dashRechargeInterval);
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
      const now = performance.now();
      const delta = (now - gameRef.current!.lastTime) / 1000;
      gameRef.current!.lastTime = now;

      if (isPlaying && !isPaused) {
        const state = useGameStore.getState();

        // 플레이어 업데이트
        player.update();

        // 플레이어 위치 전달
        targetManager.setPlayerPosition(camera.position);
        targetManager.setDifficulty(state.difficulty);

        // 적 업데이트
        targetManager.update(delta);

        // 무기/이펙트 업데이트
        weaponSystem.update();
        effectsManager.update();

        // 상태 업데이트
        state.updateAbility(delta);
        state.updateBuffs(delta);
        state.updateGameMode(delta);

        // Scanner 어빌리티 효과
        if (state.selectedAbility === 'scanner' && state.isAbilityActive) {
          targetManager.highlightAllEnemies(true);
        } else {
          targetManager.highlightAllEnemies(false);
        }

        // 플레이어 데미지 체크
        const checkNow = Date.now();
        if (checkNow - lastDamageTimeRef.current >= damageIntervalMs) {
          // 근접 데미지
          const contactDamage = targetManager.checkPlayerDamage(camera.position, 3);
          // 적 총알 데미지
          const bulletDamage = targetManager.checkBulletDamage(camera.position, 2);

          const totalDamage = contactDamage + bulletDamage;
          if (totalDamage > 0) {
            state.takeDamage(totalDamage);
            lastDamageTimeRef.current = checkNow;
          }
        }

        // 아이템 수집 체크
        const item = targetManager.checkItemPickup(camera.position, 4);
        if (item) {
          const collected = targetManager.collectItem(item);
          if (collected.type === 'health') {
            state.heal(30);
            showAlert('HEALTH +30');
          } else {
            // 탄약 충전
            state.setReloading(false); // 즉시 탄약 충전
            showAlert('AMMO REFILLED');
          }
          audioManager.playHit(state.volume);
        }

        // Wave 모드 체크
        if (state.gameMode === 'wave') {
          if (targetManager.getEnemyCount() === 0 && !state.waveIntermission && state.waveNumber > 0) {
            state.completeWave();
            showAlert(`WAVE ${state.waveNumber} COMPLETE!`);
          }
        }

        // 슬라이딩 타이머
        if (state.isSliding) {
          const newSlideTimer = state.slideTimer - delta;
          if (newSlideTimer <= 0) {
            state.endSlide();
          } else {
            useGameStore.setState({ slideTimer: newSlideTimer });
          }
        }

        // 슬라이드 쿨다운
        if (state.slideCooldownTimer > 0) {
          useGameStore.setState({ slideCooldownTimer: Math.max(0, state.slideCooldownTimer - delta) });
        }

        // 대시 타이머
        if (state.isDashing) {
          const newDashTimer = state.dashTimer - delta;
          if (newDashTimer <= 0) {
            state.endDash();
          } else {
            useGameStore.setState({ dashTimer: newDashTimer });
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
  }, [isPlaying, isPaused, showAlert]);

  // Update player sensitivity
  useEffect(() => {
    if (gameRef.current?.player) {
      gameRef.current.player.setSensitivity(sensitivity);
    }
  }, [sensitivity]);

  // Handle shooting
  const handleShoot = useCallback(() => {
    if (!gameRef.current) return;

    const state = useGameStore.getState();
    if (!state.isPlaying || state.isPaused) return;

    const { camera, targetManager, weaponSystem, effectsManager } = gameRef.current;
    const weapon = WEAPONS[state.currentWeaponIndex];

    if (state.shoot()) {
      audioManager.playShoot('rifle', state.volume);

      // 데미지 계산 (버프 적용)
      let damage = weapon.damage * state.perkMultipliers.baseDamage * state.damageBuffMultiplier;

      // 머즐 플래시
      createMuzzleFlash(
        gameRef.current.scene,
        camera.position.clone(),
        new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
      );

      // 화면 흔들림
      const shakeIntensity = weapon.category === 'shotgun' ? 0.06 : weapon.category === 'sniper' ? 0.08 : 0.02;
      createScreenShake(camera, shakeIntensity, 50);

      // 산탄총 처리
      const pelletCount = weapon.pelletCount || 1;
      for (let i = 0; i < pelletCount; i++) {
        const spread = state.isADS ? weapon.adsSpread : weapon.spread;
        const hitObject = weaponSystem.checkHitWithSpread(targetManager.getTargets(), spread);

        if (hitObject) {
          const target = targetManager.findTarget(hitObject);
          if (target) {
            audioManager.playHit(state.volume);
            effectsManager.createHitEffect(target.mesh.position.clone());

            // 헤드샷 체크 (상단 20% 영역)
            const hitY = hitObject.position?.y || target.mesh.position.y;
            const targetTop = target.mesh.position.y + 1;
            const isHeadshot = hitY > targetTop - 0.4;

            const headShotDamage = isHeadshot
              ? damage * weapon.headshotMult * state.perkMultipliers.headshotBonus
              : damage;

            const result = targetManager.damageEnemy(target, headShotDamage, isHeadshot);

            if (isHeadshot) {
              showAlert('HEADSHOT!');
            }

            if (result.destroyed) {
              audioManager.playExplosion(state.volume);
              effectsManager.createExplosion(target.mesh.position.clone());
              state.addScore(result.points);
              state.addKill();
              targetManager.removeTarget(target);

              // Wave 모드 적 수 감소
              if (state.gameMode === 'wave') {
                useGameStore.setState({
                  enemiesRemainingInWave: Math.max(0, state.enemiesRemainingInWave - 1)
                });
              }

              // 리스폰 (Survival/Time Attack 모드)
              if (state.gameMode !== 'wave') {
                setTimeout(() => {
                  if (gameRef.current && useGameStore.getState().isPlaying) {
                    targetManager.respawnTarget();
                  }
                }, 1000);
              }
            }
          }
        }
      }
    } else {
      // 탄약 없음
      const currentAmmo = state.ammo[state.currentWeaponIndex];
      if (currentAmmo === 0 && !state.isReloading) {
        audioManager.playEmpty(state.volume);
        handleReload();
      }
    }
  }, [showAlert]);

  // Handle reload
  const handleReload = useCallback(() => {
    const state = useGameStore.getState();
    if (!state.isPlaying || state.isPaused || state.isReloading) return;

    const weapon = WEAPONS[state.currentWeaponIndex];
    if (state.ammo[state.currentWeaponIndex] === weapon.ammoCapacity) return;

    state.reload();
    audioManager.playReload(state.volume);

    const reloadTime = weapon.reloadTime * state.perkMultipliers.reloadTime;
    setTimeout(() => {
      useGameStore.getState().setReloading(false);
    }, reloadTime);
  }, []);

  // Handle ability
  const handleUseAbility = useCallback(() => {
    const state = useGameStore.getState();
    if (!state.isPlaying || state.isPaused) return;
    if (state.abilityCooldownTimer > 0) return;

    state.useAbility();

    // Blink 처리 (순간이동)
    if (state.selectedAbility === 'blink' && gameRef.current) {
      const { camera, player } = gameRef.current;
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      dir.y = 0;
      dir.normalize();
      camera.position.add(dir.multiplyScalar(30));
      showAlert('BLINK!');
    } else if (state.selectedAbility === 'overcharge') {
      showAlert('OVERCHARGE ACTIVE!');
    } else if (state.selectedAbility === 'phase') {
      showAlert('PHASE SHIFT!');
    } else if (state.selectedAbility === 'scanner') {
      showAlert('THREAT SCANNER!');
    }

    audioManager.playWeaponSwitch(state.volume);
  }, [showAlert]);

  // Auto-fire for automatic weapons
  useEffect(() => {
    const checkAndStartAutoFire = () => {
      const state = useGameStore.getState();
      const weapon = WEAPONS[state.currentWeaponIndex];
      const isAutomatic = weapon.category === 'ar' || weapon.category === 'smg' || weapon.category === 'lmg';

      if (isMouseDownRef.current && state.isPlaying && !state.isPaused && isAutomatic) {
        if (!autoFireIntervalRef.current) {
          autoFireIntervalRef.current = setInterval(() => {
            handleShoot();
          }, weapon.fireRate);
        }
      } else {
        if (autoFireIntervalRef.current) {
          clearInterval(autoFireIntervalRef.current);
          autoFireIntervalRef.current = null;
        }
      }
    };

    checkAndStartAutoFire();

    return () => {
      if (autoFireIntervalRef.current) {
        clearInterval(autoFireIntervalRef.current);
        autoFireIntervalRef.current = null;
      }
    };
  }, [isPlaying, isPaused, currentWeaponIndex, handleShoot]);

  // Event handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const state = useGameStore.getState();
      if (state.isPlaying && !state.isPaused && document.pointerLockElement) {
        gameRef.current?.player.handleMouseMove(e.movementX, e.movementY);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const state = useGameStore.getState();

      if (e.button === 0) { // 좌클릭 - 사격
        isMouseDownRef.current = true;
        if (state.isPlaying && !state.isPaused) {
          handleShoot();

          const weapon = WEAPONS[state.currentWeaponIndex];
          const isAutomatic = weapon.category === 'ar' || weapon.category === 'smg' || weapon.category === 'lmg';

          if (isAutomatic && !autoFireIntervalRef.current) {
            autoFireIntervalRef.current = setInterval(() => {
              handleShoot();
            }, weapon.fireRate);
          }
        }
      } else if (e.button === 2) { // 우클릭 - ADS
        state.setADS(true);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDownRef.current = false;
        if (autoFireIntervalRef.current) {
          clearInterval(autoFireIntervalRef.current);
          autoFireIntervalRef.current = null;
        }
      } else if (e.button === 2) {
        useGameStore.getState().setADS(false);
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
        case 'KeyE': // 어빌리티
          handleUseAbility();
          break;
        case 'KeyQ': // 대시
          if (state.dashCharges > 0 && !state.isDashing) {
            state.startDash();
            showAlert('DASH!');
          }
          break;
        case 'KeyC': // 슬라이드/앉기
        case 'ControlLeft':
          if (e.shiftKey && !state.isSliding && state.slideCooldownTimer <= 0) {
            state.startSlide();
          }
          break;
        case 'KeyX': // 무기 슬롯 전환
          state.switchSlot();
          audioManager.playWeaponSwitch(state.volume);
          break;
        // 무기 선택 (1-8)
        case 'Digit1': state.switchWeapon(0); audioManager.playWeaponSwitch(state.volume); break;
        case 'Digit2': state.switchWeapon(1); audioManager.playWeaponSwitch(state.volume); break;
        case 'Digit3': state.switchWeapon(2); audioManager.playWeaponSwitch(state.volume); break;
        case 'Digit4': state.switchWeapon(3); audioManager.playWeaponSwitch(state.volume); break;
        case 'Digit5': state.switchWeapon(4); audioManager.playWeaponSwitch(state.volume); break;
        case 'Digit6': state.switchWeapon(5); audioManager.playWeaponSwitch(state.volume); break;
        case 'Digit7': state.switchWeapon(6); audioManager.playWeaponSwitch(state.volume); break;
        case 'Digit8': state.switchWeapon(7); audioManager.playWeaponSwitch(state.volume); break;
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

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [handleShoot, handleReload, handleUseAbility, pauseGame, resumeGame, showAlert]);

  // Start game
  const handleStart = useCallback(() => {
    if (!gameRef.current) return;

    const state = useGameStore.getState();

    setShowStartMenu(false);
    startGame();

    gameRef.current.player.reset();
    gameRef.current.targetManager.clear();
    gameRef.current.targetManager.setDifficulty(state.difficulty);

    // 게임 모드에 따른 초기화
    if (state.gameMode === 'wave') {
      state.startWave();
      // Wave 모드: 웨이브별 적 스폰
      const enemyCount = 5 + state.waveNumber * 2;
      gameRef.current.targetManager.spawnInitialTargets(enemyCount);
      showAlert(`WAVE ${state.waveNumber + 1}`);
    } else {
      // Survival/Time Attack: 기본 적 스폰
      gameRef.current.targetManager.spawnInitialTargets(15);
    }

    gameRef.current.weaponSystem.clear();
    gameRef.current.effectsManager.clear();

    // 적 스폰 인터벌 (Survival/Time Attack 모드)
    if (state.gameMode !== 'wave') {
      gameRef.current.spawnInterval = setInterval(() => {
        if (useGameStore.getState().isPlaying && !useGameStore.getState().isPaused) {
          gameRef.current?.targetManager.respawnTarget();
        }
      }, 3000);
    }

    // 대시 충전 인터벌
    gameRef.current.dashRechargeInterval = setInterval(() => {
      const currentState = useGameStore.getState();
      if (currentState.isPlaying && !currentState.isPaused && currentState.dashCharges < 2) {
        currentState.rechargeDash();
      }
    }, 3000);

    document.body.requestPointerLock();
  }, [startGame, showAlert]);

  // Resume game
  const handleResume = useCallback(() => {
    document.body.requestPointerLock();
    resumeGame();
  }, [resumeGame]);

  // Quit to menu
  const handleQuit = useCallback(() => {
    document.exitPointerLock();
    if (gameRef.current?.spawnInterval) {
      clearInterval(gameRef.current.spawnInterval);
    }
    if (gameRef.current?.dashRechargeInterval) {
      clearInterval(gameRef.current.dashRechargeInterval);
    }
    resetGame();
    setShowStartMenu(true);
  }, [resetGame]);

  // Restart game
  const handleRestart = useCallback(() => {
    if (gameRef.current?.spawnInterval) {
      clearInterval(gameRef.current.spawnInterval);
    }
    if (gameRef.current?.dashRechargeInterval) {
      clearInterval(gameRef.current.dashRechargeInterval);
    }
    handleStart();
  }, [handleStart]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <div ref={containerRef} className="w-full h-full" />

      {/* Alert 메시지 */}
      {alertMessage && (
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="text-4xl font-bold text-yellow-400 animate-pulse drop-shadow-lg">
            {alertMessage}
          </div>
        </div>
      )}

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

import { create } from 'zustand';

// === 타입 정의 ===
export type Difficulty = 'easy' | 'normal' | 'hard';
export type GameMode = 'survival' | 'wave' | 'time_attack';
export type AbilityType = 'blink' | 'overcharge' | 'phase' | 'scanner';
export type PerkType = 'quickReload' | 'thickSkin' | 'deadEye' | 'marathoner' | 'scavenger' | 'vampirism' | 'ninja' | 'heavyHitter';
export type MovementState = 'idle' | 'walking' | 'sprinting' | 'crouching' | 'sliding' | 'dashing' | 'jumping' | 'wall_running' | 'falling';

// === 무기 설정 (8종) ===
export interface WeaponConfig {
  name: string;
  category: 'ar' | 'smg' | 'shotgun' | 'sniper' | 'lmg' | 'dmr' | 'pistol';
  damage: number;
  fireRate: number;
  spread: number;
  adsSpread: number;
  ammoCapacity: number;
  reloadTime: number;
  color: number;
  range: number;
  headshotMult: number;
  slot: 'primary' | 'secondary';
  pelletCount?: number;
  scopeZoom?: number;
  movementPenalty?: number;
}

export const WEAPONS: WeaponConfig[] = [
  // PRIMARY WEAPONS
  {
    name: "Pulse Rifle",
    category: "ar",
    damage: 22,
    fireRate: 100,
    spread: 0.025,
    adsSpread: 0.008,
    ammoCapacity: 30,
    reloadTime: 1500,
    color: 0x00ffff,
    range: 500,
    headshotMult: 1.5,
    slot: "primary"
  },
  {
    name: "Phantom AR",
    category: "ar",
    damage: 26,
    fireRate: 120,
    spread: 0.02,
    adsSpread: 0.005,
    ammoCapacity: 25,
    reloadTime: 1800,
    color: 0x00ff88,
    range: 600,
    headshotMult: 1.5,
    slot: "primary"
  },
  {
    name: "Viper SMG",
    category: "smg",
    damage: 14,
    fireRate: 50,
    spread: 0.08,
    adsSpread: 0.04,
    ammoCapacity: 35,
    reloadTime: 1200,
    color: 0xffaa00,
    range: 300,
    headshotMult: 1.3,
    slot: "primary"
  },
  {
    name: "Neon Shotgun",
    category: "shotgun",
    damage: 18,
    fireRate: 900,
    spread: 0.18,
    adsSpread: 0.12,
    ammoCapacity: 6,
    pelletCount: 8,
    reloadTime: 2500,
    color: 0xff0000,
    range: 150,
    headshotMult: 1.2,
    slot: "primary"
  },
  {
    name: "Ion Sniper",
    category: "sniper",
    damage: 150,
    fireRate: 1500,
    spread: 0.001,
    adsSpread: 0.0001,
    ammoCapacity: 5,
    reloadTime: 3000,
    color: 0xff00ff,
    range: 1000,
    headshotMult: 2.5,
    scopeZoom: 3.0,
    slot: "primary"
  },
  {
    name: "Plasma LMG",
    category: "lmg",
    damage: 18,
    fireRate: 80,
    spread: 0.06,
    adsSpread: 0.03,
    ammoCapacity: 100,
    reloadTime: 4000,
    color: 0x00ff00,
    range: 450,
    headshotMult: 1.3,
    movementPenalty: 0.7,
    slot: "primary"
  },
  {
    name: "Arc DMR",
    category: "dmr",
    damage: 55,
    fireRate: 400,
    spread: 0.01,
    adsSpread: 0.002,
    ammoCapacity: 15,
    reloadTime: 2000,
    color: 0x8800ff,
    range: 700,
    headshotMult: 2.0,
    slot: "primary"
  },
  // SECONDARY WEAPON
  {
    name: "Volt Pistol",
    category: "pistol",
    damage: 35,
    fireRate: 300,
    spread: 0.03,
    adsSpread: 0.01,
    ammoCapacity: 12,
    reloadTime: 1000,
    color: 0xffffff,
    range: 400,
    headshotMult: 1.8,
    slot: "secondary"
  }
];

// === 난이도 설정 ===
export const DIFFICULTY_CONFIG: Record<Difficulty, { damageMultiplier: number; spawnRate: number; enemyHealthMult: number; label: string }> = {
  easy: { damageMultiplier: 0.5, spawnRate: 3000, enemyHealthMult: 0.7, label: '쉬움' },
  normal: { damageMultiplier: 1.0, spawnRate: 2000, enemyHealthMult: 1.0, label: '보통' },
  hard: { damageMultiplier: 1.5, spawnRate: 1000, enemyHealthMult: 1.5, label: '어려움' },
};

// === 킬스트릭 설정 ===
export interface KillstreakConfig {
  name: string;
  duration: number;
  icon: string;
  color: number;
}

export const KILLSTREAKS: Record<number, KillstreakConfig> = {
  3: { name: "Speed Boost", duration: 10, icon: "⚡", color: 0x00ffff },
  5: { name: "Damage Amp", duration: 8, icon: "💥", color: 0xff0000 },
  7: { name: "Shield", duration: 6, icon: "🛡️", color: 0x00ff00 },
  10: { name: "Orbital Strike", duration: 0, icon: "☄️", color: 0xffff00 },
  15: { name: "Neon Storm", duration: 12, icon: "🌩️", color: 0xff00ff }
};

// === 어빌리티 설정 ===
export interface AbilityConfig {
  name: string;
  description: string;
  cooldown: number;
  key: string;
}

export const ABILITIES: Record<AbilityType, AbilityConfig> = {
  blink: { name: "Blink", description: "순간이동 (30m)", cooldown: 8, key: "E" },
  overcharge: { name: "Overcharge", description: "5초간 연사속도 2배", cooldown: 15, key: "E" },
  phase: { name: "Phase Shift", description: "2초간 무적", cooldown: 20, key: "E" },
  scanner: { name: "Scanner", description: "5초간 적 하이라이트", cooldown: 12, key: "E" }
};

// === 퍽 설정 ===
export interface PerkConfig {
  name: string;
  description: string;
}

export const PERKS: Record<PerkType, PerkConfig> = {
  quickReload: { name: "Quick Reload", description: "재장전 시간 -30%" },
  thickSkin: { name: "Thick Skin", description: "받는 데미지 -15%" },
  deadEye: { name: "Dead Eye", description: "헤드샷 데미지 +25%" },
  marathoner: { name: "Marathoner", description: "무한 달리기" },
  scavenger: { name: "Scavenger", description: "탄약 획득량 +50%" },
  vampirism: { name: "Vampirism", description: "킬 시 체력 +10" },
  ninja: { name: "Ninja", description: "조용한 이동, 빠른 앉기" },
  heavyHitter: { name: "Heavy Hitter", description: "기본 데미지 +10%" }
};

// === 퍽 배율 ===
export interface PerkMultipliers {
  reloadTime: number;
  damageTaken: number;
  headshotBonus: number;
  ammoPickup: number;
  baseDamage: number;
  crouchSpeed: number;
}

// === 버프 상태 ===
export interface ActiveBuff {
  type: 'speed' | 'damage' | 'shield' | 'storm';
  duration: number;
  name: string;
}

// === 게임 상태 인터페이스 ===
interface GameState {
  // 게임 상태
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;

  // 플레이어 스탯
  health: number;
  score: number;

  // 쉴드
  hasShield: boolean;
  shieldHealth: number;

  // 무기 시스템
  currentWeaponIndex: number;
  primaryWeaponIndex: number;
  secondaryWeaponIndex: number;
  currentSlot: 'primary' | 'secondary';
  ammo: number[];
  lastFireTime: number;
  isReloading: boolean;
  isADS: boolean;

  // 이동 시스템
  movementState: MovementState;
  isSliding: boolean;
  slideTimer: number;
  slideCooldownTimer: number;
  dashCharges: number;
  dashCooldownTimer: number;
  isDashing: boolean;
  dashTimer: number;
  isWallRunning: boolean;
  wallRunTimer: number;

  // 킬스트릭
  currentKillstreak: number;
  highestKillstreak: number;
  activeBuffs: ActiveBuff[];
  speedBuffMultiplier: number;
  damageBuffMultiplier: number;

  // 어빌리티
  selectedAbility: AbilityType;
  abilityCooldownTimer: number;
  isAbilityActive: boolean;
  abilityDuration: number;

  // 퍽
  selectedPerks: PerkType[];
  perkMultipliers: PerkMultipliers;

  // 게임 모드
  gameMode: GameMode;
  waveNumber: number;
  enemiesRemainingInWave: number;
  waveIntermission: boolean;
  intermissionTimer: number;
  survivalTime: number;
  timeAttackTimer: number;
  targetScore: number;

  // 설정
  sensitivity: number;
  volume: number;
  difficulty: Difficulty;

  // === 액션 ===
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  resetGame: () => void;

  // 플레이어 액션
  setHealth: (health: number) => void;
  takeDamage: (damage: number) => void;
  heal: (amount: number) => void;
  addScore: (points: number) => void;

  // 무기 액션
  switchWeapon: (index: number) => void;
  switchSlot: () => void;
  shoot: () => boolean;
  reload: () => void;
  setReloading: (reloading: boolean) => void;
  setADS: (ads: boolean) => void;

  // 이동 액션
  setMovementState: (state: MovementState) => void;
  startSlide: () => void;
  endSlide: () => void;
  startDash: () => void;
  endDash: () => void;
  rechargeDash: () => void;

  // 킬스트릭 액션
  addKill: () => void;
  resetKillstreak: () => void;
  activateKillstreak: (streak: number) => void;
  updateBuffs: (delta: number) => void;

  // 어빌리티 액션
  setSelectedAbility: (ability: AbilityType) => void;
  useAbility: () => void;
  updateAbility: (delta: number) => void;

  // 퍽 액션
  setSelectedPerks: (perks: PerkType[]) => void;
  togglePerk: (perk: PerkType) => void;
  applyPerks: () => void;

  // 게임 모드 액션
  setGameMode: (mode: GameMode) => void;
  startWave: () => void;
  completeWave: () => void;
  updateGameMode: (delta: number) => void;

  // 설정 액션
  setSensitivity: (sensitivity: number) => void;
  setVolume: (volume: number) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setPrimaryWeapon: (index: number) => void;
}

// === 초기 탄약 배열 생성 ===
const createInitialAmmo = (): number[] => WEAPONS.map(w => w.ammoCapacity);

// === 퍽 배율 계산 ===
const calculatePerkMultipliers = (perks: PerkType[]): PerkMultipliers => {
  const multipliers: PerkMultipliers = {
    reloadTime: 1.0,
    damageTaken: 1.0,
    headshotBonus: 1.0,
    ammoPickup: 1.0,
    baseDamage: 1.0,
    crouchSpeed: 1.0
  };

  perks.forEach(perk => {
    switch (perk) {
      case 'quickReload':
        multipliers.reloadTime = 0.7;
        break;
      case 'thickSkin':
        multipliers.damageTaken = 0.85;
        break;
      case 'deadEye':
        multipliers.headshotBonus = 1.25;
        break;
      case 'scavenger':
        multipliers.ammoPickup = 1.5;
        break;
      case 'heavyHitter':
        multipliers.baseDamage = 1.1;
        break;
      case 'ninja':
        multipliers.crouchSpeed = 1.5;
        break;
    }
  });

  return multipliers;
};

// === Zustand 스토어 ===
export const useGameStore = create<GameState>((set, get) => ({
  // 초기 상태
  isPlaying: false,
  isPaused: false,
  isGameOver: false,

  health: 100,
  score: 0,

  hasShield: false,
  shieldHealth: 0,

  currentWeaponIndex: 0,
  primaryWeaponIndex: 0,
  secondaryWeaponIndex: 7,
  currentSlot: 'primary',
  ammo: createInitialAmmo(),
  lastFireTime: 0,
  isReloading: false,
  isADS: false,

  movementState: 'idle',
  isSliding: false,
  slideTimer: 0,
  slideCooldownTimer: 0,
  dashCharges: 2,
  dashCooldownTimer: 0,
  isDashing: false,
  dashTimer: 0,
  isWallRunning: false,
  wallRunTimer: 0,

  currentKillstreak: 0,
  highestKillstreak: 0,
  activeBuffs: [],
  speedBuffMultiplier: 1.0,
  damageBuffMultiplier: 1.0,

  selectedAbility: 'blink',
  abilityCooldownTimer: 0,
  isAbilityActive: false,
  abilityDuration: 0,

  selectedPerks: ['quickReload', 'vampirism'],
  perkMultipliers: calculatePerkMultipliers(['quickReload', 'vampirism']),

  gameMode: 'survival',
  waveNumber: 0,
  enemiesRemainingInWave: 0,
  waveIntermission: false,
  intermissionTimer: 0,
  survivalTime: 0,
  timeAttackTimer: 120,
  targetScore: 5000,

  sensitivity: 0.002,
  volume: 0.5,
  difficulty: 'normal',

  // === 게임 상태 액션 ===
  startGame: () => {
    const state = get();
    set({
      isPlaying: true,
      isPaused: false,
      isGameOver: false,
      health: 100,
      score: 0,
      hasShield: false,
      shieldHealth: 0,
      currentWeaponIndex: state.primaryWeaponIndex,
      currentSlot: 'primary',
      ammo: createInitialAmmo(),
      isReloading: false,
      isADS: false,
      movementState: 'idle',
      isSliding: false,
      slideTimer: 0,
      slideCooldownTimer: 0,
      dashCharges: 2,
      dashCooldownTimer: 0,
      isDashing: false,
      dashTimer: 0,
      isWallRunning: false,
      wallRunTimer: 0,
      currentKillstreak: 0,
      activeBuffs: [],
      speedBuffMultiplier: 1.0,
      damageBuffMultiplier: 1.0,
      abilityCooldownTimer: 0,
      isAbilityActive: false,
      abilityDuration: 0,
      waveNumber: 0,
      enemiesRemainingInWave: 0,
      waveIntermission: false,
      intermissionTimer: 0,
      survivalTime: 0,
      timeAttackTimer: 120,
    });
    get().applyPerks();
  },

  pauseGame: () => set({ isPaused: true }),
  resumeGame: () => set({ isPaused: false }),
  endGame: () => set({ isPlaying: false, isGameOver: true }),

  resetGame: () => set({
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    health: 100,
    score: 0,
    hasShield: false,
    shieldHealth: 0,
    currentWeaponIndex: 0,
    currentSlot: 'primary',
    ammo: createInitialAmmo(),
    isReloading: false,
    isADS: false,
    currentKillstreak: 0,
    activeBuffs: [],
    speedBuffMultiplier: 1.0,
    damageBuffMultiplier: 1.0,
    abilityCooldownTimer: 0,
    isAbilityActive: false,
    abilityDuration: 0,
  }),

  // === 플레이어 액션 ===
  setHealth: (health) => {
    set({ health: Math.max(0, Math.min(100, health)) });
    if (health <= 0) {
      get().endGame();
    }
  },

  takeDamage: (damage) => {
    const state = get();
    const multiplier = DIFFICULTY_CONFIG[state.difficulty].damageMultiplier * state.perkMultipliers.damageTaken;

    // Phase Shift 체크
    if (state.selectedAbility === 'phase' && state.isAbilityActive) {
      return; // 무적 상태
    }

    let actualDamage = Math.round(damage * multiplier);

    // 쉴드 먼저 소모
    if (state.hasShield && state.shieldHealth > 0) {
      if (state.shieldHealth >= actualDamage) {
        set({ shieldHealth: state.shieldHealth - actualDamage });
        return;
      } else {
        actualDamage -= state.shieldHealth;
        set({ hasShield: false, shieldHealth: 0 });
      }
    }

    const newHealth = Math.max(0, state.health - actualDamage);
    set({ health: newHealth });

    if (newHealth <= 0) {
      get().endGame();
    } else {
      get().resetKillstreak();
    }
  },

  heal: (amount) => {
    const state = get();
    set({ health: Math.min(100, state.health + amount) });
  },

  addScore: (points) => set((state) => ({ score: state.score + points })),

  // === 무기 액션 ===
  switchWeapon: (index) => {
    const state = get();
    if (state.isReloading) return;
    if (index < 0 || index >= WEAPONS.length) return;
    set({ currentWeaponIndex: index, isReloading: false, isADS: false });
  },

  switchSlot: () => {
    const state = get();
    if (state.isReloading) return;

    if (state.currentSlot === 'primary') {
      set({
        currentSlot: 'secondary',
        currentWeaponIndex: state.secondaryWeaponIndex,
        isADS: false
      });
    } else {
      set({
        currentSlot: 'primary',
        currentWeaponIndex: state.primaryWeaponIndex,
        isADS: false
      });
    }
  },

  shoot: () => {
    const state = get();
    const weapon = WEAPONS[state.currentWeaponIndex];
    const now = Date.now();

    if (state.isReloading) return false;
    if (state.ammo[state.currentWeaponIndex] <= 0) return false;

    // Overcharge 어빌리티 - 연사 속도 2배
    const fireRateMultiplier = (state.selectedAbility === 'overcharge' && state.isAbilityActive) ? 0.5 : 1;
    if (now - state.lastFireTime < weapon.fireRate * fireRateMultiplier) return false;

    const newAmmo = [...state.ammo];
    newAmmo[state.currentWeaponIndex]--;

    set({
      ammo: newAmmo,
      lastFireTime: now,
    });

    return true;
  },

  reload: () => {
    const state = get();
    const weapon = WEAPONS[state.currentWeaponIndex];
    if (state.ammo[state.currentWeaponIndex] === weapon.ammoCapacity) return;
    if (state.isReloading) return;

    set({ isReloading: true });
  },

  setReloading: (reloading) => {
    if (!reloading) {
      const state = get();
      const weapon = WEAPONS[state.currentWeaponIndex];
      const newAmmo = [...state.ammo];
      newAmmo[state.currentWeaponIndex] = weapon.ammoCapacity;
      set({
        isReloading: false,
        ammo: newAmmo,
      });
    } else {
      set({ isReloading: reloading });
    }
  },

  setADS: (ads) => set({ isADS: ads }),

  // === 이동 액션 ===
  setMovementState: (state) => set({ movementState: state }),

  startSlide: () => {
    const state = get();
    if (state.isSliding || state.slideCooldownTimer > 0) return;
    set({
      isSliding: true,
      slideTimer: 0.6,
      movementState: 'sliding'
    });
  },

  endSlide: () => set({
    isSliding: false,
    slideCooldownTimer: 1.0,
    movementState: 'idle'
  }),

  startDash: () => {
    const state = get();
    if (state.dashCharges <= 0 || state.isDashing) return;
    set({
      isDashing: true,
      dashTimer: 0.15,
      dashCharges: state.dashCharges - 1,
      movementState: 'dashing'
    });
  },

  endDash: () => set({
    isDashing: false,
    movementState: 'idle'
  }),

  rechargeDash: () => {
    const state = get();
    if (state.dashCharges < 2) {
      set({ dashCharges: state.dashCharges + 1 });
    }
  },

  // === 킬스트릭 액션 ===
  addKill: () => {
    const state = get();
    const newKillstreak = state.currentKillstreak + 1;
    const newHighest = Math.max(newKillstreak, state.highestKillstreak);

    set({
      currentKillstreak: newKillstreak,
      highestKillstreak: newHighest
    });

    // 킬스트릭 보상 체크
    if (KILLSTREAKS[newKillstreak]) {
      get().activateKillstreak(newKillstreak);
    }

    // Vampirism 퍽
    if (state.selectedPerks.includes('vampirism')) {
      get().heal(10);
    }
  },

  resetKillstreak: () => set({ currentKillstreak: 0 }),

  activateKillstreak: (streak) => {
    const state = get();
    const ks = KILLSTREAKS[streak];
    if (!ks) return;

    const newBuffs = [...state.activeBuffs];

    switch (streak) {
      case 3: // Speed Boost
        set({ speedBuffMultiplier: 1.5 });
        newBuffs.push({ type: 'speed', duration: ks.duration, name: ks.name });
        break;
      case 5: // Damage Amp
        set({ damageBuffMultiplier: 1.5 });
        newBuffs.push({ type: 'damage', duration: ks.duration, name: ks.name });
        break;
      case 7: // Shield
        set({ hasShield: true, shieldHealth: 50 });
        newBuffs.push({ type: 'shield', duration: ks.duration, name: ks.name });
        break;
      case 10: // Orbital Strike - 즉시 효과
        // 이건 Game 컴포넌트에서 처리
        break;
      case 15: // Neon Storm
        newBuffs.push({ type: 'storm', duration: ks.duration, name: ks.name });
        break;
    }

    set({ activeBuffs: newBuffs });
  },

  updateBuffs: (delta) => {
    const state = get();
    const newBuffs: ActiveBuff[] = [];

    for (const buff of state.activeBuffs) {
      buff.duration -= delta;
      if (buff.duration > 0) {
        newBuffs.push(buff);
      } else {
        // 버프 종료 처리
        switch (buff.type) {
          case 'speed':
            set({ speedBuffMultiplier: 1.0 });
            break;
          case 'damage':
            set({ damageBuffMultiplier: 1.0 });
            break;
          case 'shield':
            set({ hasShield: false, shieldHealth: 0 });
            break;
        }
      }
    }

    set({ activeBuffs: newBuffs });
  },

  // === 어빌리티 액션 ===
  setSelectedAbility: (ability) => set({ selectedAbility: ability }),

  useAbility: () => {
    const state = get();
    if (state.abilityCooldownTimer > 0) return;

    const ability = ABILITIES[state.selectedAbility];
    set({ abilityCooldownTimer: ability.cooldown });

    switch (state.selectedAbility) {
      case 'blink':
        // Blink은 Game 컴포넌트에서 처리 (위치 이동)
        break;
      case 'overcharge':
        set({ isAbilityActive: true, abilityDuration: 5 });
        break;
      case 'phase':
        set({ isAbilityActive: true, abilityDuration: 2 });
        break;
      case 'scanner':
        set({ isAbilityActive: true, abilityDuration: 5 });
        break;
    }
  },

  updateAbility: (delta) => {
    const state = get();

    // 쿨다운 업데이트
    if (state.abilityCooldownTimer > 0) {
      set({ abilityCooldownTimer: Math.max(0, state.abilityCooldownTimer - delta) });
    }

    // 지속 시간 업데이트
    if (state.isAbilityActive && state.abilityDuration > 0) {
      const newDuration = state.abilityDuration - delta;
      if (newDuration <= 0) {
        set({ isAbilityActive: false, abilityDuration: 0 });
      } else {
        set({ abilityDuration: newDuration });
      }
    }
  },

  // === 퍽 액션 ===
  setSelectedPerks: (perks) => set({
    selectedPerks: perks,
    perkMultipliers: calculatePerkMultipliers(perks)
  }),

  togglePerk: (perk) => {
    const state = get();
    let newPerks: PerkType[];

    if (state.selectedPerks.includes(perk)) {
      newPerks = state.selectedPerks.filter(p => p !== perk);
    } else {
      if (state.selectedPerks.length < 2) {
        newPerks = [...state.selectedPerks, perk];
      } else {
        // 가장 오래된 퍽 교체
        newPerks = [state.selectedPerks[1], perk];
      }
    }

    set({
      selectedPerks: newPerks,
      perkMultipliers: calculatePerkMultipliers(newPerks)
    });
  },

  applyPerks: () => {
    const state = get();
    set({ perkMultipliers: calculatePerkMultipliers(state.selectedPerks) });
  },

  // === 게임 모드 액션 ===
  setGameMode: (mode) => set({
    gameMode: mode,
    waveNumber: 0,
    enemiesRemainingInWave: 0,
    waveIntermission: false,
    intermissionTimer: 0,
    survivalTime: 0,
    timeAttackTimer: 120
  }),

  startWave: () => {
    const state = get();
    const newWaveNumber = state.waveNumber + 1;
    const enemyCount = 5 + newWaveNumber * 2;

    set({
      waveNumber: newWaveNumber,
      waveIntermission: false,
      enemiesRemainingInWave: enemyCount
    });
  },

  completeWave: () => {
    const state = get();
    set({
      waveIntermission: true,
      intermissionTimer: 10,
      health: Math.min(100, state.health + 20) // 체력 보너스
    });
  },

  updateGameMode: (delta) => {
    const state = get();

    switch (state.gameMode) {
      case 'survival':
        set({ survivalTime: state.survivalTime + delta });
        break;
      case 'wave':
        if (state.waveIntermission) {
          const newTimer = state.intermissionTimer - delta;
          if (newTimer <= 0) {
            get().startWave();
          } else {
            set({ intermissionTimer: newTimer });
          }
        }
        break;
      case 'time_attack':
        const newTimer = state.timeAttackTimer - delta;
        if (newTimer <= 0) {
          get().endGame();
        } else {
          set({ timeAttackTimer: newTimer });
        }
        break;
    }
  },

  // === 설정 액션 ===
  setSensitivity: (sensitivity) => set({ sensitivity }),
  setVolume: (volume) => set({ volume }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setPrimaryWeapon: (index) => {
    if (index >= 0 && index < 7) { // 0-6은 주무기
      set({ primaryWeaponIndex: index });
    }
  },
}));

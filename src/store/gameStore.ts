import { create } from 'zustand';

export type WeaponType = 'pistol' | 'rifle' | 'shotgun';

export interface WeaponConfig {
  name: string;
  damage: number;
  maxAmmo: number;
  fireRate: number; // ms between shots
  automatic: boolean;
}

export const WEAPONS: Record<WeaponType, WeaponConfig> = {
  pistol: {
    name: 'Pistol',
    damage: 25,
    maxAmmo: 12,
    fireRate: 300,
    automatic: false,
  },
  rifle: {
    name: 'Rifle',
    damage: 35,
    maxAmmo: 30,
    fireRate: 100,
    automatic: true,
  },
  shotgun: {
    name: 'Shotgun',
    damage: 100,
    maxAmmo: 6,
    fireRate: 800,
    automatic: false,
  },
};

interface GameState {
  // Game status
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;

  // Player stats
  health: number;
  score: number;

  // Weapon
  currentWeapon: WeaponType;
  ammo: Record<WeaponType, number>;
  lastFireTime: number;
  isReloading: boolean;

  // Settings
  sensitivity: number;
  volume: number;

  // Actions
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  resetGame: () => void;

  setHealth: (health: number) => void;
  addScore: (points: number) => void;

  switchWeapon: (weapon: WeaponType) => void;
  shoot: () => boolean;
  reload: () => void;
  setReloading: (reloading: boolean) => void;

  setSensitivity: (sensitivity: number) => void;
  setVolume: (volume: number) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  isPlaying: false,
  isPaused: false,
  isGameOver: false,

  health: 100,
  score: 0,

  currentWeapon: 'pistol',
  ammo: {
    pistol: WEAPONS.pistol.maxAmmo,
    rifle: WEAPONS.rifle.maxAmmo,
    shotgun: WEAPONS.shotgun.maxAmmo,
  },
  lastFireTime: 0,
  isReloading: false,

  sensitivity: 0.002,
  volume: 0.5,

  // Actions
  startGame: () => set({
    isPlaying: true,
    isPaused: false,
    isGameOver: false,
    health: 100,
    score: 0,
    currentWeapon: 'pistol',
    ammo: {
      pistol: WEAPONS.pistol.maxAmmo,
      rifle: WEAPONS.rifle.maxAmmo,
      shotgun: WEAPONS.shotgun.maxAmmo,
    },
    isReloading: false,
  }),

  pauseGame: () => set({ isPaused: true }),

  resumeGame: () => set({ isPaused: false }),

  endGame: () => set({ isPlaying: false, isGameOver: true }),

  resetGame: () => set({
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    health: 100,
    score: 0,
    currentWeapon: 'pistol',
    ammo: {
      pistol: WEAPONS.pistol.maxAmmo,
      rifle: WEAPONS.rifle.maxAmmo,
      shotgun: WEAPONS.shotgun.maxAmmo,
    },
    isReloading: false,
  }),

  setHealth: (health) => {
    set({ health: Math.max(0, Math.min(100, health)) });
    if (health <= 0) {
      get().endGame();
    }
  },

  addScore: (points) => set((state) => ({ score: state.score + points })),

  switchWeapon: (weapon) => {
    if (get().isReloading) return;
    set({ currentWeapon: weapon, isReloading: false });
  },

  shoot: () => {
    const state = get();
    const weapon = WEAPONS[state.currentWeapon];
    const now = Date.now();

    if (state.isReloading) return false;
    if (state.ammo[state.currentWeapon] <= 0) return false;
    if (now - state.lastFireTime < weapon.fireRate) return false;

    set((state) => ({
      ammo: {
        ...state.ammo,
        [state.currentWeapon]: state.ammo[state.currentWeapon] - 1,
      },
      lastFireTime: now,
    }));

    return true;
  },

  reload: () => {
    const state = get();
    const weapon = WEAPONS[state.currentWeapon];
    if (state.ammo[state.currentWeapon] === weapon.maxAmmo) return;
    if (state.isReloading) return;

    set({ isReloading: true });
  },

  setReloading: (reloading) => {
    if (!reloading) {
      const state = get();
      const weapon = WEAPONS[state.currentWeapon];
      set((state) => ({
        isReloading: false,
        ammo: {
          ...state.ammo,
          [state.currentWeapon]: weapon.maxAmmo,
        },
      }));
    } else {
      set({ isReloading: reloading });
    }
  },

  setSensitivity: (sensitivity) => set({ sensitivity }),
  setVolume: (volume) => set({ volume }),
}));

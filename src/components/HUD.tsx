'use client';

import { useGameStore, WEAPONS } from '@/store/gameStore';

export function HUD() {
  const { health, score, currentWeapon, ammo, isReloading } = useGameStore();
  const weapon = WEAPONS[currentWeapon];
  const currentAmmo = ammo[currentWeapon];

  return (
    <div className="pointer-events-none select-none">
      {/* Health Bar */}
      <div className="fixed bottom-6 left-6 z-50">
        <div className="text-green-400 font-mono text-sm mb-1">HEALTH</div>
        <div className="w-48 h-4 bg-gray-800/80 rounded overflow-hidden border border-green-500/50">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-green-500 transition-all duration-200"
            style={{ width: `${health}%` }}
          />
        </div>
        <div className="text-green-400 font-mono text-lg mt-1">{health}</div>
      </div>

      {/* Ammo */}
      <div className="fixed bottom-6 right-6 z-50 text-right">
        <div className="text-green-400 font-mono text-sm mb-1">{weapon.name.toUpperCase()}</div>
        <div className="text-green-400 font-mono text-4xl">
          <span className={currentAmmo === 0 ? 'text-red-500' : ''}>{currentAmmo}</span>
          <span className="text-green-400/50"> / {weapon.maxAmmo}</span>
        </div>
        {isReloading && (
          <div className="text-yellow-400 font-mono text-sm animate-pulse mt-1">
            RELOADING...
          </div>
        )}
      </div>

      {/* Score */}
      <div className="fixed top-6 right-6 z-50 text-right">
        <div className="text-green-400 font-mono text-sm">SCORE</div>
        <div className="text-green-400 font-mono text-3xl">{score.toLocaleString()}</div>
      </div>

      {/* Crosshair */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
        <div className="relative w-6 h-6">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-green-400" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-green-400" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-0.5 bg-green-400" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-0.5 bg-green-400" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-green-400 rounded-full" />
        </div>
      </div>

      {/* Weapon Selector */}
      <WeaponSelector />
    </div>
  );
}

function WeaponSelector() {
  const { currentWeapon, ammo } = useGameStore();

  const weapons = [
    { key: 'pistol' as const, num: '1', name: 'PISTOL' },
    { key: 'rifle' as const, num: '2', name: 'RIFLE' },
    { key: 'shotgun' as const, num: '3', name: 'SHOTGUN' },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-2">
      {weapons.map(({ key, num, name }) => (
        <div
          key={key}
          className={`px-4 py-2 font-mono text-sm border transition-all ${
            currentWeapon === key
              ? 'bg-green-500/30 border-green-400 text-green-400'
              : 'bg-gray-800/50 border-gray-600 text-gray-400'
          }`}
        >
          <div className="text-xs text-center">[{num}]</div>
          <div>{name}</div>
          <div className="text-xs text-center">
            {ammo[key]}/{WEAPONS[key].maxAmmo}
          </div>
        </div>
      ))}
    </div>
  );
}

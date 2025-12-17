'use client';

import { useGameStore, WEAPONS, ABILITIES, KILLSTREAKS } from '@/store/gameStore';

export function HUD() {
  const {
    health,
    score,
    currentWeaponIndex,
    ammo,
    isReloading,
    isADS,
    hasShield,
    shieldHealth,
    dashCharges,
    currentKillstreak,
    highestKillstreak,
    activeBuffs,
    selectedAbility,
    abilityCooldownTimer,
    isAbilityActive,
    abilityDuration,
    gameMode,
    waveNumber,
    waveIntermission,
    intermissionTimer,
    survivalTime,
    timeAttackTimer,
    enemiesRemainingInWave,
    isSliding,
    isDashing,
  } = useGameStore();

  const weapon = WEAPONS[currentWeaponIndex];
  const currentAmmo = ammo[currentWeaponIndex];
  const ability = ABILITIES[selectedAbility];

  return (
    <div className="pointer-events-none select-none">
      {/* Health & Shield Bar */}
      <div className="fixed bottom-6 left-6 z-50">
        <div className="text-cyan-400 font-mono text-sm mb-1">HEALTH</div>
        <div className="w-48 h-4 bg-gray-800/80 rounded overflow-hidden border border-cyan-500/50">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-green-500 transition-all duration-200"
            style={{ width: `${health}%` }}
          />
        </div>
        <div className="text-cyan-400 font-mono text-lg mt-1">{health}</div>

        {/* Shield */}
        {hasShield && (
          <>
            <div className="text-blue-400 font-mono text-sm mb-1 mt-2">SHIELD</div>
            <div className="w-48 h-3 bg-gray-800/80 rounded overflow-hidden border border-blue-500/50">
              <div
                className="h-full bg-blue-500 transition-all duration-200"
                style={{ width: `${shieldHealth * 2}%` }}
              />
            </div>
          </>
        )}

        {/* Dash Charges */}
        <div className="mt-3 flex gap-1">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={`w-6 h-2 rounded ${
                i < dashCharges ? 'bg-yellow-400' : 'bg-gray-600'
              }`}
            />
          ))}
          <span className="text-yellow-400 font-mono text-xs ml-2">DASH [Q]</span>
        </div>

        {/* Movement State */}
        {(isSliding || isDashing) && (
          <div className="mt-2 text-yellow-400 font-mono text-sm animate-pulse">
            {isSliding ? 'SLIDING' : 'DASHING'}
          </div>
        )}
      </div>

      {/* Ammo */}
      <div className="fixed bottom-6 right-6 z-50 text-right">
        <div
          className="font-mono text-sm mb-1"
          style={{ color: `#${weapon.color.toString(16).padStart(6, '0')}` }}
        >
          {weapon.name.toUpperCase()}
        </div>
        <div className="text-white font-mono text-4xl">
          <span className={currentAmmo === 0 ? 'text-red-500' : ''}>{currentAmmo}</span>
          <span className="text-gray-500"> / {weapon.ammoCapacity}</span>
        </div>
        {isReloading && (
          <div className="text-yellow-400 font-mono text-sm animate-pulse mt-1">
            RELOADING...
          </div>
        )}
        {isADS && (
          <div className="text-cyan-400 font-mono text-xs mt-1">
            ADS
          </div>
        )}
      </div>

      {/* Score & Killstreak */}
      <div className="fixed top-6 right-6 z-50 text-right">
        <div className="text-cyan-400 font-mono text-sm">SCORE</div>
        <div className="text-white font-mono text-3xl">{score.toLocaleString()}</div>

        {/* Killstreak */}
        {currentKillstreak > 0 && (
          <div className="mt-2">
            <div className="text-orange-400 font-mono text-sm">STREAK</div>
            <div className="text-orange-400 font-mono text-2xl">{currentKillstreak}</div>
          </div>
        )}
      </div>

      {/* Ability */}
      <div className="fixed top-6 left-6 z-50">
        <div className="text-purple-400 font-mono text-sm mb-1">ABILITY [E]</div>
        <div className="bg-gray-800/80 rounded px-3 py-2 border border-purple-500/50">
          <div className="text-purple-300 font-mono font-bold">{ability.name}</div>
          {abilityCooldownTimer > 0 ? (
            <div className="text-gray-400 font-mono text-sm">
              CD: {Math.ceil(abilityCooldownTimer)}s
            </div>
          ) : (
            <div className="text-green-400 font-mono text-sm">READY</div>
          )}
          {isAbilityActive && (
            <div className="text-yellow-400 font-mono text-sm animate-pulse">
              ACTIVE: {Math.ceil(abilityDuration)}s
            </div>
          )}
        </div>
      </div>

      {/* Game Mode Info */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 text-center">
        {gameMode === 'wave' && (
          <div className="bg-gray-800/80 rounded px-4 py-2 border border-purple-500/50">
            <div className="text-purple-400 font-mono font-bold">WAVE {waveNumber}</div>
            {waveIntermission ? (
              <div className="text-yellow-400 font-mono text-sm">
                Next wave in: {Math.ceil(intermissionTimer)}s
              </div>
            ) : (
              <div className="text-gray-400 font-mono text-sm">
                Enemies: {enemiesRemainingInWave}
              </div>
            )}
          </div>
        )}

        {gameMode === 'survival' && (
          <div className="bg-gray-800/80 rounded px-4 py-2 border border-green-500/50">
            <div className="text-green-400 font-mono font-bold">SURVIVAL</div>
            <div className="text-white font-mono text-xl">
              {Math.floor(survivalTime / 60)}:{(Math.floor(survivalTime) % 60).toString().padStart(2, '0')}
            </div>
          </div>
        )}

        {gameMode === 'time_attack' && (
          <div className="bg-gray-800/80 rounded px-4 py-2 border border-red-500/50">
            <div className="text-red-400 font-mono font-bold">TIME ATTACK</div>
            <div className={`font-mono text-2xl ${timeAttackTimer <= 30 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              {Math.floor(timeAttackTimer / 60)}:{(Math.floor(timeAttackTimer) % 60).toString().padStart(2, '0')}
            </div>
          </div>
        )}
      </div>

      {/* Active Buffs */}
      {activeBuffs.length > 0 && (
        <div className="fixed top-32 left-6 z-50 space-y-1">
          {activeBuffs.map((buff, index) => (
            <div
              key={index}
              className="bg-gray-800/80 rounded px-2 py-1 border border-yellow-500/50 font-mono text-xs"
            >
              <span className="text-yellow-400">{buff.name}</span>
              <span className="text-gray-400 ml-2">{Math.ceil(buff.duration)}s</span>
            </div>
          ))}
        </div>
      )}

      {/* Crosshair */}
      <Crosshair isADS={isADS} weaponCategory={weapon.category} />

      {/* Weapon Selector */}
      <WeaponSelector />

      {/* Killstreak Progress */}
      <KillstreakProgress currentKillstreak={currentKillstreak} />
    </div>
  );
}

function Crosshair({ isADS, weaponCategory }: { isADS: boolean; weaponCategory: string }) {
  const size = isADS ? 'w-4 h-4' : 'w-6 h-6';
  const color = isADS ? 'bg-red-400' : 'bg-cyan-400';
  const lineLength = isADS ? 'h-1.5 w-0.5' : 'h-2 w-0.5';
  const hLineLength = isADS ? 'w-1.5 h-0.5' : 'w-2 h-0.5';

  // Sniper scope
  if (isADS && weaponCategory === 'sniper') {
    return (
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
        <div className="relative w-64 h-64">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-red-400/50" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-red-400/50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 border border-red-400 rounded-full" />
          <div className="absolute inset-0 border-2 border-gray-900 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
      <div className={`relative ${size}`}>
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 ${lineLength} ${color}`} />
        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 ${lineLength} ${color}`} />
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 ${hLineLength} ${color}`} />
        <div className={`absolute right-0 top-1/2 -translate-y-1/2 ${hLineLength} ${color}`} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 ${color} rounded-full`} />
      </div>
    </div>
  );
}

function WeaponSelector() {
  const { currentWeaponIndex, ammo, currentSlot } = useGameStore();

  // 주무기 (1-7)와 보조무기 (8)
  const primaryWeapons = WEAPONS.slice(0, 7).map((w, i) => ({ ...w, index: i }));
  const secondaryWeapon = { ...WEAPONS[7], index: 7 };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex gap-1 items-end">
        {/* Primary Weapons */}
        <div className="flex gap-1">
          {primaryWeapons.map((weapon) => (
            <div
              key={weapon.index}
              className={`px-2 py-1 font-mono text-xs border transition-all ${
                currentWeaponIndex === weapon.index
                  ? 'bg-cyan-500/30 border-cyan-400 scale-110'
                  : 'bg-gray-800/50 border-gray-700 opacity-60'
              }`}
              style={{
                borderBottomColor: currentWeaponIndex === weapon.index
                  ? `#${weapon.color.toString(16).padStart(6, '0')}`
                  : undefined,
                borderBottomWidth: currentWeaponIndex === weapon.index ? '2px' : undefined
              }}
            >
              <div className="text-gray-400 text-center">{weapon.index + 1}</div>
              {currentWeaponIndex === weapon.index && (
                <div className="text-white text-center">{ammo[weapon.index]}</div>
              )}
            </div>
          ))}
        </div>

        {/* Separator */}
        <div className="w-px h-8 bg-gray-600 mx-1" />

        {/* Secondary Weapon */}
        <div
          className={`px-2 py-1 font-mono text-xs border transition-all ${
            currentWeaponIndex === 7
              ? 'bg-cyan-500/30 border-cyan-400 scale-110'
              : 'bg-gray-800/50 border-gray-700 opacity-60'
          }`}
        >
          <div className="text-gray-400 text-center">8</div>
          {currentWeaponIndex === 7 && (
            <div className="text-white text-center">{ammo[7]}</div>
          )}
        </div>
      </div>

      {/* Slot Indicator */}
      <div className="text-center mt-1 text-gray-500 font-mono text-xs">
        {currentSlot === 'primary' ? 'PRIMARY' : 'SECONDARY'} [X to switch]
      </div>
    </div>
  );
}

function KillstreakProgress({ currentKillstreak }: { currentKillstreak: number }) {
  const milestones = [3, 5, 7, 10, 15];
  const nextMilestone = milestones.find(m => m > currentKillstreak) || 15;

  if (currentKillstreak === 0) return null;

  return (
    <div className="fixed bottom-28 right-6 z-50">
      <div className="bg-gray-800/80 rounded px-3 py-2 border border-orange-500/50">
        <div className="text-orange-400 font-mono text-xs mb-1">
          Next: {KILLSTREAKS[nextMilestone]?.name || 'MAX'}
        </div>
        <div className="flex gap-0.5">
          {milestones.map((milestone) => (
            <div
              key={milestone}
              className={`w-3 h-3 rounded-sm ${
                currentKillstreak >= milestone
                  ? 'bg-orange-400'
                  : 'bg-gray-600'
              }`}
              title={KILLSTREAKS[milestone]?.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import {
  useGameStore,
  WEAPONS,
  DIFFICULTY_CONFIG,
  Difficulty,
  GameMode,
  ABILITIES,
  AbilityType,
  PERKS,
  PerkType
} from '@/store/gameStore';
import { Leaderboard } from './Leaderboard';

interface MenuProps {
  onStart: () => void;
}

export function StartMenu({ onStart }: MenuProps) {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [activeTab, setActiveTab] = useState<'loadout' | 'abilities' | 'perks'>('loadout');

  const {
    difficulty,
    setDifficulty,
    gameMode,
    setGameMode,
    primaryWeaponIndex,
    setPrimaryWeapon,
    selectedAbility,
    setSelectedAbility,
    selectedPerks,
    togglePerk
  } = useGameStore();

  const difficulties: Difficulty[] = ['easy', 'normal', 'hard'];
  const gameModes: { mode: GameMode; label: string; description: string }[] = [
    { mode: 'survival', label: 'SURVIVAL', description: '무한 생존' },
    { mode: 'wave', label: 'WAVE ASSAULT', description: '웨이브 클리어 (보스 포함)' },
    { mode: 'time_attack', label: 'TIME ATTACK', description: '2분 내 최고 점수' },
  ];

  const abilities = Object.entries(ABILITIES) as [AbilityType, typeof ABILITIES[AbilityType]][];
  const perks = Object.entries(PERKS) as [PerkType, typeof PERKS[PerkType]][];
  const primaryWeapons = WEAPONS.filter(w => w.slot === 'primary');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm overflow-y-auto py-4">
      <div className="text-center max-w-4xl w-full px-4">
        {/* 타이틀 */}
        <h1 className="text-5xl font-bold text-cyan-400 mb-1 font-mono tracking-wider">
          NEON ARENA RIVALS
        </h1>
        <p className="text-gray-400 mb-6 font-mono text-sm">Tactical Shooter v3.0</p>

        {/* 게임 모드 선택 */}
        <div className="mb-6">
          <h2 className="text-cyan-400 font-mono text-lg mb-3">GAME MODE</h2>
          <div className="flex justify-center gap-3 flex-wrap">
            {gameModes.map(({ mode, label, description }) => (
              <button
                key={mode}
                onClick={() => setGameMode(mode)}
                className={`px-4 py-3 font-mono text-sm rounded transition-all ${
                  gameMode === mode
                    ? 'bg-cyan-600 text-white ring-2 ring-cyan-400'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="font-bold">{label}</div>
                <div className="text-xs opacity-70">{description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 난이도 선택 */}
        <div className="mb-6">
          <h2 className="text-cyan-400 font-mono text-lg mb-3">DIFFICULTY</h2>
          <div className="flex justify-center gap-2">
            {difficulties.map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficulty(diff)}
                className={`px-4 py-2 font-mono text-sm rounded transition-colors ${
                  difficulty === diff
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {DIFFICULTY_CONFIG[diff].label}
              </button>
            ))}
          </div>
        </div>

        {/* 탭 선택 */}
        <div className="flex justify-center gap-1 mb-4">
          {(['loadout', 'abilities', 'perks'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 font-mono text-sm rounded-t transition-colors ${
                activeTab === tab
                  ? 'bg-gray-800 text-cyan-400 border-b-2 border-cyan-400'
                  : 'bg-gray-900 text-gray-400 hover:text-white'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* 탭 내용 */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6 min-h-[200px]">
          {/* 로드아웃 탭 */}
          {activeTab === 'loadout' && (
            <div>
              <h3 className="text-cyan-400 font-mono mb-4">PRIMARY WEAPON</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {primaryWeapons.map((weapon, index) => (
                  <button
                    key={weapon.name}
                    onClick={() => setPrimaryWeapon(index)}
                    className={`p-3 rounded text-left transition-all ${
                      primaryWeaponIndex === index
                        ? 'bg-cyan-600/30 ring-2 ring-cyan-400'
                        : 'bg-gray-700/50 hover:bg-gray-700'
                    }`}
                    style={{ borderLeft: `4px solid #${weapon.color.toString(16).padStart(6, '0')}` }}
                  >
                    <div className="font-mono text-sm font-bold text-white">{weapon.name}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      DMG: {weapon.damage} | {weapon.category.toUpperCase()}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-gray-500 text-xs font-mono mt-4">
                보조무기: Volt Pistol (고정) | X키로 전환
              </p>
            </div>
          )}

          {/* 어빌리티 탭 */}
          {activeTab === 'abilities' && (
            <div>
              <h3 className="text-cyan-400 font-mono mb-4">SELECT ABILITY (E키)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {abilities.map(([key, ability]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedAbility(key)}
                    className={`p-4 rounded text-center transition-all ${
                      selectedAbility === key
                        ? 'bg-purple-600/30 ring-2 ring-purple-400'
                        : 'bg-gray-700/50 hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-mono text-lg font-bold text-white">{ability.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{ability.description}</div>
                    <div className="text-xs text-purple-400 mt-1">CD: {ability.cooldown}s</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 퍽 탭 */}
          {activeTab === 'perks' && (
            <div>
              <h3 className="text-cyan-400 font-mono mb-2">SELECT PERKS (2개 선택)</h3>
              <p className="text-gray-500 text-xs mb-4">선택: {selectedPerks.length}/2</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {perks.map(([key, perk]) => (
                  <button
                    key={key}
                    onClick={() => togglePerk(key)}
                    className={`p-3 rounded text-left transition-all ${
                      selectedPerks.includes(key)
                        ? 'bg-green-600/30 ring-2 ring-green-400'
                        : 'bg-gray-700/50 hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-mono text-sm font-bold text-white">{perk.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{perk.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 시작/리더보드 버튼 */}
        <div className="space-y-3 mb-6">
          <button
            onClick={onStart}
            className="block w-64 mx-auto px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xl transition-colors rounded font-bold"
          >
            START GAME
          </button>
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="block w-64 mx-auto px-8 py-2 bg-gray-700 hover:bg-gray-600 text-white font-mono transition-colors rounded text-sm"
          >
            {showLeaderboard ? 'HIDE SCORES' : 'LEADERBOARD'}
          </button>
        </div>

        {showLeaderboard && (
          <div className="mb-6">
            <Leaderboard />
          </div>
        )}

        {/* 조작법 */}
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 text-left max-w-2xl mx-auto">
          <h2 className="text-cyan-400 font-mono text-lg mb-3 text-center">CONTROLS</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-gray-300 font-mono text-xs">
            <div className="flex justify-between"><span>Move</span><span className="text-cyan-400">W A S D</span></div>
            <div className="flex justify-between"><span>Look</span><span className="text-cyan-400">MOUSE</span></div>
            <div className="flex justify-between"><span>Shoot</span><span className="text-cyan-400">LEFT CLICK</span></div>
            <div className="flex justify-between"><span>ADS</span><span className="text-cyan-400">RIGHT CLICK</span></div>
            <div className="flex justify-between"><span>Reload</span><span className="text-cyan-400">R</span></div>
            <div className="flex justify-between"><span>Ability</span><span className="text-cyan-400">E</span></div>
            <div className="flex justify-between"><span>Dash</span><span className="text-cyan-400">Q</span></div>
            <div className="flex justify-between"><span>Slide</span><span className="text-cyan-400">SHIFT + C</span></div>
            <div className="flex justify-between"><span>Switch Slot</span><span className="text-cyan-400">X</span></div>
            <div className="flex justify-between"><span>Weapons</span><span className="text-cyan-400">1-8</span></div>
          </div>
        </div>

        <p className="text-gray-600 font-mono text-xs mt-4">
          Click to start and lock pointer
        </p>
      </div>
    </div>
  );
}

interface PauseMenuProps {
  onResume: () => void;
  onQuit: () => void;
}

export function PauseMenu({ onResume, onQuit }: PauseMenuProps) {
  const { score, currentKillstreak, highestKillstreak, survivalTime, waveNumber, gameMode } = useGameStore();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-yellow-400 mb-6 font-mono">PAUSED</h2>

        {/* 현재 상태 */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6 font-mono text-sm">
          <div className="text-cyan-400">Score: {score.toLocaleString()}</div>
          <div className="text-yellow-400">Killstreak: {currentKillstreak} (Best: {highestKillstreak})</div>
          {gameMode === 'survival' && (
            <div className="text-green-400">Time: {Math.floor(survivalTime)}s</div>
          )}
          {gameMode === 'wave' && (
            <div className="text-purple-400">Wave: {waveNumber}</div>
          )}
        </div>

        <div className="space-y-4">
          <button
            onClick={onResume}
            className="block w-48 mx-auto px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-lg transition-colors rounded"
          >
            RESUME
          </button>
          <button
            onClick={onQuit}
            className="block w-48 mx-auto px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-mono text-lg transition-colors rounded"
          >
            QUIT
          </button>
        </div>

        <p className="text-gray-400 font-mono text-sm mt-6">Press ESC to resume</p>
      </div>
    </div>
  );
}

interface GameOverMenuProps {
  score: number;
  onRestart: () => void;
  onQuit: () => void;
}

export function GameOverMenu({ score, onRestart, onQuit }: GameOverMenuProps) {
  const [playerName, setPlayerName] = useState('');
  const [saved, setSaved] = useState(false);
  const {
    currentWeaponIndex,
    highestKillstreak,
    survivalTime,
    waveNumber,
    gameMode
  } = useGameStore();

  const handleSaveScore = () => {
    if (playerName.trim() && !saved) {
      const { saveScore } = require('@/lib/leaderboard');
      saveScore({
        name: playerName.trim(),
        score,
        weapon: WEAPONS[currentWeaponIndex].name,
      });
      setSaved(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="text-center">
        <h2 className="text-5xl font-bold text-red-500 mb-4 font-mono">GAME OVER</h2>

        <div className="text-cyan-400 font-mono text-2xl mb-4">
          FINAL SCORE: <span className="text-4xl">{score.toLocaleString()}</span>
        </div>

        {/* 통계 */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6 font-mono text-sm inline-block">
          <div className="text-yellow-400">Best Killstreak: {highestKillstreak}</div>
          {gameMode === 'survival' && (
            <div className="text-green-400">Survived: {Math.floor(survivalTime)}s</div>
          )}
          {gameMode === 'wave' && (
            <div className="text-purple-400">Waves Completed: {waveNumber}</div>
          )}
          <div className="text-gray-400">Weapon: {WEAPONS[currentWeaponIndex].name}</div>
        </div>

        {!saved && (
          <div className="mb-6">
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={15}
              className="px-4 py-2 bg-gray-800 border border-gray-600 text-white font-mono text-center rounded mr-2"
            />
            <button
              onClick={handleSaveScore}
              disabled={!playerName.trim()}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 text-white font-mono transition-colors rounded"
            >
              SAVE SCORE
            </button>
          </div>
        )}

        {saved && (
          <div className="text-cyan-400 font-mono mb-6">Score saved!</div>
        )}

        <div className="mb-6">
          <Leaderboard />
        </div>

        <div className="space-y-4">
          <button
            onClick={onRestart}
            className="block w-48 mx-auto px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-lg transition-colors rounded"
          >
            PLAY AGAIN
          </button>
          <button
            onClick={onQuit}
            className="block w-48 mx-auto px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-mono text-lg transition-colors rounded"
          >
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}

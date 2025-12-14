'use client';

import { useState } from 'react';
import { useGameStore, WEAPONS } from '@/store/gameStore';
import { Leaderboard } from './Leaderboard';

interface MenuProps {
  onStart: () => void;
}

export function StartMenu({ onStart }: MenuProps) {
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-green-400 mb-2 font-mono tracking-wider">
          FPS ARENA
        </h1>
        <p className="text-gray-400 mb-8 font-mono">Tactical Shooting Game</p>

        <div className="space-y-4 mb-8">
          <button
            onClick={onStart}
            className="block w-64 mx-auto px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-mono text-xl transition-colors rounded"
          >
            START GAME
          </button>
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="block w-64 mx-auto px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-mono transition-colors rounded"
          >
            {showLeaderboard ? 'HIDE SCORES' : 'LEADERBOARD'}
          </button>
        </div>

        {showLeaderboard && (
          <div className="mb-8">
            <Leaderboard />
          </div>
        )}

        <div className="text-left max-w-md mx-auto bg-gray-900/50 p-6 rounded-lg border border-gray-700">
          <h2 className="text-green-400 font-mono text-lg mb-4">CONTROLS</h2>
          <div className="space-y-2 text-gray-300 font-mono text-sm">
            <div className="flex justify-between">
              <span>Move</span>
              <span className="text-green-400">W A S D</span>
            </div>
            <div className="flex justify-between">
              <span>Look</span>
              <span className="text-green-400">MOUSE</span>
            </div>
            <div className="flex justify-between">
              <span>Shoot</span>
              <span className="text-green-400">LEFT CLICK</span>
            </div>
            <div className="flex justify-between">
              <span>Reload</span>
              <span className="text-green-400">R</span>
            </div>
            <div className="flex justify-between">
              <span>Switch Weapon</span>
              <span className="text-green-400">1 2 3</span>
            </div>
            <div className="flex justify-between">
              <span>Pause</span>
              <span className="text-green-400">ESC</span>
            </div>
          </div>

          <h2 className="text-green-400 font-mono text-lg mt-6 mb-4">WEAPONS</h2>
          <div className="space-y-2 text-gray-300 font-mono text-sm">
            <div className="flex justify-between">
              <span>[1] Pistol</span>
              <span className="text-green-400">DMG: {WEAPONS.pistol.damage}</span>
            </div>
            <div className="flex justify-between">
              <span>[2] Rifle</span>
              <span className="text-green-400">DMG: {WEAPONS.rifle.damage} (Auto)</span>
            </div>
            <div className="flex justify-between">
              <span>[3] Shotgun</span>
              <span className="text-green-400">DMG: {WEAPONS.shotgun.damage}</span>
            </div>
          </div>
        </div>

        <p className="text-gray-500 font-mono text-xs mt-6">
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
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-yellow-400 mb-8 font-mono">PAUSED</h2>

        <div className="space-y-4">
          <button
            onClick={onResume}
            className="block w-48 mx-auto px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-mono text-lg transition-colors rounded"
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
  const { currentWeapon } = useGameStore();

  const handleSaveScore = () => {
    if (playerName.trim() && !saved) {
      const { saveScore } = require('@/lib/leaderboard');
      saveScore({
        name: playerName.trim(),
        score,
        weapon: WEAPONS[currentWeapon].name,
      });
      setSaved(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="text-center">
        <h2 className="text-5xl font-bold text-red-500 mb-4 font-mono">GAME OVER</h2>

        <div className="text-green-400 font-mono text-2xl mb-8">
          FINAL SCORE: <span className="text-4xl">{score.toLocaleString()}</span>
        </div>

        {!saved && (
          <div className="mb-8">
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
              className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white font-mono transition-colors rounded"
            >
              SAVE SCORE
            </button>
          </div>
        )}

        {saved && (
          <div className="text-green-400 font-mono mb-8">Score saved!</div>
        )}

        <div className="mb-8">
          <Leaderboard />
        </div>

        <div className="space-y-4">
          <button
            onClick={onRestart}
            className="block w-48 mx-auto px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-mono text-lg transition-colors rounded"
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

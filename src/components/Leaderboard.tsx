'use client';

import { useEffect, useState } from 'react';
import { getLeaderboard, LeaderboardEntry } from '@/lib/leaderboard';

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    setEntries(getLeaderboard());
  }, []);

  if (entries.length === 0) {
    return (
      <div className="bg-gray-900/80 p-4 rounded-lg border border-gray-700 max-w-md mx-auto">
        <h3 className="text-green-400 font-mono text-lg mb-2 text-center">LEADERBOARD</h3>
        <p className="text-gray-500 font-mono text-sm text-center">No scores yet</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/80 p-4 rounded-lg border border-gray-700 max-w-md mx-auto">
      <h3 className="text-green-400 font-mono text-lg mb-4 text-center">LEADERBOARD</h3>
      <div className="space-y-2">
        {entries.map((entry, index) => (
          <div
            key={index}
            className={`flex items-center justify-between px-3 py-2 rounded font-mono text-sm ${
              index === 0
                ? 'bg-yellow-500/20 text-yellow-400'
                : index === 1
                ? 'bg-gray-400/20 text-gray-300'
                : index === 2
                ? 'bg-orange-500/20 text-orange-400'
                : 'bg-gray-800/50 text-gray-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="w-6 text-center">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
              </span>
              <span className="truncate max-w-[120px]">{entry.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">{entry.weapon}</span>
              <span className="font-bold">{entry.score.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

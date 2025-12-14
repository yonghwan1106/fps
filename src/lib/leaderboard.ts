export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
  weapon: string;
}

const STORAGE_KEY = 'fps_leaderboard';
const MAX_ENTRIES = 10;

export function getLeaderboard(): LeaderboardEntry[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveScore(entry: Omit<LeaderboardEntry, 'date'>): LeaderboardEntry[] {
  const leaderboard = getLeaderboard();

  const newEntry: LeaderboardEntry = {
    ...entry,
    date: new Date().toISOString(),
  };

  leaderboard.push(newEntry);
  leaderboard.sort((a, b) => b.score - a.score);

  const trimmedLeaderboard = leaderboard.slice(0, MAX_ENTRIES);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedLeaderboard));
  } catch {
    console.error('Failed to save leaderboard');
  }

  return trimmedLeaderboard;
}

export function isHighScore(score: number): boolean {
  const leaderboard = getLeaderboard();
  if (leaderboard.length < MAX_ENTRIES) return true;
  return score > leaderboard[leaderboard.length - 1].score;
}

export function clearLeaderboard(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    console.error('Failed to clear leaderboard');
  }
}

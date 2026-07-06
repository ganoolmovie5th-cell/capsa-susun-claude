// Achievements for capsa susun. Pure logic.

export interface Achievement {
  id: string;
  name: string;
  icon: string; // ponytail: icon name (not emoji) — will use vector icon in UI
  description: string;
  check: (stats: Stats) => boolean;
}

export interface Stats {
  gamesPlayed: number;
  gamesWon: number;
  totalRounds: number;
  roundsWon: number;
  scoops: number;
  bestRoundScore: number;
  royalFlushes: number;
  straightFlushes: number;
  fourOfAKinds: number;
}

export const defaultStats: Stats = {
  gamesPlayed: 0, gamesWon: 0, totalRounds: 0, roundsWon: 0,
  scoops: 0, bestRoundScore: 0, royalFlushes: 0, straightFlushes: 0, fourOfAKinds: 0,
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_win', name: 'Kemenangan Pertama', icon: 'trophy', description: 'Menangkan game pertama', check: (s) => s.gamesWon >= 1 },
  { id: 'win_5', name: 'Pemain Handal', icon: 'star', description: 'Menangkan 5 game', check: (s) => s.gamesWon >= 5 },
  { id: 'win_20', name: 'Master Capsa', icon: 'crown', description: 'Menangkan 20 game', check: (s) => s.gamesWon >= 20 },
  { id: 'scoop_1', name: 'Sapu Bersih', icon: 'broom', description: 'Dapatkan scoop pertama (menang 3 baris)', check: (s) => s.scoops >= 1 },
  { id: 'scoop_5', name: 'Tukang Sapu', icon: 'sparkles', description: 'Dapatkan 5 scoop', check: (s) => s.scoops >= 5 },
  { id: 'royal', name: 'Kartu Kerajaan', icon: 'gem', description: 'Dapatkan Royal Flush', check: (s) => s.royalFlushes >= 1 },
  { id: 'sf', name: 'Straight Flush!', icon: 'zap', description: 'Dapatkan Straight Flush', check: (s) => s.straightFlushes >= 1 },
  { id: 'four', name: 'Empat Serangkai', icon: 'square', description: 'Dapatkan Four of a Kind', check: (s) => s.fourOfAKinds >= 1 },
  { id: 'games_10', name: 'Rajin Main', icon: 'gamepad', description: 'Mainkan 10 game', check: (s) => s.gamesPlayed >= 10 },
  { id: 'games_50', name: 'Kecanduan', icon: 'flame', description: 'Mainkan 50 game', check: (s) => s.gamesPlayed >= 50 },
  { id: 'score_10', name: 'Skor Tinggi', icon: 'trending-up', description: 'Dapatkan +10 di satu ronde', check: (s) => s.bestRoundScore >= 10 },
  { id: 'rounds_50', name: 'Veteran', icon: 'shield', description: 'Selesaikan 50 ronde', check: (s) => s.totalRounds >= 50 },
];

export function checkNewAchievements(stats: Stats, unlocked: string[]): Achievement[] {
  return ACHIEVEMENTS.filter((a) => !unlocked.includes(a.id) && a.check(stats));
}

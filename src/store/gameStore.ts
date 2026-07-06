import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState, Player, PlayerArrangement, GamePhase, TIMER_DURATION, Card } from '../core/types';
import { deal } from '../core/deck';
import { calculateRoundScores } from '../core/scoring';
import { validateArrangement } from '../core/validation';
import { findBestArrangement } from '../core/ai';
import { Stats, defaultStats, checkNewAchievements } from '../core/achievements';
import { evaluateHand5 } from '../core/poker';

interface GameStore {
  state: GameState | null;
  stats: Stats;
  unlockedAchievements: string[];
  newAchievement: string | null;
  // Actions
  newGame: (playerCount: number, aiCount: number) => void;
  placeCards: (arrangement: PlayerArrangement) => void;
  autoArrange: () => void;
  nextPlayer: () => void;
  revealAndScore: () => void;
  tickTimer: () => void;
  dismissAchievement: () => void;
  resetStats: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      state: null,
      stats: { ...defaultStats },
      unlockedAchievements: [],
      newAchievement: null,

      newGame: (playerCount, aiCount) => {
        const humanCount = playerCount - aiCount;
        const players: Player[] = [];
        for (let i = 0; i < humanCount; i++) {
          players.push({ id: i, name: `Pemain ${i + 1}`, isAI: false, hand: [], arrangement: null, score: 0, totalScore: 0 });
        }
        for (let i = 0; i < aiCount; i++) {
          players.push({ id: humanCount + i, name: `Bot ${i + 1}`, isAI: true, hand: [], arrangement: null, score: 0, totalScore: 0 });
        }

        const hands = deal(playerCount);
        players.forEach((p, i) => { p.hand = hands[i]; });

        set({
          state: {
            players,
            currentPlayerIndex: 0,
            phase: 'arranging',
            roundNumber: 1,
            timer: TIMER_DURATION,
            lastRoundScores: [],
          },
        });

        // AI players auto-arrange immediately
        setTimeout(() => {
          const { state } = get();
          if (!state) return;
          const updatedPlayers = state.players.map((p) => {
            if (p.isAI && !p.arrangement) {
              return { ...p, arrangement: findBestArrangement(p.hand) };
            }
            return p;
          });
          set({ state: { ...state, players: updatedPlayers } });
        }, 500);
      },

      placeCards: (arrangement) => {
        const { state } = get();
        if (!state) return;
        const validation = validateArrangement(arrangement);
        if (!validation.valid) return;

        const players = state.players.map((p, i) =>
          i === state.currentPlayerIndex ? { ...p, arrangement } : p
        );
        set({ state: { ...state, players } });
      },

      autoArrange: () => {
        const { state } = get();
        if (!state) return;
        const current = state.players[state.currentPlayerIndex];
        if (current.isAI) return;
        const arrangement = findBestArrangement(current.hand);
        get().placeCards(arrangement);
      },

      nextPlayer: () => {
        const { state } = get();
        if (!state) return;
        const nextIdx = state.currentPlayerIndex + 1;

        if (nextIdx >= state.players.length) {
          // All players have arranged — reveal and score
          get().revealAndScore();
          return;
        }

        // Skip AI (already arranged)
        const nextPlayer = state.players[nextIdx];
        set({ state: { ...state, currentPlayerIndex: nextIdx, timer: TIMER_DURATION } });

        if (nextPlayer.isAI) {
          // AI already arranged, skip to next
          setTimeout(() => get().nextPlayer(), 300);
        }
      },

      revealAndScore: () => {
        const { state, stats, unlockedAchievements } = get();
        if (!state) return;

        const scores = calculateRoundScores(state.players);
        const players = state.players.map((p, i) => ({
          ...p,
          score: scores[i],
          totalScore: p.totalScore + scores[i],
        }));

        // Update stats
        const newStats = { ...stats };
        newStats.totalRounds++;
        const humanIdx = players.findIndex((p) => !p.isAI);
        if (humanIdx >= 0 && scores[humanIdx] > 0) newStats.roundsWon++;
        if (humanIdx >= 0 && scores[humanIdx] > newStats.bestRoundScore) newStats.bestRoundScore = scores[humanIdx];
        // Check for special hands
        for (const p of players) {
          if (p.isAI || !p.arrangement) continue;
          const botEval = evaluateHand5(p.arrangement.bottom);
          if (botEval.rank === 'royal-flush') newStats.royalFlushes++;
          else if (botEval.rank === 'straight-flush') newStats.straightFlushes++;
          else if (botEval.rank === 'four-of-a-kind') newStats.fourOfAKinds++;
          if (scores[p.id] >= 6) newStats.scoops++; // scoop = +6 (3 wins + 3 bonus)
        }

        const newAchs = checkNewAchievements(newStats, unlockedAchievements);
        const unlocked = [...unlockedAchievements, ...newAchs.map((a) => a.id)];

        set({
          state: { ...state, players, phase: 'scoring', lastRoundScores: scores },
          stats: newStats,
          unlockedAchievements: unlocked,
          newAchievement: newAchs.length > 0 ? newAchs[0].id : null,
        });
      },

      tickTimer: () => {
        const { state } = get();
        if (!state || state.phase !== 'arranging') return;
        const current = state.players[state.currentPlayerIndex];
        if (current.isAI) return;
        if (state.timer <= 1) {
          // Time's up — auto-arrange
          get().autoArrange();
          get().nextPlayer();
        } else {
          set({ state: { ...state, timer: state.timer - 1 } });
        }
      },

      dismissAchievement: () => set({ newAchievement: null }),
      resetStats: () => set({ stats: { ...defaultStats }, unlockedAchievements: [] }),
    }),
    {
      name: 'capsa-susun-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ stats: s.stats, unlockedAchievements: s.unlockedAchievements }),
    },
  ),
);

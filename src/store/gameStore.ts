import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState, Player, PlayerArrangement, AIDifficulty, HandHistoryEntry } from '../core/types';
import { deal } from '../core/deck';
import { calculateRoundScores, computeRowComparison } from '../core/scoring';
import { validateArrangement } from '../core/validation';
import { findBestArrangement } from '../core/ai';
import { Stats, defaultStats, checkNewAchievements } from '../core/achievements';
import { evaluateHand5 } from '../core/poker';
import { playSoundDeal, playSoundPlace, playSoundScore, playSoundWin, playSoundLose } from '../core/sounds';

interface GameStore {
  state: GameState | null;
  stats: Stats;
  unlockedAchievements: string[];
  newAchievement: string | null;
  soundEnabled: boolean;
  handHistory: HandHistoryEntry[];
  // Actions
  newGame: (playerCount: number, aiCount: number, targetScore?: number, aiDifficulty?: AIDifficulty, timerDuration?: number) => void;
  nextRound: () => void;
  placeCards: (arrangement: PlayerArrangement) => void;
  autoArrange: () => void;
  nextPlayer: () => void;
  revealAndScore: () => void;
  tickTimer: () => void;
  dismissAchievement: () => void;
  resetStats: () => void;
  toggleSound: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      state: null,
      stats: { ...defaultStats },
      unlockedAchievements: [],
      newAchievement: null,
      soundEnabled: true,
      handHistory: [],

      newGame: (playerCount, aiCount, targetScore = 15, aiDifficulty = 'hard', timerDuration = 60) => {
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

        if (get().soundEnabled) playSoundDeal();

        set({
          state: {
            players,
            currentPlayerIndex: 0,
            phase: 'arranging',
            roundNumber: 1,
            timer: timerDuration,
            timerDuration,
            lastRoundScores: [],
            targetScore,
            matchWinner: null,
            aiDifficulty,
            rowComparison: null,
          },
        });

        // AI players auto-arrange immediately
        setTimeout(() => {
          const { state } = get();
          if (!state) return;
          const updatedPlayers = state.players.map((p) => {
            if (p.isAI && !p.arrangement) {
              return { ...p, arrangement: findBestArrangement(p.hand, state.aiDifficulty) };
            }
            return p;
          });
          set({ state: { ...state, players: updatedPlayers } });
        }, 500);
      },

      nextRound: () => {
        const { state, soundEnabled } = get();
        if (!state) return;

        // Keep totalScores, deal new hands
        const hands = deal(state.players.length);
        const players = state.players.map((p, i) => ({
          ...p,
          hand: hands[i],
          arrangement: null,
          score: 0,
        }));

        if (soundEnabled) playSoundDeal();

        set({
          state: {
            ...state,
            players,
            currentPlayerIndex: 0,
            phase: 'arranging',
            roundNumber: state.roundNumber + 1,
            timer: state.timerDuration,
            timerDuration: state.timerDuration,
            lastRoundScores: [],
            matchWinner: null,
            rowComparison: null,
          },
        });

        // AI auto-arrange
        setTimeout(() => {
          const { state: s } = get();
          if (!s) return;
          const updatedPlayers = s.players.map((p) => {
            if (p.isAI && !p.arrangement) {
              return { ...p, arrangement: findBestArrangement(p.hand, s.aiDifficulty) };
            }
            return p;
          });
          set({ state: { ...s, players: updatedPlayers } });
        }, 500);
      },

      placeCards: (arrangement) => {
        const { state, soundEnabled } = get();
        if (!state) return;
        const validation = validateArrangement(arrangement);
        if (!validation.valid) return;

        if (soundEnabled) playSoundPlace();

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
          get().revealAndScore();
          return;
        }

        const nextP = state.players[nextIdx];
        set({ state: { ...state, currentPlayerIndex: nextIdx, timer: state.timerDuration } });

        if (nextP.isAI) {
          setTimeout(() => get().nextPlayer(), 300);
        }
      },

      revealAndScore: () => {
        const { state, stats, unlockedAchievements, soundEnabled } = get();
        if (!state) return;

        const scores = calculateRoundScores(state.players);
        const players = state.players.map((p, i) => ({
          ...p,
          score: scores[i],
          totalScore: p.totalScore + scores[i],
        }));

        // Check match winner (first to targetScore)
        let matchWinner: number | null = null;
        let phase: GameState['phase'] = 'scoring';
        for (let i = 0; i < players.length; i++) {
          if (players[i].totalScore >= state.targetScore) {
            if (matchWinner === null || players[i].totalScore > players[matchWinner].totalScore) {
              matchWinner = i;
            }
          }
        }
        if (matchWinner !== null) {
          phase = 'match-over';
        }

        // Update stats
        const newStats = { ...stats };
        newStats.totalRounds++;
        const humanIdx = players.findIndex((p) => !p.isAI);
        if (humanIdx >= 0 && scores[humanIdx] > 0) newStats.roundsWon++;
        if (humanIdx >= 0 && scores[humanIdx] > newStats.bestRoundScore) newStats.bestRoundScore = scores[humanIdx];

        if (matchWinner !== null) {
          newStats.gamesPlayed++;
          if (humanIdx >= 0 && matchWinner === humanIdx) {
            newStats.gamesWon++;
            if (soundEnabled) playSoundWin();
          } else {
            if (soundEnabled) playSoundLose();
          }
        } else {
          if (soundEnabled) playSoundScore();
        }

        for (const p of players) {
          if (p.isAI || !p.arrangement) continue;
          const botEval = evaluateHand5(p.arrangement.bottom);
          if (botEval.rank === 'royal-flush') newStats.royalFlushes++;
          else if (botEval.rank === 'straight-flush') newStats.straightFlushes++;
          else if (botEval.rank === 'four-of-a-kind') newStats.fourOfAKinds++;
          if (scores[p.id] >= 6) newStats.scoops++;
        }

        const newAchs = checkNewAchievements(newStats, unlockedAchievements);
        const unlocked = [...unlockedAchievements, ...newAchs.map((a) => a.id)];

        // Push hand history entry (keep last 20)
        const historyEntry: HandHistoryEntry = {
          roundNumber: state.roundNumber,
          players: players.map((p, i) => ({
            name: p.name,
            arrangement: p.arrangement,
            score: scores[i],
          })),
          date: Date.now(),
        };
        const updatedHistory = [...get().handHistory, historyEntry].slice(-20);

        set({
          state: { ...state, players, phase, lastRoundScores: scores, matchWinner, rowComparison: computeRowComparison(players) },
          stats: newStats,
          unlockedAchievements: unlocked,
          newAchievement: newAchs.length > 0 ? newAchs[0].id : null,
          handHistory: updatedHistory,
        });
      },

      tickTimer: () => {
        const { state } = get();
        if (!state || state.phase !== 'arranging') return;
        const current = state.players[state.currentPlayerIndex];
        if (current.isAI) return;
        if (state.timer <= 1) {
          get().autoArrange();
          get().nextPlayer();
        } else {
          set({ state: { ...state, timer: state.timer - 1 } });
        }
      },

      dismissAchievement: () => set({ newAchievement: null }),
      resetStats: () => set({ stats: { ...defaultStats }, unlockedAchievements: [] }),
      toggleSound: () => set({ soundEnabled: !get().soundEnabled }),
    }),
    {
      name: 'capsa-susun-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ stats: s.stats, unlockedAchievements: s.unlockedAchievements, soundEnabled: s.soundEnabled, handHistory: s.handHistory }),
    },
  ),
);

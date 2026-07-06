// Core types for Capsa Susun. Pure data, no React.

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Value = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14; // 11=J, 12=Q, 13=K, 14=A

export interface Card {
  suit: Suit;
  value: Value;
  id: string; // unique "2h", "As", etc.
}

export type HandRank =
  | 'high-card'
  | 'pair'
  | 'two-pair'
  | 'three-of-a-kind'
  | 'straight'
  | 'flush'
  | 'full-house'
  | 'four-of-a-kind'
  | 'straight-flush'
  | 'royal-flush';

export interface HandEvaluation {
  rank: HandRank;
  rankValue: number; // 0-9
  tiebreaker: number[]; // for comparing same rank
}

export type RowType = 'top' | 'middle' | 'bottom';

export interface PlayerArrangement {
  top: Card[];    // 3 cards
  middle: Card[]; // 5 cards
  bottom: Card[]; // 5 cards
}

export interface Player {
  id: number;
  name: string;
  isAI: boolean;
  hand: Card[]; // 13 cards dealt
  arrangement: PlayerArrangement | null;
  score: number;
  totalScore: number;
}

export type GamePhase = 'dealing' | 'arranging' | 'revealing' | 'scoring' | 'game-over';

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  phase: GamePhase;
  roundNumber: number;
  timer: number; // seconds remaining
  lastRoundScores: number[];
}

// Theme colors
export const THEME = {
  bg: '#0a1f14',
  surface: '#143d28',
  surfaceLight: '#1a5035',
  gold: '#d4af37',
  goldSoft: '#b8860b',
  card: '#ffffff',
  cardShadow: 'rgba(0,0,0,0.4)',
  text: '#f5f0e8',
  textMuted: '#8fae9b',
  red: '#dc2626',
  black: '#1a1a1a',
  accent: '#10b981',
  danger: '#ef4444',
  border: '#2d6b4a',
} as const;

export const TIMER_DURATION = 60; // seconds per turn

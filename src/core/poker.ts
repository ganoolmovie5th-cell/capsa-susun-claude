// Poker hand evaluation. Pure functions.
import { Card, HandEvaluation, HandRank } from './types';

const RANK_VALUES: Record<HandRank, number> = {
  'high-card': 0,
  'pair': 1,
  'two-pair': 2,
  'three-of-a-kind': 3,
  'straight': 4,
  'flush': 5,
  'full-house': 6,
  'four-of-a-kind': 7,
  'straight-flush': 8,
  'royal-flush': 9,
};

/** Evaluate a 5-card hand. */
export function evaluateHand5(cards: Card[]): HandEvaluation {
  if (cards.length !== 5) throw new Error('evaluateHand5 requires exactly 5 cards');

  const values = cards.map((c) => c.value).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);
  const isFlush = suits.every((s) => s === suits[0]);

  // Check straight (handle A-2-3-4-5 low straight)
  let isStraight = false;
  let straightHigh = values[0];
  if (values[0] - values[4] === 4 && new Set(values).size === 5) {
    isStraight = true;
  } else if (values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2) {
    isStraight = true;
    straightHigh = 5; // low straight, 5 is high
  }

  // Count value frequencies
  const freq: Record<number, number> = {};
  for (const v of values) freq[v] = (freq[v] || 0) + 1;
  const counts = Object.values(freq).sort((a, b) => b - a);
  const freqEntries = Object.entries(freq)
    .map(([v, c]) => ({ value: Number(v), count: c }))
    .sort((a, b) => b.count - a.count || b.value - a.value);

  // Royal Flush
  if (isFlush && isStraight && straightHigh === 14) {
    return { rank: 'royal-flush', rankValue: 9, tiebreaker: [14] };
  }
  // Straight Flush
  if (isFlush && isStraight) {
    return { rank: 'straight-flush', rankValue: 8, tiebreaker: [straightHigh] };
  }
  // Four of a Kind
  if (counts[0] === 4) {
    return { rank: 'four-of-a-kind', rankValue: 7, tiebreaker: [freqEntries[0].value, freqEntries[1].value] };
  }
  // Full House
  if (counts[0] === 3 && counts[1] === 2) {
    return { rank: 'full-house', rankValue: 6, tiebreaker: [freqEntries[0].value, freqEntries[1].value] };
  }
  // Flush
  if (isFlush) {
    return { rank: 'flush', rankValue: 5, tiebreaker: values };
  }
  // Straight
  if (isStraight) {
    return { rank: 'straight', rankValue: 4, tiebreaker: [straightHigh] };
  }
  // Three of a Kind
  if (counts[0] === 3) {
    return { rank: 'three-of-a-kind', rankValue: 3, tiebreaker: [freqEntries[0].value, ...values.filter((v) => v !== freqEntries[0].value)] };
  }
  // Two Pair
  if (counts[0] === 2 && counts[1] === 2) {
    const pairs = freqEntries.filter((e) => e.count === 2).map((e) => e.value).sort((a, b) => b - a);
    const kicker = freqEntries.find((e) => e.count === 1)!.value;
    return { rank: 'two-pair', rankValue: 2, tiebreaker: [...pairs, kicker] };
  }
  // One Pair
  if (counts[0] === 2) {
    const pairVal = freqEntries[0].value;
    const kickers = values.filter((v) => v !== pairVal);
    return { rank: 'pair', rankValue: 1, tiebreaker: [pairVal, ...kickers] };
  }
  // High Card
  return { rank: 'high-card', rankValue: 0, tiebreaker: values };
}

/** Evaluate a 3-card hand (top row). Only high-card, pair, three-of-a-kind. */
export function evaluateHand3(cards: Card[]): HandEvaluation {
  if (cards.length !== 3) throw new Error('evaluateHand3 requires exactly 3 cards');

  const values = cards.map((c) => c.value).sort((a, b) => b - a);
  const freq: Record<number, number> = {};
  for (const v of values) freq[v] = (freq[v] || 0) + 1;
  const counts = Object.values(freq).sort((a, b) => b - a);
  const freqEntries = Object.entries(freq)
    .map(([v, c]) => ({ value: Number(v), count: c }))
    .sort((a, b) => b.count - a.count || b.value - a.value);

  if (counts[0] === 3) {
    return { rank: 'three-of-a-kind', rankValue: 3, tiebreaker: [freqEntries[0].value] };
  }
  if (counts[0] === 2) {
    const pairVal = freqEntries[0].value;
    const kicker = freqEntries[1].value;
    return { rank: 'pair', rankValue: 1, tiebreaker: [pairVal, kicker] };
  }
  return { rank: 'high-card', rankValue: 0, tiebreaker: values };
}

/** Compare two hand evaluations. Returns >0 if a wins, <0 if b wins, 0 if tie. */
export function compareEvaluations(a: HandEvaluation, b: HandEvaluation): number {
  if (a.rankValue !== b.rankValue) return a.rankValue - b.rankValue;
  for (let i = 0; i < Math.min(a.tiebreaker.length, b.tiebreaker.length); i++) {
    if (a.tiebreaker[i] !== b.tiebreaker[i]) return a.tiebreaker[i] - b.tiebreaker[i];
  }
  return 0;
}

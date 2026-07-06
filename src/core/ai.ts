// Smart AI for capsa susun with difficulty levels. Pure functions.
import { Card, PlayerArrangement, AIDifficulty } from './types';
import { evaluateHand5, evaluateHand3 } from './poker';
import { validateArrangement } from './validation';

/** Generate combinations of k items from array. */
function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const result: T[][] = [];
  const [first, ...rest] = arr;
  for (const combo of combinations(rest, k - 1)) {
    result.push([first, ...combo]);
  }
  for (const combo of combinations(rest, k)) {
    result.push(combo);
  }
  return result;
}

/** Shuffle array (Fisher-Yates). */
function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Difficulty config: how many combinations the AI evaluates
// Easy: random valid arrangement
// Medium: limited search (top 5 middles per bottom, first 200 bottoms)
// Hard: current strategy (top 20 middles, all 1287 bottoms, early exit 700)
// Dewa: exhaustive (top 56 middles = all, no early exit)
interface DifficultyConfig {
  maxBottoms: number;   // how many bottom combos to try
  maxMiddles: number;   // how many middles to evaluate per bottom
  earlyExit: number;    // stop if score exceeds this (Infinity = no early exit)
  pickFromTop: number;  // pick randomly from top N results (1 = always best)
}

const DIFFICULTY_CONFIGS: Record<AIDifficulty, DifficultyConfig> = {
  easy:   { maxBottoms: 100,  maxMiddles: 3,  earlyExit: 100, pickFromTop: 5 },
  medium: { maxBottoms: 500,  maxMiddles: 8,  earlyExit: 400, pickFromTop: 3 },
  hard:   { maxBottoms: 1287, maxMiddles: 20, earlyExit: 700, pickFromTop: 1 },
  dewa:   { maxBottoms: 1287, maxMiddles: 56, earlyExit: Infinity, pickFromTop: 1 },
};

/** Find best valid arrangement for 13 cards based on difficulty. */
export function findBestArrangement(hand: Card[], difficulty: AIDifficulty = 'hard'): PlayerArrangement {
  const config = DIFFICULTY_CONFIGS[difficulty];

  // Easy mode: just find a few valid arrangements and pick one randomly
  if (difficulty === 'easy') {
    return findEasyArrangement(hand, config);
  }

  const candidates: { arr: PlayerArrangement; score: number }[] = [];

  const allBottomCombos = combinations(hand, 5);
  // Shuffle and limit bottoms for medium
  const bottomCombos = config.maxBottoms < allBottomCombos.length
    ? shuffleArr(allBottomCombos).slice(0, config.maxBottoms)
    : allBottomCombos;

  for (const bottom of bottomCombos) {
    const remaining8 = hand.filter((c) => !bottom.includes(c));
    const middleCombos = combinations(remaining8, 5);

    const evaluated = middleCombos
      .map((mid) => ({ mid, eval: evaluateHand5(mid) }))
      .sort((a, b) => b.eval.rankValue - a.eval.rankValue || b.eval.tiebreaker[0] - a.eval.tiebreaker[0])
      .slice(0, config.maxMiddles);

    for (const { mid: middle } of evaluated) {
      const top = remaining8.filter((c) => !middle.includes(c));
      if (top.length !== 3) continue;

      const arrangement: PlayerArrangement = { top, middle, bottom };
      if (!validateArrangement(arrangement).valid) continue;

      const botEval = evaluateHand5(bottom);
      const midEval = evaluateHand5(middle);
      const topEval = evaluateHand3(top);
      const score = botEval.rankValue * 100 + midEval.rankValue * 10 + topEval.rankValue
        + botEval.tiebreaker[0] * 0.1 + midEval.tiebreaker[0] * 0.01;

      candidates.push({ arr: arrangement, score });
    }

    // Early exit for non-dewa
    if (candidates.length > 0 && candidates[candidates.length - 1].score > config.earlyExit) break;
  }

  if (candidates.length === 0) {
    // Fallback
    const sorted = [...hand].sort((a, b) => b.value - a.value);
    return { bottom: sorted.slice(0, 5), middle: sorted.slice(5, 10), top: sorted.slice(10, 13) };
  }

  // Sort by score descending, pick from top N
  candidates.sort((a, b) => b.score - a.score);
  const pickPool = candidates.slice(0, config.pickFromTop);
  const pick = pickPool[Math.floor(Math.random() * pickPool.length)];
  return pick.arr;
}

/** Easy mode: find first few valid arrangements, pick randomly. */
function findEasyArrangement(hand: Card[], config: DifficultyConfig): PlayerArrangement {
  const valid: PlayerArrangement[] = [];
  const bottomCombos = shuffleArr(combinations(hand, 5)).slice(0, config.maxBottoms);

  for (const bottom of bottomCombos) {
    if (valid.length >= 5) break;
    const remaining8 = hand.filter((c) => !bottom.includes(c));
    const middleCombos = shuffleArr(combinations(remaining8, 5)).slice(0, config.maxMiddles);

    for (const middle of middleCombos) {
      const top = remaining8.filter((c) => !middle.includes(c));
      if (top.length !== 3) continue;
      const arr: PlayerArrangement = { top, middle, bottom };
      if (validateArrangement(arr).valid) {
        valid.push(arr);
        break; // one per bottom
      }
    }
  }

  if (valid.length === 0) {
    const sorted = [...hand].sort((a, b) => b.value - a.value);
    return { bottom: sorted.slice(0, 5), middle: sorted.slice(5, 10), top: sorted.slice(10, 13) };
  }

  return valid[Math.floor(Math.random() * valid.length)];
}

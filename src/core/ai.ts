// Smart AI for capsa susun. Pure functions.
import { Card, PlayerArrangement } from './types';
import { evaluateHand5, evaluateHand3 } from './poker';
import { validateArrangement } from './validation';

/** Generate combinations of k items from array. */
function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const result: T[][] = [];
  const [first, ...rest] = arr;
  // Include first
  for (const combo of combinations(rest, k - 1)) {
    result.push([first, ...combo]);
  }
  // Exclude first
  for (const combo of combinations(rest, k)) {
    result.push(combo);
  }
  return result;
}

/** Find best valid arrangement for 13 cards. Smart AI strategy. */
export function findBestArrangement(hand: Card[]): PlayerArrangement {
  // Strategy: try many combinations, pick the one with highest total strength
  // that passes validation.

  let bestArrangement: PlayerArrangement | null = null;
  let bestScore = -Infinity;

  // Generate candidate bottom hands (5 cards from 13)
  // Limit: 13C5 = 1287 combinations — manageable
  const bottomCombos = combinations(hand, 5);

  for (const bottom of bottomCombos) {
    const remaining8 = hand.filter((c) => !bottom.includes(c));

    // Try a few middle combinations from remaining 8
    const middleCombos = combinations(remaining8, 5);

    // ponytail: limit iterations for performance (top 50 middle combos by strength)
    const evaluated = middleCombos
      .map((mid) => ({ mid, eval: evaluateHand5(mid) }))
      .sort((a, b) => b.eval.rankValue - a.eval.rankValue || b.eval.tiebreaker[0] - a.eval.tiebreaker[0])
      .slice(0, 20); // top 20 middles per bottom

    for (const { mid: middle } of evaluated) {
      const top = remaining8.filter((c) => !middle.includes(c));
      if (top.length !== 3) continue;

      const arrangement: PlayerArrangement = { top, middle, bottom };
      const validation = validateArrangement(arrangement);
      if (!validation.valid) continue;

      // Score this arrangement (sum of rankValues)
      const botEval = evaluateHand5(bottom);
      const midEval = evaluateHand5(middle);
      const topEval = evaluateHand3(top);
      const score = botEval.rankValue * 100 + midEval.rankValue * 10 + topEval.rankValue
        + botEval.tiebreaker[0] * 0.1 + midEval.tiebreaker[0] * 0.01;

      if (score > bestScore) {
        bestScore = score;
        bestArrangement = arrangement;
      }
    }

    // ponytail: early exit if we found a very strong arrangement (perf limit)
    if (bestScore > 700) break; // four-of-a-kind + full-house level
  }

  // Fallback: just split cards in order if nothing found
  if (!bestArrangement) {
    const sorted = [...hand].sort((a, b) => b.value - a.value);
    bestArrangement = {
      bottom: sorted.slice(0, 5),
      middle: sorted.slice(5, 10),
      top: sorted.slice(10, 13),
    };
  }

  return bestArrangement;
}

// Validate capsa susun arrangement. Pure functions.
import { Card, PlayerArrangement } from './types';
import { evaluateHand3, evaluateHand5, compareEvaluations } from './poker';

/** Validate that bottom ≥ middle ≥ top in hand strength. */
export function validateArrangement(arr: PlayerArrangement): { valid: boolean; error?: string } {
  if (arr.top.length !== 3) return { valid: false, error: 'Baris atas harus 3 kartu' };
  if (arr.middle.length !== 5) return { valid: false, error: 'Baris tengah harus 5 kartu' };
  if (arr.bottom.length !== 5) return { valid: false, error: 'Baris bawah harus 5 kartu' };

  const topEval = evaluateHand3(arr.top);
  const midEval = evaluateHand5(arr.middle);
  const botEval = evaluateHand5(arr.bottom);

  // Bottom must be >= middle
  if (compareEvaluations(botEval, midEval) < 0) {
    return { valid: false, error: 'Baris bawah harus lebih kuat dari tengah' };
  }
  // Middle must be >= top (compare 5-card eval vs 3-card eval by rankValue only)
  if (midEval.rankValue < topEval.rankValue) {
    return { valid: false, error: 'Baris tengah harus lebih kuat dari atas' };
  }
  if (midEval.rankValue === topEval.rankValue) {
    // Same rank type — compare tiebreakers
    if (compareEvaluations(midEval, topEval) < 0) {
      return { valid: false, error: 'Baris tengah harus lebih kuat dari atas' };
    }
  }

  return { valid: true };
}



// Scoring system for capsa susun. Pure functions.
import { PlayerArrangement, Player } from './types';
import { evaluateHand3, evaluateHand5, compareEvaluations } from './poker';

interface RowResult {
  winner: number; // player index who won this row
  loser: number;
  tie: boolean;
}

/** Compare two players' arrangements and return scores. */
export function compareArrangements(a: PlayerArrangement, b: PlayerArrangement): { aScore: number; bScore: number } {
  const aTop = evaluateHand3(a.top);
  const bTop = evaluateHand3(b.top);
  const aMid = evaluateHand5(a.middle);
  const bMid = evaluateHand5(b.middle);
  const aBot = evaluateHand5(a.bottom);
  const bBot = evaluateHand5(b.bottom);

  let aScore = 0;
  let bScore = 0;

  // Top row
  const topCmp = compareEvaluations(aTop, bTop);
  if (topCmp > 0) aScore++;
  else if (topCmp < 0) bScore++;

  // Middle row
  const midCmp = compareEvaluations(aMid, bMid);
  if (midCmp > 0) aScore++;
  else if (midCmp < 0) bScore++;

  // Bottom row
  const botCmp = compareEvaluations(aBot, bBot);
  if (botCmp > 0) aScore++;
  else if (botCmp < 0) bScore++;

  // Scoop bonus: win all 3 rows = +3 extra
  if (aScore === 3) aScore += 3;
  if (bScore === 3) bScore += 3;

  return { aScore, bScore };
}

/** Calculate scores for all players in a round. Returns score deltas. */
export function calculateRoundScores(players: Player[]): number[] {
  const scores = new Array(players.length).fill(0);
  const arrangements = players.map((p) => p.arrangement);

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const a = arrangements[i];
      const b = arrangements[j];
      if (!a || !b) continue;
      const { aScore, bScore } = compareArrangements(a, b);
      scores[i] += aScore - bScore;
      scores[j] += bScore - aScore;
    }
  }

  // Bonus checks
  for (let i = 0; i < players.length; i++) {
    const arr = arrangements[i];
    if (!arr) continue;
    const botEval = evaluateHand5(arr.bottom);
    const midEval = evaluateHand5(arr.middle);
    // Royal flush bottom: +5
    if (botEval.rank === 'royal-flush') scores[i] += 5;
    // Four of a kind bottom: +4
    else if (botEval.rank === 'four-of-a-kind') scores[i] += 4;
    // Straight flush middle: +4
    if (midEval.rank === 'straight-flush') scores[i] += 4;
  }

  return scores;
}

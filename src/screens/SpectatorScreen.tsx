import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '../store/gameStore';
import { THEME, Card, AIDifficulty } from '../core/types';
import { cardDisplay, isRed } from '../core/deck';
import { evaluateHand3, evaluateHand5 } from '../core/poker';

interface Props { onBack: () => void; }

type SpeedSetting = 'cepat' | 'normal' | 'lambat';
const SPEED_DELAYS: Record<SpeedSetting, number> = { cepat: 1000, normal: 2000, lambat: 3000 };

export default function SpectatorScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const { state, newGame, nextPlayer, revealAndScore, nextRound } = useGameStore();
  const [speed, setSpeed] = useState<SpeedSetting>('normal');
  const [autoRunning, setAutoRunning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // Start a spectator game on mount
  useEffect(() => {
    newGame(4, 4, 15, 'medium', 60);
    setAutoRunning(true);
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Auto-advance logic
  useEffect(() => {
    if (!state || !autoRunning) return;

    const delay = SPEED_DELAYS[speed];

    if (state.phase === 'arranging') {
      // All 4 are AI, wait for them to arrange then advance
      const allArranged = state.players.every((p) => p.arrangement !== null);
      if (allArranged) {
        // All arranged, advance through players then score
        timeoutRef.current = setTimeout(() => {
          if (!mountedRef.current) return;
          const { state: s } = useGameStore.getState();
          if (!s) return;
          if (s.currentPlayerIndex < s.players.length - 1) {
            nextPlayer();
          } else {
            revealAndScore();
          }
        }, delay);
      } else {
        // AI is still arranging (500ms setTimeout in newGame), wait and retry
        timeoutRef.current = setTimeout(() => {
          if (!mountedRef.current) return;
          // Check again — AI should have arranged by now
          const { state: s } = useGameStore.getState();
          if (!s) return;
          const allDone = s.players.every((p) => p.arrangement !== null);
          if (allDone) {
            // Advance all players (they're all AI)
            // Just call revealAndScore directly since all are arranged
            revealAndScore();
          }
        }, 1000);
      }
    } else if (state.phase === 'scoring') {
      // Wait then go to next round
      timeoutRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        nextRound();
      }, delay * 2);
    } else if (state.phase === 'match-over') {
      // Game over — wait then start new game
      timeoutRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        newGame(4, 4, 15, 'hard', 60);
      }, delay * 3);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [state?.phase, state?.currentPlayerIndex, state?.players, autoRunning, speed]);

  const renderCardCompact = (card: Card) => {
    const red = isRed(card);
    return (
      <View key={card.id} style={[cardStyles.card, red && cardStyles.cardRed]}>
        <Text style={[cardStyles.cardText, red && cardStyles.cardTextRed]}>
          {cardDisplay(card)}
        </Text>
      </View>
    );
  };

  if (!state) return null;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Kembali">
            <Text style={styles.backText}>← Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Spectator Mode</Text>
          <View style={{ width: 80 }} />
        </View>

        {/* Speed toggle */}
        <View style={styles.speedRow}>
          <Text style={styles.speedLabel}>Kecepatan:</Text>
          {(['cepat', 'normal', 'lambat'] as SpeedSetting[]).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.speedChip, speed === s && styles.speedChipActive]}
              onPress={() => setSpeed(s)}
              accessibilityRole="button"
            >
              <Text style={[styles.speedChipText, speed === s && styles.speedChipTextActive]}>
                {s === 'cepat' ? 'Cepat' : s === 'normal' ? 'Normal' : 'Lambat'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Round info */}
        <View style={styles.roundBar}>
          <Text style={styles.roundText}>Ronde {state.roundNumber}</Text>
          <Text style={styles.phaseText}>
            {state.phase === 'arranging' ? 'Menyusun...' :
             state.phase === 'scoring' ? 'Hasil' :
             state.phase === 'match-over' ? 'Selesai!' : state.phase}
          </Text>
        </View>

        {/* Player scores */}
        <View style={styles.scoresRow}>
          {state.players.map((p) => (
            <View key={p.id} style={styles.scoreCard}>
              <Text style={styles.scoreName}>{p.name}</Text>
              <Text style={[styles.scoreValue, p.totalScore >= state.targetScore && styles.scoreWin]}>
                {p.totalScore >= 0 ? '+' : ''}{p.totalScore}
              </Text>
              {state.lastRoundScores.length > 0 && (
                <Text style={[
                  styles.scoreRound,
                  state.lastRoundScores[p.id] > 0 && { color: THEME.accent },
                  state.lastRoundScores[p.id] < 0 && { color: THEME.danger },
                ]}>
                  ({state.lastRoundScores[p.id] >= 0 ? '+' : ''}{state.lastRoundScores[p.id]})
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Show all hands during scoring/match-over */}
        {(state.phase === 'scoring' || state.phase === 'match-over') && (
          <View style={styles.handsSection}>
            {state.players.map((p) => (
              <View key={p.id} style={styles.playerHand}>
                <Text style={styles.playerHandName}>{p.name}</Text>
                {p.arrangement && (
                  <>
                    <View style={styles.rowContainer}>
                      <Text style={styles.rowLabel}>A</Text>
                      <View style={styles.cardsRow}>
                        {p.arrangement.top.map(renderCardCompact)}
                      </View>
                      <Text style={styles.handLabel}>{evaluateHand3(p.arrangement.top).rank}</Text>
                    </View>
                    <View style={styles.rowContainer}>
                      <Text style={styles.rowLabel}>T</Text>
                      <View style={styles.cardsRow}>
                        {p.arrangement.middle.map(renderCardCompact)}
                      </View>
                      <Text style={styles.handLabel}>{evaluateHand5(p.arrangement.middle).rank}</Text>
                    </View>
                    <View style={styles.rowContainer}>
                      <Text style={styles.rowLabel}>B</Text>
                      <View style={styles.cardsRow}>
                        {p.arrangement.bottom.map(renderCardCompact)}
                      </View>
                      <Text style={styles.handLabel}>{evaluateHand5(p.arrangement.bottom).rank}</Text>
                    </View>
                  </>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Match winner */}
        {state.phase === 'match-over' && state.matchWinner !== null && (
          <View style={styles.winnerBanner}>
            <Text style={styles.winnerText}>🏆 {state.players[state.matchWinner].name} Menang!</Text>
            <Text style={styles.winnerSub}>Ronde baru dimulai otomatis...</Text>
          </View>
        )}

        {/* Waiting indicator */}
        {state.phase === 'arranging' && (
          <View style={styles.waitingBox}>
            <Text style={styles.waitingText}>🤖 Bot sedang menyusun kartu...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const cardStyles = StyleSheet.create({
  card: { backgroundColor: THEME.card, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2, marginRight: 2 },
  cardRed: {},
  cardText: { fontSize: 11, fontWeight: '700', color: THEME.black },
  cardTextRed: { color: THEME.red },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  scroll: { padding: 16, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  backBtn: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: THEME.surface, borderRadius: 8 },
  backText: { color: THEME.textMuted, fontWeight: '600', fontSize: 13 },
  title: { fontSize: 16, fontWeight: '800', color: THEME.gold },
  // Speed
  speedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  speedLabel: { fontSize: 12, color: THEME.textMuted, fontWeight: '600' },
  speedChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.border },
  speedChipActive: { borderColor: THEME.gold, backgroundColor: 'rgba(212,175,55,0.12)' },
  speedChipText: { fontSize: 12, fontWeight: '600', color: THEME.textMuted },
  speedChipTextActive: { color: THEME.gold },
  // Round
  roundBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: 10, backgroundColor: THEME.surface, borderRadius: 10, borderWidth: 1, borderColor: THEME.border },
  roundText: { fontSize: 14, fontWeight: '700', color: THEME.gold },
  phaseText: { fontSize: 12, color: THEME.textMuted, fontStyle: 'italic' },
  // Scores
  scoresRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  scoreCard: { flex: 1, backgroundColor: THEME.surface, borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: THEME.border },
  scoreName: { fontSize: 10, color: THEME.textMuted, fontWeight: '600' },
  scoreValue: { fontSize: 18, fontWeight: '800', color: THEME.gold, marginTop: 2 },
  scoreWin: { color: THEME.accent },
  scoreRound: { fontSize: 10, color: THEME.textMuted, marginTop: 2 },
  // Hands
  handsSection: { gap: 10 },
  playerHand: { backgroundColor: THEME.surface, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: THEME.border },
  playerHandName: { fontSize: 13, fontWeight: '700', color: THEME.text, marginBottom: 6 },
  rowContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  rowLabel: { width: 16, fontSize: 10, fontWeight: '700', color: THEME.textMuted },
  cardsRow: { flexDirection: 'row', flexWrap: 'wrap', flex: 1 },
  handLabel: { fontSize: 9, color: THEME.accent, fontWeight: '600', marginLeft: 4, maxWidth: 80 },
  // Winner
  winnerBanner: { marginTop: 14, padding: 16, backgroundColor: 'rgba(212,175,55,0.12)', borderRadius: 14, borderWidth: 1, borderColor: THEME.gold, alignItems: 'center' },
  winnerText: { fontSize: 18, fontWeight: '800', color: THEME.gold },
  winnerSub: { fontSize: 12, color: THEME.textMuted, marginTop: 4 },
  // Waiting
  waitingBox: { alignItems: 'center', paddingVertical: 40 },
  waitingText: { fontSize: 14, color: THEME.textMuted, fontStyle: 'italic' },
});

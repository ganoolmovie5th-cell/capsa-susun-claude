import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useGameStore } from '../store/gameStore';
import { THEME, Card, PlayerArrangement, RowType } from '../core/types';
import { cardDisplay, isRed } from '../core/deck';
import { evaluateHand3, evaluateHand5 } from '../core/poker';
import DraggableCard from '../components/DraggableCard';
import DropRow from '../components/DropRow';
import FlipCard from '../components/FlipCard';
import { playSoundFlip } from '../core/sounds';

interface Props { onBack: () => void; }

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function GameScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const { state, placeCards, autoArrange, nextPlayer, nextRound, tickTimer, soundEnabled } = useGameStore();

  // Timer
  useEffect(() => {
    if (!state || state.phase !== 'arranging') return;
    const id = setInterval(tickTimer, 1000);
    return () => clearInterval(id);
  }, [state?.phase, state?.currentPlayerIndex]);

  // Local arrangement state for human
  const [top, setTop] = useState<Card[]>([]);
  const [middle, setMiddle] = useState<Card[]>([]);
  const [bottom, setBottom] = useState<Card[]>([]);
  const [unplaced, setUnplaced] = useState<Card[]>([]);

  // Reveal state for scoring
  const [revealCards, setRevealCards] = useState(false);

  // Drop zone Y positions
  const dropZones = useRef<Record<RowType, { y: number; h: number }>>({
    top: { y: 0, h: 0 },
    middle: { y: 0, h: 0 },
    bottom: { y: 0, h: 0 },
  });

  // Init unplaced when player changes
  useEffect(() => {
    if (!state || state.phase !== 'arranging') return;
    const current = state.players[state.currentPlayerIndex];
    if (!current.isAI && !current.arrangement) {
      setTop([]);
      setMiddle([]);
      setBottom([]);
      setUnplaced([...current.hand]);
    }
  }, [state?.currentPlayerIndex, state?.phase]);

  // Trigger reveal animation when scoring
  useEffect(() => {
    if (state?.phase === 'scoring' || state?.phase === 'match-over') {
      setRevealCards(false);
      const timeout = setTimeout(() => {
        setRevealCards(true);
        if (soundEnabled) playSoundFlip();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [state?.phase]);

  const handleDropZoneLayout = useCallback((type: RowType, y: number, h: number) => {
    dropZones.current[type] = { y, h };
  }, []);

  const moveToRow = useCallback((card: Card, target: RowType) => {
    // Remove from all locations
    setUnplaced((prev) => prev.filter((c) => c.id !== card.id));
    setTop((prev) => prev.filter((c) => c.id !== card.id));
    setMiddle((prev) => prev.filter((c) => c.id !== card.id));
    setBottom((prev) => prev.filter((c) => c.id !== card.id));

    const maxForRow = target === 'top' ? 3 : 5;
    const setter = target === 'top' ? setTop : target === 'middle' ? setMiddle : setBottom;
    const current = target === 'top' ? top : target === 'middle' ? middle : bottom;

    if (current.length < maxForRow) {
      setter((prev) => [...prev, card]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [top, middle, bottom]);

  const handleDrop = useCallback((card: Card, absoluteY: number) => {
    const zones = dropZones.current;
    // Find which zone the card was dropped into
    if (absoluteY >= zones.top.y && absoluteY <= zones.top.y + zones.top.h) {
      moveToRow(card, 'top');
    } else if (absoluteY >= zones.middle.y && absoluteY <= zones.middle.y + zones.middle.h) {
      moveToRow(card, 'middle');
    } else if (absoluteY >= zones.bottom.y && absoluteY <= zones.bottom.y + zones.bottom.h) {
      moveToRow(card, 'bottom');
    }
    // If dropped elsewhere, card stays where it is (spring back)
  }, [moveToRow]);

  const handleTap = useCallback((card: Card) => {
    // Tap cycles through: unplaced → bottom → middle → top → unplaced
    if (bottom.length < 5 && unplaced.find((c) => c.id === card.id)) {
      moveToRow(card, 'bottom');
    } else if (middle.length < 5 && (unplaced.find((c) => c.id === card.id) || bottom.find((c) => c.id === card.id))) {
      moveToRow(card, 'middle');
    } else if (top.length < 3) {
      moveToRow(card, 'top');
    }
  }, [unplaced, top, middle, bottom, moveToRow]);

  const returnCard = useCallback((card: Card) => {
    setTop((prev) => prev.filter((c) => c.id !== card.id));
    setMiddle((prev) => prev.filter((c) => c.id !== card.id));
    setBottom((prev) => prev.filter((c) => c.id !== card.id));
    setUnplaced((prev) => [...prev, card]);
  }, []);

  const handleSubmit = () => {
    if (top.length !== 3 || middle.length !== 5 || bottom.length !== 5) return;
    const arrangement: PlayerArrangement = { top, middle, bottom };
    placeCards(arrangement);
    nextPlayer();
  };

  const handleAutoArrange = () => {
    autoArrange();
    const { state: updated } = useGameStore.getState();
    if (updated) {
      const p = updated.players[updated.currentPlayerIndex];
      if (p.arrangement) {
        setTop(p.arrangement.top);
        setMiddle(p.arrangement.middle);
        setBottom(p.arrangement.bottom);
        setUnplaced([]);
      }
    }
  };

  const handleNextRound = () => {
    nextRound();
  };

  if (!state) return null;

  const current = state.players[state.currentPlayerIndex];

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Keluar">
            <Text style={styles.backText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Ronde {state.roundNumber}</Text>
            <Text style={styles.headerSub}>Target: {state.targetScore} poin</Text>
          </View>
          {state.phase === 'arranging' && !current.isAI && (
            <View style={[styles.timerBadge, state.timer <= 10 && styles.timerBadgeDanger]}>
              <Text style={[styles.timerText, state.timer <= 10 && styles.timerDanger]}>{state.timer}s</Text>
            </View>
          )}
          {(state.phase !== 'arranging' || current.isAI) && <View style={{ width: 44 }} />}
        </View>

        {/* Player scores bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playersRow}>
          {state.players.map((p) => (
            <View key={p.id} style={[styles.playerChip, p.id === current.id && state.phase === 'arranging' && styles.playerChipActive]}>
              <Text style={styles.playerName}>{p.name}{p.isAI ? ' 🤖' : ''}</Text>
              <Text style={[styles.playerScore, p.totalScore >= state.targetScore && styles.playerScoreWin]}>
                {p.totalScore >= 0 ? '+' : ''}{p.totalScore}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Arranging phase - Drag & Drop UI */}
        {state.phase === 'arranging' && !current.isAI && (
          <>
            {/* Drop zones */}
            <DropRow label="Atas (3)" type="top" cards={top} maxCards={3} onRemoveCard={returnCard} onLayout={handleDropZoneLayout} />
            <DropRow label="Tengah (5)" type="middle" cards={middle} maxCards={5} onRemoveCard={returnCard} onLayout={handleDropZoneLayout} />
            <DropRow label="Bawah (5)" type="bottom" cards={bottom} maxCards={5} onRemoveCard={returnCard} onLayout={handleDropZoneLayout} />

            {/* Unplaced cards - Draggable */}
            <Text style={styles.sectionLabel}>Kartu ({unplaced.length})</Text>
            <Text style={styles.hint}>Drag ke baris atau tap untuk auto-place</Text>
            <View style={styles.unplacedGrid}>
              {unplaced.sort((a, b) => b.value - a.value || a.suit.localeCompare(b.suit)).map((c) => (
                <DraggableCard key={c.id} card={c} onDrop={handleDrop} onTap={handleTap} />
              ))}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.autoBtn} onPress={handleAutoArrange} accessibilityRole="button">
                <Text style={styles.autoBtnText}>🤖 Auto</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, (top.length !== 3 || middle.length !== 5 || bottom.length !== 5) && styles.submitDisabled]}
                onPress={handleSubmit}
                disabled={top.length !== 3 || middle.length !== 5 || bottom.length !== 5}
                accessibilityRole="button"
              >
                <Text style={styles.submitText}>✓ Selesai</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* AI thinking */}
        {state.phase === 'arranging' && current.isAI && (
          <View style={styles.aiThinking}>
            <Text style={styles.aiText}>🤖 {current.name} sedang menyusun kartu...</Text>
          </View>
        )}

        {/* Scoring / Reveal phase */}
        {(state.phase === 'scoring' || state.phase === 'match-over') && (
          <View style={styles.scoringSection}>
            <Text style={styles.scoringTitle}>
              {state.phase === 'match-over' ? '🏆 Pertandingan Selesai!' : `Hasil Ronde ${state.roundNumber}`}
            </Text>

            {/* Player arrangements with flip cards + row comparison */}
            {state.players.map((p, idx) => {
              // Compute row results for this player (vs all others)
              const rc = state.rowComparison;
              const rowWins = (row: 'top' | 'middle' | 'bottom') => {
                if (!rc) return 0;
                return rc[row][idx].reduce((sum, v) => sum + (v > 0 ? 1 : 0), 0);
              };
              const rowLosses = (row: 'top' | 'middle' | 'bottom') => {
                if (!rc) return 0;
                return rc[row][idx].reduce((sum, v) => sum + (v < 0 ? 1 : 0), 0);
              };
              const rowIndicator = (row: 'top' | 'middle' | 'bottom') => {
                const w = rowWins(row);
                const l = rowLosses(row);
                if (w > l) return { text: `W${w}`, color: THEME.accent };
                if (l > w) return { text: `L${l}`, color: THEME.danger };
                return { text: 'T', color: THEME.textMuted };
              };

              return (
                <View key={p.id} style={styles.revealPlayer}>
                  <View style={styles.revealHeader}>
                    <Text style={styles.revealName}>{p.name}{p.isAI ? ' 🤖' : ''}</Text>
                    <Text style={[
                      styles.revealScore,
                      state.lastRoundScores[idx] > 0 && styles.scorePositive,
                      state.lastRoundScores[idx] < 0 && styles.scoreNegative,
                    ]}>
                      {state.lastRoundScores[idx] >= 0 ? '+' : ''}{state.lastRoundScores[idx]}
                    </Text>
                  </View>
                  {p.arrangement && (
                    <View style={styles.revealRows}>
                      {(['top', 'middle', 'bottom'] as const).map((row) => {
                        const cards = row === 'top' ? p.arrangement!.top : row === 'middle' ? p.arrangement!.middle : p.arrangement!.bottom;
                        const label = row === 'top' ? 'A' : row === 'middle' ? 'T' : 'B';
                        const delayBase = row === 'top' ? 0 : row === 'middle' ? 250 : 500;
                        const indicator = rowIndicator(row);
                        const handEval = row === 'top' ? evaluateHand3(cards) : evaluateHand5(cards);
                        return (
                          <View key={row} style={styles.revealRow}>
                            <Text style={styles.revealRowLabel}>{label}</Text>
                            {cards.map((c, ci) => (
                              <FlipCard key={c.id} card={c} faceUp={revealCards} delay={idx * 200 + delayBase + ci * 80} size="sm" />
                            ))}
                            <View style={[styles.rowBadge, { backgroundColor: indicator.color + '22', borderColor: indicator.color }]}>
                              <Text style={[styles.rowBadgeText, { color: indicator.color }]}>{indicator.text}</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}

            {/* Match winner */}
            {state.phase === 'match-over' && state.matchWinner !== null && (
              <View style={styles.winnerBanner}>
                <Text style={styles.winnerText}>🎉 {state.players[state.matchWinner].name} Menang!</Text>
                <Text style={styles.winnerSub}>
                  Mencapai {state.players[state.matchWinner].totalScore} poin dalam {state.roundNumber} ronde
                </Text>
              </View>
            )}

            {/* Actions */}
            {state.phase === 'scoring' && (
              <TouchableOpacity style={styles.startBtn} onPress={handleNextRound} accessibilityRole="button">
                <Text style={styles.startBtnText}>Ronde Berikutnya →</Text>
              </TouchableOpacity>
            )}
            {state.phase === 'match-over' && (
              <TouchableOpacity style={styles.startBtn} onPress={onBack} accessibilityRole="button">
                <Text style={styles.startBtnText}>Kembali ke Menu</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  scroll: { padding: 16, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: THEME.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: THEME.border },
  backText: { color: THEME.textMuted, fontWeight: '700', fontSize: 16 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { color: THEME.gold, fontWeight: '700', fontSize: 16 },
  headerSub: { color: THEME.textMuted, fontSize: 11, marginTop: 1 },
  timerBadge: { backgroundColor: THEME.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: THEME.border },
  timerBadgeDanger: { borderColor: THEME.danger, backgroundColor: 'rgba(239,68,68,0.1)' },
  timerText: { color: THEME.text, fontWeight: '800', fontSize: 15 },
  timerDanger: { color: THEME.danger },
  playersRow: { maxHeight: 54, marginBottom: 12 },
  playerChip: { backgroundColor: THEME.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, alignItems: 'center', borderWidth: 1, borderColor: 'transparent', minWidth: 80 },
  playerChipActive: { borderColor: THEME.gold },
  playerName: { fontSize: 11, color: THEME.textMuted },
  playerScore: { fontSize: 16, fontWeight: '800', color: THEME.gold, marginTop: 1 },
  playerScoreWin: { color: THEME.accent },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: THEME.textMuted, marginTop: 12, marginBottom: 2, textTransform: 'uppercase' },
  hint: { fontSize: 11, color: THEME.textMuted, marginBottom: 8, fontStyle: 'italic' },
  unplacedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 4 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  autoBtn: { flex: 1, paddingVertical: 14, backgroundColor: THEME.surface, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: THEME.border },
  autoBtnText: { fontSize: 15, fontWeight: '700', color: THEME.text },
  submitBtn: { flex: 2, paddingVertical: 14, backgroundColor: THEME.gold, borderRadius: 12, alignItems: 'center' },
  submitDisabled: { opacity: 0.4 },
  submitText: { fontSize: 15, fontWeight: '800', color: THEME.bg },
  aiThinking: { alignItems: 'center', paddingVertical: 60 },
  aiText: { fontSize: 16, color: THEME.textMuted, fontStyle: 'italic' },
  // Scoring
  scoringSection: { marginTop: 12 },
  scoringTitle: { fontSize: 20, fontWeight: '800', color: THEME.gold, textAlign: 'center', marginBottom: 16 },
  revealPlayer: { marginBottom: 14, padding: 12, backgroundColor: THEME.surface, borderRadius: 14, borderWidth: 1, borderColor: THEME.border },
  revealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  revealName: { fontSize: 14, fontWeight: '700', color: THEME.text },
  revealScore: { fontSize: 18, fontWeight: '800', color: THEME.text },
  scorePositive: { color: THEME.accent },
  scoreNegative: { color: THEME.danger },
  revealRows: { gap: 6 },
  revealRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  revealRowLabel: { width: 16, fontSize: 10, fontWeight: '700', color: THEME.textMuted, textAlign: 'center' },
  rowBadge: { marginLeft: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  rowBadgeText: { fontSize: 10, fontWeight: '800' },
  winnerBanner: { marginTop: 16, padding: 20, backgroundColor: 'rgba(212,175,55,0.12)', borderRadius: 16, borderWidth: 1, borderColor: THEME.gold, alignItems: 'center' },
  winnerText: { fontSize: 22, fontWeight: '800', color: THEME.gold },
  winnerSub: { fontSize: 13, color: THEME.textMuted, marginTop: 4 },
  startBtn: { marginTop: 20, backgroundColor: THEME.gold, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  startBtnText: { fontSize: 16, fontWeight: '800', color: THEME.bg },
});

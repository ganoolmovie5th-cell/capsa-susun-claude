import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '../store/gameStore';
import { THEME, Card, PlayerArrangement } from '../core/types';
import { cardDisplay, isRed } from '../core/deck';
import { evaluateHand3, evaluateHand5 } from '../core/poker';

interface Props { onBack: () => void; }

export default function GameScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const { state, placeCards, autoArrange, nextPlayer, revealAndScore, tickTimer, newGame } = useGameStore();

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

  if (!state) return null;

  const current = state.players[state.currentPlayerIndex];

  const moveToRow = (card: Card, target: 'top' | 'middle' | 'bottom') => {
    // Remove from current location
    setUnplaced((prev) => prev.filter((c) => c.id !== card.id));
    setTop((prev) => prev.filter((c) => c.id !== card.id));
    setMiddle((prev) => prev.filter((c) => c.id !== card.id));
    setBottom((prev) => prev.filter((c) => c.id !== card.id));

    // Add to target (with limit)
    if (target === 'top') setTop((prev) => prev.length < 3 ? [...prev, card] : prev);
    else if (target === 'middle') setMiddle((prev) => prev.length < 5 ? [...prev, card] : prev);
    else setBottom((prev) => prev.length < 5 ? [...prev, card] : prev);
  };

  const returnCard = (card: Card) => {
    setTop((prev) => prev.filter((c) => c.id !== card.id));
    setMiddle((prev) => prev.filter((c) => c.id !== card.id));
    setBottom((prev) => prev.filter((c) => c.id !== card.id));
    setUnplaced((prev) => [...prev, card]);
  };

  const handleSubmit = () => {
    if (top.length !== 3 || middle.length !== 5 || bottom.length !== 5) return;
    const arrangement: PlayerArrangement = { top, middle, bottom };
    placeCards(arrangement);
    nextPlayer();
  };

  const handleAutoArrange = () => {
    autoArrange();
    // Sync local state with store
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

  const handleNewRound = () => {
    if (!state) return;
    newGame(state.players.length, state.players.filter((p) => p.isAI).length);
  };

  const renderCard = (card: Card, onPress: () => void) => (
    <TouchableOpacity key={card.id} style={styles.card} onPress={onPress} accessibilityRole="button" accessibilityLabel={cardDisplay(card)}>
      <Text style={[styles.cardText, isRed(card) && styles.cardRed]}>{cardDisplay(card)}</Text>
    </TouchableOpacity>
  );

  const renderRow = (label: string, cards: Card[], maxCards: number) => (
    <View style={styles.rowSection}>
      <Text style={styles.rowLabel}>{label} ({cards.length}/{maxCards})</Text>
      <View style={styles.rowCards}>
        {cards.map((c) => renderCard(c, () => returnCard(c)))}
        {cards.length < maxCards && <View style={styles.cardPlaceholder}><Text style={styles.placeholderText}>+</Text></View>}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Keluar">
            <Text style={styles.backText}>Keluar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ronde {state.roundNumber}</Text>
          {state.phase === 'arranging' && !current.isAI && (
            <View style={styles.timerBadge}>
              <Text style={[styles.timerText, state.timer <= 10 && styles.timerDanger]}>⏱ {state.timer}s</Text>
            </View>
          )}
        </View>

        {/* Player scores */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playersRow}>
          {state.players.map((p) => (
            <View key={p.id} style={[styles.playerChip, p.id === current.id && styles.playerChipActive]}>
              <Text style={styles.playerName}>{p.name}{p.isAI ? ' 🤖' : ''}</Text>
              <Text style={styles.playerScore}>{p.totalScore >= 0 ? '+' : ''}{p.totalScore}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Arranging phase */}
        {state.phase === 'arranging' && !current.isAI && (
          <>
            {renderRow('Atas (3)', top, 3)}
            {renderRow('Tengah (5)', middle, 5)}
            {renderRow('Bawah (5)', bottom, 5)}

            {/* Unplaced cards */}
            <Text style={styles.sectionLabel}>Kartu Tersisa ({unplaced.length})</Text>
            <View style={styles.unplacedGrid}>
              {unplaced.sort((a, b) => b.value - a.value).map((c) => (
                <View key={c.id} style={styles.unplacedCard}>
                  <TouchableOpacity style={styles.miniBtn} onPress={() => moveToRow(c, 'top')}><Text style={styles.miniBtnText}>A</Text></TouchableOpacity>
                  {renderCard(c, () => moveToRow(c, 'bottom'))}
                  <View style={styles.miniBtnRow}>
                    <TouchableOpacity style={styles.miniBtn} onPress={() => moveToRow(c, 'middle')}><Text style={styles.miniBtnText}>T</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.miniBtn} onPress={() => moveToRow(c, 'bottom')}><Text style={styles.miniBtnText}>B</Text></TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.autoBtn} onPress={handleAutoArrange} accessibilityRole="button">
                <Text style={styles.autoBtnText}>🤖 Auto Susun</Text>
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

        {/* Scoring phase */}
        {state.phase === 'scoring' && (
          <View style={styles.scoringSection}>
            <Text style={styles.scoringTitle}>Hasil Ronde {state.roundNumber}</Text>
            {state.players.map((p, i) => (
              <View key={p.id} style={styles.scoreRow}>
                <Text style={styles.scoreName}>{p.name}{p.isAI ? ' 🤖' : ''}</Text>
                <Text style={[styles.scoreValue, state.lastRoundScores[i] > 0 && styles.scorePositive, state.lastRoundScores[i] < 0 && styles.scoreNegative]}>
                  {state.lastRoundScores[i] >= 0 ? '+' : ''}{state.lastRoundScores[i]}
                </Text>
              </View>
            ))}
            <TouchableOpacity style={styles.startBtn} onPress={handleNewRound} accessibilityRole="button">
              <Text style={styles.startBtnText}>Ronde Berikutnya</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  backBtn: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: THEME.surface, borderRadius: 8, borderWidth: 1, borderColor: THEME.border },
  backText: { color: THEME.textMuted, fontWeight: '600', fontSize: 13 },
  headerTitle: { color: THEME.gold, fontWeight: '700', fontSize: 16 },
  timerBadge: { backgroundColor: THEME.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: THEME.border },
  timerText: { color: THEME.text, fontWeight: '700', fontSize: 14 },
  timerDanger: { color: THEME.danger },
  playersRow: { maxHeight: 60, marginBottom: 12 },
  playerChip: { backgroundColor: THEME.surface, borderRadius: 10, padding: 10, marginRight: 8, alignItems: 'center', borderWidth: 1, borderColor: 'transparent', minWidth: 80 },
  playerChipActive: { borderColor: THEME.gold },
  playerName: { fontSize: 11, color: THEME.textMuted },
  playerScore: { fontSize: 16, fontWeight: '800', color: THEME.gold, marginTop: 2 },
  rowSection: { marginBottom: 12 },
  rowLabel: { fontSize: 12, fontWeight: '700', color: THEME.gold, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  rowCards: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  card: { width: 44, height: 60, backgroundColor: THEME.card, borderRadius: 6, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 },
  cardText: { fontSize: 13, fontWeight: '800', color: THEME.black },
  cardRed: { color: THEME.red },
  cardPlaceholder: { width: 44, height: 60, borderRadius: 6, borderWidth: 1, borderColor: THEME.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: THEME.textMuted, fontSize: 18 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: THEME.textMuted, marginTop: 16, marginBottom: 8, textTransform: 'uppercase' },
  unplacedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  unplacedCard: { alignItems: 'center', gap: 3 },
  miniBtn: { paddingHorizontal: 8, paddingVertical: 2, backgroundColor: THEME.surfaceLight, borderRadius: 4 },
  miniBtnText: { fontSize: 9, fontWeight: '700', color: THEME.gold },
  miniBtnRow: { flexDirection: 'row', gap: 4 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  autoBtn: { flex: 1, paddingVertical: 14, backgroundColor: THEME.surface, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: THEME.border },
  autoBtnText: { fontSize: 15, fontWeight: '700', color: THEME.text },
  submitBtn: { flex: 1, paddingVertical: 14, backgroundColor: THEME.gold, borderRadius: 12, alignItems: 'center' },
  submitDisabled: { opacity: 0.4 },
  submitText: { fontSize: 15, fontWeight: '800', color: THEME.bg },
  aiThinking: { alignItems: 'center', paddingVertical: 60 },
  aiText: { fontSize: 16, color: THEME.textMuted, fontStyle: 'italic' },
  scoringSection: { marginTop: 20, padding: 20, backgroundColor: THEME.surface, borderRadius: 16, borderWidth: 1, borderColor: THEME.gold },
  scoringTitle: { fontSize: 18, fontWeight: '800', color: THEME.gold, textAlign: 'center', marginBottom: 16 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: THEME.border },
  scoreName: { fontSize: 15, color: THEME.text },
  scoreValue: { fontSize: 20, fontWeight: '800', color: THEME.text },
  scorePositive: { color: THEME.accent },
  scoreNegative: { color: THEME.danger },
  startBtn: { marginTop: 20, backgroundColor: THEME.gold, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  startBtnText: { fontSize: 16, fontWeight: '800', color: THEME.bg },
});

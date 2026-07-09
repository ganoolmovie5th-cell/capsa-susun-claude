import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '../store/gameStore';
import { THEME, Card, HandHistoryEntry } from '../core/types';
import { cardDisplay, isRed } from '../core/deck';
import { evaluateHand3, evaluateHand5 } from '../core/poker';

interface Props { onBack: () => void; }

function formatCardList(cards: Card[]): string {
  return cards.map((c) => c.id).join(' ');
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

function HandEntry({ entry }: { entry: HandHistoryEntry }) {
  return (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <Text style={styles.entryRound}>Ronde {entry.roundNumber}</Text>
        <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
      </View>
      {entry.players.map((p, idx) => (
        <View key={idx} style={styles.playerEntry}>
          <View style={styles.playerRow}>
            <Text style={styles.playerName}>{p.name}</Text>
            <Text style={[
              styles.playerScore,
              p.score > 0 && styles.scorePositive,
              p.score < 0 && styles.scoreNegative,
            ]}>
              {p.score >= 0 ? '+' : ''}{p.score}
            </Text>
          </View>
          {p.arrangement && (
            <View style={styles.arrangementBlock}>
              <View style={styles.handRow}>
                <Text style={styles.handRowLabel}>A:</Text>
                <Text style={styles.handCards}>{formatCardList(p.arrangement.top)}</Text>
                <Text style={styles.handRank}>{evaluateHand3(p.arrangement.top).rank}</Text>
              </View>
              <View style={styles.handRow}>
                <Text style={styles.handRowLabel}>T:</Text>
                <Text style={styles.handCards}>{formatCardList(p.arrangement.middle)}</Text>
                <Text style={styles.handRank}>{evaluateHand5(p.arrangement.middle).rank}</Text>
              </View>
              <View style={styles.handRow}>
                <Text style={styles.handRowLabel}>B:</Text>
                <Text style={styles.handCards}>{formatCardList(p.arrangement.bottom)}</Text>
                <Text style={styles.handRank}>{evaluateHand5(p.arrangement.bottom).rank}</Text>
              </View>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

export default function HandHistoryScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const { handHistory } = useGameStore();

  // Display most recent first
  const reversed = [...handHistory].reverse();

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Kembali">
          <Text style={styles.backText}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Riwayat Tangan</Text>
        <View style={{ width: 80 }} />
      </View>

      {reversed.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📜</Text>
          <Text style={styles.emptyText}>Belum ada riwayat.</Text>
          <Text style={styles.emptySubtext}>Mainkan beberapa ronde untuk melihat riwayat di sini.</Text>
        </View>
      ) : (
        <FlatList
          data={reversed}
          keyExtractor={(item, idx) => `${item.date}-${idx}`}
          renderItem={({ item }) => <HandEntry entry={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: THEME.surface, borderRadius: 8 },
  backText: { color: THEME.textMuted, fontWeight: '600', fontSize: 13 },
  title: { fontSize: 16, fontWeight: '800', color: THEME.gold },
  list: { padding: 16, paddingBottom: 40 },
  // Entry
  entryCard: { backgroundColor: THEME.surface, borderRadius: 14, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: THEME.border },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: THEME.border },
  entryRound: { fontSize: 14, fontWeight: '700', color: THEME.gold },
  entryDate: { fontSize: 11, color: THEME.textMuted },
  // Player
  playerEntry: { marginBottom: 8 },
  playerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  playerName: { fontSize: 13, fontWeight: '600', color: THEME.text },
  playerScore: { fontSize: 14, fontWeight: '800', color: THEME.text },
  scorePositive: { color: THEME.accent },
  scoreNegative: { color: THEME.danger },
  // Arrangement
  arrangementBlock: { marginLeft: 8, gap: 2 },
  handRow: { flexDirection: 'row', alignItems: 'center' },
  handRowLabel: { width: 16, fontSize: 10, fontWeight: '700', color: THEME.textMuted },
  handCards: { fontSize: 10, color: THEME.text, fontFamily: 'monospace', flex: 1 },
  handRank: { fontSize: 9, color: THEME.accent, fontWeight: '600', marginLeft: 4 },
  // Empty
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: THEME.text },
  emptySubtext: { fontSize: 13, color: THEME.textMuted, marginTop: 4, textAlign: 'center', paddingHorizontal: 40 },
});

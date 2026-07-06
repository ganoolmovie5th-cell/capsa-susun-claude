import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '../store/gameStore';
import { THEME } from '../core/types';

interface Props { onStart: () => void; onStats: () => void; }

export default function HomeScreen({ onStart, onStats }: Props) {
  const insets = useSafeAreaInsets();
  const { newGame } = useGameStore();
  const [playerCount, setPlayerCount] = useState(2);
  const [aiCount, setAiCount] = useState(1);

  const total = playerCount;
  const humanCount = playerCount - aiCount;

  const handleStart = () => {
    newGame(playerCount, aiCount);
    onStart();
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>♠ Capsa Susun ♥</Text>
        <Text style={styles.subtitle}>Chinese Poker</Text>

        <Text style={styles.sectionLabel}>Jumlah Pemain</Text>
        <View style={styles.chipRow}>
          {[2, 3, 4].map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.chip, playerCount === n && styles.chipActive]}
              onPress={() => { setPlayerCount(n); setAiCount(Math.min(aiCount, n - 1)); }}
              accessibilityRole="button"
            >
              <Text style={[styles.chipText, playerCount === n && styles.chipTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Jumlah Bot AI</Text>
        <View style={styles.chipRow}>
          {Array.from({ length: playerCount }, (_, i) => i).map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.chip, aiCount === n && styles.chipActive]}
              onPress={() => setAiCount(n)}
              accessibilityRole="button"
            >
              <Text style={[styles.chipText, aiCount === n && styles.chipTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>👤 {humanCount} Manusia · 🤖 {aiCount} Bot</Text>
          <Text style={styles.infoText}>⏱ 60 detik per giliran</Text>
        </View>

        <TouchableOpacity style={styles.startBtn} onPress={handleStart} accessibilityRole="button" accessibilityLabel="Mulai permainan">
          <Text style={styles.startText}>♠ Mulai Bermain</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statsBtn} onPress={onStats} accessibilityRole="button" accessibilityLabel="Lihat statistik">
          <Text style={styles.statsBtnText}>📊 Statistik & Achievements</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  scroll: { padding: 24, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '800', color: THEME.gold, marginTop: 32 },
  subtitle: { fontSize: 14, color: THEME.textMuted, marginBottom: 32 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: THEME.textMuted, alignSelf: 'flex-start', marginBottom: 10, marginTop: 20, textTransform: 'uppercase', letterSpacing: 1 },
  chipRow: { flexDirection: 'row', gap: 12, width: '100%' },
  chip: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: THEME.surface, alignItems: 'center', borderWidth: 1, borderColor: THEME.border },
  chipActive: { borderColor: THEME.gold, backgroundColor: 'rgba(212,175,55,0.15)' },
  chipText: { fontSize: 20, fontWeight: '700', color: THEME.textMuted },
  chipTextActive: { color: THEME.gold },
  infoCard: { marginTop: 24, padding: 16, backgroundColor: THEME.surface, borderRadius: 14, width: '100%', borderWidth: 1, borderColor: THEME.border, alignItems: 'center', gap: 6 },
  infoText: { fontSize: 14, color: THEME.text },
  startBtn: { marginTop: 32, backgroundColor: THEME.gold, paddingVertical: 16, borderRadius: 14, width: '100%', alignItems: 'center' },
  startText: { fontSize: 18, fontWeight: '800', color: THEME.bg },
  statsBtn: { marginTop: 16, paddingVertical: 12 },
  statsBtnText: { color: THEME.gold, fontWeight: '600', fontSize: 15 },
});

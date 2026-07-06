import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '../store/gameStore';
import { THEME, TARGET_SCORE_OPTIONS } from '../core/types';

interface Props { onStart: () => void; onStats: () => void; }

export default function HomeScreen({ onStart, onStats }: Props) {
  const insets = useSafeAreaInsets();
  const { newGame, soundEnabled, toggleSound } = useGameStore();
  const [playerCount, setPlayerCount] = useState(2);
  const [aiCount, setAiCount] = useState(1);
  const [targetScore, setTargetScore] = useState<number>(15);

  const humanCount = playerCount - aiCount;

  const handleStart = () => {
    newGame(playerCount, aiCount, targetScore);
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

        <Text style={styles.sectionLabel}>Target Skor (First to X)</Text>
        <View style={styles.chipRow}>
          {TARGET_SCORE_OPTIONS.map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.chip, targetScore === n && styles.chipActive]}
              onPress={() => setTargetScore(n)}
              accessibilityRole="button"
            >
              <Text style={[styles.chipText, targetScore === n && styles.chipTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>👤 {humanCount} Manusia · 🤖 {aiCount} Bot</Text>
          <Text style={styles.infoText}>🏆 Pertama sampai {targetScore} poin menang</Text>
          <Text style={styles.infoText}>⏱ 60 detik per giliran</Text>
        </View>

        <TouchableOpacity style={styles.startBtn} onPress={handleStart} accessibilityRole="button" accessibilityLabel="Mulai permainan">
          <Text style={styles.startText}>♠ Mulai Bermain</Text>
        </TouchableOpacity>

        <View style={styles.bottomRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onStats} accessibilityRole="button" accessibilityLabel="Lihat statistik">
            <Text style={styles.secondaryBtnText}>📊 Statistik</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={toggleSound} accessibilityRole="button" accessibilityLabel="Toggle suara">
            <Text style={styles.secondaryBtnText}>{soundEnabled ? '🔊 Suara' : '🔇 Mute'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  scroll: { padding: 24, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '800', color: THEME.gold, marginTop: 32 },
  subtitle: { fontSize: 14, color: THEME.textMuted, marginBottom: 28 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: THEME.textMuted, alignSelf: 'flex-start', marginBottom: 10, marginTop: 18, textTransform: 'uppercase', letterSpacing: 1 },
  chipRow: { flexDirection: 'row', gap: 10, width: '100%' },
  chip: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: THEME.surface, alignItems: 'center', borderWidth: 1, borderColor: THEME.border },
  chipActive: { borderColor: THEME.gold, backgroundColor: 'rgba(212,175,55,0.15)' },
  chipText: { fontSize: 18, fontWeight: '700', color: THEME.textMuted },
  chipTextActive: { color: THEME.gold },
  infoCard: { marginTop: 20, padding: 16, backgroundColor: THEME.surface, borderRadius: 14, width: '100%', borderWidth: 1, borderColor: THEME.border, alignItems: 'center', gap: 6 },
  infoText: { fontSize: 14, color: THEME.text },
  startBtn: { marginTop: 28, backgroundColor: THEME.gold, paddingVertical: 16, borderRadius: 14, width: '100%', alignItems: 'center' },
  startText: { fontSize: 18, fontWeight: '800', color: THEME.bg },
  bottomRow: { flexDirection: 'row', gap: 12, marginTop: 16, width: '100%' },
  secondaryBtn: { flex: 1, paddingVertical: 12, backgroundColor: THEME.surface, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: THEME.border },
  secondaryBtnText: { color: THEME.gold, fontWeight: '600', fontSize: 14 },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '../store/gameStore';
import { THEME } from '../core/types';
import { ACHIEVEMENTS } from '../core/achievements';

interface Props { onBack: () => void; }

export default function StatsScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const { stats, unlockedAchievements } = useGameStore();
  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Kembali">
            <Text style={styles.backText}>← Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Statistik</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.gamesPlayed}</Text>
            <Text style={styles.statLabel}>Game</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{winRate}%</Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.scoops}</Text>
            <Text style={styles.statLabel}>Scoop</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>+{stats.bestRoundScore}</Text>
            <Text style={styles.statLabel}>Best Round</Text>
          </View>
        </View>

        {/* Achievements */}
        <Text style={styles.sectionTitle}>Achievements ({unlockedAchievements.length}/{ACHIEVEMENTS.length})</Text>
        {ACHIEVEMENTS.map((a) => {
          const unlocked = unlockedAchievements.includes(a.id);
          return (
            <View key={a.id} style={[styles.achRow, !unlocked && styles.achLocked]}>
              <View style={styles.achLeft}>
                <Text style={styles.achName}>{unlocked ? '✓' : '🔒'} {a.name}</Text>
                <Text style={styles.achDesc}>{a.description}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: THEME.surface, borderRadius: 8 },
  backText: { color: THEME.textMuted, fontWeight: '600', fontSize: 13 },
  title: { fontSize: 18, fontWeight: '800', color: THEME.gold },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: THEME.surface, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: THEME.border },
  statValue: { fontSize: 24, fontWeight: '800', color: THEME.gold },
  statLabel: { fontSize: 11, color: THEME.textMuted, marginTop: 4, textTransform: 'uppercase' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: THEME.text, marginBottom: 12 },
  achRow: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: THEME.surface, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: THEME.border },
  achLocked: { opacity: 0.4 },
  achLeft: { flex: 1 },
  achName: { fontSize: 14, fontWeight: '700', color: THEME.text },
  achDesc: { fontSize: 12, color: THEME.textMuted, marginTop: 2 },
});

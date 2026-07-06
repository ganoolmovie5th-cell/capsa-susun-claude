import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { useGameStore } from '../store/gameStore';
import { THEME, TIMER_OPTIONS, AIDifficulty, AI_DIFFICULTY_OPTIONS, AI_DIFFICULTY_LABELS } from '../core/types';

interface Props { onStart: () => void; onStats: () => void; }

const { width: SCREEN_W } = Dimensions.get('window');
const SLIDER_W = SCREEN_W - 80; // padding 40 each side
const SLIDER_MIN = 5;
const SLIDER_MAX = 100;

/** Custom slider using gesture handler. */
function ScoreSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const progress = (value - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN);
  const thumbX = useSharedValue(progress * SLIDER_W);

  const updateValue = (x: number) => {
    const clamped = Math.max(0, Math.min(SLIDER_W, x));
    const v = Math.round(SLIDER_MIN + (clamped / SLIDER_W) * (SLIDER_MAX - SLIDER_MIN));
    onChange(v);
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const newX = Math.max(0, Math.min(SLIDER_W, e.x));
      thumbX.value = newX;
      runOnJS(updateValue)(newX);
    });

  const tapGesture = Gesture.Tap()
    .onEnd((e) => {
      const newX = Math.max(0, Math.min(SLIDER_W, e.x));
      thumbX.value = newX;
      runOnJS(updateValue)(newX);
    });

  const composed = Gesture.Race(panGesture, tapGesture);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value - 12 }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: thumbX.value,
  }));

  return (
    <View style={sliderStyles.container}>
      <GestureDetector gesture={composed}>
        <View style={[sliderStyles.track, { width: SLIDER_W }]}>
          <Animated.View style={[sliderStyles.fill, fillStyle]} />
          <Animated.View style={[sliderStyles.thumb, thumbStyle]} />
        </View>
      </GestureDetector>
      <View style={sliderStyles.labels}>
        <Text style={sliderStyles.labelText}>{SLIDER_MIN}</Text>
        <Text style={sliderStyles.valueText}>{value} poin</Text>
        <Text style={sliderStyles.labelText}>{SLIDER_MAX}</Text>
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: { width: '100%', alignItems: 'center', marginTop: 4 },
  track: { height: 28, justifyContent: 'center', borderRadius: 14, backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.border },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 14, backgroundColor: 'rgba(212,175,55,0.25)' },
  thumb: { position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: THEME.gold, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 6 },
  labelText: { fontSize: 11, color: THEME.textMuted },
  valueText: { fontSize: 13, fontWeight: '800', color: THEME.gold },
});

export default function HomeScreen({ onStart, onStats }: Props) {
  const insets = useSafeAreaInsets();
  const { newGame, soundEnabled, toggleSound } = useGameStore();
  const [playerCount, setPlayerCount] = useState(2);
  const [aiCount, setAiCount] = useState(1);
  const [targetScore, setTargetScore] = useState(15);
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('hard');
  const [timerDuration, setTimerDuration] = useState(60);

  const humanCount = playerCount - aiCount;

  const handleStart = () => {
    newGame(playerCount, aiCount, targetScore, aiDifficulty, timerDuration);
    onStart();
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>♠</Text>
          <Text style={styles.title}>Capsa Susun</Text>
          <Text style={styles.subtitle}>Chinese Poker</Text>
        </View>

        {/* Settings card */}
        <View style={styles.settingsCard}>
          {/* Players */}
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

          {/* AI Count */}
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

          {/* AI Difficulty */}
          <Text style={styles.sectionLabel}>Level Bot</Text>
          <View style={styles.chipRow}>
            {AI_DIFFICULTY_OPTIONS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.chipSmall, aiDifficulty === d && styles.chipActive]}
                onPress={() => setAiDifficulty(d)}
                accessibilityRole="button"
              >
                <Text style={[styles.chipSmallText, aiDifficulty === d && styles.chipTextActive]}>
                  {AI_DIFFICULTY_LABELS[d]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Target Score Slider */}
          <Text style={styles.sectionLabel}>Target Skor</Text>
          <ScoreSlider value={targetScore} onChange={setTargetScore} />

          {/* Timer */}
          <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Waktu per Giliran</Text>
          <View style={styles.chipRow}>
            {TIMER_OPTIONS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.chipSmall, timerDuration === t && styles.chipActive]}
                onPress={() => setTimerDuration(t)}
                accessibilityRole="button"
              >
                <Text style={[styles.chipSmallText, timerDuration === t && styles.chipTextActive]}>{t}s</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryIcon}>👤</Text>
            <Text style={styles.summaryText}>{humanCount} Manusia</Text>
          </View>
          <View style={styles.summaryDot} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryIcon}>🤖</Text>
            <Text style={styles.summaryText}>{aiCount} Bot ({AI_DIFFICULTY_LABELS[aiDifficulty]})</Text>
          </View>
          <View style={styles.summaryDot} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryIcon}>🏆</Text>
            <Text style={styles.summaryText}>First to {targetScore}</Text>
          </View>
          <View style={styles.summaryDot} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryIcon}>⏱</Text>
            <Text style={styles.summaryText}>{timerDuration}s/giliran</Text>
          </View>
        </View>

        {/* Start button */}
        <TouchableOpacity style={styles.startBtn} onPress={handleStart} accessibilityRole="button" accessibilityLabel="Mulai permainan">
          <Text style={styles.startText}>♠ Mulai Bermain</Text>
        </TouchableOpacity>

        {/* Bottom actions */}
        <View style={styles.bottomRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={onStats} accessibilityRole="button" accessibilityLabel="Lihat statistik">
            <Text style={styles.iconBtnEmoji}>📊</Text>
            <Text style={styles.iconBtnText}>Statistik</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={toggleSound} accessibilityRole="button" accessibilityLabel="Toggle suara">
            <Text style={styles.iconBtnEmoji}>{soundEnabled ? '🔊' : '🔇'}</Text>
            <Text style={styles.iconBtnText}>{soundEnabled ? 'Suara' : 'Mute'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  scroll: { padding: 24, alignItems: 'center', paddingBottom: 40 },

  // Logo
  logoContainer: { alignItems: 'center', marginTop: 20, marginBottom: 24 },
  logoIcon: { fontSize: 48, color: THEME.gold, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '800', color: THEME.gold, letterSpacing: 1 },
  subtitle: { fontSize: 13, color: THEME.textMuted, marginTop: 2, letterSpacing: 2, textTransform: 'uppercase' },

  // Settings card
  settingsCard: { width: '100%', backgroundColor: THEME.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: THEME.border },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: THEME.textMuted, marginBottom: 8, marginTop: 14, textTransform: 'uppercase', letterSpacing: 1.2 },
  chipRow: { flexDirection: 'row', gap: 8, width: '100%' },
  chip: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: 'rgba(10,31,20,0.6)', alignItems: 'center', borderWidth: 1, borderColor: THEME.border },
  chipActive: { borderColor: THEME.gold, backgroundColor: 'rgba(212,175,55,0.12)' },
  chipText: { fontSize: 18, fontWeight: '700', color: THEME.textMuted },
  chipTextActive: { color: THEME.gold },
  chipSmall: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: 'rgba(10,31,20,0.6)', alignItems: 'center', borderWidth: 1, borderColor: THEME.border },
  chipSmallText: { fontSize: 11, fontWeight: '700', color: THEME.textMuted },
  divider: { height: 1, backgroundColor: THEME.border, marginVertical: 16, width: '100%' },

  // Summary
  summaryCard: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginTop: 16, padding: 14, backgroundColor: THEME.surface, borderRadius: 14, borderWidth: 1, borderColor: THEME.border, gap: 6, width: '100%' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  summaryIcon: { fontSize: 14 },
  summaryText: { fontSize: 12, color: THEME.text, fontWeight: '600' },
  summaryDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: THEME.textMuted },

  // Start
  startBtn: { marginTop: 20, backgroundColor: THEME.gold, paddingVertical: 16, borderRadius: 14, width: '100%', alignItems: 'center', shadowColor: THEME.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  startText: { fontSize: 18, fontWeight: '800', color: THEME.bg, letterSpacing: 0.5 },

  // Bottom
  bottomRow: { flexDirection: 'row', gap: 12, marginTop: 18, width: '100%' },
  iconBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, backgroundColor: THEME.surface, borderRadius: 12, borderWidth: 1, borderColor: THEME.border },
  iconBtnEmoji: { fontSize: 16 },
  iconBtnText: { color: THEME.gold, fontWeight: '600', fontSize: 13 },
});

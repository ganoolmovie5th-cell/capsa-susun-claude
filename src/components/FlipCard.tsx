// Animated card with flip reveal. Uses Reanimated for 3D transform.
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Card, THEME } from '../core/types';
import { cardDisplay, isRed } from '../core/deck';

interface Props {
  card: Card;
  faceUp: boolean;
  delay?: number;
  size?: 'sm' | 'md';
}

export default function FlipCard({ card, faceUp, delay = 0, size = 'md' }: Props) {
  const flip = useSharedValue(faceUp ? 1 : 0);

  useEffect(() => {
    flip.value = withTiming(faceUp ? 1 : 0, {
      duration: 400,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [faceUp]);

  // Delayed start
  useEffect(() => {
    if (delay > 0) {
      const timeout = setTimeout(() => {
        flip.value = withTiming(1, { duration: 400, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [delay]);

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flip.value, [0, 1], [180, 0]);
    return {
      transform: [{ perspective: 800 }, { rotateY: `${rotateY}deg` }],
      opacity: flip.value > 0.5 ? 1 : 0,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flip.value, [0, 1], [0, -180]);
    return {
      transform: [{ perspective: 800 }, { rotateY: `${rotateY}deg` }],
      opacity: flip.value <= 0.5 ? 1 : 0,
    };
  });

  const w = size === 'sm' ? 36 : 44;
  const h = size === 'sm' ? 50 : 60;
  const fontSize = size === 'sm' ? 11 : 13;

  return (
    <View style={{ width: w, height: h }}>
      {/* Back face */}
      <Animated.View style={[styles.face, { width: w, height: h, backgroundColor: THEME.surfaceLight, borderColor: THEME.gold }, backStyle]}>
        <Text style={styles.backPattern}>♠</Text>
      </Animated.View>
      {/* Front face */}
      <Animated.View style={[styles.face, { width: w, height: h, backgroundColor: THEME.card }, frontStyle]}>
        <Text style={[styles.cardText, { fontSize }, isRed(card) && styles.cardRed]}>
          {cardDisplay(card)}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  face: {
    position: 'absolute',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backfaceVisibility: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  backPattern: {
    fontSize: 18,
    color: THEME.gold,
    opacity: 0.6,
  },
  cardText: {
    fontWeight: '800',
    color: THEME.black,
  },
  cardRed: {
    color: THEME.red,
  },
});

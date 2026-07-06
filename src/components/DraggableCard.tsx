// Draggable card for arranging phase. Uses Gesture Handler + Reanimated.
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Card, THEME } from '../core/types';
import { cardDisplay, isRed } from '../core/deck';

interface Props {
  card: Card;
  onDrop: (card: Card, y: number) => void;
  onTap: (card: Card) => void;
}

export default function DraggableCard({ card, onDrop, onTap }: Props) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIdx = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      scale.value = withSpring(1.15, { damping: 15 });
      zIdx.value = 100;
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      scale.value = withSpring(1, { damping: 15 });
      zIdx.value = 0;
      // Pass absolute Y for drop zone detection
      runOnJS(onDrop)(card, e.absoluteY);
      translateX.value = withSpring(0, { damping: 15 });
      translateY.value = withSpring(0, { damping: 15 });
    });

  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      runOnJS(onTap)(card);
    });

  const composed = Gesture.Exclusive(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: zIdx.value,
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <Text style={[styles.cardText, isRed(card) && styles.cardRed]}>
          {cardDisplay(card)}
        </Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 44,
    height: 60,
    backgroundColor: THEME.card,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  cardText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.black,
  },
  cardRed: {
    color: THEME.red,
  },
});

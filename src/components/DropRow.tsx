// Drop zone row for card arrangement. Shows placed cards + placeholder slots.
import React, { useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Card, THEME, RowType } from '../core/types';
import { cardDisplay, isRed } from '../core/deck';
import { evaluateHand3, evaluateHand5 } from '../core/poker';

interface Props {
  label: string;
  type: RowType;
  cards: Card[];
  maxCards: number;
  onRemoveCard: (card: Card) => void;
  onLayout?: (type: RowType, y: number, height: number) => void;
}

const HAND_LABELS: Record<string, string> = {
  'high-card': 'High Card',
  'pair': 'Pair',
  'two-pair': 'Two Pair',
  'three-of-a-kind': 'Three of a Kind',
  'straight': 'Straight',
  'flush': 'Flush',
  'full-house': 'Full House',
  'four-of-a-kind': 'Four of a Kind',
  'straight-flush': 'Straight Flush',
  'royal-flush': 'Royal Flush',
};

export default function DropRow({ label, type, cards, maxCards, onRemoveCard, onLayout }: Props) {
  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    if (onLayout) {
      e.target.measureInWindow((_x, y, _w, h) => {
        onLayout(type, y, h);
      });
    }
  }, [type, onLayout]);

  // Evaluate hand when full
  let handLabel = '';
  if (cards.length === maxCards) {
    const ev = maxCards === 3 ? evaluateHand3(cards) : evaluateHand5(cards);
    handLabel = HAND_LABELS[ev.rank] || '';
  }

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label} ({cards.length}/{maxCards})</Text>
        {handLabel ? <Text style={styles.handLabel}>{handLabel}</Text> : null}
      </View>
      <View style={styles.cardsRow}>
        {cards.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={styles.card}
            onPress={() => onRemoveCard(c)}
            accessibilityRole="button"
            accessibilityLabel={`Hapus ${cardDisplay(c)}`}
          >
            <Text style={[styles.cardText, isRed(c) && styles.cardRed]}>{cardDisplay(c)}</Text>
          </TouchableOpacity>
        ))}
        {Array.from({ length: maxCards - cards.length }).map((_, i) => (
          <View key={`ph-${i}`} style={styles.placeholder}>
            <Text style={styles.placeholderText}>+</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: 'rgba(20,61,40,0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  handLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.accent,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  card: {
    width: 44,
    height: 60,
    backgroundColor: THEME.card,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  cardText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.black,
  },
  cardRed: {
    color: THEME.red,
  },
  placeholder: {
    width: 44,
    height: 60,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: THEME.textMuted,
    fontSize: 18,
  },
});

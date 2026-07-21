// Deck creation and dealing. Pure functions.
import { Card, Suit, Value } from './types';

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const VALUES: Value[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

const SUIT_CHAR: Record<Suit, string> = { spades: 's', hearts: 'h', diamonds: 'd', clubs: 'c' };
const VALUE_CHAR: Record<number, string> = { 2:'2',3:'3',4:'4',5:'5',6:'6',7:'7',8:'8',9:'9',10:'T',11:'J',12:'Q',13:'K',14:'A' };

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value, id: `${VALUE_CHAR[value]}${SUIT_CHAR[suit]}` });
    }
  }
  return deck;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Deal 13 cards to each player. */
export function deal(playerCount: number): Card[][] {
  const deck = shuffle(createDeck());
  const hands: Card[][] = [];
  for (let i = 0; i < playerCount; i++) {
    hands.push(deck.slice(i * 13, (i + 1) * 13));
  }
  return hands;
}

export function cardDisplay(card: Card): string {
  const v = card.value === 10 ? '10' : VALUE_CHAR[card.value];
  const s = card.suit === 'spades' ? '♠' : card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : '♣';
  return `${v}${s}`;
}

export function isRed(card: Card): boolean {
  return card.suit === 'hearts' || card.suit === 'diamonds';
}

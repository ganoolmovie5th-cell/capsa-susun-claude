# ♠ Capsa Susun (Chinese Poker)

Game kartu Capsa Susun klasik untuk mobile. Susun 13 kartu menjadi 3 baris (3-5-5) dengan aturan poker hand ranking. Dibangun dengan React Native + Expo SDK 54.

## Fitur

- **2-4 pemain** — hot-seat di satu device
- **Smart AI** — bot menyusun kartu secara optimal (brute-force best arrangement)
- **Full rules** — poker hand ranking, validasi baris (bottom ≥ middle ≥ top), scoring
- **Timer** — 60 detik per giliran
- **Auto-arrange** — AI bantu susun otomatis
- **Scoring** — +1/-1 per baris, scoop bonus +3, bonus Royal Flush/Four-of-a-kind
- **Statistics** — games played, win rate, best round, scoops
- **12 Achievements** — milestone badges
- **Casino theme** — dark green felt, gold accents, card shadows
- **Save progress** — stats & achievements tersimpan (AsyncStorage)

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Language | TypeScript strict |
| State | Zustand 5 + persist (AsyncStorage) |
| Gesture | react-native-gesture-handler |
| Animation | react-native-reanimated 4 |
| Haptics | expo-haptics |

## Menjalankan

```bash
npm install
npx expo start --go    # Scan QR dengan Expo Go
```

## Verifikasi

```bash
npm run typecheck      # tsc --noEmit (0 error)
npx expo export --platform android   # Bundle sukses
```

## Struktur

```
src/
├── core/              # Pure logic (no React)
│   ├── types.ts       # Card, Suit, Value, HandRank, GameState, THEME
│   ├── deck.ts        # createDeck, shuffle, deal
│   ├── poker.ts       # evaluateHand5, evaluateHand3, compareEvaluations
│   ├── validation.ts  # validateArrangement (bottom ≥ middle ≥ top)
│   ├── scoring.ts     # compareArrangements, calculateRoundScores, bonuses
│   ├── ai.ts          # findBestArrangement (smart brute-force)
│   └── achievements.ts # 12 badges + stats tracking
├── store/
│   └── gameStore.ts   # Zustand: game state + stats + achievements
└── screens/
    ├── HomeScreen.tsx  # Setup (players, AI count)
    ├── GameScreen.tsx  # Main gameplay (arrange cards, timer, scoring)
    └── StatsScreen.tsx # Statistics + achievements grid
```

## Poker Hand Rankings

| Rank | Nama | Keterangan |
|---|---|---|
| 9 | Royal Flush | A K Q J 10 suit sama |
| 8 | Straight Flush | 5 berurutan suit sama |
| 7 | Four of a Kind | 4 kartu sama |
| 6 | Full House | 3 + 2 kartu sama |
| 5 | Flush | 5 suit sama |
| 4 | Straight | 5 berurutan |
| 3 | Three of a Kind | 3 kartu sama |
| 2 | Two Pair | 2 + 2 kartu sama |
| 1 | One Pair | 2 kartu sama |
| 0 | High Card | Tidak ada kombinasi |

Baris atas (3 kartu): hanya High Card, Pair, Three of a Kind.

## Scoring

- Per baris menang: +1, kalah: -1
- Scoop (menang 3 baris): +3 bonus
- Royal Flush di bawah: +5
- Four of a Kind di bawah: +4
- Straight Flush di tengah: +4

## License

Private — © 2026

# Capsa Susun

Game kartu Capsa Susun (Chinese Poker) klasik untuk mobile. Susun 13 kartu menjadi 3 baris (3-5-5) dengan aturan poker hand ranking. Main melawan AI atau teman (hot-seat).

**Tech Stack:** React Native · Expo SDK 58 · TypeScript · Zustand · Reanimated · Gesture Handler

## Features

- 2-4 pemain (hot-seat di satu device)
- Smart AI dengan 4 level: Easy, Medium, Hard, Dewa
- Full poker hand ranking + validasi baris (bottom >= middle >= top)
- Drag-and-drop kartu ke baris target
- Card flip animation (3D flip saat reveal)
- Multi-round (first to X points, slider 5-100)
- Configurable timer per giliran (30/45/60/90/120 detik)
- Sound effects (deal, place, flip, score, win/lose) + toggle
- Auto-arrange (AI bantu susun otomatis)
- Poker hand labels di setiap baris
- Row indicators (W/L/T per baris saat reveal)
- Statistics (games played, win rate, best round, scoops)
- 12 achievement badges
- Spectator Mode (tonton 4 bot bermain, speed toggle)
- Hand History (rekam 20 ronde terakhir)
- Hand Replay (putar ulang step-by-step)
- Casino theme (dark green felt, gold accents)
- Save progress (AsyncStorage)

## Getting Started

```bash
npm install
npx expo start --go
```

Scan QR code dengan Expo Go di device.

## Project Structure

```
src/
  core/             → Pure logic (no React)
    types.ts            Card, Suit, Value, HandRank, GameState
    deck.ts             createDeck, shuffle, deal
    poker.ts            evaluateHand5, evaluateHand3, compare
    validation.ts       validateArrangement (bottom >= middle >= top)
    scoring.ts          compareArrangements, calculateRoundScores
    ai.ts               findBestArrangement (brute-force)
    achievements.ts     12 badges + stats tracking
    sounds.ts           Sound effects (expo-av)
  components/       → DraggableCard, DropRow, FlipCard
  store/            → gameStore.ts (Zustand + persist)
  screens/
    HomeScreen.tsx      Setup (players, AI, target score, timer)
    GameScreen.tsx      Gameplay (drag-drop, flip, multi-round)
    StatsScreen.tsx     Statistics + achievements
    SpectatorScreen.tsx Tonton bot bermain
    HandHistoryScreen.tsx Riwayat ronde
```

## Testing

```bash
npm run typecheck
npx expo export --platform android
```

## License

MIT

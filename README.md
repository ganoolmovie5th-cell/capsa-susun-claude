# ♠ Capsa Susun (Chinese Poker)

Game kartu Capsa Susun klasik untuk mobile. Susun 13 kartu menjadi 3 baris (3-5-5) dengan aturan poker hand ranking. Dibangun dengan React Native + Expo SDK 54.

## Fitur

- **2-4 pemain** — hot-seat di satu device
- **Smart AI** — bot menyusun kartu secara optimal (brute-force best arrangement)
- **Full rules** — poker hand ranking, validasi baris (bottom ≥ middle ≥ top), scoring
- **Drag-and-drop** — seret kartu ke baris target, atau tap untuk auto-place
- **Card flip animation** — kartu terungkap dengan animasi 3D flip saat reveal
- **Multi-round** — first to X points (slider 5–100) wins the match
- **Configurable timer** — pilih waktu per giliran (30s/45s/60s/90s/120s)
- **Sound effects** — efek suara deal, place, flip, score, win/lose (toggle on/off)
- **Timer** — configurable per giliran (30/45/60/90/120 detik)
- **Auto-arrange** — AI bantu susun otomatis
- **Poker hand labels** — tampil nama kombinasi di setiap baris saat penuh
- **Bot AI difficulty** — 4 level: Easy, Medium, Hard, Dewa
- **Row indicators** — badge W/L/T per baris saat reveal
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
| Sound | expo-av |
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
│   ├── achievements.ts # 12 badges + stats tracking
│   └── sounds.ts      # Sound effects via expo-av (procedural WAV gen)
├── components/
│   ├── DraggableCard.tsx  # Pan gesture + spring animation
│   ├── DropRow.tsx        # Drop zone with hand evaluation label
│   └── FlipCard.tsx       # 3D flip card reveal animation
├── store/
│   └── gameStore.ts   # Zustand: game state + multi-round + sound toggle
└── screens/
    ├── HomeScreen.tsx  # Setup (players, AI, target score, sound toggle)
    ├── GameScreen.tsx  # Gameplay (drag-drop, flip reveal, multi-round)
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
- Scoop (menang 3 baris): +3 bonus
- Royal Flush di bawah: +5
- Four of a Kind di bawah: +4
- Straight Flush di tengah: +4

## Multi-Round

- Pilih target skor di HomeScreen via slider (5–100 poin)
- Pilih waktu per giliran (30s / 45s / 60s / 90s / 120s)
- Pemain pertama yang mencapai target skor memenangkan pertandingan
- Total skor di-carry antar ronde
- Match over = tampil pemenang + statistik

## Bot AI Difficulty

| Level | Strategi |
|---|---|
| Easy 🟢 | Cari beberapa arrangement valid, pilih acak |
| Medium 🟡 | Search terbatas (500 bottom, 8 middle), pilih dari top 3 |
| Hard 🔴 | Full brute-force (1287 bottom, 20 middle), selalu pilih terbaik |
| Dewa 💀 | Exhaustive (semua kombinasi, tanpa early exit), selalu optimal |

## License

Private — © 2026

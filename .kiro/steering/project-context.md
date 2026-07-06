# Capsa Susun — Project Context & Conventions

## Overview

Game kartu Capsa Susun (Chinese Poker) untuk mobile. 2-4 pemain hot-seat + Smart AI.

- **Repo:** ganoolmovie5th-cell/capsa-susun-claude
- **Branch:** `main` (push langsung)
- **Stack:** React Native 0.81 + Expo SDK 54 (Expo Go compatible) + TypeScript strict

---

## Aturan Penting

- **Harus jalan di Expo Go SDK 54** — jangan native module yang butuh prebuild
- **Logika game di `src/core/` harus murni** (no React import)
- Push langsung ke `main`, tanpa PR
- Setiap commit update README.md + steering file

---

## Design System (Casino Mewah)

| Token | Value | Usage |
|---|---|---|
| `bg` | `#0a1f14` | Dark green felt |
| `surface` | `#143d28` | Card table surface |
| `surfaceLight` | `#1a5035` | Lighter surface |
| `gold` | `#d4af37` | Accents, headings |
| `goldSoft` | `#b8860b` | Secondary gold |
| `card` | `#ffffff` | Card background |
| `text` | `#f5f0e8` | Primary text |
| `textMuted` | `#8fae9b` | Secondary text |
| `red` | `#dc2626` | Hearts/Diamonds |
| `black` | `#1a1a1a` | Spades/Clubs |
| `accent` | `#10b981` | Success |
| `danger` | `#ef4444` | Error/timer |
| `border` | `#2d6b4a` | Borders |

---

## Game Rules

- **Deal:** 13 kartu per pemain dari deck 52 kartu
- **Susun:** 3 baris — Atas (3 kartu), Tengah (5 kartu), Bawah (5 kartu)
- **Validasi:** Bawah ≥ Tengah ≥ Atas (kekuatan poker hand)
- **Scoring:** Bandingkan per baris antar semua pemain (+1/-1 per menang/kalah)
- **Bonus:** Scoop (+3), Royal Flush bawah (+5), Four-of-a-kind bawah (+4), Straight Flush tengah (+4)
- **Timer:** 60 detik per giliran; timeout = auto-arrange
- **Multi-round:** Pertama sampai target skor (10/15/20/30) memenangkan match

---

## AI Strategy

- Brute-force: coba semua 13C5 = 1287 kombinasi bawah
- Per bawah: evaluasi top 20 kombinasi tengah terkuat
- Pilih arrangement dengan total rankValue tertinggi yang valid
- Early exit jika sudah dapat score > 700 (four-of-a-kind level)

---

## Persistence

- Stats + achievements + soundEnabled di-persist (key: `capsa-susun-store`)
- Game state transient (tidak di-persist antar session)

---

## Verifikasi (WAJIB sebelum selesai)

```bash
npm run typecheck      # tsc --noEmit (0 error)
npx expo export --platform android   # bundle sukses
```

---

## Commit Convention

```
<type>: <deskripsi singkat>
```
Type: `feat` `fix` `refactor` `test` `chore` `docs`

---

## Fitur Baru (Juli 2026)

### Drag-and-drop kartu
- `src/components/DraggableCard.tsx`: Pan gesture (react-native-gesture-handler) + spring animation (reanimated)
- Drop zones (`DropRow.tsx`) report Y position via `measureInWindow`
- Tap fallback: auto-place ke baris berikutnya yang tersedia
- Haptic feedback (expo-haptics) saat card placed

### Card flip animation
- `src/components/FlipCard.tsx`: 3D rotateY via reanimated interpolate
- Back face: dark surface + gold ♠ pattern
- Front face: white card + value/suit text
- Staggered delay per card saat reveal (80ms per card, 200ms per player)

### Multi-round (First to X)
- `GameState.targetScore`: target poin (10/15/20/30), dipilih di HomeScreen
- `GameState.matchWinner`: null sampai ada pemain >= targetScore
- `GamePhase 'match-over'`: tampilkan pemenang + statistik
- `nextRound()`: deal ulang, reset arrangement, pertahankan totalScore
- `gamesPlayed`/`gamesWon` di-increment saat match selesai (bukan per ronde)

### Sound effects
- `src/core/sounds.ts`: procedural WAV generation (sine + decay) — tanpa file audio fisik
- 6 sounds: deal (800Hz), place (600Hz), flip (1200Hz), score (880Hz), win (1047Hz), lose (330Hz)
- Toggle on/off di HomeScreen, preferensi di-persist
- `expo-av` Audio.Sound.createAsync dari data URI base64

### Poker hand labels
- `DropRow.tsx` mengevaluasi hand saat penuh (3 atau 5 kartu)
- Label ditampilkan di kanan atas row (hijau accent)

---

## Roadmap

- [x] Drag-and-drop kartu ke baris (gesture handler)
- [x] Card flip animation saat reveal
- [x] Visual poker hand labels di setiap baris
- [x] Multi-round game (first to X points)
- [x] Sound effects + haptic feedback
- [ ] Online multiplayer (Supabase)
- [ ] Spectator mode (0 human, 4 AI)

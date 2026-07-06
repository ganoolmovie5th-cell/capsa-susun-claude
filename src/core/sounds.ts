// Sound effects for Capsa Susun. Uses expo-av.
import { Audio } from 'expo-av';

type SoundName = 'deal' | 'place' | 'flip' | 'score' | 'win' | 'lose';

// ponytail: generate sounds programmatically via oscillator-like beeps
// using short Audio.Sound with frequency patterns encoded as base64 WAV.
// This avoids needing physical .wav files in assets.

let initialized = false;

// We use a silent approach: generate minimal WAV in-memory.
// Expo-av can load from URI or require(). For Expo Go without prebuild,
// we'll use haptics as primary feedback and Audio only for dealt/flip effect.

const soundRefs: Partial<Record<SoundName, Audio.Sound>> = {};

function createWavBuffer(frequency: number, duration: number, volume: number = 0.5): string {
  const sampleRate = 8000;
  const numSamples = Math.floor(sampleRate * duration);
  const dataSize = numSamples * 2; // 16-bit
  const fileSize = 44 + dataSize;

  const buffer = new Uint8Array(fileSize);
  const view = new DataView(buffer.buffer);

  // WAV header
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) buffer[offset + i] = str.charCodeAt(i);
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, fileSize - 8, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  // Generate sine wave with decay
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const decay = Math.exp(-t * 8);
    const sample = Math.sin(2 * Math.PI * frequency * t) * volume * decay;
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    view.setInt16(44 + i * 2, intSample, true);
  }

  // Convert to base64
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

// Sound definitions (frequency, duration)
const SOUND_DEFS: Record<SoundName, { freq: number; dur: number; vol: number }> = {
  deal: { freq: 800, dur: 0.08, vol: 0.3 },
  place: { freq: 600, dur: 0.1, vol: 0.4 },
  flip: { freq: 1200, dur: 0.12, vol: 0.3 },
  score: { freq: 880, dur: 0.2, vol: 0.5 },
  win: { freq: 1047, dur: 0.3, vol: 0.6 },
  lose: { freq: 330, dur: 0.25, vol: 0.4 },
};

async function ensureInit() {
  if (initialized) return;
  initialized = true;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      staysActiveInBackground: false,
    });
  } catch {
    // ponytail: silent fail if audio unavailable
  }
}

export async function playSound(name: SoundName): Promise<void> {
  try {
    await ensureInit();
    const def = SOUND_DEFS[name];
    const base64 = createWavBuffer(def.freq, def.dur, def.vol);
    const { sound } = await Audio.Sound.createAsync(
      { uri: `data:audio/wav;base64,${base64}` },
      { shouldPlay: true, volume: def.vol }
    );
    // Cleanup after playback
    sound.setOnPlaybackStatusUpdate((status) => {
      if ('didJustFinish' in status && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch {
    // ponytail: silent fail — sound is non-critical
  }
}

// Convenience exports
export const playSoundDeal = () => playSound('deal');
export const playSoundPlace = () => playSound('place');
export const playSoundFlip = () => playSound('flip');
export const playSoundScore = () => playSound('score');
export const playSoundWin = () => playSound('win');
export const playSoundLose = () => playSound('lose');

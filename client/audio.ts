/**
 * Chiptune sound effects synthesized with the Web Audio API (square and triangle
 * waves), so the game ships no audio files. The context is created lazily on the
 * first sound, which always follows a key press or click, so autoplay rules are met.
 */

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(value: boolean): void {
  enabled = value;
}

function getContext(): AudioContext | null {
  if (!enabled) return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

interface Blip {
  duration?: number;
  type?: OscillatorType;
  volume?: number;
  /** Seconds from now. */
  delay?: number;
  /** Glide to this frequency over the blip. */
  slideTo?: number;
}

function blip(frequency: number, { duration = 0.09, type = 'square', volume = 0.1, delay = 0, slideTo }: Blip = {}) {
  const audio = getContext();
  if (!audio) return;

  const start = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const gain = audio.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);

  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gain).connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

// A pentatonic scale never sounds wrong, however fast merges chain together.
const PENTATONIC = [0, 2, 4, 7, 9];
const BASE_HZ = 261.63; // middle C

/** Merge pitch rises with the tile you just built. */
export function mergeFrequency(value: number): number {
  const level = Math.max(0, Math.round(Math.log2(value)) - 2); // 4 -> 0, 8 -> 1, ...
  const semitones = PENTATONIC[level % PENTATONIC.length]! + 12 * Math.floor(level / PENTATONIC.length);
  return Math.min(BASE_HZ * 2 ** (semitones / 12), 2093);
}

export const sfx = {
  move: () => blip(170, { duration: 0.05, type: 'triangle', volume: 0.05, slideTo: 130 }),
  merge: (value: number) => {
    const f = mergeFrequency(value);
    blip(f, { duration: 0.13, volume: 0.09 });
    if (value >= 128) blip(f * 2, { duration: 0.16, volume: 0.05, delay: 0.04 });
  },
  win: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => blip(f, { duration: 0.18, delay: i * 0.1, volume: 0.09 })),
  gameOver: () =>
    [392, 329.63, 261.63, 196].forEach((f, i) => blip(f, { duration: 0.22, type: 'triangle', delay: i * 0.16, volume: 0.1 })),
  click: () => blip(440, { duration: 0.04, volume: 0.06 }),
};

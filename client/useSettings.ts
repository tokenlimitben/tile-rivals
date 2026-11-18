import { useCallback, useEffect, useState } from 'react';
import { setSoundEnabled } from './audio';
import { readBool, writeBool } from './storage';

const SOUND_KEY = 'versus2048.sound';
const MOTION_KEY = 'versus2048.reduceMotion';

function osPrefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** Sound and reduced-motion settings. Reduced motion defaults to the OS preference. */
export function useSettings() {
  const [sound, setSound] = useState(() => readBool(SOUND_KEY, true));
  const [reduceMotion, setReduceMotion] = useState(() => readBool(MOTION_KEY, osPrefersReducedMotion()));

  useEffect(() => {
    setSoundEnabled(sound);
  }, [sound]);

  useEffect(() => {
    document.documentElement.dataset.reduceMotion = String(reduceMotion);
  }, [reduceMotion]);

  // Updater functions must stay pure (React may call them twice), so persist from the
  // current value instead of inside setState.
  const toggleSound = useCallback(() => {
    setSound(!sound);
    writeBool(SOUND_KEY, !sound);
  }, [sound]);

  const toggleReduceMotion = useCallback(() => {
    setReduceMotion(!reduceMotion);
    writeBool(MOTION_KEY, !reduceMotion);
  }, [reduceMotion]);

  return { sound, reduceMotion, toggleSound, toggleReduceMotion };
}

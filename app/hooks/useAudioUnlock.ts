import { useRef, useCallback } from 'react';

export function useAudioUnlock() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isUnlockedRef = useRef(false);

  const unlock = useCallback(() => {
    if (isUnlockedRef.current || typeof window === 'undefined') return;

    // Initialize AudioContext
    if (!audioContextRef.current) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioContextRef.current = new AudioContextClass();
          audioContextRef.current?.resume();
        }
      } catch (error) {
        console.error('Failed to initialize AudioContext:', error);
      }
    }

    // Play silent audio to unlock
    try {
      const silentAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==');
      silentAudio.play().catch(() => {});
    } catch (error) {
      console.error('Failed to play silent audio:', error);
    }

    // Initialize SpeechSynthesis
    if (window.speechSynthesis) {
      const dummyUtterance = new SpeechSynthesisUtterance('');
      window.speechSynthesis.speak(dummyUtterance);
    }

    isUnlockedRef.current = true;
  }, []);

  return { unlock };
}

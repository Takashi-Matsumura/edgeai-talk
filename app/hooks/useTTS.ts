import { useCallback, useEffect, useRef, useState } from "react";
import type { TtsEngine } from "../types";

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [actualEngine, setActualEngine] = useState<TtsEngine>("browser");
  const [pendingText, setPendingText] = useState("");
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true);
    }
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!text) return;

      console.log("[TTS] Starting speech:", text.substring(0, 50));

      try {
        setIsSpeaking(true);

        // Try VOICEVOX first
        try {
          console.log("[TTS] Trying VOICEVOX...");
          const response = await fetch("/api/tts/voicevox", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          });

          if (response.ok) {
            console.log("[TTS] VOICEVOX response OK");
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            if (!audioElementRef.current) {
              audioElementRef.current = new Audio();
            }
            const audio = audioElementRef.current;
            audio.src = audioUrl;

            audio.onended = () => {
              console.log("[TTS] Audio playback ended");
              URL.revokeObjectURL(audioUrl);
              setIsSpeaking(false);
            };
            audio.onerror = (error) => {
              console.error("[TTS] Audio playback error:", error);
              URL.revokeObjectURL(audioUrl);
              setIsSpeaking(false);
            };

            setActualEngine("voicevox");
            try {
              await audio.play();
              console.log("[TTS] VOICEVOX playback started");
              setPendingText("");
              return;
            } catch (playError) {
              console.error("[TTS] VOICEVOX play() failed:", playError);
              URL.revokeObjectURL(audioUrl);
              throw playError;
            }
          } else {
            console.warn("[TTS] VOICEVOX response not OK:", response.status);
          }
        } catch (voicevoxError) {
          console.warn("[TTS] VOICEVOX error, falling back to browser TTS:", voicevoxError);
        }

        // Fallback to browser TTS
        if (isSupported && typeof window !== "undefined") {
          console.log("[TTS] Using browser TTS");
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = "ja-JP";
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;

          utterance.onend = () => {
            console.log("[TTS] Browser TTS ended");
            setIsSpeaking(false);
          };
          utterance.onerror = (error) => {
            console.error("[TTS] Browser TTS error:", error);
            setIsSpeaking(false);
          };

          setActualEngine("browser");
          window.speechSynthesis.speak(utterance);
          console.log("[TTS] Browser TTS started");
        } else {
          console.error("[TTS] No TTS available");
          setIsSpeaking(false);
        }
      } catch (error) {
        console.error("[TTS] Fatal error:", error);
        setIsSpeaking(false);
        throw error;
      }
    },
    [isSupported]
  );

  const cancel = useCallback(() => {
    if (typeof window !== "undefined") {
      window.speechSynthesis?.cancel();
    }
    setIsSpeaking(false);
  }, []);

  return {
    speak,
    cancel,
    isSpeaking,
    isSupported,
    actualEngine,
    pendingText,
    setPendingText,
    audioElementRef,
  };
}

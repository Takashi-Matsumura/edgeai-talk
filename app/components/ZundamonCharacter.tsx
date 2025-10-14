import { useEffect, useRef, useState } from "react";
import type { TtsEngine } from "../types";

interface ZundamonSpeakingProps {
  actualEngine: TtsEngine;
}

export function ZundamonSpeaking({ actualEngine }: ZundamonSpeakingProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    if (actualEngine === "voicevox" && videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.error("Video autoplay failed:", error);
      });
    }
  }, [actualEngine]);

  if (actualEngine !== "voicevox") return null;

  return (
    <div className="fixed bottom-24 right-8 z-50">
      <div className="relative">
        <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 -ml-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl shadow-lg border-2 border-green-400 whitespace-nowrap">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">話しているのだ!</p>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-0 h-0 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-green-400"></div>
        </div>

        <div className="w-32 h-32 rounded-full overflow-hidden shadow-2xl border-4 border-white dark:border-gray-700 bg-gradient-to-br from-green-400 to-green-600">
          {!videoError ? (
            <video
              ref={videoRef}
              src="/movie/zundam_web.mp4"
              loop
              muted
              playsInline
              preload="auto"
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error("Video load error:", e);
                setVideoError(true);
              }}
              onLoadedData={() => {
                console.log("Video loaded successfully");
                setVideoError(false);
                videoRef.current?.play().catch((err) => {
                  console.error("Play failed:", err);
                  setVideoError(true);
                });
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center animate-bounce">
              <div className="text-6xl">🍃</div>
            </div>
          )}
        </div>

        <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-75"></div>
      </div>
    </div>
  );
}

interface ZundamonListeningProps {
  isRecording: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export function ZundamonListening({
  isRecording,
  onStart,
  onStop,
  disabled,
}: ZundamonListeningProps) {
  const zundamonRef = useRef<HTMLDivElement>(null);
  const sleepVideoRef = useRef<HTMLVideoElement>(null);
  const wakeupVideoRef = useRef<HTMLVideoElement>(null);
  const [sleepVideoError, setSleepVideoError] = useState(false);
  const [wakeupVideoError, setWakeupVideoError] = useState(false);

  useEffect(() => {
    const element = zundamonRef.current;
    if (!element || disabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      onStart();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      onStop();
    };

    const handleTouchCancel = (e: TouchEvent) => {
      e.preventDefault();
      onStop();
    };

    element.addEventListener("touchstart", handleTouchStart, { passive: false });
    element.addEventListener("touchend", handleTouchEnd, { passive: false });
    element.addEventListener("touchcancel", handleTouchCancel, { passive: false });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchend", handleTouchEnd);
      element.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [disabled, onStart, onStop]);

  useEffect(() => {
    if (isRecording && wakeupVideoRef.current) {
      wakeupVideoRef.current.play().catch((error) => {
        console.error("Wakeup video autoplay failed:", error);
      });
    } else if (!isRecording && sleepVideoRef.current) {
      sleepVideoRef.current.play().catch((error) => {
        console.error("Sleep video autoplay failed:", error);
      });
    }
  }, [isRecording]);

  if (disabled) return null;

  return (
    <div
      ref={zundamonRef}
      className="fixed bottom-8 left-8 z-50 select-none transition-opacity opacity-100"
      style={{
        touchAction: "none",
        cursor: "pointer",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
      }}
      onMouseDown={onStart}
      onMouseUp={onStop}
      onMouseLeave={onStop}
    >
      <div className="relative">
        {isRecording ? (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full ml-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl shadow-lg border-2 border-green-400 whitespace-nowrap animate-pulse">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">聞いているのだ!</p>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full w-0 h-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-green-400"></div>
          </div>
        ) : (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full ml-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl shadow-lg border-2 border-gray-300 dark:border-gray-600 whitespace-nowrap">
            <p className="text-xs text-gray-500 dark:text-gray-400">タップして話すのだ</p>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full w-0 h-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-gray-300 dark:border-r-gray-600"></div>
          </div>
        )}

        <div
          className={`w-32 h-32 rounded-full overflow-hidden shadow-2xl border-4 border-white dark:border-gray-700 bg-gradient-to-br from-green-400 to-green-600 transition-all ${
            isRecording ? "scale-110" : "scale-100 opacity-70"
          }`}
        >
          {isRecording ? (
            !wakeupVideoError ? (
              <video
                ref={wakeupVideoRef}
                src="/movie/wakeup_web.mp4"
                loop
                muted
                playsInline
                autoPlay
                preload="auto"
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error("Wakeup video load error:", e);
                  setWakeupVideoError(true);
                }}
                onLoadedData={() => {
                  console.log("Wakeup video loaded successfully");
                  setWakeupVideoError(false);
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-6xl">👂</div>
              </div>
            )
          ) : !sleepVideoError ? (
            <video
              ref={sleepVideoRef}
              src="/movie/sleep_web.mp4"
              loop
              muted
              playsInline
              autoPlay
              preload="auto"
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error("Sleep video load error:", e);
                setSleepVideoError(true);
              }}
              onLoadedData={() => {
                console.log("Sleep video loaded successfully");
                setSleepVideoError(false);
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-6xl rotate-90">😴</div>
            </div>
          )}
        </div>

        {isRecording && (
          <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-75"></div>
        )}
      </div>
    </div>
  );
}

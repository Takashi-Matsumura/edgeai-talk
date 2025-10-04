import { useRef, useEffect, FormEvent } from 'react';

interface ControlBarProps {
  input: string;
  isLoading: boolean;
  isRecording: boolean;
  isSpeechSupported: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onClear: () => void;
}

export function ControlBar({
  input,
  isLoading,
  isRecording,
  isSpeechSupported,
  onInputChange,
  onSubmit,
  onStartRecording,
  onStopRecording,
  onClear,
}: ControlBarProps) {
  const micButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const element = micButtonRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      onStartRecording();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      onStopRecording();
    };

    const handleTouchCancel = (e: TouchEvent) => {
      e.preventDefault();
      onStopRecording();
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [onStartRecording, onStopRecording]);

  return (
    <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-4">
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <button
          ref={micButtonRef}
          type="button"
          onClick={onStartRecording}
          disabled={!isSpeechSupported}
          className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all touch-none ${
            isRecording
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/50'
              : isSpeechSupported
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
          }`}
          aria-label="音声入力"
          style={{
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
          }}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
            <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-1.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
          </svg>
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="メッセージを入力..."
          className="flex-1 px-4 py-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          aria-label="送信"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onClear}
          className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
          aria-label="クリア"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </form>
    </div>
  );
}

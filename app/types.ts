export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export type TtsEngine = 'browser' | 'voicevox';

export interface SpeechRecognitionType {
  start: () => void;
  stop: () => void;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
}

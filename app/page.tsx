'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(false);
  const [isTtsSupported, setIsTtsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [actualTtsEngine, setActualTtsEngine] = useState<'browser' | 'voicevox'>('browser');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<{
    start: () => void;
    stop: () => void;
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((event: unknown) => void) | null;
    onerror: ((event: unknown) => void) | null;
    onend: (() => void) | null;
  } | null>(null);
  const isTtsEnabledRef = useRef(isTtsEnabled);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    isTtsEnabledRef.current = isTtsEnabled;
  }, [isTtsEnabled]);

  useEffect(() => {
    // Check if Web Speech API is supported
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        setIsSpeechSupported(true);
        const recognition = new SpeechRecognitionAPI();
        recognition.lang = 'ja-JP';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: unknown) => {
          const transcript = (event as { results: { 0: { 0: { transcript: string } } } }).results[0][0].transcript;
          setInput(transcript);
          setIsRecording(false);

          // 音声入力が完了したら自動送信
          if (transcript.trim()) {
            sendMessage(transcript);
          }
        };

        recognition.onerror = (event: unknown) => {
          console.error('Speech recognition error:', (event as { error: string }).error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }

      // Check if TTS is supported
      if ('speechSynthesis' in window) {
        setIsTtsSupported(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) throw new Error('API request failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // ストリーミング完了後にTTS読み上げ
            if (isTtsEnabledRef.current && assistantMessage) {
              speakText(assistantMessage);
            }
            break;
          }

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter((line) => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content || '';
                assistantMessage += content;

                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1].content = assistantMessage;
                  return updated;
                });
              } catch (e) {
                console.error('Parse error:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'エラーが発生しました。もう一度お試しください。' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = async (text: string) => {
    if (!text) return;

    try {
      setIsSpeaking(true);

      // まずVOICEVOXを試行
      try {
        const response = await fetch('/api/tts/voicevox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        if (response.ok) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);

          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            setIsSpeaking(false);
          };
          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl);
            setIsSpeaking(false);
          };

          setActualTtsEngine('voicevox');
          await audio.play();
          return;
        }
      } catch (voicevoxError) {
        console.warn('VOICEVOX not available, falling back to browser TTS:', voicevoxError);
      }

      // VOICEVOXが利用できない場合はブラウザTTSにフォールバック
      if (isTtsSupported) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        setActualTtsEngine('browser');
        window.speechSynthesis.speak(utterance);
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleClear = () => {
    setMessages([]);
    setInput('');
    window.speechSynthesis?.cancel();
  };

  const startRecording = (e?: React.MouseEvent | React.TouchEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!isSpeechSupported || !recognitionRef.current || isRecording) return;

    try {
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = (e?: React.MouseEvent | React.TouchEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!recognitionRef.current || !isRecording) return;

    recognitionRef.current.stop();
    setIsRecording(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 relative">
      {/* Zundamon - Speaking (Right Bottom) */}
      {isSpeaking && actualTtsEngine === 'voicevox' && (
        <div className="fixed bottom-24 right-8 z-50 animate-bounce">
          <div className="relative">
            {/* Speech Bubble */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl shadow-lg border-2 border-green-400 whitespace-nowrap">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">話しているのだ！</p>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-green-400"></div>
            </div>
            {/* Zundamon Character */}
            <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white dark:border-gray-700">
              <div className="text-6xl">🍃</div>
            </div>
            {/* Sound Wave Effect */}
            <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-75"></div>
          </div>
        </div>
      )}

      {/* Zundamon - Sleeping/Listening (Left Bottom) */}
      {!isSpeaking && !isLoading && isTtsEnabled && (
        <div
          className="fixed bottom-8 left-8 z-50 cursor-pointer select-none touch-none"
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          onTouchStart={(e) => {
            e.preventDefault();
            startRecording(e);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            stopRecording(e);
          }}
          onTouchCancel={(e) => {
            e.preventDefault();
            stopRecording(e);
          }}
        >
          <div className="relative">
            {/* Speech Bubble */}
            {isRecording ? (
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl shadow-lg border-2 border-green-400 whitespace-nowrap animate-pulse">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">聞いているのだ！</p>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-green-400"></div>
              </div>
            ) : (
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl shadow-lg border-2 border-gray-300 dark:border-gray-600 whitespace-nowrap">
                <p className="text-xs text-gray-500 dark:text-gray-400">タップして話すのだ</p>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-300 dark:border-t-gray-600"></div>
              </div>
            )}
            {/* Zundamon Character */}
            <div className={`w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white dark:border-gray-700 transition-all ${
              isRecording ? 'scale-110' : 'scale-100 opacity-70'
            }`}>
              <div className={`text-6xl transition-transform ${isRecording ? '' : 'rotate-90'}`}>
                {isRecording ? '👂' : '😴'}
              </div>
            </div>
            {/* Listening Wave Effect */}
            {isRecording && (
              <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-75"></div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">EdgeAI Talk</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">localhost:1234</p>
          </div>
          <div className="flex items-center gap-2">
            {/* TTS Toggle */}
            {isTtsSupported && (
              <button
                onClick={() => setIsTtsEnabled(!isTtsEnabled)}
                className="relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                style={{ backgroundColor: isTtsEnabled ? '#10b981' : '#d1d5db' }}
                aria-label="音声読み上げ切替"
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                    isTtsEnabled ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Chat Window */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 dark:text-gray-600 mt-20">
            <p className="text-sm">メッセージを入力するか、マイクボタンで音声入力してください</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
              ) : (
                <div className="text-sm prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-ul:my-2 prose-li:my-0.5 prose-strong:font-semibold prose-strong:text-gray-900 dark:prose-strong:text-gray-100">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
            {/* Repeat Button for Assistant Messages */}
            {msg.role === 'assistant' && isTtsEnabled && msg.content && (
              <button
                onClick={() => speakText(msg.content)}
                className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 transition-all flex items-center justify-center self-end"
                aria-label="リピート"
                title="リピート"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-2xl">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Control Bar - Only shown when TTS is disabled */}
      {!isTtsEnabled && (
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <button
              type="button"
              onClick={startRecording}
              disabled={!isSpeechSupported}
              className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/50'
                  : isSpeechSupported
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
              }`}
              aria-label="音声入力"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-1.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
              </svg>
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
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
              onClick={handleClear}
              className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              aria-label="クリア"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

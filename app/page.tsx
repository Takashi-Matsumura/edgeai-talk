'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Message } from './types';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useTTS } from './hooks/useTTS';
import { useAudioUnlock } from './hooks/useAudioUnlock';
import { ZundamonSpeaking, ZundamonListening } from './components/ZundamonCharacter';
import { ChatMessage, LoadingIndicator } from './components/ChatMessage';
import { ControlBar } from './components/ControlBar';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { unlock } = useAudioUnlock();
  const { speak, isSpeaking, isSupported: isTtsSupported, actualEngine, pendingText, setPendingText } = useTTS();

  const handleTranscript = useCallback((text: string) => {
    setInput(text);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
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
            if (isTtsEnabled && assistantMessage) {
              speak(assistantMessage).catch(() => {
                setPendingText(assistantMessage);
              });
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
  }, [isLoading, messages, isTtsEnabled, speak, setPendingText]);

  const handleRecognitionEnd = useCallback((finalTranscript: string) => {
    if (finalTranscript) {
      sendMessage(finalTranscript);
      setInput('');
    }
  }, [sendMessage]);

  const { isRecording, isSupported: isSpeechSupported, start: startRecording, stop: stopRecording } = useSpeechRecognition({
    onTranscript: handleTranscript,
    onEnd: handleRecognitionEnd,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleClear = () => {
    setMessages([]);
    setInput('');
    window.speechSynthesis?.cancel();
  };

  const handleRecordingStart = () => {
    unlock();
    startRecording();
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 relative">
      {/* Zundamon - Speaking */}
      {isSpeaking && <ZundamonSpeaking actualEngine={actualEngine} />}

      {/* Manual Play Button */}
      {pendingText && isTtsEnabled && !isSpeaking && (
        <button
          onClick={() => {
            speak(pendingText);
            setPendingText('');
          }}
          className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 hover:bg-green-600 transition-all animate-bounce"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
          <span className="text-lg font-bold">タップして読み上げ</span>
        </button>
      )}

      {/* Zundamon - Listening */}
      {isTtsEnabled && (
        <ZundamonListening
          isRecording={isRecording}
          onStart={handleRecordingStart}
          onStop={stopRecording}
          disabled={isSpeaking || isLoading}
        />
      )}

      {/* Header */}
      <header className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">EdgeAI Talk</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">localhost:1234</p>
          </div>
          <div className="flex items-center gap-2">
            {isTtsEnabled && messages.length > 0 && (
              <button
                onClick={handleClear}
                className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-md"
                aria-label="会話をクリア"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            )}
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
          <ChatMessage
            key={idx}
            message={msg}
            showRepeat={isTtsEnabled}
            onRepeat={() => speak(msg.content)}
          />
        ))}
        {isLoading && <LoadingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Control Bar */}
      {!isTtsEnabled && (
        <ControlBar
          input={input}
          isLoading={isLoading}
          isRecording={isRecording}
          isSpeechSupported={isSpeechSupported}
          onInputChange={setInput}
          onSubmit={handleSubmit}
          onStartRecording={handleRecordingStart}
          onStopRecording={stopRecording}
          onClear={handleClear}
        />
      )}
    </div>
  );
}

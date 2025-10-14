"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatMessage, LoadingIndicator } from "./components/ChatMessage";
import { ControlBar } from "./components/ControlBar";
import { DocumentManager } from "./components/DocumentManager";
import { ZundamonListening, ZundamonSpeaking } from "./components/ZundamonCharacter";
import { useAudioUnlock } from "./hooks/useAudioUnlock";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import { useTTS } from "./hooks/useTTS";
import type { Message } from "./types";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(false);
  const [isRagEnabled, setIsRagEnabled] = useState(true); // RAG機能のON/OFF
  const [isDocManagerOpen, setIsDocManagerOpen] = useState(false); // ドキュメント管理モーダル
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ragLongPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { unlock } = useAudioUnlock();
  const {
    speak,
    cancel,
    isSpeaking,
    isSupported: isTtsSupported,
    actualEngine,
    pendingText,
    setPendingText,
    audioElementRef,
  } = useTTS();

  const handleTranscript = useCallback((text: string) => {
    setInput(text);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: Message = { role: "user", content: text };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        // RAG有効時はFastAPIバックエンド、無効時は従来のエンドポイント
        const endpoint = isRagEnabled ? "http://localhost:8000/api/chat/completions" : "/api/chat";

        const requestBody = isRagEnabled
          ? {
              messages: [...messages, userMessage],
              use_rag: true,
              model: "google/gemma-3n-e4b",
            }
          : { messages: [...messages, userMessage] };

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) throw new Error("API request failed");

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let assistantMessage = "";

        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

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
            const lines = chunk.split("\n").filter((line) => line.trim());

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices[0]?.delta?.content || "";
                  assistantMessage += content;

                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1].content = assistantMessage;
                    return updated;
                  });
                } catch (e) {
                  console.error("Parse error:", e);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error:", error);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "エラーが発生しました。もう一度お試しください。" },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, isTtsEnabled, isRagEnabled, speak, setPendingText]
  );

  const handleRecognitionEnd = useCallback(
    (finalTranscript: string) => {
      if (finalTranscript) {
        sendMessage(finalTranscript);
        setInput("");
      }
    },
    [sendMessage]
  );

  const {
    isRecording,
    isSupported: isSpeechSupported,
    start: startRecording,
    stop: stopRecording,
  } = useSpeechRecognition({
    onTranscript: handleTranscript,
    onEnd: handleRecognitionEnd,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleClear = () => {
    setMessages([]);
    setInput("");
    window.speechSynthesis?.cancel();
  };

  const handleRecordingStart = () => {
    unlock();
    startRecording();
  };

  // 長押し判定用のフラグ
  const isLongPress = useRef(false);

  // RAG長押し開始
  const handleRagMouseDown = () => {
    isLongPress.current = false;
    ragLongPressTimerRef.current = setTimeout(() => {
      isLongPress.current = true;
      setIsDocManagerOpen(true);
    }, 500); // 500msで長押しと判定
  };

  // RAG長押し終了/キャンセル
  const handleRagMouseUp = () => {
    if (ragLongPressTimerRef.current) {
      clearTimeout(ragLongPressTimerRef.current);
      ragLongPressTimerRef.current = null;
    }

    // 短押しの場合のみトグル
    if (!isLongPress.current) {
      setIsRagEnabled(!isRagEnabled);
    }

    // フラグをリセット
    isLongPress.current = false;
  };

  // タイマーのクリーンアップ
  useEffect(() => {
    return () => {
      if (ragLongPressTimerRef.current) {
        clearTimeout(ragLongPressTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-orange-100 via-orange-200 to-orange-300 dark:from-orange-300 dark:via-orange-400 dark:to-orange-500 gradient-animate relative">
      {/* Decorative elements */}
      <div
        className="fixed top-0 left-0 w-96 h-96 bg-orange-200/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ zIndex: 0 }}
      />
      <div
        className="fixed bottom-0 right-0 w-96 h-96 bg-orange-300/40 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"
        style={{ zIndex: 0 }}
      />

      {/* Zundamon - Speaking */}
      {isSpeaking && (
        <ZundamonSpeaking
          actualEngine={actualEngine}
          onCancel={cancel}
          audioElementRef={audioElementRef}
        />
      )}

      {/* Manual Play Button */}
      {pendingText && isTtsEnabled && !isSpeaking && (
        <button
          onClick={() => {
            speak(pendingText);
            setPendingText("");
          }}
          className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 glass dark:glass-dark text-gray-800 dark:text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 hover:scale-105 transition-all duration-300 animate-bounce"
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
      <header
        className="flex-shrink-0 bg-white/95 backdrop-blur-sm border-b-4 border-orange-500 px-4 py-4 relative shadow-2xl"
        style={{ zIndex: 30 }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-orange-500 rounded-full animate-pulse shadow-lg shadow-orange-500/50"></div>
              <h1 className="text-2xl font-black text-gray-900">EdgeAI Talk</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* RAGシンプルトグルボタン */}
            <button
              onMouseDown={handleRagMouseDown}
              onMouseUp={handleRagMouseUp}
              onMouseLeave={handleRagMouseUp}
              onTouchStart={handleRagMouseDown}
              onTouchEnd={handleRagMouseUp}
              className="px-6 py-3 rounded-full backdrop-blur-sm shadow-lg hover:scale-105 transition-all duration-300 hover:shadow-xl font-bold text-white text-lg"
              style={{
                backgroundColor: isRagEnabled ? "#6366f1" : "#d1d5db",
              }}
              aria-label="RAG機能切替（長押しでRAG管理）"
            >
              RAG
            </button>

            {/* 音声シンプルトグルボタン */}
            {isTtsSupported && (
              <button
                onClick={() => setIsTtsEnabled(!isTtsEnabled)}
                className="px-6 py-3 rounded-full backdrop-blur-sm shadow-lg hover:scale-105 transition-all duration-300 hover:shadow-xl font-bold text-white text-lg"
                style={{
                  backgroundColor: isTtsEnabled ? "#fb923c" : "#d1d5db",
                }}
                aria-label="音声機能切替"
              >
                音声
              </button>
            )}

            {isTtsEnabled && messages.length > 0 && (
              <button
                onClick={handleClear}
                className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 hover:scale-110 transition-all duration-300 shadow-xl border-2 border-red-400"
                aria-label="会話をクリア"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Chat Window */}
      <div
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4 chat-scroll relative"
        style={{ zIndex: 10 }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-start pt-8 space-y-8 px-4">
            {/* Hero Message */}
            <div className="text-center space-y-6 animate-fade-in">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-orange-600/90 backdrop-blur-sm rounded-full border-2 border-white/50 mb-2 shadow-2xl">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-lg font-extrabold text-white tracking-wide">
                  100% ローカル処理 | プライバシー保護
                </span>
              </div>

              <h2
                className="text-5xl md:text-6xl font-black text-white leading-tight px-4"
                style={{ textShadow: "0 4px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)" }}
              >
                インターネット不要！
                <br />
                <span
                  className="text-orange-500"
                  style={{ textShadow: "0 4px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)" }}
                >
                  この端末だけ
                </span>
                でAIと会話
              </h2>

              <p
                className="text-2xl md:text-3xl font-bold text-white leading-relaxed max-w-2xl mx-auto px-4"
                style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
              >
                エッジAI - クラウド接続なしで高速レスポンス
              </p>
            </div>

            {/* Suggestion Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
              {[
                { icon: "🌤️", text: "今日の天気を教えて", question: "今日の天気を教えて" },
                { icon: "🍳", text: "おすすめのレシピは？", question: "おすすめのレシピを教えて" },
                { icon: "💡", text: "AIについて教えて", question: "AIについて簡単に教えて" },
                { icon: "🎯", text: "何ができるの？", question: "あなたは何ができますか？" },
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(suggestion.question);
                    sendMessage(suggestion.question);
                  }}
                  className="group bg-white/95 backdrop-blur-sm px-8 py-5 rounded-2xl shadow-2xl hover:scale-105 hover:shadow-3xl hover:bg-white transition-all duration-300 text-left border-2 border-white/50"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl group-hover:scale-125 transition-transform duration-300">
                      {suggestion.icon}
                    </span>
                    <span className="text-xl font-bold text-gray-800">{suggestion.text}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Call to Action */}
            <div className="flex items-center gap-4 text-white animate-bounce">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span
                className="text-2xl font-bold"
                style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
              >
                タップして試してみよう
              </span>
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
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

      {/* Document Manager Modal */}
      <DocumentManager isOpen={isDocManagerOpen} onClose={() => setIsDocManagerOpen(false)} />
    </div>
  );
}

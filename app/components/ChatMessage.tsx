import ReactMarkdown from 'react-markdown';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  onRepeat?: () => void;
  showRepeat?: boolean;
}

export function ChatMessage({ message, onRepeat, showRepeat }: ChatMessageProps) {
  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} gap-3 animate-fade-in`}>
      <div
        className={`max-w-[85%] px-6 py-4 rounded-2xl shadow-2xl transition-all duration-300 hover:shadow-3xl ${
          message.role === 'user'
            ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white border-2 border-orange-400'
            : 'bg-white/95 backdrop-blur-sm text-gray-900 border-2 border-white/50'
        }`}
      >
        {message.role === 'user' ? (
          <p className="text-xl whitespace-pre-wrap break-words font-bold leading-relaxed">{message.content}</p>
        ) : (
          <div className="text-lg prose prose-lg max-w-none prose-p:my-3 prose-ul:my-3 prose-li:my-1 prose-strong:font-bold prose-strong:text-gray-900 prose-headings:text-gray-900 prose-headings:font-bold leading-relaxed">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>

      {showRepeat && message.role === 'assistant' && message.content && (
        <button
          onClick={onRepeat}
          className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 text-white hover:from-orange-500 hover:to-orange-600 hover:scale-110 transition-all duration-300 flex items-center justify-center self-end shadow-2xl border-2 border-white/50"
          aria-label="リピート"
          title="リピート"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function LoadingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="bg-white/95 backdrop-blur-sm px-7 py-5 rounded-2xl shadow-2xl border-2 border-white/50">
        <div className="flex space-x-3">
          <div className="w-4 h-4 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0ms' }}></div>
          <div className="w-4 h-4 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '150ms' }}></div>
          <div className="w-4 h-4 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}

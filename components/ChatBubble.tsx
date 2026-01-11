import React from 'react';
import Markdown from 'react-markdown';
import { Message } from '../types';
import { PlusIcon } from './Icons';

interface ChatBubbleProps {
  message: Message;
  selectedSuggestions: Set<string>;
  onToggleSuggestion: (suggestion: string) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, selectedSuggestions, onToggleSuggestion }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex flex-col w-full mb-4 ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 text-[15px] leading-relaxed shadow-sm
        ${
          isUser
            ? 'bg-[#007AFF] text-white rounded-2xl rounded-tr-sm'
            : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-100'
        }`}
      >
        <div className={`prose prose-sm max-w-none ${isUser ? 'text-white prose-a:text-white prose-strong:text-white' : 'text-gray-800'}`}>
            <Markdown>{message.text}</Markdown>
        </div>
      </div>

      {/* Suggestion Chips */}
      {!isUser && message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 max-w-[85%] sm:max-w-[75%]">
              {message.suggestions.map((suggestion, index) => {
                  const isSelected = selectedSuggestions.has(suggestion);
                  return (
                      <button
                        key={index}
                        onClick={() => onToggleSuggestion(suggestion)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 flex items-center gap-1.5
                        ${isSelected 
                            ? 'bg-blue-100 text-blue-700 border-blue-200 font-medium' 
                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                        }`}
                      >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                          {suggestion}
                      </button>
                  );
              })}
          </div>
      )}
    </div>
  );
};

export const TypingIndicator = () => (
    <div className="flex w-full mb-4 justify-start">
        <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm border border-gray-100 flex items-center space-x-1 shadow-sm h-[46px]">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
    </div>
);
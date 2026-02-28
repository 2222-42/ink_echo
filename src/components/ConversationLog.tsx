import React, { useEffect, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import type { Message } from '../types/conversation';

export interface ConversationLogProps {
    messages: Message[];
    onPlayAudio?: (content: string) => void;
    autoScroll?: boolean;
}

export const ConversationLog: React.FC<ConversationLogProps> = ({
    messages,
    onPlayAudio,
    autoScroll = true,
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, autoScroll]);

    return (
        <div className="flex flex-col space-y-4 p-4 overflow-y-auto w-full max-w-2xl mx-auto h-[60vh]">
            {messages.map((msg: Message, i: number) => {
                const isUser = msg.role === 'user';
                return (
                    <div
                        key={`${msg.role}-${i}`}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`
                max-w-[80%] rounded-2xl px-4 py-3 shadow-sm relative group
                ${isUser
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                }
              `}
                        >
                            <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">
                                {msg.content}
                            </p>

                            {!isUser && onPlayAudio && (
                                <button
                                    data-testid="play-audio-button"
                                    onClick={() => onPlayAudio(msg.content)}
                                    className="absolute -right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 p-2 rounded-full hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                                    aria-label="Play audio message"
                                >
                                    <Volume2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
            <div ref={scrollRef} />
        </div>
    );
};

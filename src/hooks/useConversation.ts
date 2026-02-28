import { useState, useEffect } from 'react';
import { localStorageImpl } from '../lib/storage';

const SESSION_KEY = 'ink-echo-session';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export interface ConversationState {
    id: string;
    turns: number;
    history: Message[];
    isSessionEnded: boolean;
    isWaitingVision: boolean;
}

function isValidConversationState(value: unknown): value is ConversationState {
    if (typeof value !== 'object' || value === null) return false;
    const s = value as Partial<ConversationState>;
    return (
        typeof s.id === 'string' &&
        typeof s.turns === 'number' &&
        Array.isArray(s.history) &&
        s.history.every(m => m && typeof m === 'object' && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string') &&
        typeof s.isSessionEnded === 'boolean' &&
        typeof s.isWaitingVision === 'boolean'
    );
}

export const useConversation = () => {
    const [state, setState] = useState<ConversationState>(() => {
        const storedSession = localStorageImpl.getSession(SESSION_KEY);
        if (isValidConversationState(storedSession)) {
            return storedSession;
        }

        return {
            id: crypto.randomUUID(),
            turns: 0,
            history: [],
            isSessionEnded: false,
            isWaitingVision: false,
        };
    });

    useEffect(() => {
        localStorageImpl.saveSession(SESSION_KEY, state);
    }, [state]);

    const addMessage = (role: 'user' | 'assistant', content: string) => {
        setState((prevState) => {
            const newHistory = [...prevState.history, { role, content }];

            // Increment turn only when assistant replies
            const newTurns = role === 'assistant' ? prevState.turns + 1 : prevState.turns;

            // Session ends at 7 turns
            const newIsSessionEnded = newTurns >= 7;

            return {
                ...prevState,
                history: newHistory,
                turns: newTurns,
                isSessionEnded: newIsSessionEnded
            };
        });
    };

    const resumeSessionWithVision = (visionResult: { feedback: string }) => {
        setState((prevState) => {
            const newHistory = [
                ...prevState.history,
                { role: 'assistant', content: visionResult.feedback } as Message
            ];

            return {
                ...prevState,
                history: newHistory,
                turns: 0,
                isSessionEnded: false,
                isWaitingVision: false,
            };
        });
    };

    return {
        ...state,
        addMessage,
        resumeSessionWithVision
    };
};

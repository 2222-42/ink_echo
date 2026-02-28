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

export const useConversation = () => {
    const [state, setState] = useState<ConversationState>(() => {
        const storedSession = localStorageImpl.getSession(SESSION_KEY) as ConversationState | null;
        if (storedSession) {
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

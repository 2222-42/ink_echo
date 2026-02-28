import { useState, useEffect } from 'react';
import { localStorageImpl } from '../lib/storage';
import type { ConversationState, Message } from '../types/conversation';

const SESSION_KEY = 'ink-echo-session';

function isValidConversationState(value: unknown): value is ConversationState {
    if (typeof value !== 'object' || value === null) return false;
    const s = value as Record<string, unknown>;

    return (
        typeof s.id === 'string' &&
        typeof s.turns === 'number' && Number.isInteger(s.turns) && s.turns >= 0 &&
        Array.isArray(s.history) &&
        s.history.every((m: unknown) =>
            typeof m === 'object' && m !== null &&
            'role' in m && (m.role === 'user' || m.role === 'assistant') &&
            'content' in m && typeof m.content === 'string'
        ) &&
        typeof s.isSessionEnded === 'boolean' &&
        typeof s.isWaitingVision === 'boolean'
    );
}

export const useConversation = () => {
    const [state, setState] = useState<ConversationState>(() => {
        const storedSession = localStorageImpl.getSession(SESSION_KEY);
        if (storedSession) {
            if (isValidConversationState(storedSession)) {
                return storedSession;
            } else {
                console.warn('Invalid or corrupted session data found. Starting fresh session.');
                localStorageImpl.removeSession(SESSION_KEY);
            }
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

    const startVisionUpload = () => {
        setState((prevState) => ({
            ...prevState,
            isWaitingVision: true
        }));
    };

    return {
        ...state,
        addMessage,
        resumeSessionWithVision,
        startVisionUpload
    };
};

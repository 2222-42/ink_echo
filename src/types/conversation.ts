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

export interface SessionStorage {
    saveSession(id: string, state: object): void;
    getSession(id: string): object | null;
}

export const localStorageImpl: SessionStorage = {
    saveSession(id: string, state: object): void {
        try {
            const serializedState = JSON.stringify(state);
            localStorage.setItem(id, serializedState);
        } catch (error) {
            console.error('Error saving session to localStorage', error);
        }
    },

    getSession(id: string): object | null {
        try {
            const serializedState = localStorage.getItem(id);
            if (serializedState === null) {
                return null;
            }
            return JSON.parse(serializedState);
        } catch (error) {
            console.error('Error parsing session from localStorage', error);
            return null;
        }
    }
};

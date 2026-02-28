import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { localStorageImpl } from './storage'

describe('localStorageImpl', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.spyOn(Storage.prototype, 'setItem');
        vi.spyOn(Storage.prototype, 'getItem');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('saves session data as a serialized JSON string', () => {
        const id = 'test-session-1';
        const data = { turns: 3, role: 'user' };

        localStorageImpl.saveSession(id, data);

        expect(localStorage.setItem).toHaveBeenCalledWith(id, JSON.stringify(data));
        expect(localStorage.getItem(id)).toBe(JSON.stringify(data));
    });

    it('retrieves and parses session data correctly', () => {
        const id = 'test-session-2';
        const data = { turns: 5, history: [] };
        localStorage.setItem(id, JSON.stringify(data));

        const retrieved = localStorageImpl.getSession(id);

        expect(localStorage.getItem).toHaveBeenCalledWith(id);
        expect(retrieved).toEqual(data);
    });

    it('returns null if the session does not exist', () => {
        const retrieved = localStorageImpl.getSession('non-existent');
        expect(retrieved).toBeNull();
    });

    it('returns null if the data cannot be parsed', () => {
        const id = 'test-session-invalid';
        localStorage.setItem(id, 'invalid-json-string');

        const retrieved = localStorageImpl.getSession(id);
        expect(retrieved).toBeNull();
    });
});

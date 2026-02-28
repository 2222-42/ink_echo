import { describe, it, expect, vi, beforeEach } from 'vitest';
import { compressImage } from './imageUtils';

describe('compressImage', () => {
    beforeEach(() => {
        // Mock URL.createObjectURL and URL.revokeObjectURL
        global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
        global.URL.revokeObjectURL = vi.fn();
    });

    it('should resolve with a base64 string', async () => {
        // We cannot easily test canvas drawImage in vitest without jsdom-canvas
        // So we'll test the error handling or mock the Image object to instantly resolve

        // Mock global Image constructor to trigger onload
        const originalImage = global.Image;
        global.Image = class {
            onload: () => void = () => { };
            src: string = '';
            width: number = 2000;
            height: number = 1000;

            constructor() {
                setTimeout(() => this.onload(), 0);
            }
        } as any;

        try {
            const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
            // This will throw if canvas is not implemented in jsdom, but we'll catch it or mock it
            // Let's mock document.createElement('canvas')
            const mockContext = {
                drawImage: vi.fn(),
            };
            const mockCanvas = {
                width: 0,
                height: 0,
                getContext: vi.fn(() => mockContext),
                toDataURL: vi.fn(() => 'data:image/jpeg;base64,mockbase64data'),
            };
            vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
                if (tagName === 'canvas') return mockCanvas as any;
                return document.createElement(tagName);
            });

            const result = await compressImage(file, 1024);

            expect(result).toBe('mockbase64data'); // Expects the base64 content without the prefix
            expect(mockCanvas.width).toBe(1024); // Width should be scaled down
            expect(mockCanvas.height).toBe(512); // Height scaled proportionally
            expect(mockContext.drawImage).toHaveBeenCalled();
        } finally {
            global.Image = originalImage;
            vi.restoreAllMocks();
        }
    });

    it('should reject if file is not an image', async () => {
        const file = new File(['test'], 'test.txt', { type: 'text/plain' });
        await expect(compressImage(file)).rejects.toThrow('File must be an image');
    });
});

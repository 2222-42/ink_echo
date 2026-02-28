/**
 * Compresses an image file by resizing its maximum dimension.
 * @param file The image file to compress.
 * @param maxSize The maximum width or height of the compressed image.
 * @returns A promise that resolves to the compressed image as a base64 string.
 */
export const compressImage = (file: File, maxSize: number = 1024): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            return reject(new Error('File must be an image'));
        }

        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url); // Clean up the URL object

            let width = img.width;
            let height = img.height;

            // Calculate new dimensions while maintaining aspect ratio
            if (width > maxSize || height > maxSize) {
                if (width > height) {
                    height = Math.round((height * maxSize) / width);
                    width = maxSize;
                } else {
                    width = Math.round((width * maxSize) / height);
                    height = maxSize;
                }
            }

            // Create a canvas to draw the resized image
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get 2d context from canvas'));
            }

            // Draw image onto canvas
            ctx.drawImage(img, 0, 0, width, height);

            // Convert canvas to a base64 string (JPEG format with 0.8 quality)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

            // Resolve with only the base64 payload (strip the data prefix)
            const base64Content = dataUrl.split(',')[1] || dataUrl;
            resolve(base64Content);
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image for compression'));
        };

        img.src = url;
    });
};

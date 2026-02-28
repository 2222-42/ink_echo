import React, { useCallback, useState } from 'react';
import { UploadCloud, X } from 'lucide-react';

export interface UploadAreaProps {
    onImageSelect: (file: File | null) => void;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ onImageSelect }) => {
    const [dragActive, setDragActive] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const processFile = useCallback((file: File) => {
        if (file && file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            onImageSelect(file);
        }
    }, [onImageSelect]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    }, [processFile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    React.useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleClear = () => {
        setPreviewUrl(null);
        onImageSelect(null);
    };

    return (
        <div className="w-full max-w-md mx-auto">
            {previewUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-gray-200">
                    <img
                        src={previewUrl}
                        alt="Upload preview"
                        className="w-full max-h-64 object-contain bg-gray-50"
                        data-testid="image-preview"
                    />
                    <button
                        onClick={handleClear}
                        className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md text-gray-500 hover:text-red-500 hover:bg-gray-100 transition-colors"
                        aria-label="Clear image"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            ) : (
                <div
                    className={`
            relative p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-colors cursor-pointer
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 bg-gray-50'}
          `}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        data-testid="upload-input"
                        aria-label="Upload image"
                    />
                    <UploadCloud className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 font-medium">
                        Drag & drop an image or click to upload
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                        Supports JPG, PNG, WEBP
                    </p>
                </div>
            )}
        </div>
    );
};

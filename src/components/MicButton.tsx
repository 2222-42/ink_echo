import React from 'react';
import { Mic, Square } from 'lucide-react';

export interface MicButtonProps {
    isRecording: boolean;
    disabled: boolean;
    onClick: () => void;
}

export const MicButton: React.FC<MicButtonProps> = ({
    isRecording,
    disabled,
    onClick,
}) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
        relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300
        ${disabled
                    ? 'bg-gray-300 cursor-not-allowed opacity-50'
                    : isRecording
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse text-white shadow-lg shadow-red-500/50'
                        : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/50 hover:scale-105'
                }
      `}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
            {isRecording ? (
                <Square
                    data-testid="square-icon"
                    className="w-10 h-10 fill-current"
                />
            ) : (
                <Mic
                    data-testid="mic-icon"
                    className="w-10 h-10"
                />
            )}
        </button>
    );
};

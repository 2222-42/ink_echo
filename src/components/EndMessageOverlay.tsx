import React from 'react';
import { RefreshCw } from 'lucide-react';

export interface EndMessageOverlayProps {
    isVisible: boolean;
    message: string;
    onRestart: () => void;
}

export const EndMessageOverlay: React.FC<EndMessageOverlayProps> = ({
    isVisible,
    message,
    onRestart,
}) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center transform animate-in zoom-in-95 duration-300">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Session Ended
                </h2>
                <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                    {message}
                </p>

                <button
                    onClick={onRestart}
                    className="flex items-center justify-center space-x-2 w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-600/30"
                    aria-label="Restart session"
                >
                    <RefreshCw className="w-5 h-5" />
                    <span>Restart</span>
                </button>
            </div>
        </div>
    );
};

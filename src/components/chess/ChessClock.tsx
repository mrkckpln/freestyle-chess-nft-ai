import React from 'react';

interface ChessClockProps {
  whiteTime: number;
  blackTime: number;
  currentPlayer: 'w' | 'b';
  isRunning: boolean;
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const ChessClock: React.FC<ChessClockProps> = ({
  whiteTime,
  blackTime,
  currentPlayer,
  isRunning
}) => {
  return (
    <div className="flex justify-between items-center w-full gap-4 mb-4">
      {/* Black Clock - Left Side */}
      <button
        className={`flex-1 relative overflow-hidden rounded-xl transition-all duration-300 transform cursor-pointer ${
          currentPlayer === 'b' && isRunning
            ? 'scale-105 shadow-lg'
            : 'scale-100 shadow-md'
        }`}
      >
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            currentPlayer === 'b' && isRunning
              ? 'opacity-100'
              : 'opacity-0'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-800"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-700 animate-pulse"></div>
        </div>

        <div
          className={`relative p-4 ${
            currentPlayer === 'b' && isRunning
              ? 'text-white'
              : 'bg-white text-gray-800'
          }`}
        >
          <div className="text-center">
            <div className="text-sm font-semibold mb-1 flex items-center justify-center gap-2">
              <span>Black</span>
              {currentPlayer === 'b' && isRunning && (
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              )}
            </div>
            <div 
              className={`text-3xl font-mono font-bold transition-colors duration-300 ${
                blackTime <= 30 
                  ? 'text-red-500 animate-pulse' 
                  : blackTime <= 60 
                    ? 'text-yellow-500'
                    : ''
              }`}
            >
              {formatTime(blackTime)}
            </div>
          </div>
        </div>
      </button>

      {/* White Clock - Right Side */}
      <button
        className={`flex-1 relative overflow-hidden rounded-xl transition-all duration-300 transform cursor-pointer ${
          currentPlayer === 'w' && isRunning
            ? 'scale-105 shadow-lg'
            : 'scale-100 shadow-md'
        }`}
      >
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            currentPlayer === 'w' && isRunning
              ? 'opacity-100'
              : 'opacity-0'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 animate-pulse"></div>
        </div>

        <div
          className={`relative p-4 ${
            currentPlayer === 'w' && isRunning
              ? 'text-white'
              : 'bg-white text-gray-800'
          }`}
        >
          <div className="text-center">
            <div className="text-sm font-semibold mb-1 flex items-center justify-center gap-2">
              <span>White</span>
              {currentPlayer === 'w' && isRunning && (
                <div className="w-2 h-2 rounded-full bg-blue-300 animate-pulse"></div>
              )}
            </div>
            <div 
              className={`text-3xl font-mono font-bold transition-colors duration-300 ${
                whiteTime <= 30 
                  ? 'text-red-500 animate-pulse' 
                  : whiteTime <= 60 
                    ? 'text-yellow-500'
                    : ''
              }`}
            >
              {formatTime(whiteTime)}
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}; 
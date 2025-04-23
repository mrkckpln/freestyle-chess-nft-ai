import React from 'react';

interface TimeControl {
  initial: number;
  increment: number;
}

interface GameSettingsProps {
  timeControl: TimeControl;
  onTimeControlChange: (newTimeControl: TimeControl) => void;
  disabled?: boolean;
}

const PRESET_TIME_CONTROLS = [
  { 
    name: 'Bullet',
    initial: 60,
    increment: 0,
    icon: '⚡'
  },
  { 
    name: 'Blitz',
    initial: 180,
    increment: 2,
    icon: '🔥'
  },
  { 
    name: 'Rapid',
    initial: 600,
    increment: 5,
    icon: '⚔️'
  },
  { 
    name: 'Classical',
    initial: 1800,
    increment: 10,
    icon: '👑'
  },
];

export const GameSettings: React.FC<GameSettingsProps> = ({
  timeControl,
  onTimeControlChange,
  disabled = false
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
        <h3 className="text-lg font-semibold text-white">
          Game Settings
        </h3>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Preset Time Controls */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Time Controls</h4>
          <div className="grid grid-cols-2 gap-3">
            {PRESET_TIME_CONTROLS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => onTimeControlChange(preset)}
                disabled={disabled}
                className={`relative group p-4 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  timeControl.initial === preset.initial &&
                  timeControl.increment === preset.increment
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-50 text-gray-800 hover:bg-gray-100'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-2xl mb-1">{preset.icon}</div>
                <div className="text-sm font-medium">{preset.name}</div>
                <div className="text-xs opacity-75">
                  {Math.floor(preset.initial / 60)}m + {preset.increment}s
                </div>
                {timeControl.initial === preset.initial &&
                  timeControl.increment === preset.increment && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Time Control */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Custom Time Control</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Initial Time (minutes)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={Math.floor(timeControl.initial / 60)}
                  onChange={(e) =>
                    onTimeControlChange({
                      ...timeControl,
                      initial: parseInt(e.target.value) * 60
                    })
                  }
                  disabled={disabled}
                  className="w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-100"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  min
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Increment (seconds)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={timeControl.increment}
                  onChange={(e) =>
                    onTimeControlChange({
                      ...timeControl,
                      increment: parseInt(e.target.value)
                    })
                  }
                  disabled={disabled}
                  className="w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-100"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  sec
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Time Control Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Current Time Control</h4>
          <div className="text-2xl font-mono text-blue-600">
            {Math.floor(timeControl.initial / 60)}:00 + {timeControl.increment}
          </div>
        </div>
      </div>
    </div>
  );
}; 
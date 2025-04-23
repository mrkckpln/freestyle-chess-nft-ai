import React, { useState } from 'react';
import { ChessBoard } from '../components/chess/ChessBoard';
import { GameSettings } from '../components/chess/GameSettings';

interface TimeControl {
  initial: number;
  increment: number;
}

const Home: React.FC = () => {
  const [timeControl, setTimeControl] = useState<TimeControl>({
    initial: 600, // 10 minutes
    increment: 5, // 5 seconds
  });
  const [gameStarted, setGameStarted] = useState(false);

  const handlePositionGenerated = (fen: string) => {
    console.log('New position generated:', fen);
    setGameStarted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-8" style={{ maxWidth: '1400px' }}>
        <h1 className="text-4xl font-bold text-center mb-4 text-gray-800">
          Freestyle Chess NFT Platform
        </h1>
        <p className="text-center text-gray-600 mb-8 max-w-3xl mx-auto">
          Play chess with randomized but balanced starting positions, earn NFTs, and compete with time controls.
          Each game is unique and can be minted as an NFT on the Solana blockchain.
        </p>

        <div className="flex gap-8 mb-12">
          {/* Game Settings Panel */}
          <div className="w-1/4">
            <GameSettings
              timeControl={timeControl}
              onTimeControlChange={setTimeControl}
              disabled={gameStarted}
            />
            
            <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">How to Play</h3>
              <ol className="space-y-2 text-sm text-gray-600">
                <li> Choose your preferred time control</li>
                <li> Click "Generate New Position" to start</li>
                <li> Connect your Phantom wallet</li>
                <li> Play your moves before time runs out</li>
                <li> Mint your game as an NFT after completion</li>
              </ol>
            </div>
          </div>

          {/* Chess Board and Clock Container */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-xl p-8">
              <ChessBoard 
                onPositionGenerated={handlePositionGenerated}
                timeControl={timeControl}
              />
              <div className="mt-8 text-center text-gray-600">
                <p className="mb-2">Each position is analyzed by our AI to ensure fairness.</p>
                <p className="text-sm">Current evaluation will be shown after position generation.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3 text-blue-600">Freestyle Chess</h3>
            <p className="text-gray-600">
              Experience unique chess games with balanced but randomized starting positions.
              Every game is different!
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3 text-blue-600">NFT Rewards</h3>
            <p className="text-gray-600">
              Turn your best games into NFTs on the Solana blockchain.
              Collect and trade your chess achievements.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3 text-blue-600">Time Controls</h3>
            <p className="text-gray-600">
              Choose from various time controls or create your own.
              Test your skills under pressure!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 
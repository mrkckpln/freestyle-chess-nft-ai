import React from 'react';
import { ChessBoard } from '../components/chess/ChessBoard';

const Home: React.FC = () => {
  const handlePositionGenerated = (fen: string) => {
    console.log('New position generated:', fen);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">
          Freestyle Chess NFT Platform
        </h1>
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <ChessBoard onPositionGenerated={handlePositionGenerated} />
          <div className="mt-8 text-center text-gray-600">
            <p>Generate a random, balanced starting position to begin playing.</p>
            <p>Each position is analyzed by our AI to ensure fairness.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 
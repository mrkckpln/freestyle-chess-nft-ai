import React, { useEffect, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { PositionAnalyzer } from '../../utils/analysis/positionAnalyzer';
import { SolanaWeb3Service } from '../../utils/web3/solanaWeb3Service';

interface ChessBoardProps {
  onPositionGenerated?: (fen: string) => void;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({ onPositionGenerated }) => {
  const [game, setGame] = useState(new Chess());
  const [analyzer] = useState(new PositionAnalyzer());
  const [web3Service] = useState(new SolanaWeb3Service());
  const [isGenerating, setIsGenerating] = useState(false);
  const [evaluation, setEvaluation] = useState<number | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [gameHistory, setGameHistory] = useState<string[]>([]);
  const [isMinting, setIsMinting] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      analyzer.destroy();
    };
  }, [analyzer]);

  const connectWallet = async () => {
    try {
      const address = await web3Service.connectWallet();
      setWalletAddress(address);
      const balance = await web3Service.getBalance();
      setBalance(balance);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const generateNewPosition = async () => {
    setIsGenerating(true);
    let isBalanced = false;
    let fen = '';
    let attempts = 0;

    while (!isBalanced && attempts < 10) {
      fen = analyzer.generateRandomPosition();
      isBalanced = await analyzer.isBalancedPosition(fen);
      attempts++;
    }

    if (isBalanced) {
      const newGame = new Chess();
      newGame.load(fen);
      setGame(newGame);
      const evaluation = await analyzer.analyzePosition(fen);
      setEvaluation(evaluation);
      setGameHistory([fen]);
      onPositionGenerated?.(fen);
    } else {
      console.error('Could not generate a balanced position after 10 attempts');
    }
    setIsGenerating(false);
  };

  const onPieceDrop = (sourceSquare: string, targetSquare: string) => {
    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });

      if (move === null) return false;
      
      const newGame = new Chess(game.fen());
      setGame(newGame);
      setGameHistory(prev => [...prev, newGame.fen()]);
      
      return true;
    } catch (e) {
      return false;
    }
  };

  const mintGameNFT = async () => {
    if (!walletAddress || gameHistory.length < 2) return;

    setIsMinting(true);
    try {
      const gameData = JSON.stringify({
        moves: gameHistory,
        finalEvaluation: evaluation
      });

      const tokenId = await web3Service.mintGameNFT(
        gameData,
        evaluation || 0
      );

      alert(`NFT minted successfully! Token ID: ${tokenId}`);
      
      // Update balance after minting
      const newBalance = await web3Service.getBalance();
      setBalance(newBalance);
    } catch (error) {
      console.error('Error minting NFT:', error);
      alert('Error minting NFT. Check console for details.');
    }
    setIsMinting(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-[480px] h-[480px]">
        <Chessboard 
          position={game.fen()} 
          onPieceDrop={onPieceDrop}
          boardWidth={480}
        />
      </div>
      <div className="flex gap-4 items-center">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          onClick={generateNewPosition}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate New Position'}
        </button>
        {evaluation !== null && (
          <div className="text-lg">
            Evaluation: {evaluation.toFixed(2)}
          </div>
        )}
      </div>
      <div className="flex gap-4 items-center mt-4">
        {!walletAddress ? (
          <button
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={connectWallet}
          >
            Connect Phantom Wallet
          </button>
        ) : (
          <>
            <div className="text-sm text-gray-600">
              Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              {balance !== null && ` (${balance.toFixed(4)} SOL)`}
            </div>
            <button
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
              onClick={mintGameNFT}
              disabled={isMinting || gameHistory.length < 2}
            >
              {isMinting ? 'Minting...' : 'Mint Game NFT'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}; 
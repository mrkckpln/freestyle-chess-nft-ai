import React, { useEffect, useState, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { PositionAnalyzer } from '../../utils/analysis/positionAnalyzer';
import { SolanaWeb3Service } from '../../utils/web3/solanaWeb3Service';
import { Web3Service } from '../../utils/web3/web3Service';
import { ChessClock } from './ChessClock';
import { AIAnalyzer } from './AIAnalyzer';

interface TimeControl {
  initial: number; // Initial time in seconds
  increment: number; // Increment per move in seconds
}

interface ChessBoardProps {
  onPositionGenerated?: (fen: string) => void;
  timeControl?: TimeControl;
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const ChessBoard: React.FC<ChessBoardProps> = ({ 
  onPositionGenerated,
  timeControl = { initial: 600, increment: 5 } // Default: 10 minutes + 5 seconds increment
}) => {
  const [game, setGame] = useState(new Chess());
  const [analyzer] = useState(new PositionAnalyzer());
  const [web3Service] = useState(
    process.env.NEXT_PUBLIC_NETWORK === 'ethereum' 
      ? new Web3Service() 
      : new SolanaWeb3Service()
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [evaluation, setEvaluation] = useState<number | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [gameHistory, setGameHistory] = useState<string[]>([]);
  const [isMinting, setIsMinting] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<'w' | 'b'>('w');
  const [whiteTime, setWhiteTime] = useState(timeControl.initial);
  const [blackTime, setBlackTime] = useState(timeControl.initial);
  const [isClockRunning, setIsClockRunning] = useState(false);
  const [lastMoveTime, setLastMoveTime] = useState<number | null>(null);
  const [showMintSuccess, setShowMintSuccess] = useState(false);
  const [mintedTokenId, setMintedTokenId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    return () => {
      analyzer.destroy();
    };
  }, [analyzer]);

  // Handle clock updates
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isClockRunning && !gameEnded) {
      timer = setInterval(() => {
        if (currentPlayer === 'w') {
          setWhiteTime(prev => {
            if (prev <= 0) {
              setGameEnded(true);
              setIsClockRunning(false);
              alert('Black wins on time!');
              return 0;
            }
            return prev - 1;
          });
        } else {
          setBlackTime(prev => {
            if (prev <= 0) {
              setGameEnded(true);
              setIsClockRunning(false);
              alert('White wins on time!');
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isClockRunning, currentPlayer, gameEnded]);

  useEffect(() => {
    // Reset clock times when time control changes
    setWhiteTime(timeControl.initial);
    setBlackTime(timeControl.initial);
  }, [timeControl]);

  const connectWallet = async () => {
    try {
      const address = await web3Service.connectWallet();
      setWalletAddress(address);
      const balance = await web3Service.getBalance();
      setBalance(balance);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Error connecting wallet. Please make sure you have the correct wallet installed (MetaMask for Ethereum or Phantom for Solana).');
    }
  };

  const generateNewPosition = async () => {
    setIsGenerating(true);
    setGameEnded(false);
    setIsClockRunning(false);
    setWhiteTime(timeControl.initial);
    setBlackTime(timeControl.initial);
    setCurrentPlayer('w');
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

      // Start analysis after move
      setIsAnalyzing(true);

      // Start clock if it's the first move
      if (!isClockRunning && gameHistory.length === 1) {
        setIsClockRunning(true);
      }

      // Handle time increment and player switch
      if (currentPlayer === 'w') {
        setWhiteTime(prev => prev + timeControl.increment);
      } else {
        setBlackTime(prev => prev + timeControl.increment);
      }
      setCurrentPlayer(currentPlayer === 'w' ? 'b' : 'w');
      setLastMoveTime(Date.now());
      
      // Check game state
      if (newGame.isGameOver()) {
        setGameEnded(true);
        setIsClockRunning(false);
        setIsAnalyzing(false);
        if (newGame.isCheckmate()) {
          alert(`Checkmate! ${currentPlayer === 'w' ? 'White' : 'Black'} wins! You can now mint this game as an NFT.`);
        } else if (newGame.isDraw()) {
          alert('Game ended in a draw!');
        } else if (newGame.isStalemate()) {
          alert('Game ended in stalemate!');
        }
      }
      
      return true;
    } catch (e) {
      return false;
    }
  };

  const mintGameNFT = async () => {
    if (!walletAddress || gameHistory.length < 2) {
      alert('Please connect your wallet and make some moves before minting.');
      return;
    }

    setIsMinting(true);
    try {
      const gameData = JSON.stringify({
        moves: gameHistory,
        finalEvaluation: evaluation,
        isCheckmate: game.isCheckmate(),
        isDraw: game.isDraw(),
        isStalemate: game.isStalemate()
      });

      let tokenId;
      if (process.env.NEXT_PUBLIC_NETWORK === 'ethereum') {
        tokenId = await (web3Service as Web3Service).mintGameNFT(
          walletAddress,
          '0x0000000000000000000000000000000000000000',
          gameData,
          evaluation || 0
        );
      } else {
        tokenId = await (web3Service as SolanaWeb3Service).mintGameNFT(
          gameData,
          evaluation || 0
        );
      }

      // Update balance after minting
      const newBalance = await web3Service.getBalance();
      setBalance(newBalance);

      // Show success alert with token ID
      alert(`NFT başarıyla mint edildi!\n\nToken ID: ${tokenId}\n\nOyununuz artık blockchain üzerinde güvende!`);
    } catch (error) {
      console.error('Error minting NFT:', error);
      alert('NFT mint edilirken bir hata oluştu. Lütfen yeterli bakiyeniz olduğundan emin olun ve tekrar deneyin.');
    }
    setIsMinting(false);
  };

  const requestAirdrop = async () => {
    if (!walletAddress) return;

    try {
      if (process.env.NEXT_PUBLIC_NETWORK === 'solana') {
        const result = await (web3Service as SolanaWeb3Service).requestAirdrop();
        alert(`Airdrop successful! Please wait a few seconds for the balance to update.`);
        // Update balance after airdrop
        const newBalance = await web3Service.getBalance();
        setBalance(newBalance);
      }
    } catch (error) {
      console.error('Error requesting airdrop:', error);
      alert('Error requesting airdrop. Please try again in a few minutes.');
    }
  };

  return (
    <div className="flex flex-col">
      {/* Game Info Bar */}
      <div className="w-full max-w-[600px] flex justify-between items-center bg-white/50 backdrop-blur-sm p-4 rounded-xl shadow-lg mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700">Live Game</span>
        </div>
        {evaluation !== null && (
          <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg shadow">
            <span className="text-sm font-medium text-gray-700">Evaluation:</span>
            <span className={`text-sm font-bold ${evaluation > 0 ? 'text-blue-600' : evaluation < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {evaluation > 0 ? '+' : ''}{evaluation.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Main Game Container */}
      <div className="flex items-start gap-4">
        {/* Chess Board */}
        <div className="relative">
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur opacity-20 transition-opacity duration-300"></div>
          <div className="relative w-[600px] h-[600px] bg-white rounded-lg shadow-xl p-3">
            <Chessboard 
              position={game.fen()} 
              onPieceDrop={onPieceDrop}
              boardWidth={574}
              customBoardStyle={{
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
              customDarkSquareStyle={{ backgroundColor: '#769656' }}
              customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
            />
          </div>
        </div>

        {/* Right Side Panel */}
        <div className="flex flex-col gap-4 w-[300px]">
          {/* Clocks */}
          <div className="flex flex-col justify-between h-[600px]">
            {/* Black Clock */}
            <button
              className={`w-full relative overflow-hidden rounded-xl transition-all duration-300 transform cursor-pointer h-[290px] ${
                currentPlayer === 'b' && isClockRunning
                  ? 'scale-105 shadow-lg'
                  : 'scale-100 shadow-md'
              }`}
            >
              <div
                className={`absolute inset-0 transition-opacity duration-300 ${
                  currentPlayer === 'b' && isClockRunning
                    ? 'opacity-100'
                    : 'opacity-0'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-800"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-700 animate-pulse"></div>
              </div>

              <div
                className={`relative p-4 h-full flex flex-col justify-center ${
                  currentPlayer === 'b' && isClockRunning
                    ? 'text-white'
                    : 'bg-white text-gray-800'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl font-semibold mb-4 flex items-center justify-center gap-2">
                    <span>Black</span>
                    {currentPlayer === 'b' && isClockRunning && (
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    )}
                  </div>
                  <div 
                    className={`text-5xl font-mono font-bold transition-colors duration-300 ${
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

            {/* White Clock */}
            <button
              className={`w-full relative overflow-hidden rounded-xl transition-all duration-300 transform cursor-pointer h-[290px] ${
                currentPlayer === 'w' && isClockRunning
                  ? 'scale-105 shadow-lg'
                  : 'scale-100 shadow-md'
              }`}
            >
              <div
                className={`absolute inset-0 transition-opacity duration-300 ${
                  currentPlayer === 'w' && isClockRunning
                    ? 'opacity-100'
                    : 'opacity-0'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 animate-pulse"></div>
              </div>

              <div
                className={`relative p-4 h-full flex flex-col justify-center ${
                  currentPlayer === 'w' && isClockRunning
                    ? 'text-white'
                    : 'bg-white text-gray-800'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl font-semibold mb-4 flex items-center justify-center gap-2">
                    <span>White</span>
                    {currentPlayer === 'w' && isClockRunning && (
                      <div className="w-2 h-2 rounded-full bg-blue-300 animate-pulse"></div>
                    )}
                  </div>
                  <div 
                    className={`text-5xl font-mono font-bold transition-colors duration-300 ${
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

          {/* AI Analysis */}
          <AIAnalyzer
            fen={game.fen()}
            isAnalyzing={isAnalyzing}
            currentPlayer={currentPlayer}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex gap-4">
        <button
          className={`px-6 py-3 rounded-lg font-medium text-white shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isGenerating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
          }`}
          onClick={generateNewPosition}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin"></div>
              <span>Generating...</span>
            </div>
          ) : (
            'Generate New Position'
          )}
        </button>

        {/* Wallet Connect Button */}
        <button
          className={`px-6 py-3 rounded-lg font-medium text-white shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
            walletAddress
              ? 'bg-green-500'
              : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
          }`}
          onClick={connectWallet}
        >
          {walletAddress ? (
            <div className="flex items-center gap-2">
              <span>Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
              {balance !== null && (
                <span className="px-2 py-1 bg-green-600 rounded-md text-sm">
                  {balance.toFixed(2)} SOL
                </span>
              )}
            </div>
          ) : (
            'Connect Wallet'
          )}
        </button>

        {/* Mint NFT Button */}
        {gameEnded && walletAddress && (
          <button
            className={`px-6 py-3 rounded-lg font-medium text-white shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 ${
              isMinting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
            }`}
            onClick={mintGameNFT}
            disabled={isMinting}
          >
            {isMinting ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin"></div>
                <span>Minting...</span>
              </div>
            ) : (
              'Mint as NFT'
            )}
          </button>
        )}

        {/* Airdrop Button (Only for Solana testnet) */}
        {process.env.NEXT_PUBLIC_NETWORK === 'solana' && walletAddress && (
          <button
            className="px-6 py-3 rounded-lg font-medium text-white shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700"
            onClick={requestAirdrop}
          >
            Request Airdrop
          </button>
        )}
      </div>
    </div>
  );
}; 
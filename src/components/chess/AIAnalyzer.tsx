import React, { useEffect, useState } from 'react';
import { PositionAnalyzer } from '../../utils/analysis/positionAnalyzer';

interface AIAnalyzerProps {
  fen: string;
  isAnalyzing: boolean;
  currentPlayer: 'w' | 'b';
}

interface AnalysisResult {
  evaluation: number;
  bestMove: string;
  topMoves: Array<{
    move: string;
    evaluation: number;
    continuation: string;
  }>;
  depth: number;
}

export const AIAnalyzer: React.FC<AIAnalyzerProps> = ({
  fen,
  isAnalyzing,
  currentPlayer
}) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzer] = useState(new PositionAnalyzer());
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    return () => {
      analyzer.destroy();
    };
  }, [analyzer]);

  useEffect(() => {
    if (!isAnalyzing || !fen) return;

    const analyzePosition = async () => {
      setIsThinking(true);
      try {
        const result = await analyzer.analyzePositionWithMoves(fen);
        setAnalysis(result);
      } catch (error) {
        console.error('Analysis error:', error);
      }
      setIsThinking(false);
    };

    analyzePosition();
  }, [fen, isAnalyzing, analyzer]);

  if (!isAnalyzing || !analysis) return null;

  const getEvaluationColor = (eval_: number) => {
    if (eval_ > 3) return 'text-blue-600';
    if (eval_ > 1.5) return 'text-blue-500';
    if (eval_ > 0.5) return 'text-blue-400';
    if (eval_ > -0.5) return 'text-gray-600';
    if (eval_ > -1.5) return 'text-red-400';
    if (eval_ > -3) return 'text-red-500';
    return 'text-red-600';
  };

  const formatEvaluation = (eval_: number): string => {
    if (eval_ > 100) return 'Mate in ' + Math.ceil((eval_ - 100) / 2);
    if (eval_ < -100) return 'Mate in ' + Math.ceil((-eval_ - 100) / 2);
    return eval_.toFixed(1);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">AI Analysis</h3>
        {isThinking && (
          <div className="flex items-center">
            <div className="w-4 h-4 border-t-2 border-blue-500 rounded-full animate-spin mr-2"></div>
            <span className="text-sm text-gray-600">Analyzing...</span>
          </div>
        )}
      </div>

      {analysis && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Position Evaluation:</span>
            <span className={`font-mono font-bold ${getEvaluationColor(analysis.evaluation)}`}>
              {formatEvaluation(analysis.evaluation)}
            </span>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Best Moves:</h4>
            <div className="space-y-2">
              {analysis.topMoves.map((move, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <span className="w-6 text-sm text-gray-500">{index + 1}.</span>
                    <span className="font-mono">{move.move}</span>
                    <span className="ml-2 text-sm text-gray-500">{move.continuation}</span>
                  </div>
                  <span className={`font-mono ${getEvaluationColor(move.evaluation)}`}>
                    {formatEvaluation(move.evaluation)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-gray-500 mt-2">
            Analysis depth: {analysis.depth} moves
          </div>
        </div>
      )}
    </div>
  );
}; 
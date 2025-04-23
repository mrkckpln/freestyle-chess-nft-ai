import { Chess } from 'chess.js';

export class PositionAnalyzer {
  private worker: Worker | null = null;
  private isReady: boolean = false;
  private currentResolve: ((value: any) => void) | null = null;
  private lastAnalysis: {
    evaluation: number;
    bestMove: string;
    topMoves: Array<{
      move: string;
      evaluation: number;
      continuation: string;
    }>;
    depth: number;
  } | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initWorker();
    }
  }

  private async initWorker(): Promise<void> {
    try {
      // Create a new worker
      this.worker = new Worker('/stockfish.js');
      
      // Set up message handler
      this.worker.onmessage = (e) => {
        const msg = e.data;
        if (msg === 'uciok') {
          this.worker?.postMessage('isready');
        } else if (msg === 'readyok') {
          this.isReady = true;
          console.log('Stockfish engine is ready');
        } else if (msg.startsWith('info depth')) {
          this.handleAnalysisInfo(msg);
        } else if (msg.startsWith('bestmove')) {
          const bestMove = msg.split(' ')[1];
          if (this.lastAnalysis && this.currentResolve) {
            this.lastAnalysis.bestMove = bestMove;
            this.currentResolve(this.lastAnalysis);
            this.lastAnalysis = null;
          }
        }
      };

      // Set up error handler
      this.worker.onerror = (error) => {
        console.error('Stockfish worker error:', error);
        this.isReady = false;
        this.worker = null;
      };

      // Initialize UCI mode
      this.worker.postMessage('uci');
      this.worker.postMessage('setoption name MultiPV value 3');

      // Wait for engine to be ready
      await new Promise<void>((resolve) => {
        const checkReady = setInterval(() => {
          if (this.isReady) {
            clearInterval(checkReady);
            resolve();
          }
        }, 100);
      });
    } catch (error) {
      console.error('Error initializing Stockfish worker:', error);
      this.isReady = false;
      this.worker = null;
    }
  }

  private handleAnalysisInfo(msg: string): void {
    const depthMatch = msg.match(/depth (\d+)/);
    const scoreMatch = msg.match(/score cp (-?\d+)/);
    const mateMatch = msg.match(/score mate (-?\d+)/);
    const pvMatch = msg.match(/pv (.+?)(?=\s+(?:bmc|hashfull|nps|tbhits|time|nodes|score|depth|seldepth|multipv|$))/);
    const multipvMatch = msg.match(/multipv (\d+)/);

    if (!depthMatch?.[1] || (!scoreMatch?.[1] && !mateMatch?.[1]) || !pvMatch?.[1] || !multipvMatch?.[1]) {
      return;
    }

    const depth = depthMatch[1];
    const score = scoreMatch?.[1];
    const mate = mateMatch?.[1];
    const pv = pvMatch[1];
    const multipv = multipvMatch[1];

    const evaluation = mate ? 
      (parseInt(mate) > 0 ? 100 + parseInt(mate) : -100 - Math.abs(parseInt(mate))) : 
      parseInt(score || '0') / 100;
    
    if (!this.lastAnalysis) {
      this.lastAnalysis = {
        evaluation: 0,
        bestMove: '',
        topMoves: [],
        depth: parseInt(depth)
      };
    }

    const moveInfo = {
      move: pv.split(' ')[0],
      evaluation: evaluation,
      continuation: pv.split(' ').slice(1, 4).join(' ')
    };

    const pvNum = parseInt(multipv) - 1;
    if (pvNum === 0) {
      this.lastAnalysis.evaluation = evaluation;
    }

    if (this.lastAnalysis.topMoves.length <= pvNum) {
      this.lastAnalysis.topMoves.push(moveInfo);
    } else {
      this.lastAnalysis.topMoves[pvNum] = moveInfo;
    }

    this.lastAnalysis.depth = parseInt(depth);
  }

  public async analyzePositionWithMoves(fen: string): Promise<{
    evaluation: number;
    bestMove: string;
    topMoves: Array<{
      move: string;
      evaluation: number;
      continuation: string;
    }>;
    depth: number;
  }> {
    if (!this.worker || !this.isReady) {
      await this.initWorker();
      if (!this.worker || !this.isReady) {
        throw new Error('Stockfish worker not initialized');
      }
    }

    return new Promise((resolve) => {
      this.currentResolve = resolve;
      this.lastAnalysis = null;
      this.worker?.postMessage('position fen ' + fen);
      this.worker?.postMessage('go depth 20 multipv 3');
    });
  }

  public async analyzePosition(fen: string): Promise<number> {
    if (!this.worker || !this.isReady) {
      await this.initWorker();
      if (!this.worker || !this.isReady) {
        throw new Error('Stockfish worker not initialized');
      }
    }

    return new Promise((resolve) => {
      this.currentResolve = resolve;
      this.worker?.postMessage('position fen ' + fen);
      this.worker?.postMessage('go depth 20');
    });
  }

  public async isBalancedPosition(fen: string): Promise<boolean> {
    const evaluation = await this.analyzePosition(fen);
    // Consider positions between -0.3 and 0.3 as balanced
    return Math.abs(evaluation) <= 0.3;
  }

  private isBishopsOnDifferentColors(whitePositions: Map<string, string>, blackPositions: Map<string, string>): boolean {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    let whiteBishopSquares: string[] = [];
    let blackBishopSquares: string[] = [];

    // Find bishop positions
    whitePositions.forEach((piece, square) => {
      if (piece === 'b') {
        whiteBishopSquares.push(square);
      }
    });

    blackPositions.forEach((piece, square) => {
      if (piece === 'b') {
        blackBishopSquares.push(square);
      }
    });

    // Check if bishops are on different colored squares
    const isSquareWhite = (square: string): boolean => {
      const file = files.indexOf(square[0]);
      const rank = parseInt(square[1]) - 1;
      return (file + rank) % 2 === 0;
    };

    // For white bishops
    if (whiteBishopSquares.length === 2) {
      if (isSquareWhite(whiteBishopSquares[0]) === isSquareWhite(whiteBishopSquares[1])) {
        return false;
      }
    }

    // For black bishops
    if (blackBishopSquares.length === 2) {
      if (isSquareWhite(blackBishopSquares[0]) === isSquareWhite(blackBishopSquares[1])) {
        return false;
      }
    }

    return true;
  }

  private generateSymmetricPosition(): { whitePositions: Map<string, string>, blackPositions: Map<string, string> } {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    let whitePositions: Map<string, string>;
    let blackPositions: Map<string, string>;
    
    do {
      whitePositions = new Map<string, string>();
      blackPositions = new Map<string, string>();
      
      // Tüm taşları bir diziye koy
      const pieces = ['k', 'q', 'r', 'r', 'b', 'b', 'n', 'n'];
      
      // Taşları karıştır
      for (let i = pieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
      }
      
      // Karıştırılmış taşları simetrik olarak yerleştir
      for (let i = 0; i < 8; i++) {
        whitePositions.set(`${files[i]}1`, pieces[i]);
        blackPositions.set(`${files[i]}8`, pieces[i]);
      }

      // Piyonları yerleştir
      for (let i = 0; i < 8; i++) {
        whitePositions.set(`${files[i]}2`, 'p');
        blackPositions.set(`${files[i]}7`, 'p');
      }
    } while (!this.isBishopsOnDifferentColors(whitePositions, blackPositions));

    return { whitePositions, blackPositions };
  }

  public generateRandomPosition(): string {
    const chess = new Chess();
    chess.clear();

    const { whitePositions, blackPositions } = this.generateSymmetricPosition();

    // Beyaz taşları yerleştir
    whitePositions.forEach((piece, square) => {
      chess.put({ type: piece as any, color: 'w' }, square as any);
    });

    // Siyah taşları yerleştir
    blackPositions.forEach((piece, square) => {
      chess.put({ type: piece as any, color: 'b' }, square as any);
    });

    return chess.fen();
  }

  public destroy(): void {
    this.worker?.terminate();
    this.worker = null;
  }
} 
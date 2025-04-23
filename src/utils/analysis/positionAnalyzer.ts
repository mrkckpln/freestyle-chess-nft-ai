import { Chess } from 'chess.js';

export class PositionAnalyzer {
  private worker: Worker | null = null;
  private isReady: boolean = false;
  private currentResolve: ((value: number) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.worker = new Worker('/stockfish.js');
      this.initEngine();
    }
  }

  private initEngine(): void {
    if (!this.worker) return;

    this.worker.onmessage = (e) => {
      const msg = e.data;
      if (msg === 'uciok') {
        this.worker?.postMessage('isready');
      } else if (msg === 'readyok') {
        this.isReady = true;
      } else if (msg.startsWith('info depth') && msg.includes('score cp')) {
        const score = msg.match(/score cp (-?\d+)/);
        if (score && this.currentResolve) {
          this.currentResolve(parseInt(score[1]) / 100);
        }
      }
    };
    this.worker.postMessage('uci');
  }

  public async analyzePosition(fen: string): Promise<number> {
    if (!this.worker) return 0;

    return new Promise((resolve) => {
      if (!this.isReady) {
        setTimeout(() => this.analyzePosition(fen).then(resolve), 100);
        return;
      }

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
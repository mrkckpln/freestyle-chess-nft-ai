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

  public generateRandomPosition(): string {
    const chess = new Chess();
    // Clear the board
    chess.clear();
    
    // Place kings first (on the back rank)
    const whiteKingFile = Math.floor(Math.random() * 8);
    const blackKingFile = Math.floor(Math.random() * 8);
    chess.put({ type: 'k', color: 'b' }, `${String.fromCharCode(97 + blackKingFile)}8` as any);
    chess.put({ type: 'k', color: 'w' }, `${String.fromCharCode(97 + whiteKingFile)}1` as any);

    // Define piece types and their quantities
    const pieces = [
      { type: 'q', count: 1 },
      { type: 'r', count: 2 },
      { type: 'b', count: 2 },
      { type: 'n', count: 2 },
      { type: 'p', count: 8 }
    ];

    // Place pieces randomly for both colors
    for (const color of ['w', 'b']) {
      for (const piece of pieces) {
        for (let i = 0; i < piece.count; i++) {
          let placed = false;
          while (!placed) {
            const file = Math.floor(Math.random() * 8);
            let rank;
            
            if (piece.type === 'p') {
              // Place pawns on 2nd and 7th ranks only
              rank = color === 'w' ? 2 : 7;
            } else {
              // Place other pieces on back ranks
              rank = color === 'w' ? 1 : 8;
            }
            
            const square = `${String.fromCharCode(97 + file)}${rank}` as any;
            
            if (!chess.get(square)) {
              chess.put({ type: piece.type as any, color: color as any }, square);
              placed = true;
            }
          }
        }
      }
    }

    return chess.fen();
  }

  public destroy(): void {
    this.worker?.terminate();
    this.worker = null;
  }
} 
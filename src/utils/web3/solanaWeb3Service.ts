import { 
  Connection, 
  PublicKey, 
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { 
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo
} from '@solana/spl-token';

interface ChessGameMetadata {
  gameId: string;
  startPosition: string;
  moves: string[];
  finalPosition: string;
  evaluation: number;
  timestamp: string;
  playerAddress: string;
  difficulty: string;
  imageUrl: string;
}

export class SolanaWeb3Service {
  private connection: Connection;
  private wallet: any = null;

  constructor() {
    // Connect to Solana devnet
    this.connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  }

  private async generateNFTImage(metadata: ChessGameMetadata): Promise<string> {
    // Bu fonksiyon oyun verilerini kullanarak dinamik bir görsel oluşturur
    // Örnek olarak, son pozisyonu ve önemli hamleleri gösteren bir kolaj
    // TODO: Canvas veya SVG kullanarak görsel oluşturma implementasyonu
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <style>
          .title { font: bold 24px sans-serif; fill: #333; }
          .info { font: 16px sans-serif; fill: #666; }
          .board { stroke: #000; stroke-width: 2; }
          .evaluation { font: bold 20px monospace; fill: #007bff; }
        </style>
        
        <rect width="100%" height="100%" fill="#f8f9fa"/>
        
        <!-- Başlık -->
        <text x="50" y="50" class="title">Freestyle Chess NFT</text>
        
        <!-- Oyun Bilgileri -->
        <text x="50" y="100" class="info">Game ID: ${metadata.gameId}</text>
        <text x="50" y="130" class="info">Date: ${new Date(metadata.timestamp).toLocaleDateString()}</text>
        <text x="50" y="160" class="info">Player: ${metadata.playerAddress.slice(0, 8)}...</text>
        
        <!-- Değerlendirme -->
        <text x="50" y="200" class="evaluation">Evaluation: ${metadata.evaluation.toFixed(2)}</text>
        
        <!-- Satranç Tahtası Temsili -->
        <rect x="50" y="250" width="300" height="300" class="board" fill="#fff"/>
        
        <!-- Hamleler -->
        <text x="400" y="270" class="info">Key Moves:</text>
        ${metadata.moves.slice(-5).map((move, i) => 
          `<text x="400" y="${300 + i * 25}" class="info">${move}</text>`
        ).join('')}
      </svg>
    `)}`;
  }

  private generateGameId(): string {
    return `CHESS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateDifficulty(evaluation: number): string {
    const absEval = Math.abs(evaluation);
    if (absEval <= 0.3) return "Grandmaster";
    if (absEval <= 0.8) return "Master";
    if (absEval <= 1.5) return "Expert";
    if (absEval <= 2.5) return "Intermediate";
    return "Beginner";
  }

  public async connectWallet(): Promise<string> {
    try {
      if (typeof window === 'undefined') {
        throw new Error('Window object not found');
      }

      const { solana } = window as any;

      if (!solana) {
        throw new Error('Phantom wallet not found! Please install it.');
      }

      // Connect to Phantom wallet
      const response = await solana.connect();
      this.wallet = response;
      
      return response.publicKey.toString();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  public async mintGameNFT(
    gameData: string,
    evaluation: number
  ): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      const parsedGameData = JSON.parse(gameData);
      const gameMetadata: ChessGameMetadata = {
        gameId: this.generateGameId(),
        startPosition: parsedGameData.moves[0],
        moves: parsedGameData.moves,
        finalPosition: parsedGameData.moves[parsedGameData.moves.length - 1],
        evaluation: evaluation,
        timestamp: new Date().toISOString(),
        playerAddress: this.wallet.publicKey.toString(),
        difficulty: this.calculateDifficulty(evaluation),
        imageUrl: ''
      };

      // Dinamik NFT görseli oluştur
      gameMetadata.imageUrl = await this.generateNFTImage(gameMetadata);

      // NFT metadata
      const metadata = {
        name: `Freestyle Chess Game #${gameMetadata.gameId}`,
        symbol: 'CHESS',
        description: `A unique freestyle chess game NFT featuring a ${gameMetadata.difficulty} level position.`,
        image: gameMetadata.imageUrl,
        attributes: [
          {
            trait_type: 'Difficulty',
            value: gameMetadata.difficulty
          },
          {
            trait_type: 'Evaluation',
            value: evaluation.toFixed(2)
          },
          {
            trait_type: 'Number of Moves',
            value: gameMetadata.moves.length - 1
          },
          {
            trait_type: 'Date',
            value: new Date(gameMetadata.timestamp).toLocaleDateString()
          }
        ],
        properties: {
          files: [
            {
              uri: gameMetadata.imageUrl,
              type: 'image/svg+xml'
            }
          ],
          category: 'chess',
          gameData: gameMetadata
        }
      };

      // Create new mint
      const mint = await createMint(
        this.connection,
        this.wallet,
        this.wallet.publicKey,
        this.wallet.publicKey,
        0
      );

      // Get token account
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        this.wallet,
        mint,
        this.wallet.publicKey
      );

      // Mint NFT
      await mintTo(
        this.connection,
        this.wallet,
        mint,
        tokenAccount.address,
        this.wallet,
        1
      );

      return mint.toString();
    } catch (error) {
      console.error('Error minting game NFT:', error);
      throw error;
    }
  }

  public async getBalance(): Promise<number> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    const balance = await this.connection.getBalance(this.wallet.publicKey);
    return balance / LAMPORTS_PER_SOL;
  }
} 
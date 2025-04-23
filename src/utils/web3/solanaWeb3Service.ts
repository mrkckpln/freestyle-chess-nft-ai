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

export class SolanaWeb3Service {
  private connection: Connection;
  private wallet: any = null;

  constructor() {
    // Connect to Solana devnet
    this.connection = new Connection('https://api.devnet.solana.com', 'confirmed');
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
      // Create new mint
      const mint = await createMint(
        this.connection,
        this.wallet,
        this.wallet.publicKey,
        this.wallet.publicKey,
        0
      );

      // Get the token account of the wallet address, and if it does not exist, create it
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        this.wallet,
        mint,
        this.wallet.publicKey
      );

      // Mint 1 token to the token account
      await mintTo(
        this.connection,
        this.wallet,
        mint,
        tokenAccount.address,
        this.wallet,
        1
      );

      // Create metadata for the NFT (you'll need to implement Metaplex integration for this)
      const metadata = {
        name: 'Freestyle Chess Game NFT',
        symbol: 'CHESS',
        description: 'A record of a freestyle chess game',
        image: 'https://your-nft-image-url.com',
        attributes: {
          evaluation,
          timestamp: new Date().toISOString()
        },
        gameData
      };

      // Return the mint address as the token ID
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
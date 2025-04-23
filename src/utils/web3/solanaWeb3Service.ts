import { 
  Connection, 
  PublicKey, 
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Commitment,
  clusterApiUrl,
  Keypair,
  sendAndConfirmTransaction
} from '@solana/web3.js';
import { 
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  createInitializeMintInstruction,
  getMint,
  createMintToInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction
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
    const commitment: Commitment = 'confirmed';
    // Solana Devnet'e bağlan
    this.connection = new Connection(
      clusterApiUrl('devnet'),
      {
        commitment,
        wsEndpoint: 'wss://api.devnet.solana.com/',
        confirmTransactionInitialTimeout: 60000
      }
    );
  }

  private async generateNFTImage(metadata: ChessGameMetadata): Promise<string> {
    // Basit bir metin tabanlı NFT görseli döndür
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="400" height="100" xmlns="http://www.w3.org/2000/svg">
        <text x="10" y="50" font-family="sans-serif" font-size="24">
          Chess Game NFT: ${metadata.gameId}
        </text>
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

      if (!solana.isPhantom) {
        throw new Error('Please install Phantom wallet');
      }

      // Connect to Phantom wallet
      const response = await solana.connect();
      
      // Wallet nesnesini doğru şekilde yapılandır
      this.wallet = {
        publicKey: response.publicKey,
        signTransaction: async (transaction: Transaction) => {
          try {
            const signed = await solana.signTransaction(transaction);
            return signed;
          } catch (error) {
            console.error('Error signing transaction:', error);
            throw error;
          }
        },
        signAllTransactions: async (transactions: Transaction[]) => {
          try {
            const signed = await solana.signAllTransactions(transactions);
            return signed;
          } catch (error) {
            console.error('Error signing transactions:', error);
            throw error;
          }
        },
        signMessage: async (message: Uint8Array) => {
          try {
            const signed = await solana.signMessage(message, 'utf8');
            return signed;
          } catch (error) {
            console.error('Error signing message:', error);
            throw error;
          }
        }
      };
      
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
      // Check balance first
      const balance = await this.getBalance();
      console.log('Current balance:', balance, 'SOL');
      
      if (balance < 0.005) {
        throw new Error(`Insufficient balance: ${balance} SOL. You need at least 0.005 SOL to mint an NFT.`);
      }

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

      console.log('Creating NFT metadata...');
      gameMetadata.imageUrl = await this.generateNFTImage(gameMetadata);

      try {
        // Create a new keypair for the mint account
        const mintKeypair = Keypair.generate();
        console.log('Mint account:', mintKeypair.publicKey.toString());

        // Get the minimum lamports required for the mint
        const mintRent = await this.connection.getMinimumBalanceForRentExemption(MINT_SIZE);

        // Get the associated token address
        const associatedTokenAddress = await getAssociatedTokenAddress(
          mintKeypair.publicKey,
          this.wallet.publicKey
        );
        console.log('Associated token address:', associatedTokenAddress.toString());

        // Create a new transaction
        const transaction = new Transaction();

        // Add create account instruction
        transaction.add(
          SystemProgram.createAccount({
            fromPubkey: this.wallet.publicKey,
            newAccountPubkey: mintKeypair.publicKey,
            space: MINT_SIZE,
            lamports: mintRent,
            programId: TOKEN_PROGRAM_ID
          })
        );

        // Add initialize mint instruction
        transaction.add(
          createInitializeMintInstruction(
            mintKeypair.publicKey,
            0,
            this.wallet.publicKey,
            this.wallet.publicKey
          )
        );

        // Add create associated token account instruction
        transaction.add(
          createAssociatedTokenAccountInstruction(
            this.wallet.publicKey,
            associatedTokenAddress,
            this.wallet.publicKey,
            mintKeypair.publicKey
          )
        );

        // Add mint to instruction
        transaction.add(
          createMintToInstruction(
            mintKeypair.publicKey,
            associatedTokenAddress,
            this.wallet.publicKey,
            1
          )
        );

        // Get recent blockhash
        const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = this.wallet.publicKey;

        console.log('Signing transaction...');
        transaction.sign(mintKeypair);
        const signedTx = await this.wallet.signTransaction(transaction);

        console.log('Sending transaction...');
        const txId = await this.connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: true,
          preflightCommitment: 'confirmed'
        });

        console.log('Confirming transaction...');
        const confirmation = await this.connection.confirmTransaction(txId, 'confirmed');

        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }

        console.log('Transaction confirmed:', txId);

        // Verify the mint
        console.log('Verifying mint...');
        const mintInfo = await getMint(this.connection, mintKeypair.publicKey);
        
        console.log('Mint info:', {
          supply: mintInfo.supply.toString(),
          decimals: mintInfo.decimals,
          freezeAuthority: mintInfo.freezeAuthority?.toString(),
          mintAuthority: mintInfo.mintAuthority?.toString()
        });

        if (mintInfo.supply !== BigInt(1)) {
          throw new Error(`Mint verification failed: expected supply 1, got ${mintInfo.supply.toString()}`);
        }

        console.log('NFT minted successfully!');
        return mintKeypair.publicKey.toString();

      } catch (error) {
        console.error('Detailed error in transaction:', error);
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }
        throw error;
      }
    } catch (error) {
      console.error('Detailed minting error:', error);
      
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (errorMessage.includes('insufficient balance')) {
          errorMessage = 'Insufficient SOL balance. Please make sure you have enough SOL and try again.';
        } else if (errorMessage.includes('Transaction simulation failed')) {
          errorMessage = 'Transaction failed. Please try again in a few moments.';
        } else if (errorMessage.includes('timeout')) {
          errorMessage = 'Network timeout. Please check your connection and try again.';
        }
      }

      const errorDetails = error instanceof Error && (error as any).logs 
        ? `\nDetails: ${JSON.stringify((error as any).logs)}` 
        : '';

      throw new Error(`NFT Minting Error: ${errorMessage}${errorDetails}`);
    }
  }

  public async getBalance(): Promise<number> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    const balance = await this.connection.getBalance(this.wallet.publicKey);
    return balance / LAMPORTS_PER_SOL;
  }

  public async requestAirdrop(): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      console.log('Requesting airdrop for:', this.wallet.publicKey.toString());

      // İlk airdrop denemesi
      const signature1 = await this.connection.requestAirdrop(
        this.wallet.publicKey,
        1 * LAMPORTS_PER_SOL
      );

      console.log('First airdrop signature:', signature1);

      // İlk işlemi bekle
      const confirmation1 = await this.connection.confirmTransaction(signature1, 'confirmed');
      
      if (confirmation1.value.err) {
        throw new Error(`First airdrop failed: ${JSON.stringify(confirmation1.value.err)}`);
      }

      console.log('First airdrop confirmed');

      // Biraz bekle
      await new Promise(resolve => setTimeout(resolve, 2000));

      // İkinci airdrop denemesi
      const signature2 = await this.connection.requestAirdrop(
        this.wallet.publicKey,
        1 * LAMPORTS_PER_SOL
      );

      console.log('Second airdrop signature:', signature2);

      // İkinci işlemi bekle
      const confirmation2 = await this.connection.confirmTransaction(signature2, 'confirmed');

      if (confirmation2.value.err) {
        throw new Error(`Second airdrop failed: ${JSON.stringify(confirmation2.value.err)}`);
      }

      console.log('Second airdrop confirmed');

      // Son bakiyeyi kontrol et
      const balance = await this.getBalance();
      console.log('New balance:', balance, 'SOL');

      return signature2;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Detailed airdrop error:', error);
      throw new Error(`Airdrop failed: ${errorMessage}`);
    }
  }

  public async getUserNFTs(walletAddress: string) {
    try {
      const publicKey = new PublicKey(walletAddress);
      const nftAccounts = await this.connection.getParsedTokenAccountsByOwner(
        publicKey,
        {
          programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
        }
      );

      const nfts = [];
      for (const account of nftAccounts.value) {
        const tokenAmount = account.account.data.parsed.info.tokenAmount;
        
        // NFT'ler için token miktarı 1 olmalı
        if (tokenAmount.amount === '1' && tokenAmount.decimals === 0) {
          try {
            const mintAddress = account.account.data.parsed.info.mint;
            const metadataPDA = await this.findMetadataPDA(new PublicKey(mintAddress));
            const metadata = await this.connection.getAccountInfo(metadataPDA);
            
            if (metadata) {
              const decodedMetadata = this.decodeMetadata(metadata.data);
              nfts.push({
                mint: mintAddress,
                metadata: decodedMetadata
              });
            }
          } catch (error) {
            console.error('Error fetching NFT metadata:', error);
          }
        }
      }

      return nfts;
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      throw error;
    }
  }

  private async findMetadataPDA(mint: PublicKey): Promise<PublicKey> {
    const [metadataPDA] = await PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(),
        mint.toBuffer()
      ],
      new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
    );
    return metadataPDA;
  }

  private decodeMetadata(buffer: Buffer): any {
    // Bu fonksiyon Metaplex metadata formatını decode eder
    // Basitleştirilmiş bir versiyon kullanıyoruz
    try {
      const metadata = JSON.parse(buffer.toString('utf8'));
      return {
        name: metadata.name,
        image: metadata.image,
        attributes: metadata.attributes || []
      };
    } catch (error) {
      console.error('Error decoding metadata:', error);
      return {
        name: 'Unknown NFT',
        image: '',
        attributes: []
      };
    }
  }
} 
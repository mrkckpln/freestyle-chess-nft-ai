import { ethers } from 'ethers';

const CONTRACT_ABI = [
  "function mintGameNFT(address winner, address loser, string memory gameData, string memory tokenURI, int8 evaluation) public returns (uint256)",
  "function getGameResult(uint256 tokenId) public view returns (address winner, address loser, string memory gameData, uint256 timestamp, int8 evaluation)",
  "event GameNFTMinted(uint256 indexed tokenId, address winner, address loser, string gameData, int8 evaluation)"
];

declare global {
  interface Window {
    ethereum?: any;
  }
}

export class Web3Service {
  private provider: ethers.BrowserProvider | null = null;
  private contract: ethers.Contract | null = null;
  private signer: ethers.Signer | null = null;

  constructor() {
    this.initializeWeb3();
  }

  private async initializeWeb3() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      
      // Contract address will be set after deployment
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      
      if (contractAddress) {
        this.contract = new ethers.Contract(
          contractAddress,
          CONTRACT_ABI,
          this.provider
        );
      }
    }
  }

  public async connectWallet(): Promise<string> {
    if (!this.provider) {
      throw new Error('Web3 provider not initialized');
    }

    try {
      const accounts = await this.provider.send('eth_requestAccounts', []);
      this.signer = await this.provider.getSigner();
      return accounts[0];
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  public async mintGameNFT(
    winner: string,
    loser: string,
    gameData: string,
    evaluation: number
  ): Promise<string> {
    if (!this.contract || !this.signer) {
      throw new Error('Contract or signer not initialized');
    }

    try {
      // Create metadata for the NFT
      const metadata = {
        name: 'Freestyle Chess Game NFT',
        description: 'A record of a freestyle chess game',
        image: 'https://your-nft-image-url.com', // You'll need to add image generation
        attributes: {
          winner,
          loser,
          evaluation,
          timestamp: new Date().toISOString()
        },
        gameData
      };

      // Upload metadata to IPFS (you'll need to implement this)
      const tokenURI = await this.uploadToIPFS(metadata);

      // Convert evaluation to int8 (multiply by 100 to handle decimals)
      const evaluationInt8 = Math.round(evaluation * 100);

      // Connect contract to signer for sending transactions
      const contractWithSigner = this.contract.connect(this.signer);

      // Mint the NFT
      const tx = await contractWithSigner.mintGameNFT(
        winner,
        loser,
        gameData,
        tokenURI,
        evaluationInt8
      );

      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Get the token ID from the event
      const event = receipt.logs.find((log: any) => 
        log.fragment?.name === 'GameNFTMinted'
      );
      
      return event?.args?.tokenId.toString() || '';
    } catch (error) {
      console.error('Error minting game NFT:', error);
      throw error;
    }
  }

  private async uploadToIPFS(metadata: any): Promise<string> {
    // TODO: Implement IPFS upload
    // For now, return a placeholder URL
    return `https://your-ipfs-gateway.com/${Date.now()}`;
  }

  public async getGameResult(tokenId: string) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const result = await this.contract.getGameResult(tokenId);
      return {
        winner: result.winner,
        loser: result.loser,
        gameData: result.gameData,
        timestamp: new Date(result.timestamp.toNumber() * 1000),
        evaluation: result.evaluation / 100
      };
    } catch (error) {
      console.error('Error getting game result:', error);
      throw error;
    }
  }
} 
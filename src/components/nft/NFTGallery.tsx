import React, { useEffect, useState } from 'react';
import { SolanaWeb3Service } from '../../utils/web3/solanaWeb3Service';

interface NFTGalleryProps {
  walletAddress: string;
}

interface NFT {
  mint: string;
  metadata: {
    name: string;
    image: string;
    attributes: Array<{
      trait_type: string;
      value: string | number;
    }>;
  };
}

export const NFTGallery: React.FC<NFTGalleryProps> = ({ walletAddress }) => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const web3Service = new SolanaWeb3Service();

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!walletAddress) return;
      
      try {
        const userNFTs = await web3Service.getUserNFTs(walletAddress);
        setNfts(userNFTs);
      } catch (error) {
        console.error('Error fetching NFTs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, [walletAddress]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="text-center p-8 text-gray-600">
        No NFTs found. Try minting some chess game NFTs first!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
      {nfts.map((nft) => (
        <div key={nft.mint} className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="relative pb-[100%]">
            <img
              src={nft.metadata.image}
              alt={nft.metadata.name}
              className="absolute top-0 left-0 w-full h-full object-cover"
            />
          </div>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">{nft.metadata.name}</h3>
            <div className="space-y-2">
              {nft.metadata.attributes.map((attr, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">{attr.trait_type}:</span>
                  <span className="font-medium">{attr.value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => window.open(`https://solscan.io/token/${nft.mint}?cluster=devnet`, '_blank')}
              className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
            >
              View on Solscan
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}; 
# Freestyle Chess NFT Platform

A decentralized platform that combines Freestyle Chess with NFT rewards. Players can participate in Freestyle Chess matches where the initial position is randomized (but balanced), and earn NFT rewards based on their performance.

## Features

- Freestyle Chess gameplay with randomized but balanced starting positions
- Position evaluation to ensure fair starting positions (0.0 evaluation)
- NFT rewards for match outcomes
- Web3 integration for NFT minting and distribution
- Real-time chess gameplay

## Tech Stack

- Frontend: React.js with TypeScript
- Smart Contracts: Solidity
- Chess Engine: Stockfish
- Web3: ethers.js
- Chess UI: react-chessboard
- Styling: TailwindCSS

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
freestyle-chess-nft-ai/
├── src/
│   ├── components/      # React components
│   ├── contracts/       # Solidity smart contracts
│   ├── utils/          # Helper functions
│   └── pages/          # Next.js pages
├── public/             # Static assets
└── test/              # Test files
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/) 
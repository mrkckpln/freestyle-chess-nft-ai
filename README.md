# Freestyle Chess NFT Platform

A decentralized platform that combines Freestyle Chess with NFT rewards on Solana blockchain. Players can participate in Freestyle Chess matches where the initial position is randomized (but balanced), and earn NFT rewards based on their performance.


## 🎮 Features

- **Freestyle Chess Gameplay**
  - Randomized but balanced starting positions
  - Position evaluation using Stockfish engine
  - Real-time chess gameplay with react-chessboard
  - Fair starting positions (0.0 evaluation)

- **Blockchain Integration**
  - Solana blockchain integration
  - NFT minting for game results
  - Phantom wallet connection
  - Game state stored on-chain

- **Technical Features**
  - Real-time position analysis
  - Automated position balancing
  - Move validation and game state management
  - Responsive chess board UI

## 🛠️ Tech Stack

- **Frontend**
  - React.js with TypeScript
  - Next.js for server-side rendering
  - TailwindCSS for styling
  - react-chessboard for chess UI

- **Blockchain**
  - Solana Web3.js
  - SPL Token
  - Phantom Wallet integration
  - Solana Program Library

- **Chess Engine**
  - Stockfish for position analysis
  - chess.js for game logic

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Phantom Wallet browser extension
- Some SOL on Solana devnet for testing

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mrkckpln/freestyle-chess-nft-ai.git
cd freestyle-chess-nft-ai
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📖 How to Play

1. **Connect Wallet**
   - Install Phantom Wallet browser extension
   - Click "Connect Phantom Wallet" button
   - Approve the connection

2. **Generate Position**
   - Click "Generate New Position"
   - Wait for position analysis
   - Position will be balanced (≈0.0)

3. **Play Chess**
   - Make moves by dragging pieces
   - Position is automatically validated
   - Game state is tracked

4. **Mint NFT**
   - After making moves, click "Mint Game NFT"
   - Approve transaction in Phantom
   - NFT will be minted with game data

## 📁 Project Structure

```
freestyle-chess-nft-ai/
├── src/
│   ├── components/      # React components
│   │   └── chess/      # Chess-related components
│   ├── contracts/      # Solana program files
│   ├── utils/
│   │   ├── analysis/   # Chess analysis utilities
│   │   └── web3/       # Blockchain utilities
│   └── pages/          # Next.js pages
├── public/             # Static assets
└── test/              # Test files
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run e2e tests
npm run test:e2e
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🔮 Future Plans

### Frontend Improvements
- Enhanced UI/UX with modern design principles
- Responsive design for mobile devices
- Dark/Light theme support
- Advanced game analysis interface
- Interactive move history with variations
- Social features (chat, friend system)
- Tournament system implementation

### Gameplay Enhancements
- Multiple time control options
- Custom position editor
- Opening book integration
- Post-game analysis with engine
- Game replay functionality
- Puzzle system integration
- Rating system implementation

### Blockchain Features
- Multi-chain support (Ethereum, Polygon)
- Advanced NFT metadata
- Marketplace integration
- Tournament smart contracts
- Achievement system
- Governance token implementation
- Play-to-earn mechanics

### Technical Improvements
- WebSocket integration for real-time features
- Progressive Web App (PWA) support
- Performance optimizations
- Advanced caching strategies
- Improved test coverage
- CI/CD pipeline enhancement
- Documentation expansion

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Stockfish](https://stockfishchess.org/) for the chess engine
- [react-chessboard](https://github.com/Clariity/react-chessboard) for the chess UI
- [Solana](https://solana.com/) for the blockchain infrastructure
- [chess.js](https://github.com/jhlywa/chess.js) for chess logic
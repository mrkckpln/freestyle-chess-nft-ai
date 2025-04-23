// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract FreestyleChessNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Game result structure
    struct GameResult {
        address winner;
        address loser;
        string gameData; // FEN strings and moves
        uint256 timestamp;
        int8 evaluation; // Position evaluation * 100 (to handle decimals)
    }

    // Mapping from token ID to game result
    mapping(uint256 => GameResult) public gameResults;

    // Event emitted when a new game NFT is minted
    event GameNFTMinted(
        uint256 indexed tokenId,
        address winner,
        address loser,
        string gameData,
        int8 evaluation
    );

    constructor() ERC721("Freestyle Chess NFT", "FCNFT") {}

    // Mint a new NFT for a completed game
    function mintGameNFT(
        address winner,
        address loser,
        string memory gameData,
        string memory tokenURI,
        int8 evaluation
    ) public onlyOwner returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(winner, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        gameResults[newTokenId] = GameResult({
            winner: winner,
            loser: loser,
            gameData: gameData,
            timestamp: block.timestamp,
            evaluation: evaluation
        });

        emit GameNFTMinted(newTokenId, winner, loser, gameData, evaluation);

        return newTokenId;
    }

    // Get game result by token ID
    function getGameResult(uint256 tokenId) public view returns (
        address winner,
        address loser,
        string memory gameData,
        uint256 timestamp,
        int8 evaluation
    ) {
        GameResult memory result = gameResults[tokenId];
        return (
            result.winner,
            result.loser,
            result.gameData,
            result.timestamp,
            result.evaluation
        );
    }

    // Override required functions
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
} 
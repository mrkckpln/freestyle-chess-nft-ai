import { ethers } from "hardhat";

async function main() {
  const FreestyleChessNFT = await ethers.getContractFactory("FreestyleChessNFT");
  const freestyleChessNFT = await FreestyleChessNFT.deploy();
  await freestyleChessNFT.waitForDeployment();

  const address = await freestyleChessNFT.getAddress();
  console.log("FreestyleChessNFT deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 
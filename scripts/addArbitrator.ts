import { network } from "hardhat";

async function main() {
  const arbitratorAddress = "0xdfDBE6E4972B8D093BC68AEc2B38079c4a6aA8eD";
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  if (!contractAddress) {
    throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS not set in .env");
  }

  console.log(`Adding arbitrator ${arbitratorAddress} to GigShield at ${contractAddress}...`);

  const { ethers } = await network.connect();
  const gigShield = await ethers.getContractAt("GigShield", contractAddress);

  const tx = await gigShield.registerArbitrator(arbitratorAddress);
  await tx.wait();

  console.log("Arbitrator registered successfully!");

  const isArb = await gigShield.isArbitrator(arbitratorAddress);
  console.log(`Verified: isArbitrator(${arbitratorAddress}) = ${isArb}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

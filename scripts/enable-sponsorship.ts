import { network } from "hardhat";
import "dotenv/config";

async function main() {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error("Set NEXT_PUBLIC_CONTRACT_ADDRESS in .env first");
    process.exit(1);
  }

  const { ethers } = await network.connect();
  const [deployer] = await ethers.getSigners();

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} CFX`);
  console.log(`Contract: ${contractAddress}`);

  const gigShield = await ethers.getContractAt("GigShield", contractAddress);

  // Check ownership
  const owner = await gigShield.owner();
  console.log(`Contract owner: ${owner}`);
  console.log(`Is owner: ${owner.toLowerCase() === deployer.address.toLowerCase()}`);

  // Try with exactly 2 CFX
  console.log("Enabling sponsorship with 2 CFX...");
  try {
    const tx = await gigShield.enableSponsorship({
      value: ethers.parseEther("2.0"),
      gasLimit: 500000,
    });
    console.log(`Tx hash: ${tx.hash}`);
    await tx.wait();
    console.log("Gas sponsorship enabled!");
  } catch (err: any) {
    console.error("Failed:", err.message);
    console.log("\nNote: The SponsorWhitelistControl precompile may not be available on eSpace.");
    console.log("On Conflux eSpace, gas fees are already < $0.001 per transaction.");
    console.log("Sponsorship can be enabled via Conflux Core Space bridge in production.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

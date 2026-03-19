import { network } from "hardhat";

async function main() {
  console.log("Deploying GigShield to Conflux eSpace...");

  const { ethers } = await network.connect();

  const GigShield = await ethers.getContractFactory("GigShield");
  const gigShield = await GigShield.deploy();
  await gigShield.waitForDeployment();

  const address = await gigShield.getAddress();
  console.log(`GigShield deployed to: ${address}`);

  // Enable gas sponsorship with 2 CFX
  console.log("Enabling gas sponsorship with 2 CFX...");
  const tx = await gigShield.enableSponsorship({
    value: ethers.parseEther("2.0"),
  });
  await tx.wait();
  console.log("Gas sponsorship enabled!");

  console.log("\n--- Next Steps ---");
  console.log(`1. Update .env: NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
  console.log(`2. Verify contract:`);
  console.log(`   npx hardhat verify --network confluxMainnet ${address}`);
  console.log(`3. View on ConfluxScan: https://evm.confluxscan.io/address/${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

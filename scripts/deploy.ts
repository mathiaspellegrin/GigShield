import { network } from "hardhat";

async function main() {
  console.log("Deploying GigShield to Conflux eSpace...");

  const { ethers } = await network.connect();

  const GigShield = await ethers.getContractFactory("GigShield");
  const gigShield = await GigShield.deploy();
  await gigShield.waitForDeployment();

  const address = await gigShield.getAddress();
  console.log(`GigShield deployed to: ${address}`);

  // Note: The SponsorWhitelistControl precompile lives on Conflux Core Space, not eSpace.
  // Calling enableSponsorship() here from eSpace has no effect on user gas costs — native
  // eSpace base fees (~$0.0001–$0.001 per tx) are what users pay today.
  // Full gas sponsorship for an eSpace contract requires a Core-Space-side sponsor contract
  // bridging via CrossSpaceCall (CIP-90), which is planned post-hackathon.

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

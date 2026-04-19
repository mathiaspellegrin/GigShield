import { network } from "hardhat";
import "dotenv/config";

const PRECOMPILE = "0x0888000000000000000000000000000000000001";
const PRECOMPILE_ABI = [
  "function setSponsorForGas(address contractAddr, uint upperBound) external payable",
  "function setSponsorForCollateral(address contractAddr) external payable",
  "function addPrivilegeByAdmin(address contractAddr, address[] memory addresses) external",
  "function isAllWhitelisted(address contractAddr) external view returns (bool)",
  "function isWhitelisted(address contractAddr, address user) external view returns (bool)",
  "function getSponsorForGas(address contractAddr) external view returns (address)",
  "function getSponsoredBalanceForGas(address contractAddr) external view returns (uint)",
  "function getSponsoredGasFeeUpperBound(address contractAddr) external view returns (uint)",
  "function getSponsorForCollateral(address contractAddr) external view returns (address)",
  "function getSponsoredBalanceForCollateral(address contractAddr) external view returns (uint)",
];

// Set CHECK_ONLY=1 to only inspect current state (no tx sent).
// Set DRY_RUN=1 to prep the tx but not broadcast.
const CHECK_ONLY = process.env.CHECK_ONLY === "1";
const DRY_RUN = process.env.DRY_RUN === "1";

async function main() {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!contractAddress) throw new Error("Set NEXT_PUBLIC_CONTRACT_ADDRESS in .env");

  const { ethers } = await network.connect();
  const [signer] = await ethers.getSigners();
  const sponsor = new ethers.Contract(PRECOMPILE, PRECOMPILE_ABI, signer);

  const [
    gasSponsorAdmin,
    gasBalance,
    gasUpperBound,
    collateralAdmin,
    collateralBalance,
    isAll,
  ] = await Promise.all([
    sponsor.getSponsorForGas(contractAddress),
    sponsor.getSponsoredBalanceForGas(contractAddress),
    sponsor.getSponsoredGasFeeUpperBound(contractAddress),
    sponsor.getSponsorForCollateral(contractAddress),
    sponsor.getSponsoredBalanceForCollateral(contractAddress),
    sponsor.isAllWhitelisted(contractAddress),
  ]);

  const signerBalance = await ethers.provider.getBalance(signer.address);

  console.log("─── Current sponsorship state ───");
  console.log(`Contract:                ${contractAddress}`);
  console.log(`Signer (EOA):            ${signer.address}`);
  console.log(`Signer balance:          ${ethers.formatEther(signerBalance)} CFX`);
  console.log(`Gas sponsor admin:       ${gasSponsorAdmin}`);
  console.log(`Gas sponsored balance:   ${ethers.formatEther(gasBalance)} CFX`);
  console.log(`Gas fee upper bound:     ${ethers.formatEther(gasUpperBound)} CFX / tx`);
  console.log(`Collateral admin:        ${collateralAdmin}`);
  console.log(`Collateral balance:      ${ethers.formatEther(collateralBalance)} CFX`);
  console.log(`All users whitelisted:   ${isAll}`);

  if (isAll) {
    console.log("\n✅ Whitelist already includes address(0). No change needed.");
    return;
  }

  if (gasSponsorAdmin.toLowerCase() !== signer.address.toLowerCase()) {
    console.error(
      `\n❌ Signer is not the gas sponsor admin. addPrivilegeByAdmin will revert.\n` +
        `   Fund the gas sponsorship from this signer first (enableSponsorship on the contract),\n` +
        `   or run this script with the EOA that funded sponsorship.`
    );
    process.exit(1);
  }

  if (CHECK_ONLY) {
    console.log("\nCHECK_ONLY=1 — not sending any transaction.");
    return;
  }

  console.log("\n─── Adding address(0) to whitelist (= all users) ───");

  const data = sponsor.interface.encodeFunctionData("addPrivilegeByAdmin", [
    contractAddress,
    [ethers.ZeroAddress],
  ]);

  const feeData = await ethers.provider.getFeeData();
  console.log(`Gas price:               ${feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, "gwei") : "?"} gwei`);

  const estGas = await ethers.provider.estimateGas({
    from: signer.address,
    to: PRECOMPILE,
    data,
  });
  console.log(`Est. gas:                ${estGas.toString()}`);

  if (DRY_RUN) {
    console.log("\nDRY_RUN=1 — not broadcasting.");
    return;
  }

  const tx = await sponsor.addPrivilegeByAdmin(contractAddress, [ethers.ZeroAddress], {
    gasLimit: (estGas * 12n) / 10n,
  });
  console.log(`Tx sent:                 ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`Mined in block:          ${receipt?.blockNumber}`);
  console.log(`Gas used:                ${receipt?.gasUsed?.toString()}`);

  const isAllAfter = await sponsor.isAllWhitelisted(contractAddress);
  console.log(`\nAll users whitelisted:   ${isAllAfter}`);
  if (!isAllAfter) {
    console.error("⚠️  Tx mined but whitelist state is still false. Check the precompile docs for this network.");
    process.exit(1);
  }
  console.log("\n✅ Gas sponsorship is now active for all users.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

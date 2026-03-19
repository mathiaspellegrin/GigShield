import "dotenv/config";
import hardhatToolboxPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { defineConfig, configVariable } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.20",
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
    },
  },
  networks: {
    confluxTestnet: {
      type: "http",
      url: "https://evmtestnet.confluxrpc.com",
      chainId: 71,
      accounts: [configVariable("PRIVATE_KEY")],
    },
    confluxMainnet: {
      type: "http",
      url: "https://evm.confluxrpc.com",
      chainId: 1030,
      accounts: [configVariable("PRIVATE_KEY")],
    },
  },
});

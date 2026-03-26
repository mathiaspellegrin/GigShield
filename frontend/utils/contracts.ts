import { createPublicClient, http, formatUnits, parseUnits, getContract as viemGetContract, type Address, type PublicClient } from "viem";
import { confluxESpace } from "viem/chains";
import CONTRACT_ABI from "@/constants/abi.json";

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "") as Address;
export const USDT0_ADDRESS = (process.env.NEXT_PUBLIC_USDT0_ADDRESS || "") as Address;
export const AXCNH_ADDRESS = "0x70bfd7f7eadf9b9827541272589a6b2bb760ae2e" as Address;

export const SUPPORTED_TOKENS: { address: Address; symbol: string; decimals: number }[] = [
  { address: USDT0_ADDRESS, symbol: "USDT0", decimals: 6 },
  { address: AXCNH_ADDRESS, symbol: "AxCNH", decimals: 18 },
];

export function getTokenByAddress(address: string): { symbol: string; decimals: number } {
  const token = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === address.toLowerCase());
  return token ?? { symbol: "TOKEN", decimals: 18 };
}

// Read-only public client
export const publicClient: PublicClient = createPublicClient({
  chain: confluxESpace,
  transport: http("https://evm.confluxrpc.com"),
});

export function getReadContract() {
  return viemGetContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI as any,
    client: publicClient,
  });
}

export const ERC20_ABI = [
  { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
  { name: "allowance", type: "function", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
] as const;

export function getContractAddress() {
  return CONTRACT_ADDRESS;
}

export function getExplorerUrl(txHash: string) {
  return `https://evm.confluxscan.io/tx/${txHash}`;
}

export function getAddressExplorerUrl(address: string) {
  return `https://evm.confluxscan.io/address/${address}`;
}

export { formatUnits, parseUnits };

export const MILESTONE_STATUS = ["Pending", "In Progress", "Under Review", "Approved", "Disputed"] as const;
export const DISPUTE_STATUS = ["None", "Filed", "Response Period", "In Arbitration", "Resolved"] as const;

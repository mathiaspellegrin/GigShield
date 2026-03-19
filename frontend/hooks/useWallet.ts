"use client";

import { useState, useCallback } from "react";
import { createWalletClient, custom, http, type WalletClient, type Address } from "viem";
import { confluxESpace } from "viem/chains";

export function useWallet() {
  const [address, setAddress] = useState<Address | null>(null);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Step 1: get accounts via raw window.ethereum.request
      const eth = (window as any).ethereum;
      if (!eth) throw new Error("No wallet found. Install MetaMask.");

      const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
      if (!accounts.length) throw new Error("No accounts found");

      // Step 2: switch chain
      try {
        await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x406" }] });
      } catch (e: any) {
        if (e.code === 4902) {
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [{ chainId: "0x406", chainName: "Conflux eSpace", rpcUrls: ["https://evm.confluxrpc.com"], nativeCurrency: { name: "CFX", symbol: "CFX", decimals: 18 }, blockExplorerUrls: ["https://evm.confluxscan.io"] }],
          });
        }
      }

      const addr = accounts[0] as Address;

      // Step 3: create wallet client using HTTP transport for reads
      // and a custom transport that wraps raw requests for writes.
      // The custom transport calls go through fetch, not the Proxy.
      const client = createWalletClient({
        account: addr,
        chain: confluxESpace,
        transport: custom({
          async request({ method, params }) {
            // For signing/sending, use the wallet
            if (
              method === "eth_sendTransaction" ||
              method === "eth_signTransaction" ||
              method === "personal_sign" ||
              method === "eth_sign" ||
              method.startsWith("eth_signTypedData") ||
              method === "eth_accounts" ||
              method === "eth_requestAccounts" ||
              method === "wallet_switchEthereumChain" ||
              method === "wallet_addEthereumChain"
            ) {
              return eth.request({ method, params });
            }
            // For everything else (reads), use direct RPC fetch
            const res = await fetch("https://evm.confluxrpc.com", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
            });
            const json = await res.json();
            if (json.error) throw new Error(json.error.message);
            return json.result;
          },
        }),
      });

      setAddress(addr);
      setWalletClient(client);
    } catch (err: any) {
      const msg = err.shortMessage || err.message || "";
      // Ignore benign "private member" errors thrown by wallet extension proxies
      if (msg.includes("private member")) return;
      setError(msg || "Failed to connect");
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setWalletClient(null);
  }, []);

  return { address, walletClient, loading, error, connect, disconnect };
}

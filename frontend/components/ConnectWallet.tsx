"use client";

import { Wallet, LogOut, Loader2 } from "lucide-react";
import type { Address } from "viem";

interface ConnectWalletProps {
  address: Address | null;
  loading: boolean;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function ConnectWallet({ address, loading, error, onConnect, onDisconnect }: ConnectWalletProps) {
  if (address) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" style={{ animation: "pulse-dot 2s ease-in-out infinite" }} />
          <span className="mono text-xs text-[var(--text-secondary)] tracking-tight">{address.slice(0, 6)}...{address.slice(-4)}</span>
          <button onClick={onDisconnect} className="p-1 rounded-full hover:bg-[var(--bg-inset)] transition-colors" title="Disconnect"><LogOut size={13} className="text-[var(--text-tertiary)]" /></button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button onClick={onConnect} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-[var(--text-primary)] text-white rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Wallet size={15} />}
        {loading ? "Connecting..." : "Connect"}
      </button>
      {error && <p className="mt-2 text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}

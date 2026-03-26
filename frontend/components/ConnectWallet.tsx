"use client";

import { Wallet, LogOut, Loader2, Unplug } from "lucide-react";
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
        <div className="flex items-center gap-2.5 pl-3 pr-1.5 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-full group hover:border-[var(--border-strong)] transition-all">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-[var(--success)]" style={{ animation: "pulse-dot 2s ease-in-out infinite" }} />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-[var(--success)] opacity-30 blur-[2px]" />
          </div>
          <span className="mono text-xs text-[var(--text-secondary)] tracking-tight">{address.slice(0, 6)}...{address.slice(-4)}</span>
          <button
            onClick={onDisconnect}
            className="p-1.5 rounded-full hover:bg-[var(--danger-subtle)] transition-all group/btn"
            title="Disconnect"
          >
            <LogOut size={12} className="text-[var(--text-tertiary)] group-hover/btn:text-[var(--danger)]" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onConnect}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-full text-sm font-medium hover:bg-[var(--accent-hover)] transition-all btn-glow disabled:opacity-50"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Wallet size={15} />}
        {loading ? "Connecting..." : "Connect Wallet"}
      </button>
      {error && <p className="mt-2 text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}

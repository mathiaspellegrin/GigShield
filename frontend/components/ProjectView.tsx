"use client";

import { useState, useEffect, useCallback } from "react";
import { formatUnits, type WalletClient, type Address } from "viem";
import { Clock, CheckCircle2, AlertTriangle, Loader2, PauseCircle, PlayCircle, Shield, ArrowUpRight, Copy, ExternalLink } from "lucide-react";
import { publicClient, getExplorerUrl, getAddressExplorerUrl, MILESTONE_STATUS, ERC20_ABI, getTokenByAddress } from "@/utils/contracts";
import CONTRACT_ABI from "@/constants/abi.json";

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "") as Address;

interface Props { projectId: number; walletClient: WalletClient | null; userAddress: Address | null; }

export default function ProjectView({ projectId, walletClient, userAddress }: Props) {
  const [project, setProject] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const isClient = userAddress?.toLowerCase() === project?.client?.toLowerCase();
  const isFreelancer = userAddress?.toLowerCase() === project?.freelancer?.toLowerCase();
  const token = project ? getTokenByAddress(project.paymentToken) : { symbol: "TOKEN", decimals: 18 };

  const copyAddr = (addr: string, key: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const load = useCallback(async () => {
    try {
      const raw = await publicClient.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI as any, functionName: "projects", args: [BigInt(projectId)] }) as any;
      const p = Array.isArray(raw) ? {
        client: raw[0], freelancer: raw[1], name: raw[2], description: raw[3],
        paymentToken: raw[4], totalAmount: raw[5], releasedAmount: raw[6],
        milestoneCount: raw[7], createdAt: raw[8], active: raw[9], funded: raw[10],
      } : raw;

      const rawMs = await publicClient.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI as any, functionName: "getProjectMilestones", args: [BigInt(projectId)] }) as any[];
      const ms = rawMs.map((m: any) => Array.isArray(m) ? {
        description: m[0], amount: m[1], status: m[2], submittedAt: m[3], autoReleasePaused: m[4],
      } : m);

      setProject(p); setMilestones(ms);
    } catch { setError("Failed to load project"); } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const exec = async (key: string, fn: () => Promise<`0x${string}`>) => {
    if (!walletClient || !userAddress) return;
    setActionLoading(key); setError(null); setTxHash(null);
    try {
      const hash = await fn(); setTxHash(hash);
      try { await publicClient.waitForTransactionReceipt({ hash, timeout: 60_000 }); } catch { await new Promise(r => setTimeout(r, 5000)); }
      await load();
    } catch (err: any) { const msg = err?.shortMessage || err?.message || "Transaction failed"; setError(msg.length > 120 ? "Transaction failed." : msg); }
    finally { setActionLoading(null); }
  };

  const write = (functionName: string, args: any[]) =>
    walletClient!.writeContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI as any, functionName, args, account: userAddress!, chain: walletClient!.chain });

  const handleDeposit = () => exec("deposit", async () => {
    const allowance = await publicClient.readContract({ address: project.paymentToken, abi: ERC20_ABI, functionName: "allowance", args: [userAddress!, CONTRACT_ADDRESS] }) as bigint;
    if (allowance < project.totalAmount) {
      const appHash = await walletClient!.writeContract({ address: project.paymentToken, abi: ERC20_ABI, functionName: "approve", args: [CONTRACT_ADDRESS, project.totalAmount], account: userAddress!, chain: walletClient!.chain });
      await publicClient.waitForTransactionReceipt({ hash: appHash });
    }
    return write("depositEscrow", [BigInt(projectId)]);
  });

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[var(--accent)]" /></div>;
  if (!project) return <div className="text-center py-20 text-sm text-[var(--text-tertiary)]">Project not found</div>;

  const progress = project.totalAmount > 0n ? Number((project.releasedAmount * 100n) / project.totalAmount) : 0;

  const statusConfig: Record<number, { bg: string; text: string; dot: string }> = {
    0: { bg: "bg-[var(--bg-elevated)]", text: "text-[var(--text-tertiary)]", dot: "bg-[var(--text-tertiary)]" },
    1: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
    2: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
    3: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
    4: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
  };

  const Btn = ({ onClick, isLoading, variant = "default", children }: any) => {
    const v: Record<string, string> = {
      default: "bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--bg)]",
      primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] btn-glow",
      success: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15",
      danger: "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/15",
      warning: "bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/15",
    };
    return (
      <button onClick={onClick} disabled={!!actionLoading}
        className={`flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl transition-all disabled:opacity-40 ${v[variant]}`}>
        {isLoading && <Loader2 size={13} className="animate-spin" />}{children}
      </button>
    );
  };

  const AddrRow = ({ label, addr, isYou, key: k }: { label: string; addr: string; isYou: boolean; key: string }) => (
    <div>
      <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">{label}</span>
      <div className="flex items-center gap-2 mt-1">
        <p className="mono text-[11px] text-[var(--text-secondary)]">
          {addr.slice(0, 8)}...{addr.slice(-6)}
          {isYou && <span className="text-[var(--accent-text)] ml-1.5 font-sans text-[10px] bg-[var(--accent-subtle)] px-1.5 py-0.5 rounded">you</span>}
        </p>
        <button onClick={() => copyAddr(addr, k)} className="p-1 rounded hover:bg-[var(--bg-elevated)] transition-colors">
          {copied === k ? <CheckCircle2 size={11} className="text-[var(--success)]" /> : <Copy size={11} className="text-[var(--text-tertiary)]" />}
        </button>
        <a href={getAddressExplorerUrl(addr)} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-[var(--bg-elevated)] transition-colors">
          <ExternalLink size={11} className="text-[var(--text-tertiary)]" />
        </a>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      {/* Project header */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="mono text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded-md font-bold">#{projectId}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${project.active ? "bg-emerald-500/10 text-emerald-400" : "bg-[var(--bg-elevated)] text-[var(--text-tertiary)]"}`}>
              {project.active ? "Active" : "Complete"}
            </span>
            {!project.funded && project.active && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400">Awaiting deposit</span>
            )}
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] text-[var(--text-tertiary)] mono">{token.symbol}</span>
          </div>
          <h2 className="text-xl font-bold mb-1">{project.name}</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-5">{project.description}</p>

          <div className="grid grid-cols-2 gap-4 text-xs mb-5">
            <AddrRow label="Client" addr={project.client} isYou={isClient} key="client" />
            <AddrRow label="Freelancer" addr={project.freelancer} isYou={isFreelancer} key="freelancer" />
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700 progress-glow" style={{ width: `${progress}%` }} />
            </div>
            <span className="mono text-xs text-[var(--text-secondary)] whitespace-nowrap font-medium">
              {formatUnits(project.releasedAmount, token.decimals)} / {formatUnits(project.totalAmount, token.decimals)} {token.symbol}
            </span>
          </div>

          {/* Deposit button */}
          {!project.funded && isClient && project.active && (
            <button onClick={handleDeposit} disabled={!!actionLoading}
              className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--accent-hover)] transition-all btn-glow disabled:opacity-50 shadow-lg shadow-indigo-500/20">
              {actionLoading === "deposit" && <Loader2 size={15} className="animate-spin" />}
              Deposit {formatUnits(project.totalAmount, token.decimals)} {token.symbol}
            </button>
          )}
        </div>
      </div>

      {/* Milestones */}
      <div className="stagger space-y-2">
        {milestones.map((m: any, i: number) => {
          const s = Number(m.status);
          const sc = statusConfig[s] || statusConfig[0];
          return (
            <div key={i} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 card-hover">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center shrink-0">
                    <span className="mono text-xs font-bold text-[var(--text-tertiary)]">{i + 1}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">{m.description}</h4>
                    <span className="mono text-xs text-[var(--text-tertiary)]">{formatUnits(m.amount, token.decimals)} {token.symbol}</span>
                  </div>
                </div>
                <span className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-lg ${sc.bg} ${sc.text}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                  {MILESTONE_STATUS[s]}
                </span>
              </div>

              {/* Auto-release info */}
              {s === 2 && m.submittedAt > 0n && (
                <div className="flex items-center gap-2 text-[11px] mb-3 px-3 py-2 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                  {m.autoReleasePaused ? (
                    <><PauseCircle size={13} className="text-amber-400" /><span className="text-[var(--text-secondary)]">Auto-release paused by client</span></>
                  ) : (
                    <><Clock size={13} className="text-[var(--text-tertiary)]" /><span className="text-[var(--text-secondary)]">Auto-releases 7 days after submission</span></>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {isFreelancer && s === 1 && (
                  <Btn onClick={() => exec(`sub-${i}`, () => write("submitMilestone", [BigInt(projectId), BigInt(i)]))} isLoading={actionLoading === `sub-${i}`} variant="primary">
                    <PlayCircle size={13} /> Submit for review
                  </Btn>
                )}
                {isClient && s === 2 && (
                  <>
                    <Btn onClick={() => exec(`app-${i}`, () => write("approveMilestone", [BigInt(projectId), BigInt(i)]))} isLoading={actionLoading === `app-${i}`} variant="success">
                      <CheckCircle2 size={13} /> Approve & release
                    </Btn>
                    <Btn onClick={() => exec(`rev-${i}`, () => write("requestRevision", [BigInt(projectId), BigInt(i)]))} isLoading={actionLoading === `rev-${i}`}>
                      Request revision
                    </Btn>
                    {!m.autoReleasePaused && (
                      <Btn onClick={() => exec(`pau-${i}`, () => write("pauseAutoRelease", [BigInt(projectId), BigInt(i)]))} isLoading={actionLoading === `pau-${i}`} variant="warning">
                        <PauseCircle size={13} /> Pause timer
                      </Btn>
                    )}
                  </>
                )}
                {s === 2 && !m.autoReleasePaused && (
                  <Btn onClick={() => exec(`auto-${i}`, () => write("triggerAutoRelease", [BigInt(projectId), BigInt(i)]))} isLoading={actionLoading === `auto-${i}`}>
                    <Clock size={13} /> Auto-release
                  </Btn>
                )}
                {(isClient || isFreelancer) && s === 2 && (
                  <Btn onClick={() => { const e = prompt("Describe the issue:"); if (e) exec(`dis-${i}`, () => write("fileDispute", [BigInt(projectId), BigInt(i), e])); }} isLoading={actionLoading === `dis-${i}`} variant="danger">
                    <AlertTriangle size={13} /> Dispute
                  </Btn>
                )}
                {s === 3 && (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                    <CheckCircle2 size={14} /> Released
                  </div>
                )}
                {s === 4 && (
                  <div className="flex items-center gap-1.5 text-[11px] text-red-400 font-medium">
                    <Shield size={14} /> Under arbitration
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Transaction feedback */}
      {txHash && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/15 rounded-xl text-xs text-emerald-400 animate-slide-down font-medium">
          <CheckCircle2 size={14} /> Confirmed
          <a href={getExplorerUrl(txHash)} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 hover:underline">
            View <ArrowUpRight size={11} />
          </a>
        </div>
      )}
      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/15 rounded-xl text-xs text-red-400 animate-slide-down font-medium">{error}</div>
      )}
    </div>
  );
}

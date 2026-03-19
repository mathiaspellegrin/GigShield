"use client";

import { useState, useEffect, useCallback } from "react";
import { formatUnits, type WalletClient, type Address } from "viem";
import { Clock, CheckCircle2, AlertTriangle, Loader2, PauseCircle, PlayCircle, Shield, ArrowUpRight } from "lucide-react";
import { publicClient, getExplorerUrl, MILESTONE_STATUS, ERC20_ABI } from "@/utils/contracts";
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

  const isClient = userAddress?.toLowerCase() === project?.client?.toLowerCase();
  const isFreelancer = userAddress?.toLowerCase() === project?.freelancer?.toLowerCase();

  const load = useCallback(async () => {
    try {
      const p = await publicClient.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI as any, functionName: "projects", args: [BigInt(projectId)] });
      const ms = await publicClient.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI as any, functionName: "getProjectMilestones", args: [BigInt(projectId)] });
      setProject(p); setMilestones(ms as any[]);
    } catch { setError("Failed to load project"); } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const exec = async (key: string, fn: () => Promise<`0x${string}`>) => {
    if (!walletClient || !userAddress) return;
    setActionLoading(key); setError(null); setTxHash(null);
    try {
      const hash = await fn(); setTxHash(hash);
      await publicClient.waitForTransactionReceipt({ hash });
      await load();
    } catch (err: any) { const msg = err?.shortMessage || err?.message || "Transaction failed"; setError(msg.length > 120 ? "Transaction failed." : msg); }
    finally { setActionLoading(null); }
  };

  const write = (functionName: string, args: any[]) =>
    walletClient!.writeContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI as any, functionName, args, account: userAddress!, chain: walletClient!.chain });

  const handleDeposit = () => exec("deposit", async () => {
    // Approve token first
    const allowance = await publicClient.readContract({ address: project.paymentToken, abi: ERC20_ABI, functionName: "allowance", args: [userAddress!, CONTRACT_ADDRESS] }) as bigint;
    if (allowance < project.totalAmount) {
      const appHash = await walletClient!.writeContract({ address: project.paymentToken, abi: ERC20_ABI, functionName: "approve", args: [CONTRACT_ADDRESS, project.totalAmount], account: userAddress!, chain: walletClient!.chain });
      await publicClient.waitForTransactionReceipt({ hash: appHash });
    }
    return write("depositEscrow", [BigInt(projectId)]);
  });

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={20} className="animate-spin text-[var(--text-tertiary)]" /></div>;
  if (!project) return <div className="text-center py-16 text-sm text-[var(--text-tertiary)]">Project not found</div>;

  const progress = project.totalAmount > 0n ? Number((project.releasedAmount * 100n) / project.totalAmount) : 0;
  const statusStyle = (s: number) => ["bg-[var(--bg-elevated)] text-[var(--text-tertiary)]", "bg-blue-50 text-blue-600", "bg-amber-50 text-amber-600", "bg-[var(--success-subtle)] text-[var(--success)]", "bg-[var(--danger-subtle)] text-[var(--danger)]"][s] || "";

  const Btn = ({ onClick, isLoading, variant = "default", children }: any) => {
    const v: Record<string, string> = { default: "border border-[var(--border)] hover:bg-[var(--bg-elevated)]", primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]", success: "bg-[var(--success)] text-white hover:opacity-90", danger: "border border-red-200 text-[var(--danger)] hover:bg-[var(--danger-subtle)]", warning: "border border-amber-200 text-[var(--warning)] hover:bg-[var(--warning-subtle)]" };
    return <button onClick={onClick} disabled={!!actionLoading} className={`flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-all disabled:opacity-40 ${v[variant]}`}>{isLoading && <Loader2 size={13} className="animate-spin" />}{children}</button>;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="mono text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded">#{projectId}</span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${project.active ? "bg-[var(--success-subtle)] text-[var(--success)]" : "bg-[var(--bg-elevated)] text-[var(--text-tertiary)]"}`}>{project.active ? "Active" : "Complete"}</span>
          {!project.funded && project.active && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--warning-subtle)] text-[var(--warning)]">Awaiting deposit</span>}
        </div>
        <h2 className="text-lg font-semibold">{project.name}</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5 mb-4">{project.description}</p>
        <div className="grid grid-cols-2 gap-4 text-xs mb-4">
          <div><span className="text-[var(--text-tertiary)]">Client</span><p className="mono text-[11px] mt-0.5">{project.client.slice(0,8)}...{project.client.slice(-6)}{isClient && <span className="text-[var(--accent-text)] ml-1 font-sans">(you)</span>}</p></div>
          <div><span className="text-[var(--text-tertiary)]">Freelancer</span><p className="mono text-[11px] mt-0.5">{project.freelancer.slice(0,8)}...{project.freelancer.slice(-6)}{isFreelancer && <span className="text-[var(--accent-text)] ml-1 font-sans">(you)</span>}</p></div>
        </div>
        <div className="flex items-center gap-3"><div className="flex-1 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden"><div className="h-full bg-[var(--accent)] rounded-full transition-all duration-700" style={{ width: `${progress}%` }} /></div><span className="mono text-[11px] text-[var(--text-secondary)] whitespace-nowrap">{formatUnits(project.releasedAmount, 6)} / {formatUnits(project.totalAmount, 6)} USDT</span></div>
        {!project.funded && isClient && project.active && <button onClick={handleDeposit} disabled={!!actionLoading} className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-[var(--accent)] text-white rounded-xl text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50">{actionLoading === "deposit" && <Loader2 size={15} className="animate-spin" />}Deposit {formatUnits(project.totalAmount, 6)} USDT</button>}
      </div>

      <div className="stagger space-y-2">{milestones.map((m: any, i: number) => {
        const s = Number(m.status);
        return (
          <div key={i} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-start justify-between gap-3 mb-3"><div className="flex items-center gap-2"><span className="mono text-[10px] text-[var(--text-tertiary)] w-4">{i+1}</span><div><h4 className="text-sm font-medium">{m.description}</h4><span className="mono text-xs text-[var(--text-tertiary)]">{formatUnits(m.amount, 6)} USDT</span></div></div><span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusStyle(s)}`}>{MILESTONE_STATUS[s]}</span></div>
            {s === 2 && m.submittedAt > 0n && <div className="flex items-center gap-2 text-[11px] mb-3 px-2.5 py-1.5 bg-[var(--bg)] rounded-md">{m.autoReleasePaused ? <><PauseCircle size={12} className="text-[var(--warning)]" /><span className="text-[var(--text-secondary)]">Auto-release paused</span></> : <><Clock size={12} className="text-[var(--text-tertiary)]" /><span className="text-[var(--text-secondary)]">Auto-releases 7 days after submission</span></>}</div>}
            <div className="flex flex-wrap gap-2">
              {isFreelancer && s === 1 && <Btn onClick={() => exec(`sub-${i}`, () => write("submitMilestone", [BigInt(projectId), BigInt(i)]))} isLoading={actionLoading === `sub-${i}`} variant="primary"><PlayCircle size={13} /> Submit for review</Btn>}
              {isClient && s === 2 && <><Btn onClick={() => exec(`app-${i}`, () => write("approveMilestone", [BigInt(projectId), BigInt(i)]))} isLoading={actionLoading === `app-${i}`} variant="success"><CheckCircle2 size={13} /> Approve & release</Btn><Btn onClick={() => exec(`rev-${i}`, () => write("requestRevision", [BigInt(projectId), BigInt(i)]))} isLoading={actionLoading === `rev-${i}`}>Request revision</Btn>{!m.autoReleasePaused && <Btn onClick={() => exec(`pau-${i}`, () => write("pauseAutoRelease", [BigInt(projectId), BigInt(i)]))} isLoading={actionLoading === `pau-${i}`} variant="warning"><PauseCircle size={13} /> Pause timer</Btn>}</>}
              {s === 2 && !m.autoReleasePaused && <Btn onClick={() => exec(`auto-${i}`, () => write("triggerAutoRelease", [BigInt(projectId), BigInt(i)]))} isLoading={actionLoading === `auto-${i}`}><Clock size={13} /> Auto-release</Btn>}
              {(isClient || isFreelancer) && s === 2 && <Btn onClick={() => { const e = prompt("Describe the issue:"); if (e) exec(`dis-${i}`, () => write("fileDispute", [BigInt(projectId), BigInt(i), e])); }} isLoading={actionLoading === `dis-${i}`} variant="danger"><AlertTriangle size={13} /> Dispute</Btn>}
              {s === 3 && <div className="flex items-center gap-1.5 text-[11px] text-[var(--success)]"><CheckCircle2 size={13} /> Released</div>}
              {s === 4 && <div className="flex items-center gap-1.5 text-[11px] text-[var(--danger)]"><Shield size={13} /> Under arbitration</div>}
            </div>
          </div>
        );
      })}</div>

      {txHash && <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--success-subtle)] border border-green-200 rounded-xl text-xs text-[var(--success)] animate-slide-down"><CheckCircle2 size={14} /> Confirmed <a href={getExplorerUrl(txHash)} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 hover:underline">View <ArrowUpRight size={11} /></a></div>}
      {error && <div className="px-4 py-2.5 bg-[var(--danger-subtle)] border border-red-200 rounded-xl text-xs text-[var(--danger)] animate-slide-down">{error}</div>}
    </div>
  );
}

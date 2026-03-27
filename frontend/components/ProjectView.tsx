"use client";

import { useState, useEffect, useCallback } from "react";
import { formatUnits, type WalletClient, type Address } from "viem";
import {
  Clock, CheckCircle2, AlertTriangle, Loader2, PauseCircle, PlayCircle,
  Shield, ArrowUpRight, ArrowRight, Copy, ExternalLink, Lock, Wallet, Send, Eye,
  CircleDot, Info, Banknote, X, Scale,
} from "lucide-react";
import { encodePacked, keccak256 } from "viem";
import { publicClient, getExplorerUrl, getAddressExplorerUrl, MILESTONE_STATUS, ERC20_ABI, getTokenByAddress, DISPUTE_STATUS } from "@/utils/contracts";
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

  // Dispute data for disputed milestones: milestoneIdx => dispute info
  const [disputeData, setDisputeData] = useState<Record<number, any>>({});

  // Modal state
  const [modal, setModal] = useState<{
    type: "dispute" | "approve" | "respond" | null;
    milestoneIdx: number;
  }>({ type: null, milestoneIdx: 0 });
  const [disputeText, setDisputeText] = useState("");

  const closeModal = () => { setModal({ type: null, milestoneIdx: 0 }); setDisputeText(""); };

  const isClient = userAddress?.toLowerCase() === project?.client?.toLowerCase();
  const isFreelancer = userAddress?.toLowerCase() === project?.freelancer?.toLowerCase();
  const isParty = isClient || isFreelancer;
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

      // Load dispute data for any disputed milestones
      const dData: Record<number, any> = {};
      for (let i = 0; i < ms.length; i++) {
        if (Number(ms[i].status) === 4) {
          try {
            const key = keccak256(encodePacked(["uint256", "uint256"], [BigInt(projectId), BigInt(i)]));
            const disputeId = await publicClient.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI as any, functionName: "milestoneDispute", args: [key] }) as bigint;
            const rawD: any = await publicClient.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI as any, functionName: "disputes", args: [disputeId] });
            const d = Array.isArray(rawD) ? {
              id: Number(disputeId), projectId: rawD[0], milestoneIndex: rawD[1], status: Number(rawD[2]),
              filedBy: rawD[3], clientEvidence: rawD[4], freelancerEvidence: rawD[5],
              filedAt: rawD[6], responseDeadline: rawD[7],
              votesForFreelancer: Number(rawD[8]), votesForClient: Number(rawD[9]),
              totalVotes: Number(rawD[10]), outcome: Number(rawD[11]),
            } : { ...rawD, id: Number(disputeId) };
            dData[i] = d;
          } catch {}
        }
      }
      setDisputeData(dData);
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
  const formattedTotal = formatUnits(project.totalAmount, token.decimals);
  const formattedReleased = formatUnits(project.releasedAmount, token.decimals);

  // Figure out current milestone index (first non-approved)
  const currentMilestoneIdx = milestones.findIndex((m: any) => Number(m.status) < 3);

  // Compute a human-readable "what's happening now" message
  const getProjectStatusInfo = () => {
    if (!project.active) return { icon: CheckCircle2, color: "emerald", label: "Completed", desc: `All milestones done. ${formattedReleased} ${token.symbol} released.` };
    if (!project.funded) {
      if (isClient) return { icon: Wallet, color: "amber", label: "Deposit Required", desc: `You need to deposit ${formattedTotal} ${token.symbol} to start the project.` };
      if (isFreelancer) return { icon: Clock, color: "amber", label: "Waiting for Client Deposit", desc: `The client hasn't deposited ${formattedTotal} ${token.symbol} yet. Work cannot begin until funds are locked in escrow.` };
      return { icon: Clock, color: "amber", label: "Awaiting Deposit", desc: `${formattedTotal} ${token.symbol} must be deposited before work begins.` };
    }
    // Funded and active
    const cm = currentMilestoneIdx >= 0 ? milestones[currentMilestoneIdx] : null;
    const cmStatus = cm ? Number(cm.status) : -1;
    if (cmStatus === 0) {
      // Pending — shouldn't happen if funded, but just in case
      return { icon: CircleDot, color: "blue", label: "Ready to Start", desc: "Funds are locked. The freelancer can begin work on the first milestone." };
    }
    if (cmStatus === 1) {
      if (isFreelancer) return { icon: Send, color: "blue", label: `Milestone ${currentMilestoneIdx + 1} — Your Turn`, desc: `You're working on "${cm.description}". Submit it for review when ready.` };
      if (isClient) return { icon: Clock, color: "blue", label: `Milestone ${currentMilestoneIdx + 1} — In Progress`, desc: `The freelancer is working on "${cm.description}". You'll review it once submitted.` };
      return { icon: CircleDot, color: "blue", label: `Milestone ${currentMilestoneIdx + 1} — In Progress`, desc: `Freelancer is working on "${cm.description}".` };
    }
    if (cmStatus === 2) {
      if (isClient) return { icon: Eye, color: "amber", label: `Milestone ${currentMilestoneIdx + 1} — Review Needed`, desc: `"${cm.description}" has been submitted. Approve to release ${formatUnits(cm.amount, token.decimals)} ${token.symbol}, or request a revision.` };
      if (isFreelancer) return { icon: Clock, color: "amber", label: `Milestone ${currentMilestoneIdx + 1} — Under Review`, desc: `You submitted "${cm.description}". Waiting for the client to approve or request revision.` };
      return { icon: Eye, color: "amber", label: `Milestone ${currentMilestoneIdx + 1} — Under Review`, desc: `"${cm.description}" is awaiting client review.` };
    }
    if (cmStatus === 4) {
      return { icon: Shield, color: "red", label: `Milestone ${currentMilestoneIdx + 1} — Disputed`, desc: `"${cm.description}" is under arbitration. A 3-person panel will resolve this.` };
    }
    return { icon: Lock, color: "indigo", label: "Funds Locked in Escrow", desc: `${formattedTotal} ${token.symbol} secured on-chain.` };
  };

  const statusInfo = getProjectStatusInfo();
  const statusColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    emerald: { bg: "bg-emerald-500/8", border: "border-emerald-500/15", text: "text-emerald-300", icon: "text-emerald-400" },
    amber: { bg: "bg-amber-500/8", border: "border-amber-500/15", text: "text-amber-300", icon: "text-amber-400" },
    blue: { bg: "bg-blue-500/8", border: "border-blue-500/15", text: "text-blue-300", icon: "text-blue-400" },
    red: { bg: "bg-red-500/8", border: "border-red-500/15", text: "text-red-300", icon: "text-red-400" },
    indigo: { bg: "bg-indigo-500/8", border: "border-indigo-500/15", text: "text-indigo-300", icon: "text-indigo-400" },
  };
  const sc = statusColors[statusInfo.color] || statusColors.indigo;

  const milestoneStatusConfig: Record<number, { bg: string; text: string; dot: string }> = {
    0: { bg: "bg-[var(--bg-elevated)]", text: "text-[var(--text-tertiary)]", dot: "bg-[var(--text-tertiary)]" },
    1: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
    2: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
    3: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
    4: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
  };

  // Human-readable milestone status with context
  const getMilestoneLabel = (s: number, milestoneIdx: number) => {
    if (s === 0) return "Pending";
    if (s === 1) return isFreelancer ? "In Progress (you)" : "In Progress";
    if (s === 2) return isClient ? "Needs Your Review" : "Submitted for Review";
    if (s === 3) return "Approved & Paid";
    if (s === 4) return "Disputed";
    return MILESTONE_STATUS[s];
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

  const AddrRow = ({ label, addr, isYou, k }: { label: string; addr: string; isYou: boolean; k: string }) => (
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

      {/* ──── Status Banner ──── */}
      <div className={`${sc.bg} border ${sc.border} rounded-2xl p-5`}>
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl ${sc.bg} flex items-center justify-center shrink-0 mt-0.5`}>
            <statusInfo.icon size={20} className={sc.icon} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`text-sm font-bold ${sc.text}`}>{statusInfo.label}</h3>
              {isParty && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/5 text-[var(--text-tertiary)]">{isClient ? "You are the Client" : "You are the Freelancer"}</span>}
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{statusInfo.desc}</p>
          </div>
        </div>
      </div>

      {/* ──── Project Header ──── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="mono text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded-md font-bold">#{projectId}</span>
            {project.active && project.funded && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                <Lock size={9} /> Funded
              </span>
            )}
            {project.active && !project.funded && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400">Not Funded</span>
            )}
            {!project.active && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] text-[var(--text-tertiary)]">Completed</span>
            )}
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] text-[var(--text-tertiary)] mono">{token.symbol}</span>
          </div>
          <h2 className="text-xl font-bold mb-1">{project.name}</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-5">{project.description}</p>

          <div className="grid grid-cols-2 gap-4 text-xs mb-5">
            <AddrRow label="Client" addr={project.client} isYou={isClient} k="client" />
            <AddrRow label="Freelancer" addr={project.freelancer} isYou={isFreelancer} k="freelancer" />
          </div>

          {/* Escrow summary */}
          <div className="bg-[var(--bg)] rounded-xl border border-[var(--border)] p-4 mb-1">
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="text-[var(--text-tertiary)] font-medium">Escrow</span>
              <span className={`font-semibold ${project.funded ? "text-emerald-400" : "text-amber-400"}`}>
                {project.funded ? "Funds Locked" : "No Funds Deposited"}
              </span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 h-2.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700 progress-glow" style={{ width: `${progress}%` }} />
              </div>
              <span className="mono text-xs text-[var(--text-secondary)] whitespace-nowrap font-semibold">
                {progress}%
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-tertiary)]">Released: <span className="mono font-medium text-[var(--text-secondary)]">{formattedReleased} {token.symbol}</span></span>
              <span className="text-[var(--text-tertiary)]">Total: <span className="mono font-medium text-[var(--text-secondary)]">{formattedTotal} {token.symbol}</span></span>
            </div>
          </div>

          {/* Deposit CTA for client */}
          {!project.funded && isClient && project.active && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-500/8 border border-amber-500/15 rounded-xl">
                <Info size={14} className="text-amber-400 shrink-0" />
                <p className="text-xs text-amber-300 leading-relaxed">
                  Deposit <span className="font-bold">{formattedTotal} {token.symbol}</span> to lock funds in the smart contract. The freelancer cannot access these funds until you approve each milestone.
                </p>
              </div>
              <button onClick={handleDeposit} disabled={!!actionLoading}
                className="w-full flex items-center justify-center gap-2.5 py-4 bg-[var(--accent)] text-white rounded-xl text-sm font-bold hover:bg-[var(--accent-hover)] transition-all btn-glow disabled:opacity-50 shadow-lg shadow-indigo-500/20">
                {actionLoading === "deposit" ? <Loader2 size={16} className="animate-spin" /> : <Banknote size={16} />}
                {actionLoading === "deposit" ? "Depositing..." : `Deposit ${formattedTotal} ${token.symbol}`}
              </button>
            </div>
          )}

          {/* Deposit CTA for freelancer (info only) */}
          {!project.funded && isFreelancer && project.active && (
            <div className="mt-4 flex items-center gap-2.5 px-4 py-3 bg-amber-500/8 border border-amber-500/15 rounded-xl">
              <Clock size={14} className="text-amber-400 shrink-0" />
              <p className="text-xs text-amber-300 leading-relaxed">
                Waiting for the client to deposit <span className="font-bold">{formattedTotal} {token.symbol}</span>. You'll be able to start work once funds are secured in escrow.
              </p>
            </div>
          )}

          {/* Funded confirmation for client */}
          {project.funded && isClient && project.active && progress === 0 && (
            <div className="mt-4 flex items-center gap-2.5 px-4 py-3 bg-emerald-500/8 border border-emerald-500/15 rounded-xl">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-300 leading-relaxed">
                <span className="font-bold">{formattedTotal} {token.symbol} deposited and locked.</span> The freelancer can now begin working. You'll review and approve each milestone to release payments.
              </p>
            </div>
          )}

          {/* Funded info for freelancer */}
          {project.funded && isFreelancer && project.active && progress === 0 && milestones.length > 0 && Number(milestones[0].status) === 1 && (
            <div className="mt-4 flex items-center gap-2.5 px-4 py-3 bg-blue-500/8 border border-blue-500/15 rounded-xl">
              <Send size={14} className="text-blue-400 shrink-0" />
              <p className="text-xs text-blue-300 leading-relaxed">
                Escrow funded! <span className="font-bold">Start working on Milestone 1</span> and submit it for review when complete.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ──── Milestones ──── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
            Milestones ({milestones.filter((m: any) => Number(m.status) === 3).length}/{milestones.length} complete)
          </h3>
        </div>

        <div className="space-y-2 stagger">
          {milestones.map((m: any, i: number) => {
            const s = Number(m.status);
            const msc = milestoneStatusConfig[s] || milestoneStatusConfig[0];
            const isCurrent = i === currentMilestoneIdx;

            return (
              <div key={i} className={`bg-[var(--bg-card)] border rounded-xl p-4 card-hover transition-all ${
                isCurrent ? "border-indigo-500/30 shadow-sm shadow-indigo-500/5" : "border-[var(--border)]"
              }`}>
                {/* Current milestone marker */}
                {isCurrent && isParty && (
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-indigo-400 mb-2">
                    <ArrowRight size={10} /> CURRENT MILESTONE
                  </div>
                )}

                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      s === 3 ? "bg-emerald-500/10" : isCurrent ? "bg-indigo-500/10" : "bg-[var(--bg-elevated)]"
                    }`}>
                      {s === 3 ? <CheckCircle2 size={14} className="text-emerald-400" /> :
                       <span className="mono text-xs font-bold text-[var(--text-tertiary)]">{i + 1}</span>}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">{m.description}</h4>
                      <span className="mono text-xs text-[var(--text-tertiary)]">{formatUnits(m.amount, token.decimals)} {token.symbol}</span>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap ${msc.bg} ${msc.text}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${msc.dot}`} />
                    {getMilestoneLabel(s, i)}
                  </span>
                </div>

                {/* Contextual help text */}
                {isParty && s === 0 && (
                  <div className="text-[11px] text-[var(--text-tertiary)] mb-2 pl-11">
                    {project.funded ? "This milestone will unlock after the previous one is approved." : "Waiting for escrow deposit to begin."}
                  </div>
                )}

                {isFreelancer && s === 1 && (
                  <div className="text-[11px] text-blue-400/70 mb-2 pl-11">
                    Complete this work, then click "Submit for review" to send it to the client.
                  </div>
                )}

                {isClient && s === 2 && (
                  <div className="text-[11px] text-amber-400/70 mb-2 pl-11">
                    The freelancer submitted this for your review. Approve to release payment, or request changes.
                  </div>
                )}

                {isFreelancer && s === 2 && (
                  <div className="text-[11px] text-amber-400/70 mb-2 pl-11">
                    Submitted and waiting for the client's review. Payment releases automatically after 7 days if no action is taken.
                  </div>
                )}

                {/* Auto-release info */}
                {s === 2 && m.submittedAt > 0n && (
                  <div className="flex items-center gap-2 text-[11px] mb-3 px-3 py-2 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                    {m.autoReleasePaused ? (
                      <><PauseCircle size={13} className="text-amber-400" /><span className="text-[var(--text-secondary)]">Auto-release paused by client — payment won't release automatically</span></>
                    ) : (
                      <><Clock size={13} className="text-[var(--text-tertiary)]" /><span className="text-[var(--text-secondary)]">Auto-releases {formatUnits(m.amount, token.decimals)} {token.symbol} to freelancer 7 days after submission</span></>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pl-11">
                  {isFreelancer && s === 1 && (
                    <Btn onClick={() => exec(`sub-${i}`, () => write("submitMilestone", [BigInt(projectId), BigInt(i)]))} isLoading={actionLoading === `sub-${i}`} variant="primary">
                      <Send size={13} /> Submit for Review
                    </Btn>
                  )}
                  {isClient && s === 2 && (
                    <>
                      <Btn onClick={() => setModal({ type: "approve", milestoneIdx: i })} isLoading={actionLoading === `app-${i}`} variant="success">
                        <CheckCircle2 size={13} /> Approve & Release {formatUnits(m.amount, token.decimals)} {token.symbol}
                      </Btn>
                      <Btn onClick={() => exec(`rev-${i}`, () => write("requestRevision", [BigInt(projectId), BigInt(i)]))} isLoading={actionLoading === `rev-${i}`}>
                        Request Revision
                      </Btn>
                      {!m.autoReleasePaused && (
                        <Btn onClick={() => exec(`pau-${i}`, () => write("pauseAutoRelease", [BigInt(projectId), BigInt(i)]))} isLoading={actionLoading === `pau-${i}`} variant="warning">
                          <PauseCircle size={13} /> Pause Auto-Release
                        </Btn>
                      )}
                    </>
                  )}
                  {s === 2 && !m.autoReleasePaused && (
                    <Btn onClick={() => exec(`auto-${i}`, () => write("triggerAutoRelease", [BigInt(projectId), BigInt(i)]))} isLoading={actionLoading === `auto-${i}`}>
                      <Clock size={13} /> Trigger Auto-Release
                    </Btn>
                  )}
                  {(isClient || isFreelancer) && s === 2 && (
                    <Btn onClick={() => setModal({ type: "dispute", milestoneIdx: i })} isLoading={actionLoading === `dis-${i}`} variant="danger">
                      <AlertTriangle size={13} /> Open Dispute
                    </Btn>
                  )}
                  {s === 3 && (
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-500/8 px-3 py-2 rounded-lg">
                      <CheckCircle2 size={14} /> {formatUnits(m.amount, token.decimals)} {token.symbol} released to freelancer
                    </div>
                  )}
                  {s === 4 && (() => {
                    const dd = disputeData[i];
                    if (!dd) return (
                      <div className="flex items-center gap-2 text-xs text-red-400 font-semibold bg-red-500/8 px-3 py-2 rounded-lg">
                        <Shield size={14} /> Disputed — loading details...
                      </div>
                    );

                    const disputeStatus = dd.status; // 1=Filed, 2=ResponsePeriod, 3=InArbitration, 4=Resolved
                    const filedByClient = dd.filedBy?.toLowerCase() === project.client?.toLowerCase();
                    const filedByYou = dd.filedBy?.toLowerCase() === userAddress?.toLowerCase();
                    const canRespond = isParty && !filedByYou && disputeStatus === 1;
                    const deadlineDate = dd.responseDeadline ? new Date(Number(dd.responseDeadline) * 1000) : null;
                    const deadlinePassed = deadlineDate ? deadlineDate < new Date() : false;

                    return (
                      <div className="space-y-2 w-full">
                        {/* Dispute status banner */}
                        <div className="bg-red-500/8 border border-red-500/15 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield size={14} className="text-red-400" />
                            <span className="text-xs font-bold text-red-400">
                              Dispute #{dd.id} — {DISPUTE_STATUS[disputeStatus] || "Unknown"}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--text-secondary)] mb-2">
                            Filed by {filedByYou ? "you" : filedByClient ? "the client" : "the freelancer"}
                          </p>

                          {/* Evidence */}
                          <div className="space-y-2 mt-3">
                            {dd.clientEvidence && (
                              <div className="bg-[var(--bg)] rounded-lg p-3 border border-[var(--border)]">
                                <span className="text-[10px] uppercase tracking-widest text-blue-400 font-semibold">Client Evidence</span>
                                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{dd.clientEvidence}</p>
                              </div>
                            )}
                            {dd.freelancerEvidence && (
                              <div className="bg-[var(--bg)] rounded-lg p-3 border border-[var(--border)]">
                                <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-semibold">Freelancer Evidence</span>
                                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{dd.freelancerEvidence}</p>
                              </div>
                            )}
                          </div>

                          {/* Response deadline */}
                          {disputeStatus === 1 && deadlineDate && (
                            <div className="flex items-center gap-2 mt-3 text-[11px]">
                              <Clock size={12} className="text-amber-400" />
                              <span className={deadlinePassed ? "text-red-400" : "text-amber-400"}>
                                {deadlinePassed
                                  ? "Response deadline has passed"
                                  : `Response deadline: ${deadlineDate.toLocaleString()}`
                                }
                              </span>
                            </div>
                          )}

                          {/* Votes if in arbitration */}
                          {disputeStatus >= 3 && (
                            <div className="mt-3 pt-3 border-t border-red-500/10">
                              <div className="flex items-center justify-between text-[11px] mb-1">
                                <span className="text-emerald-400">Freelancer: {dd.votesForFreelancer}/3</span>
                                <span className="text-red-400">Client: {dd.votesForClient}/3</span>
                              </div>
                              <div className="flex gap-1 h-1.5">
                                <div className="bg-emerald-500 rounded-full transition-all" style={{ width: `${(dd.votesForFreelancer / 3) * 100}%` }} />
                                <div className="flex-1 bg-[var(--bg-elevated)] rounded-full" />
                                <div className="bg-red-500 rounded-full transition-all" style={{ width: `${(dd.votesForClient / 3) * 100}%` }} />
                              </div>
                            </div>
                          )}

                          {/* Resolved outcome */}
                          {disputeStatus === 4 && (
                            <div className={`mt-3 px-3 py-2 rounded-lg text-xs font-semibold ${
                              dd.outcome === 1 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                            }`}>
                              <CheckCircle2 size={12} className="inline mr-1.5" />
                              {dd.outcome === 1 ? "Resolved: Released to freelancer" : "Resolved: Returned to client"}
                            </div>
                          )}
                        </div>

                        {/* Response CTA for the other party */}
                        {canRespond && !deadlinePassed && (
                          <button
                            onClick={() => setModal({ type: "respond", milestoneIdx: i })}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--accent)] text-white rounded-xl text-sm font-bold hover:bg-[var(--accent-hover)] transition-all btn-glow shadow-lg shadow-indigo-500/20"
                          >
                            <Send size={14} /> Submit Your Response
                          </button>
                        )}

                        {/* Assign Arbitrators button — available after response or after deadline */}
                        {(disputeStatus === 2 || (disputeStatus === 1 && deadlinePassed)) && (
                          <button
                            onClick={() => exec(`assign-${i}`, () => write("assignArbitrators", [BigInt(dd.id)]))}
                            disabled={!!actionLoading}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl text-sm font-bold hover:bg-indigo-500/15 transition-all disabled:opacity-40"
                          >
                            {actionLoading === `assign-${i}` ? <Loader2 size={14} className="animate-spin" /> : <Scale size={14} />}
                            Assign Arbitration Panel
                          </button>
                        )}

                        {/* Info for the party who filed */}
                        {filedByYou && disputeStatus === 1 && !deadlinePassed && (
                          <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-500/8 border border-amber-500/15 rounded-xl">
                            <Clock size={14} className="text-amber-400 shrink-0" />
                            <p className="text-xs text-amber-300">
                              Waiting for the {filedByClient ? "freelancer" : "client"} to respond. They have until {deadlineDate?.toLocaleString()} to submit their evidence.
                            </p>
                          </div>
                        )}

                        {/* Info when arbitration is in progress */}
                        {disputeStatus === 3 && (
                          <div className="flex items-center gap-2.5 px-4 py-3 bg-indigo-500/8 border border-indigo-500/15 rounded-xl">
                            <Info size={14} className="text-indigo-400 shrink-0" />
                            <p className="text-xs text-indigo-300">
                              A 3-person arbitration panel is reviewing this dispute. Votes: {dd.totalVotes}/3 cast.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ──── Approve Modal ──── */}
      {modal.type === "approve" && milestones[modal.milestoneIdx] && (() => {
        const m = milestones[modal.milestoneIdx];
        const idx = modal.milestoneIdx;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeModal}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 size={20} className="text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold">Approve & Release</h3>
                      <p className="text-xs text-[var(--text-tertiary)]">Milestone {idx + 1}</p>
                    </div>
                  </div>
                  <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors">
                    <X size={16} className="text-[var(--text-tertiary)]" />
                  </button>
                </div>

                {/* Content */}
                <div className="bg-[var(--bg)] rounded-xl border border-[var(--border)] p-4 mb-5 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Milestone</span>
                    <span className="font-semibold text-right max-w-[60%] truncate">{m.description}</span>
                  </div>
                  <div className="border-t border-[var(--border)]" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Amount to release</span>
                    <span className="mono font-bold gradient-text text-base">{formatUnits(m.amount, token.decimals)} {token.symbol}</span>
                  </div>
                  <div className="border-t border-[var(--border)]" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Recipient</span>
                    <span className="mono text-xs text-[var(--text-secondary)]">Freelancer</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-500/8 border border-amber-500/15 rounded-xl mb-5">
                  <Info size={14} className="text-amber-400 shrink-0" />
                  <p className="text-[11px] text-amber-300 leading-relaxed">
                    This action is irreversible. Funds will be transferred to the freelancer immediately.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button onClick={closeModal}
                    className="flex-1 py-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm font-medium hover:bg-[var(--bg)] transition-all">
                    Cancel
                  </button>
                  <button
                    onClick={() => { closeModal(); exec(`app-${idx}`, () => write("approveMilestone", [BigInt(projectId), BigInt(idx)])); }}
                    disabled={!!actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-400 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                  >
                    {actionLoading === `app-${idx}` ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                    Confirm Release
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ──── Dispute Modal ──── */}
      {modal.type === "dispute" && milestones[modal.milestoneIdx] && (() => {
        const m = milestones[modal.milestoneIdx];
        const idx = modal.milestoneIdx;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeModal}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                      <AlertTriangle size={20} className="text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold">Open a Dispute</h3>
                      <p className="text-xs text-[var(--text-tertiary)]">Milestone {idx + 1}: {m.description}</p>
                    </div>
                  </div>
                  <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors">
                    <X size={16} className="text-[var(--text-tertiary)]" />
                  </button>
                </div>

                {/* Info */}
                <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-500/8 border border-amber-500/15 rounded-xl mb-5">
                  <Info size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-amber-300 leading-relaxed space-y-1">
                    <p>A dispute will pause this milestone and assign a <span className="font-bold">3-person arbitration panel</span> to review the case.</p>
                    <p>The other party has <span className="font-bold">48 hours</span> to submit their response before arbitrators vote.</p>
                  </div>
                </div>

                {/* Evidence input */}
                <div className="mb-5">
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Your Evidence</label>
                  <textarea
                    value={disputeText}
                    onChange={(e) => setDisputeText(e.target.value)}
                    placeholder="Describe the issue clearly. Include specific details about what went wrong, deadlines missed, or deliverables not matching the agreed scope..."
                    rows={4}
                    className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm placeholder:text-[var(--text-tertiary)] resize-none transition-all leading-relaxed"
                    autoFocus
                  />
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-1.5">This will be stored on-chain and visible to arbitrators.</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button onClick={closeModal}
                    className="flex-1 py-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm font-medium hover:bg-[var(--bg)] transition-all">
                    Cancel
                  </button>
                  <button
                    onClick={() => { const text = disputeText; closeModal(); exec(`dis-${idx}`, () => write("fileDispute", [BigInt(projectId), BigInt(idx), text])); }}
                    disabled={!disputeText.trim() || !!actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-400 transition-all disabled:opacity-40 shadow-lg shadow-red-500/20"
                  >
                    {actionLoading === `dis-${idx}` ? <Loader2 size={15} className="animate-spin" /> : <AlertTriangle size={15} />}
                    File Dispute
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ──── Respond to Dispute Modal ──── */}
      {modal.type === "respond" && (() => {
        const idx = modal.milestoneIdx;
        const dd = disputeData[idx];
        if (!dd) return null;
        const filedByClient = dd.filedBy?.toLowerCase() === project?.client?.toLowerCase();
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeModal}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                      <Send size={20} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold">Submit Your Response</h3>
                      <p className="text-xs text-[var(--text-tertiary)]">Dispute #{dd.id} — Milestone {idx + 1}</p>
                    </div>
                  </div>
                  <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors">
                    <X size={16} className="text-[var(--text-tertiary)]" />
                  </button>
                </div>

                {/* Their evidence */}
                <div className="bg-[var(--bg)] rounded-xl border border-[var(--border)] p-4 mb-4">
                  <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] font-semibold">
                    {filedByClient ? "Client" : "Freelancer"}'s Claim
                  </span>
                  <p className="text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                    {filedByClient ? dd.clientEvidence : dd.freelancerEvidence}
                  </p>
                </div>

                {/* Info */}
                <div className="flex items-start gap-2.5 px-4 py-3 bg-indigo-500/8 border border-indigo-500/15 rounded-xl mb-4">
                  <Info size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-indigo-300 leading-relaxed space-y-1">
                    <p>Present your side of the story. A <span className="font-bold">3-person arbitration panel</span> will review both parties' evidence and vote on the outcome.</p>
                    <p>Your response will be stored on-chain and is permanent.</p>
                  </div>
                </div>

                {/* Response input */}
                <div className="mb-5">
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Your Evidence</label>
                  <textarea
                    value={disputeText}
                    onChange={(e) => setDisputeText(e.target.value)}
                    placeholder="Explain your position. Include details about the work delivered, agreements made, communications, or any relevant context..."
                    rows={4}
                    className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm placeholder:text-[var(--text-tertiary)] resize-none transition-all leading-relaxed"
                    autoFocus
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button onClick={closeModal}
                    className="flex-1 py-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm font-medium hover:bg-[var(--bg)] transition-all">
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const text = disputeText;
                      const disputeId = dd.id;
                      closeModal();
                      exec(`resp-${idx}`, () => write("submitDisputeResponse", [BigInt(disputeId), text]));
                    }}
                    disabled={!disputeText.trim() || !!actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--accent)] text-white rounded-xl text-sm font-bold hover:bg-[var(--accent-hover)] transition-all btn-glow disabled:opacity-40 disabled:shadow-none"
                  >
                    {actionLoading === `resp-${idx}` ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    Submit Response
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ──── Transaction Feedback ──── */}
      {txHash && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/15 rounded-xl text-xs text-emerald-400 animate-slide-down font-medium">
          <CheckCircle2 size={14} /> Transaction Confirmed
          <a href={getExplorerUrl(txHash)} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1.5 hover:underline">
            View on ConfluxScan <ArrowUpRight size={11} />
          </a>
        </div>
      )}
      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/15 rounded-xl text-xs text-red-400 animate-slide-down font-medium">{error}</div>
      )}
    </div>
  );
}

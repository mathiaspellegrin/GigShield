"use client";

import { useState, useEffect, useCallback } from "react";
import { type WalletClient, type Address } from "viem";
import { Loader2, CheckCircle2, ArrowUpRight, Shield, User, ThumbsUp, ThumbsDown, ExternalLink, AlertTriangle } from "lucide-react";
import { publicClient, getExplorerUrl, DISPUTE_STATUS } from "@/utils/contracts";
import CONTRACT_ABI from "@/constants/abi.json";

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "") as Address;

interface Props { disputeId: number; walletClient: WalletClient | null; userAddress: Address | null; }

export default function DisputeView({ disputeId, walletClient, userAddress }: Props) {
  const [dispute, setDispute] = useState<any>(null);
  const [arbs, setArbs] = useState<string[]>([]);
  const [projectName, setProjectName] = useState("");
  const [milestoneName, setMilestoneName] = useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const [isArb, setIsArb] = useState(false);
  const [isParty, setIsParty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  const read = (fn: string, args: any[]) => publicClient.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI as any, functionName: fn, args });
  const write = (fn: string, args: any[]) => walletClient!.writeContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI as any, functionName: fn, args, account: userAddress!, chain: walletClient!.chain });

  const load = useCallback(async () => {
    try {
      const rawD: any = await read("disputes", [BigInt(disputeId)]);
      const d = Array.isArray(rawD) ? { projectId: rawD[0], milestoneIndex: rawD[1], status: rawD[2], filedBy: rawD[3], clientEvidence: rawD[4], freelancerEvidence: rawD[5], filedAt: rawD[6], responseDeadline: rawD[7], votesForFreelancer: rawD[8], votesForClient: rawD[9], totalVotes: rawD[10], outcome: rawD[11] } : rawD;
      const a: any = await read("getDisputeArbitrators", [BigInt(disputeId)]);
      setDispute(d); setArbs([...a]);
      const rawP: any = await read("projects", [d.projectId]);
      const p = Array.isArray(rawP) ? { client: rawP[0], freelancer: rawP[1], name: rawP[2] } : rawP;
      setProjectName(p.name);
      const ms: any = await read("getProjectMilestones", [d.projectId]);
      const milestone = Array.isArray(ms[Number(d.milestoneIndex)]) ? { description: ms[Number(d.milestoneIndex)][0] } : ms[Number(d.milestoneIndex)];
      setMilestoneName(milestone.description);
      const addr = userAddress?.toLowerCase() || "";
      setIsParty(addr === p.client?.toLowerCase() || addr === p.freelancer?.toLowerCase());
      const ia = a.some((x: string) => x.toLowerCase() === addr);
      setIsArb(ia);
      if (ia && userAddress) setHasVoted(await read("hasVoted", [BigInt(disputeId), userAddress]) as boolean);
    } catch { setError("Failed to load dispute"); } finally { setLoading(false); }
  }, [disputeId, userAddress]);

  useEffect(() => { load(); }, [load]);

  const exec = async (key: string, fn: () => Promise<`0x${string}`>) => {
    if (!walletClient || !userAddress) return;
    setActionLoading(key); setError(null); setTxHash(null);
    try { const hash = await fn(); setTxHash(hash); try { await publicClient.waitForTransactionReceipt({ hash, timeout: 60_000 }); } catch { await new Promise(r => setTimeout(r, 5000)); } await load(); }
    catch (err: any) { setError(err?.shortMessage || err?.message || "Transaction failed"); }
    finally { setActionLoading(null); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[var(--accent)]" /></div>;
  if (!dispute) return <div className="text-center py-20 text-sm text-[var(--text-tertiary)]">Dispute not found</div>;

  const status = Number(dispute.status);
  const outcome = Number(dispute.outcome);

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      {/* Header */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-red-500/5 to-transparent rounded-bl-full pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Shield size={14} className="text-red-400" />
            </div>
            <span className="mono text-xs text-[var(--text-tertiary)] font-bold">Dispute #{disputeId}</span>
            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg ${
              status === 4
                ? "bg-emerald-500/10 text-emerald-400"
                : status === 3
                ? "bg-indigo-500/10 text-indigo-400"
                : "bg-amber-500/10 text-amber-400"
            }`}>
              {DISPUTE_STATUS[status]}
            </span>
          </div>
          <h2 className="text-xl font-bold">{projectName}</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Milestone: {milestoneName}</p>

          {status === 4 && (
            <div className={`mt-5 px-5 py-4 rounded-xl text-sm font-semibold flex items-center gap-2.5 ${
              outcome === 1
                ? "bg-emerald-500/10 border border-emerald-500/15 text-emerald-400"
                : "bg-amber-500/10 border border-amber-500/15 text-amber-400"
            }`}>
              <CheckCircle2 size={16} />
              Resolved: {outcome === 1 ? "Released to freelancer" : "Returned to client"}
            </div>
          )}
        </div>
      </div>

      {/* Evidence */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <User size={13} className="text-blue-400" />
            </div>
            <span className="text-xs font-semibold">Client Evidence</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {dispute.clientEvidence || <span className="text-[var(--text-tertiary)] italic">No evidence submitted</span>}
          </p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <User size={13} className="text-emerald-400" />
            </div>
            <span className="text-xs font-semibold">Freelancer Evidence</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {dispute.freelancerEvidence || <span className="text-[var(--text-tertiary)] italic">No evidence submitted</span>}
          </p>
        </div>
      </div>

      {/* Response form */}
      {isParty && status === 1 && dispute.filedBy.toLowerCase() !== userAddress?.toLowerCase() && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">Submit Your Response</h3>
          <textarea value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder="Present your evidence..."
            rows={3} className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm placeholder:text-[var(--text-tertiary)] resize-none mb-3 transition-all" />
          <button
            onClick={() => exec("respond", () => write("submitDisputeResponse", [BigInt(disputeId), responseText]))}
            disabled={!responseText || !!actionLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--accent-hover)] transition-all btn-glow disabled:opacity-40 disabled:shadow-none"
          >
            {actionLoading === "respond" && <Loader2 size={14} className="animate-spin" />}
            Submit Response
          </button>
        </div>
      )}

      {/* Voting panel */}
      {isArb && status === 3 && !hasVoted && (
        <div className="bg-[var(--bg-card)] border-2 border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden animate-[border-glow_3s_ease-in-out_infinite]">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
          <div className="relative">
            <h3 className="text-base font-bold mb-1">Cast Your Vote</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-5">Review both parties' evidence carefully. Your vote is final and cannot be changed.</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => exec("vf", () => write("voteOnDispute", [BigInt(disputeId), true]))}
                disabled={!!actionLoading}
                className="flex flex-col items-center gap-3 p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all disabled:opacity-40 group"
              >
                {actionLoading === "vf"
                  ? <Loader2 size={24} className="animate-spin text-emerald-400" />
                  : <ThumbsUp size={24} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                }
                <span className="text-xs font-semibold text-emerald-400">Release to freelancer</span>
              </button>
              <button
                onClick={() => exec("vc", () => write("voteOnDispute", [BigInt(disputeId), false]))}
                disabled={!!actionLoading}
                className="flex flex-col items-center gap-3 p-5 bg-red-500/5 border border-red-500/20 rounded-xl hover:bg-red-500/10 hover:border-red-500/30 transition-all disabled:opacity-40 group"
              >
                {actionLoading === "vc"
                  ? <Loader2 size={24} className="animate-spin text-red-400" />
                  : <ThumbsDown size={24} className="text-red-400 group-hover:scale-110 transition-transform" />
                }
                <span className="text-xs font-semibold text-red-400">Return to client</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Already voted */}
      {isArb && hasVoted && status === 3 && (
        <div className="bg-[var(--bg-elevated)] rounded-xl p-5 text-center border border-[var(--border)]">
          <CheckCircle2 size={18} className="inline mr-2 text-[var(--success)]" />
          <span className="text-sm text-[var(--text-secondary)] font-medium">You've voted ({Number(dispute.totalVotes)}/3 votes cast)</span>
        </div>
      )}

      {/* Vote tally */}
      {status >= 3 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-4">Vote Tally</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-emerald-400 font-medium flex items-center gap-1.5"><ThumbsUp size={12} /> Freelancer</span>
                <span className="mono font-bold">{Number(dispute.votesForFreelancer)}/3</span>
              </div>
              <div className="h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${(Number(dispute.votesForFreelancer) / 3) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-red-400 font-medium flex items-center gap-1.5"><ThumbsDown size={12} /> Client</span>
                <span className="mono font-bold">{Number(dispute.votesForClient)}/3</span>
              </div>
              <div className="h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full transition-all duration-700" style={{ width: `${(Number(dispute.votesForClient) / 3) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Arbitrators */}
      {arbs.length > 0 && status >= 3 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">Panel</h3>
          <div className="space-y-2">
            {arbs.map((a, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-[var(--bg)] rounded-lg">
                <div className="w-6 h-6 rounded-md bg-[var(--bg-elevated)] flex items-center justify-center">
                  <span className="mono text-[10px] font-bold text-[var(--text-tertiary)]">{i + 1}</span>
                </div>
                <span className="mono text-xs text-[var(--text-secondary)]">{a.slice(0, 8)}...{a.slice(-6)}</span>
                {a.toLowerCase() === userAddress?.toLowerCase() && (
                  <span className="text-[10px] font-semibold text-[var(--accent-text)] bg-[var(--accent-subtle)] px-1.5 py-0.5 rounded">you</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction feedback */}
      {txHash && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/15 rounded-xl text-xs text-emerald-400 animate-slide-down font-medium">
          <CheckCircle2 size={14} /> Confirmed
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

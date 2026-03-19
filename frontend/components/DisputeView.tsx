"use client";

import { useState, useEffect, useCallback } from "react";
import { type WalletClient, type Address } from "viem";
import { Loader2, CheckCircle2, ArrowUpRight, Shield, User, ThumbsUp, ThumbsDown } from "lucide-react";
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

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={20} className="animate-spin text-[var(--text-tertiary)]" /></div>;
  if (!dispute) return <div className="text-center py-16 text-sm text-[var(--text-tertiary)]">Dispute not found</div>;

  const status = Number(dispute.status);
  const outcome = Number(dispute.outcome);

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3"><Shield size={16} className="text-[var(--danger)]" /><span className="mono text-[10px] text-[var(--text-tertiary)]">Dispute #{disputeId}</span>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status===4?"bg-[var(--success-subtle)] text-[var(--success)]":status===3?"bg-[var(--accent-subtle)] text-[var(--accent)]":"bg-[var(--warning-subtle)] text-[var(--warning)]"}`}>{DISPUTE_STATUS[status]}</span>
        </div>
        <h2 className="text-lg font-semibold">{projectName}</h2><p className="text-xs text-[var(--text-secondary)] mt-0.5">Milestone: {milestoneName}</p>
        {status === 4 && <div className={`mt-4 px-4 py-3 rounded-xl text-sm font-medium ${outcome===1?"bg-[var(--success-subtle)] text-[var(--success)]":"bg-[var(--warning-subtle)] text-[var(--warning)]"}`}>Resolved: {outcome===1?"Released to freelancer":"Returned to client"}</div>}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4"><div className="flex items-center gap-2 mb-3"><div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center"><User size={12} className="text-blue-600" /></div><span className="text-xs font-medium">Client</span></div><p className="text-sm text-[var(--text-secondary)] leading-relaxed">{dispute.clientEvidence || <span className="text-[var(--text-tertiary)] italic">No evidence submitted</span>}</p></div>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4"><div className="flex items-center gap-2 mb-3"><div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center"><User size={12} className="text-green-600" /></div><span className="text-xs font-medium">Freelancer</span></div><p className="text-sm text-[var(--text-secondary)] leading-relaxed">{dispute.freelancerEvidence || <span className="text-[var(--text-tertiary)] italic">No evidence submitted</span>}</p></div>
      </div>

      {isParty && status === 1 && dispute.filedBy.toLowerCase() !== userAddress?.toLowerCase() && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
          <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Submit Your Response</h3>
          <textarea value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder="Present your evidence..." rows={3} className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm placeholder:text-[var(--text-tertiary)] resize-none mb-3" />
          <button onClick={() => exec("respond", () => write("submitDisputeResponse", [BigInt(disputeId), responseText]))} disabled={!responseText || !!actionLoading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--accent)] text-white rounded-lg text-sm font-medium disabled:opacity-40">{actionLoading==="respond" && <Loader2 size={14} className="animate-spin" />}Submit Response</button>
        </div>
      )}

      {isArb && status === 3 && !hasVoted && (
        <div className="bg-[var(--bg-card)] border-2 border-[var(--accent)] rounded-2xl p-5">
          <h3 className="text-sm font-semibold mb-1">Cast Your Vote</h3><p className="text-xs text-[var(--text-secondary)] mb-4">Review both parties' evidence. Your vote is final.</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => exec("vf", () => write("voteOnDispute", [BigInt(disputeId), true]))} disabled={!!actionLoading} className="flex flex-col items-center gap-2 p-4 border border-green-200 rounded-xl hover:bg-[var(--success-subtle)] transition-colors disabled:opacity-40">{actionLoading==="vf"?<Loader2 size={20} className="animate-spin" />:<ThumbsUp size={20} className="text-[var(--success)]" />}<span className="text-xs font-medium">Release to freelancer</span></button>
            <button onClick={() => exec("vc", () => write("voteOnDispute", [BigInt(disputeId), false]))} disabled={!!actionLoading} className="flex flex-col items-center gap-2 p-4 border border-red-200 rounded-xl hover:bg-[var(--danger-subtle)] transition-colors disabled:opacity-40">{actionLoading==="vc"?<Loader2 size={20} className="animate-spin" />:<ThumbsDown size={20} className="text-[var(--danger)]" />}<span className="text-xs font-medium">Return to client</span></button>
          </div>
        </div>
      )}

      {isArb && hasVoted && status === 3 && <div className="bg-[var(--bg-elevated)] rounded-xl p-4 text-center text-sm text-[var(--text-secondary)]"><CheckCircle2 size={16} className="inline mr-1.5 text-[var(--success)]" />You've voted ({Number(dispute.totalVotes)}/3).</div>}

      {status >= 3 && <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Votes</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1"><div className="flex justify-between text-xs mb-1"><span className="text-[var(--success)]">Freelancer</span><span className="mono">{Number(dispute.votesForFreelancer)}</span></div><div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden"><div className="h-full bg-[var(--success)] rounded-full" style={{width:`${(Number(dispute.votesForFreelancer)/3)*100}%`}} /></div></div>
          <div className="flex-1"><div className="flex justify-between text-xs mb-1"><span className="text-[var(--danger)]">Client</span><span className="mono">{Number(dispute.votesForClient)}</span></div><div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden"><div className="h-full bg-[var(--danger)] rounded-full" style={{width:`${(Number(dispute.votesForClient)/3)*100}%`}} /></div></div>
        </div>
      </div>}

      {txHash && <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--success-subtle)] border border-green-200 rounded-xl text-xs text-[var(--success)] animate-slide-down"><CheckCircle2 size={14} /> Confirmed <a href={getExplorerUrl(txHash)} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 hover:underline">View <ArrowUpRight size={11} /></a></div>}
      {error && <div className="px-4 py-2.5 bg-[var(--danger-subtle)] border border-red-200 rounded-xl text-xs text-[var(--danger)] animate-slide-down">{error}</div>}
    </div>
  );
}

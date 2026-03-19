"use client";

import { useState, useEffect, useCallback } from "react";
import { type WalletClient, type Address } from "viem";
import { Scale, Loader2, CheckCircle2, ArrowRight, AlertTriangle } from "lucide-react";
import { publicClient } from "@/utils/contracts";
import CONTRACT_ABI from "@/constants/abi.json";

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "") as Address;

interface DisputeSummary { id: number; projectId: number; milestoneIndex: number; status: number; hasVoted: boolean; outcome: number; }
interface Props { walletClient: WalletClient | null; userAddress: string; onViewDispute: (id: number) => void; }

export default function ArbitratorDashboard({ walletClient, userAddress, onViewDispute }: Props) {
  const [disputes, setDisputes] = useState<DisputeSummary[]>([]);
  const [isArb, setIsArb] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const arb = await publicClient.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI as any, functionName: "isArbitrator", args: [userAddress as Address] }) as boolean;
      setIsArb(arb);
      if (!arb) { setLoading(false); return; }
      const cnt = Number(await publicClient.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI as any, functionName: "disputeCount" }) as bigint);
      const found: DisputeSummary[] = [];
      for (let i = 0; i < cnt; i++) {
        const raw: any = await publicClient.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI as any, functionName: "disputes", args: [BigInt(i)] });
        const d = Array.isArray(raw) ? { projectId: raw[0], milestoneIndex: raw[1], status: raw[2], filedBy: raw[3], clientEvidence: raw[4], freelancerEvidence: raw[5], filedAt: raw[6], responseDeadline: raw[7], votesForFreelancer: raw[8], votesForClient: raw[9], totalVotes: raw[10], outcome: raw[11] } : raw;
        const arbs: any = await publicClient.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI as any, functionName: "getDisputeArbitrators", args: [BigInt(i)] });
        if (arbs.some((a: string) => a.toLowerCase() === userAddress.toLowerCase())) {
          const voted = await publicClient.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI as any, functionName: "hasVoted", args: [BigInt(i), userAddress as Address] }) as boolean;
          found.push({ id: i, projectId: Number(d.projectId), milestoneIndex: Number(d.milestoneIndex), status: Number(d.status), hasVoted: voted, outcome: Number(d.outcome) });
        }
      }
      setDisputes(found.reverse());
    } catch {} finally { setLoading(false); }
  }, [userAddress]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={20} className="animate-spin text-[var(--text-tertiary)]" /></div>;
  if (!isArb) return (<div className="text-center py-16 animate-fade-in"><div className="w-12 h-12 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center mx-auto mb-4"><Scale size={20} className="text-[var(--text-tertiary)]" /></div><p className="text-sm text-[var(--text-secondary)]">Not registered as arbitrator</p></div>);

  const active = disputes.filter(d => d.status === 3 && !d.hasVoted);
  const resolved = disputes.filter(d => d.status === 4);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="grid grid-cols-3 gap-3">
        {[{ label: "Needs vote", value: active.length, color: "var(--accent)" },{ label: "Voted", value: disputes.filter(d => d.status===3 && d.hasVoted).length, color: "var(--warning)" },{ label: "Resolved", value: resolved.length, color: "var(--success)" }].map(s => (
          <div key={s.label} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 text-center"><p className="mono text-2xl font-bold" style={{color:s.color}}>{s.value}</p><p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mt-1">{s.label}</p></div>
        ))}
      </div>
      {active.length > 0 && <div><h3 className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Awaiting Your Vote</h3><div className="stagger space-y-2">{active.map(d => (
        <button key={d.id} onClick={() => onViewDispute(d.id)} className="w-full text-left bg-[var(--bg-card)] border border-[var(--accent)] border-opacity-30 rounded-xl p-4 card-hover group"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-[var(--accent-subtle)] flex items-center justify-center"><AlertTriangle size={14} className="text-[var(--accent)]" /></div><div><p className="text-sm font-medium">Dispute #{d.id}</p><p className="text-[11px] text-[var(--text-tertiary)]">Project #{d.projectId}, Milestone #{d.milestoneIndex+1}</p></div></div><ArrowRight size={14} className="text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" /></div></button>
      ))}</div></div>}
      {disputes.length === 0 && <div className="text-center py-12"><p className="text-sm text-[var(--text-secondary)]">No disputes assigned yet</p></div>}
    </div>
  );
}

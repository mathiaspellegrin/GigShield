"use client";

import { useState, useEffect, useCallback } from "react";
import { type WalletClient, type Address } from "viem";
import { Scale, Loader2, CheckCircle2, ArrowRight, AlertTriangle, ChevronRight, Gavel, Clock } from "lucide-react";
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

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[var(--accent)]" /></div>;

  if (!isArb) return (
    <div className="text-center py-20 animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center mx-auto mb-5">
        <Scale size={22} className="text-[var(--text-tertiary)]" />
      </div>
      <p className="text-sm text-[var(--text-secondary)] font-medium">Not registered as arbitrator</p>
      <p className="text-xs text-[var(--text-tertiary)] mt-1">Contact the contract owner to register</p>
    </div>
  );

  const active = disputes.filter(d => d.status === 3 && !d.hasVoted);
  const voted = disputes.filter(d => d.status === 3 && d.hasVoted);
  const resolved = disputes.filter(d => d.status === 4);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 stagger">
        {[
          { label: "Needs vote", value: active.length, gradient: "from-indigo-500/10 to-purple-500/5", color: "text-indigo-400" },
          { label: "Voted", value: voted.length, gradient: "from-amber-500/10 to-orange-500/5", color: "text-amber-400" },
          { label: "Resolved", value: resolved.length, gradient: "from-emerald-500/10 to-teal-500/5", color: "text-emerald-400" },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.gradient} bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 text-center`}>
            <p className={`mono text-3xl font-bold ${s.color} number-glow`}>{s.value}</p>
            <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] mt-1.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Active disputes */}
      {active.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-3 flex items-center gap-2">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-indigo-400" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-indigo-400 animate-ping opacity-30" />
            </div>
            Awaiting Your Vote
          </h3>
          <div className="stagger space-y-2">
            {active.map(d => (
              <button
                key={d.id}
                onClick={() => onViewDispute(d.id)}
                className="w-full text-left bg-[var(--bg-card)] border border-indigo-500/20 rounded-xl p-4 card-hover group animate-[border-glow_3s_ease-in-out_infinite]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                      <Gavel size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Dispute #{d.id}</p>
                      <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Project #{d.projectId} &middot; Milestone {d.milestoneIndex + 1}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Voted disputes */}
      {voted.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-3 flex items-center gap-2">
            <Clock size={12} /> Awaiting Resolution
          </h3>
          <div className="space-y-2">
            {voted.map(d => (
              <button key={d.id} onClick={() => onViewDispute(d.id)} className="w-full text-left bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 card-hover group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <CheckCircle2 size={16} className="text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Dispute #{d.id}</p>
                      <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Voted &middot; Waiting for other arbitrators</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {disputes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-[var(--text-secondary)]">No disputes assigned yet</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">You'll be notified when you're selected for a panel</p>
        </div>
      )}
    </div>
  );
}

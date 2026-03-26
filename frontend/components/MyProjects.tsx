"use client";

import { useState, useEffect, useCallback } from "react";
import { formatUnits, type Address } from "viem";
import { Loader2, Briefcase, ChevronRight, Lock, Clock, Eye, Send, CheckCircle2, Shield } from "lucide-react";
import { publicClient, getTokenByAddress } from "@/utils/contracts";
import CONTRACT_ABI from "@/constants/abi.json";

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "") as Address;

interface ProjectSummary {
  id: number; name: string; totalAmount: bigint; releasedAmount: bigint;
  active: boolean; funded: boolean; role: "client" | "freelancer"; paymentToken: string;
  milestoneCount: number; currentStatus: number; // status of the first non-approved milestone
}
interface Props { userAddress: string; onSelectProject: (id: number) => void; }

export default function MyProjects({ userAddress, onSelectProject }: Props) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const count = await publicClient.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI as any, functionName: "projectCount" }) as bigint;
      const found: ProjectSummary[] = [];
      for (let i = 0; i < Number(count); i++) {
        const raw: any = await publicClient.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI as any, functionName: "projects", args: [BigInt(i)] });
        const p = Array.isArray(raw) ? { client: raw[0], freelancer: raw[1], name: raw[2], description: raw[3], paymentToken: raw[4], totalAmount: raw[5], releasedAmount: raw[6], milestoneCount: raw[7], createdAt: raw[8], active: raw[9], funded: raw[10] } : raw;
        const isC = p.client?.toLowerCase() === userAddress.toLowerCase();
        const isF = p.freelancer?.toLowerCase() === userAddress.toLowerCase();
        if (isC || isF) {
          // Get current milestone status
          let currentStatus = -1;
          try {
            const rawMs = await publicClient.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI as any, functionName: "getProjectMilestones", args: [BigInt(i)] }) as any[];
            const first = rawMs.find((m: any) => {
              const status = Number(Array.isArray(m) ? m[2] : m.status);
              return status < 3; // first non-approved
            });
            if (first) currentStatus = Number(Array.isArray(first) ? first[2] : first.status);
          } catch {}
          found.push({
            id: i, name: p.name, totalAmount: p.totalAmount, releasedAmount: p.releasedAmount,
            active: p.active, funded: p.funded, role: isC ? "client" : "freelancer",
            paymentToken: p.paymentToken, milestoneCount: Number(p.milestoneCount), currentStatus,
          });
        }
      }
      setProjects(found.reverse());
    } catch {} finally { setLoading(false); }
  }, [userAddress]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-[var(--accent)]" /></div>;

  if (projects.length === 0) return (
    <div className="text-center py-20 animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center mx-auto mb-5">
        <Briefcase size={22} className="text-[var(--text-tertiary)]" />
      </div>
      <p className="text-[var(--text-secondary)] text-sm font-medium">No projects yet</p>
      <p className="text-[var(--text-tertiary)] text-xs mt-1">Create your first project to get started</p>
    </div>
  );

  // Get a short action hint for the project card
  const getActionHint = (p: ProjectSummary): { text: string; icon: typeof Clock; color: string } => {
    if (!p.active) return { text: "Completed", icon: CheckCircle2, color: "text-emerald-400" };
    if (!p.funded) {
      if (p.role === "client") return { text: "You need to deposit funds", icon: Lock, color: "text-amber-400" };
      return { text: "Waiting for client deposit", icon: Clock, color: "text-amber-400" };
    }
    // Funded & active
    if (p.currentStatus === 1) {
      if (p.role === "freelancer") return { text: "Your turn — submit work", icon: Send, color: "text-blue-400" };
      return { text: "Freelancer is working", icon: Clock, color: "text-blue-400" };
    }
    if (p.currentStatus === 2) {
      if (p.role === "client") return { text: "Your review needed", icon: Eye, color: "text-amber-400" };
      return { text: "Waiting for client review", icon: Clock, color: "text-amber-400" };
    }
    if (p.currentStatus === 4) return { text: "Dispute in progress", icon: Shield, color: "text-red-400" };
    if (p.currentStatus === -1) return { text: "All milestones done", icon: CheckCircle2, color: "text-emerald-400" };
    return { text: "In progress", icon: Clock, color: "text-[var(--text-tertiary)]" };
  };

  return (
    <div className="stagger space-y-2">
      {projects.map((p) => {
        const progress = p.totalAmount > 0n ? Number((p.releasedAmount * 100n) / p.totalAmount) : 0;
        const token = getTokenByAddress(p.paymentToken);
        const hint = getActionHint(p);
        const approvedCount = p.currentStatus === -1 ? p.milestoneCount : 0; // simplification

        return (
          <button
            key={p.id}
            onClick={() => onSelectProject(p.id)}
            className="w-full text-left bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 card-hover group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Top row: badges */}
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="mono text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded-md font-bold">#{p.id}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                    p.role === "client" ? "bg-indigo-500/10 text-indigo-400" : "bg-emerald-500/10 text-emerald-400"
                  }`}>
                    {p.role === "client" ? "Client" : "Freelancer"}
                  </span>
                  {p.active && p.funded && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                      <Lock size={8} /> Funded
                    </span>
                  )}
                  {p.active && !p.funded && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400">Not Funded</span>
                  )}
                  {!p.active && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] text-[var(--text-tertiary)]">Complete</span>
                  )}
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] text-[var(--text-tertiary)] mono">{token.symbol}</span>
                </div>

                {/* Project name */}
                <h3 className="font-semibold text-sm truncate mb-1.5">{p.name}</h3>

                {/* Action hint */}
                <div className={`flex items-center gap-1.5 text-[11px] font-medium mb-2.5 ${hint.color}`}>
                  <hint.icon size={12} />
                  {hint.text}
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        background: p.active ? "linear-gradient(90deg, #6366f1, #8b5cf6)" : "var(--success)",
                      }}
                    />
                  </div>
                  <span className="mono text-[10px] text-[var(--text-tertiary)] whitespace-nowrap">
                    {formatUnits(p.releasedAmount, token.decimals)} / {formatUnits(p.totalAmount, token.decimals)} {token.symbol}
                  </span>
                </div>
              </div>
              <div className="flex items-center mt-2 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5">
                <ChevronRight size={16} className="text-[var(--text-tertiary)]" />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

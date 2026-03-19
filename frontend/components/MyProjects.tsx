"use client";

import { useState, useEffect, useCallback } from "react";
import { formatUnits, type Address } from "viem";
import { Loader2, Briefcase, ArrowRight } from "lucide-react";
import { publicClient } from "@/utils/contracts";
import CONTRACT_ABI from "@/constants/abi.json";

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "") as Address;

interface ProjectSummary { id: number; name: string; totalAmount: bigint; releasedAmount: bigint; active: boolean; role: "client" | "freelancer"; }
interface Props { userAddress: string; onSelectProject: (id: number) => void; }

export default function MyProjects({ userAddress, onSelectProject }: Props) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const count = await publicClient.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI as any, functionName: "projectCount" }) as bigint;
      const found: ProjectSummary[] = [];
      for (let i = 0; i < Number(count); i++) {
        const p: any = await publicClient.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI as any, functionName: "projects", args: [BigInt(i)] });
        const isC = p.client.toLowerCase() === userAddress.toLowerCase();
        const isF = p.freelancer.toLowerCase() === userAddress.toLowerCase();
        if (isC || isF) found.push({ id: i, name: p.name, totalAmount: p.totalAmount, releasedAmount: p.releasedAmount, active: p.active, role: isC ? "client" : "freelancer" });
      }
      setProjects(found.reverse());
    } catch {} finally { setLoading(false); }
  }, [userAddress]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 size={20} className="animate-spin text-[var(--text-tertiary)]" /></div>;
  if (projects.length === 0) return (<div className="text-center py-16 animate-fade-in"><div className="w-12 h-12 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center mx-auto mb-4"><Briefcase size={20} className="text-[var(--text-tertiary)]" /></div><p className="text-[var(--text-secondary)] text-sm">No projects yet</p></div>);

  return (
    <div className="stagger space-y-2">{projects.map((p) => {
      const progress = p.totalAmount > 0n ? Number((p.releasedAmount * 100n) / p.totalAmount) : 0;
      return (
        <button key={p.id} onClick={() => onSelectProject(p.id)} className="w-full text-left bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 card-hover group">
          <div className="flex items-start justify-between gap-4"><div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1"><span className="mono text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded">#{p.id}</span><span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${p.role === "client" ? "bg-[var(--accent-subtle)] text-[var(--accent-text)]" : "bg-[var(--success-subtle)] text-[var(--success)]"}`}>{p.role === "client" ? "Client" : "Freelancer"}</span></div>
            <h3 className="font-medium text-sm truncate">{p.name}</h3>
            <div className="flex items-center gap-3 mt-2"><div className="flex-1 h-1 bg-[var(--bg-elevated)] rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: p.active ? "var(--accent)" : "var(--success)" }} /></div><span className="mono text-[10px] text-[var(--text-tertiary)] whitespace-nowrap">{formatUnits(p.releasedAmount, 6)} / {formatUnits(p.totalAmount, 6)}</span></div>
          </div><div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><ArrowRight size={14} className="text-[var(--text-tertiary)]" /></div></div>
        </button>
      );
    })}</div>
  );
}

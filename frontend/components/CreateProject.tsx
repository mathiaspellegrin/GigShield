"use client";

import { useState } from "react";
import { parseUnits, type WalletClient, type Address } from "viem";
import { Plus, Trash2, Loader2, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";
import { publicClient, getExplorerUrl, USDT0_ADDRESS } from "@/utils/contracts";
import CONTRACT_ABI from "@/constants/abi.json";

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "") as Address;

interface Milestone { description: string; amount: string; }
interface Props { walletClient: WalletClient | null; account: Address | null; onProjectCreated: (id: number) => void; }

export default function CreateProject({ walletClient, account, onProjectCreated }: Props) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [freelancerAddress, setFreelancerAddress] = useState("");
  const [tokenAddress, setTokenAddress] = useState(USDT0_ADDRESS as string);
  const [milestones, setMilestones] = useState<Milestone[]>([{ description: "", amount: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<number | null>(null);

  const totalAmount = milestones.reduce((s, m) => s + (parseFloat(m.amount) || 0), 0);
  const addMilestone = () => { if (milestones.length < 20) setMilestones([...milestones, { description: "", amount: "" }]); };
  const removeMilestone = (i: number) => { if (milestones.length > 1) setMilestones(milestones.filter((_, idx) => idx !== i)); };
  const updateMilestone = (i: number, field: keyof Milestone, value: string) => { const u = [...milestones]; u[i] = { ...u[i], [field]: value }; setMilestones(u); };

  const handleCreate = async () => {
    if (!walletClient || !account) return;
    setLoading(true); setError(null);
    try {
      const descs = milestones.map((m) => m.description);
      const amounts = milestones.map((m) => parseUnits(m.amount, 6));

      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS, abi: CONTRACT_ABI as any, functionName: "createProject",
        args: [freelancerAddress as Address, name, description, tokenAddress as Address, descs, amounts],
        account, chain: walletClient.chain,
      });
      setTxHash(hash);

      // Wait for confirmation with retry
      try {
        await publicClient.waitForTransactionReceipt({ hash, timeout: 60_000 });
      } catch {
        // Conflux RPC may not support eth_getTransactionReceipt polling perfectly
        // Wait a fixed time as fallback
        await new Promise(r => setTimeout(r, 5000));
      }

      // Read projectCount - 1 to get the new project ID
      const count = await publicClient.readContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI as any, functionName: "projectCount" }) as bigint;
      const id = Number(count) - 1;
      setProjectId(id);
      onProjectCreated(id);
      setStep(5);
    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || "Transaction failed";
      setError(msg.length > 100 ? "Transaction failed. Please try again." : msg);
    } finally { setLoading(false); }
  };

  if (step === 5) return (
    <div className="max-w-lg mx-auto animate-fade-in-up"><div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[var(--success-subtle)] flex items-center justify-center mx-auto mb-5"><CheckCircle2 size={24} className="text-[var(--success)]" /></div>
      <h3 className="text-lg font-semibold mb-1">Project Created</h3><p className="text-sm text-[var(--text-secondary)] mb-5">Project #{projectId} is ready. Deposit funds to begin.</p>
      {txHash && <a href={getExplorerUrl(txHash)} target="_blank" rel="noopener noreferrer" className="mono text-xs text-[var(--accent-text)] hover:underline">View on ConfluxScan</a>}
    </div></div>
  );

  return (
    <div className="max-w-xl mx-auto animate-fade-in"><div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
      <div className="h-0.5 bg-[var(--bg-elevated)]"><div className="h-full bg-[var(--accent)] transition-all duration-500 ease-out" style={{ width: `${(step / 4) * 100}%` }} /></div>
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-semibold">New Project</h2><span className="mono text-xs text-[var(--text-tertiary)]">Step {step}/4</span></div>

        {step === 1 && (<div className="space-y-4 animate-fade-in">
          <div><label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Project name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Landing Page Redesign" className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm placeholder:text-[var(--text-tertiary)]" /></div>
          <div><label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the project scope..." rows={3} className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm placeholder:text-[var(--text-tertiary)] resize-none" /></div>
          <button onClick={() => setStep(2)} disabled={!name || !description} className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--text-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-30">Continue <ArrowRight size={15} /></button>
        </div>)}

        {step === 2 && (<div className="space-y-4 animate-fade-in">
          <div><label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Freelancer address</label><input type="text" value={freelancerAddress} onChange={(e) => setFreelancerAddress(e.target.value)} placeholder="0x..." className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg mono text-sm placeholder:text-[var(--text-tertiary)]" /></div>
          <div><label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Payment token</label><input type="text" value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} placeholder="USDT0 address" className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg mono text-sm placeholder:text-[var(--text-tertiary)]" /><p className="mt-1 text-[10px] text-[var(--text-tertiary)]">Pre-filled with USDT0 on Conflux eSpace</p></div>
          <div className="flex gap-3"><button onClick={() => setStep(1)} className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--bg-elevated)] transition-colors"><ArrowLeft size={15} /> Back</button><button onClick={() => setStep(3)} disabled={!freelancerAddress || !tokenAddress} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[var(--text-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-30">Continue <ArrowRight size={15} /></button></div>
        </div>)}

        {step === 3 && (<div className="space-y-4 animate-fade-in">
          <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Milestones</label>
          <div className="space-y-3">{milestones.map((m, i) => (<div key={i} className="flex gap-2 items-start p-3 bg-[var(--bg)] rounded-lg border border-[var(--border)]"><span className="mono text-[10px] text-[var(--text-tertiary)] mt-2.5 w-4 shrink-0">{i+1}</span><div className="flex-1 space-y-2"><input type="text" value={m.description} onChange={(e) => updateMilestone(i, "description", e.target.value)} placeholder="Milestone description" className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-md text-sm placeholder:text-[var(--text-tertiary)]" /><div className="flex items-center gap-2"><input type="number" value={m.amount} onChange={(e) => updateMilestone(i, "amount", e.target.value)} placeholder="0.00" className="flex-1 px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-md mono text-sm placeholder:text-[var(--text-tertiary)]" /><span className="mono text-xs text-[var(--text-tertiary)]">USDT</span></div></div>{milestones.length > 1 && <button onClick={() => removeMilestone(i)} className="p-1.5 mt-1.5 hover:bg-[var(--danger-subtle)] rounded-md transition-colors"><Trash2 size={13} className="text-[var(--text-tertiary)]" /></button>}</div>))}</div>
          <button onClick={addMilestone} className="flex items-center gap-1.5 text-xs text-[var(--accent-text)] font-medium hover:opacity-80 transition-opacity"><Plus size={14} /> Add milestone</button>
          <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]"><span className="text-xs text-[var(--text-secondary)]">Total</span><span className="mono text-sm font-semibold">{totalAmount.toFixed(2)} USDT</span></div>
          <div className="flex gap-3"><button onClick={() => setStep(2)} className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--bg-elevated)] transition-colors"><ArrowLeft size={15} /> Back</button><button onClick={() => setStep(4)} disabled={milestones.some((m) => !m.description || !m.amount || parseFloat(m.amount) <= 0)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[var(--text-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-30">Review <ArrowRight size={15} /></button></div>
        </div>)}

        {step === 4 && (<div className="space-y-4 animate-fade-in">
          <div className="bg-[var(--bg)] rounded-lg border border-[var(--border)] divide-y divide-[var(--border)]">
            <div className="p-4"><span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">Project</span><p className="font-medium text-sm mt-0.5">{name}</p></div>
            <div className="p-4"><span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">Freelancer</span><p className="mono text-xs mt-0.5">{freelancerAddress.slice(0,12)}...{freelancerAddress.slice(-8)}</p></div>
            <div className="p-4"><span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">Milestones</span><div className="mt-2 space-y-1.5">{milestones.map((m,i) => (<div key={i} className="flex items-center justify-between text-sm"><span className="text-[var(--text-secondary)]">{m.description}</span><span className="mono font-medium">{m.amount} USDT</span></div>))}</div><div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]"><span className="text-xs font-medium">Total</span><span className="mono text-sm font-bold">{totalAmount.toFixed(2)} USDT</span></div></div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2.5 bg-[var(--success-subtle)] rounded-lg"><div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" /><span className="text-xs text-[var(--success)]">Transactions are gas-free on Conflux</span></div>
          {error && <div className="px-3 py-2.5 bg-[var(--danger-subtle)] rounded-lg"><span className="text-xs text-[var(--danger)]">{error}</span></div>}
          <div className="flex gap-3"><button onClick={() => setStep(3)} disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--bg-elevated)] transition-colors disabled:opacity-50"><ArrowLeft size={15} /> Back</button><button onClick={handleCreate} disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50">{loading && <Loader2 size={15} className="animate-spin" />}{loading ? "Creating..." : "Create Project"}</button></div>
        </div>)}
      </div>
    </div></div>
  );
}

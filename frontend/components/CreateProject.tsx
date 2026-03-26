"use client";

import { useState } from "react";
import { parseUnits, type WalletClient, type Address } from "viem";
import { Plus, Trash2, Loader2, CheckCircle2, ArrowLeft, ArrowRight, Coins, ExternalLink } from "lucide-react";
import { publicClient, getExplorerUrl, SUPPORTED_TOKENS, getTokenByAddress } from "@/utils/contracts";
import CONTRACT_ABI from "@/constants/abi.json";

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "") as Address;

interface Milestone { description: string; amount: string; }
interface Props { walletClient: WalletClient | null; account: Address | null; onProjectCreated: (id: number) => void; }

export default function CreateProject({ walletClient, account, onProjectCreated }: Props) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [freelancerAddress, setFreelancerAddress] = useState("");
  const [tokenAddress, setTokenAddress] = useState(SUPPORTED_TOKENS[0].address as string);
  const [milestones, setMilestones] = useState<Milestone[]>([{ description: "", amount: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<number | null>(null);

  const totalAmount = milestones.reduce((s, m) => s + (parseFloat(m.amount) || 0), 0);
  const selectedToken = getTokenByAddress(tokenAddress);
  const addMilestone = () => { if (milestones.length < 20) setMilestones([...milestones, { description: "", amount: "" }]); };
  const removeMilestone = (i: number) => { if (milestones.length > 1) setMilestones(milestones.filter((_, idx) => idx !== i)); };
  const updateMilestone = (i: number, field: keyof Milestone, value: string) => { const u = [...milestones]; u[i] = { ...u[i], [field]: value }; setMilestones(u); };

  const handleCreate = async () => {
    if (!walletClient || !account) return;
    setLoading(true); setError(null);
    try {
      const descs = milestones.map((m) => m.description);
      const amounts = milestones.map((m) => parseUnits(m.amount, selectedToken.decimals));

      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS, abi: CONTRACT_ABI as any, functionName: "createProject",
        args: [freelancerAddress as Address, name, description, tokenAddress as Address, descs, amounts],
        account, chain: walletClient.chain,
      });
      setTxHash(hash);

      try {
        await publicClient.waitForTransactionReceipt({ hash, timeout: 60_000 });
      } catch {
        await new Promise(r => setTimeout(r, 5000));
      }

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

  // Step indicators
  const steps = ["Details", "Parties", "Milestones", "Review"];

  if (step === 5) return (
    <div className="max-w-lg mx-auto animate-fade-in-up">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-[var(--success-subtle)] border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={28} className="text-[var(--success)]" />
          </div>
          <h3 className="text-xl font-bold mb-2">Project Created</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-6">Project #{projectId} is ready. Deposit funds to begin.</p>
          {txHash && (
            <a href={getExplorerUrl(txHash)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mono text-xs text-[var(--accent-text)] hover:underline">
              View on ConfluxScan <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto animate-fade-in">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-0.5 bg-[var(--bg-elevated)]">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out progress-glow" style={{ width: `${(step / 4) * 100}%` }} />
        </div>

        <div className="p-6 md:p-8">
          {/* Step indicators */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold">New Project</h2>
            <div className="hidden sm:flex items-center gap-1">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center gap-1">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                    i + 1 === step
                      ? "bg-[var(--accent-subtle)] text-[var(--accent-text)]"
                      : i + 1 < step
                      ? "text-[var(--success)]"
                      : "text-[var(--text-tertiary)]"
                  }`}>
                    {i + 1 < step ? <CheckCircle2 size={10} /> : null}
                    {s}
                  </div>
                  {i < steps.length - 1 && <div className={`w-4 h-px ${i + 1 < step ? "bg-[var(--success)]" : "bg-[var(--border)]"}`} />}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Details */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Project name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Landing Page Redesign"
                  className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm placeholder:text-[var(--text-tertiary)] transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the project scope..." rows={3}
                  className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-sm placeholder:text-[var(--text-tertiary)] resize-none transition-all" />
              </div>
              <button onClick={() => setStep(2)} disabled={!name || !description}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--accent-hover)] transition-all btn-glow disabled:opacity-30 disabled:shadow-none">
                Continue <ArrowRight size={15} />
              </button>
            </div>
          )}

          {/* Step 2: Parties & Token */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Freelancer address</label>
                <input type="text" value={freelancerAddress} onChange={(e) => setFreelancerAddress(e.target.value)} placeholder="0x..."
                  className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl mono text-sm placeholder:text-[var(--text-tertiary)] transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Payment token</label>
                <div className="grid grid-cols-2 gap-2">
                  {SUPPORTED_TOKENS.map((t) => (
                    <button
                      key={t.address}
                      onClick={() => setTokenAddress(t.address)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                        tokenAddress === t.address
                          ? "border-[var(--accent)] bg-[var(--accent-subtle)] shadow-sm shadow-indigo-500/10"
                          : "border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)]"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tokenAddress === t.address ? "bg-[var(--accent)]/20" : "bg-[var(--bg-elevated)]"}`}>
                        <Coins size={14} className={tokenAddress === t.address ? "text-[var(--accent-text)]" : "text-[var(--text-tertiary)]"} />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${tokenAddress === t.address ? "text-[var(--accent-text)]" : ""}`}>{t.symbol}</p>
                        <p className="mono text-[10px] text-[var(--text-tertiary)]">{t.decimals}d</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm font-medium hover:bg-[var(--bg)] transition-all">
                  <ArrowLeft size={15} /> Back
                </button>
                <button onClick={() => setStep(3)} disabled={!freelancerAddress || !tokenAddress}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--accent-hover)] transition-all btn-glow disabled:opacity-30 disabled:shadow-none">
                  Continue <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Milestones */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Milestones</label>
              <div className="space-y-2">
                {milestones.map((m, i) => (
                  <div key={i} className="flex gap-2 items-start p-3.5 bg-[var(--bg)] rounded-xl border border-[var(--border)] group hover:border-[var(--border-strong)] transition-all">
                    <div className="w-6 h-6 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center mt-1.5 shrink-0">
                      <span className="mono text-[10px] font-bold text-[var(--text-tertiary)]">{i + 1}</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <input type="text" value={m.description} onChange={(e) => updateMilestone(i, "description", e.target.value)} placeholder="Milestone description"
                        className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm placeholder:text-[var(--text-tertiary)] transition-all" />
                      <div className="flex items-center gap-2">
                        <input type="number" value={m.amount} onChange={(e) => updateMilestone(i, "amount", e.target.value)} placeholder="0.00"
                          className="flex-1 px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg mono text-sm placeholder:text-[var(--text-tertiary)] transition-all" />
                        <span className="mono text-xs text-[var(--text-tertiary)] bg-[var(--bg-elevated)] px-2 py-1.5 rounded-md">{selectedToken.symbol}</span>
                      </div>
                    </div>
                    {milestones.length > 1 && (
                      <button onClick={() => removeMilestone(i)} className="p-1.5 mt-1.5 hover:bg-[var(--danger-subtle)] rounded-lg transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={13} className="text-[var(--text-tertiary)] hover:text-[var(--danger)]" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={addMilestone} className="flex items-center gap-1.5 text-xs text-[var(--accent-text)] font-medium hover:opacity-80 transition-opacity">
                <Plus size={14} /> Add milestone
              </button>
              <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                <span className="text-xs text-[var(--text-secondary)]">Total</span>
                <span className="mono text-sm font-bold gradient-text">{totalAmount.toFixed(2)} {selectedToken.symbol}</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm font-medium hover:bg-[var(--bg)] transition-all">
                  <ArrowLeft size={15} /> Back
                </button>
                <button onClick={() => setStep(4)} disabled={milestones.some((m) => !m.description || !m.amount || parseFloat(m.amount) <= 0)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--accent-hover)] transition-all btn-glow disabled:opacity-30 disabled:shadow-none">
                  Review <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-[var(--bg)] rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
                <div className="p-4">
                  <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">Project</span>
                  <p className="font-semibold text-sm mt-1">{name}</p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{description}</p>
                </div>
                <div className="p-4">
                  <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">Freelancer</span>
                  <p className="mono text-xs mt-1 text-[var(--text-secondary)]">{freelancerAddress}</p>
                </div>
                <div className="p-4">
                  <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">Token</span>
                  <p className="text-sm font-medium mt-1">{selectedToken.symbol}</p>
                </div>
                <div className="p-4">
                  <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">Milestones</span>
                  <div className="mt-2 space-y-2">
                    {milestones.map((m, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-[var(--text-secondary)] flex items-center gap-2">
                          <span className="mono text-[10px] text-[var(--text-tertiary)]">{i + 1}.</span>
                          {m.description}
                        </span>
                        <span className="mono font-semibold">{m.amount} {selectedToken.symbol}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border)]">
                    <span className="text-xs font-semibold">Total</span>
                    <span className="mono text-base font-bold gradient-text">{totalAmount.toFixed(2)} {selectedToken.symbol}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 px-4 py-3 bg-[var(--success-subtle)] border border-emerald-500/10 rounded-xl">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-[var(--success)]" />
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-[var(--success)] opacity-30 blur-[2px]" />
                </div>
                <span className="text-xs text-emerald-400">Transaction fees are near-zero on Conflux (less than $0.001)</span>
              </div>

              {error && (
                <div className="px-4 py-3 bg-[var(--danger-subtle)] border border-red-500/10 rounded-xl">
                  <span className="text-xs text-[var(--danger)]">{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(3)} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm font-medium hover:bg-[var(--bg)] transition-all disabled:opacity-50">
                  <ArrowLeft size={15} /> Back
                </button>
                <button onClick={handleCreate} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--accent-hover)] transition-all btn-glow disabled:opacity-50">
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? "Creating..." : "Create Project"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

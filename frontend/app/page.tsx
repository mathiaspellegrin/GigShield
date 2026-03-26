"use client";

import { useState } from "react";
import {
  Shield, Plus, Search, ArrowRight, Lock, Zap, Scale,
  Briefcase, Gavel, ChevronRight, ExternalLink, Globe,
  Users, TrendingUp, Clock,
} from "lucide-react";
import ConnectWallet from "@/components/ConnectWallet";
import CreateProject from "@/components/CreateProject";
import ProjectView from "@/components/ProjectView";
import MyProjects from "@/components/MyProjects";
import ArbitratorDashboard from "@/components/ArbitratorDashboard";
import DisputeView from "@/components/DisputeView";
import { useWallet } from "@/hooks/useWallet";

type View = "home" | "create" | "project" | "projects" | "arbitrator" | "dispute";

export default function Home() {
  const { address, walletClient, loading, error, connect, disconnect } = useWallet();
  const [view, setView] = useState<View>("home");
  const [projectIdInput, setProjectIdInput] = useState("");
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [activeDisputeId, setActiveDisputeId] = useState<number | null>(null);

  const goToProject = (id: number) => { setActiveProjectId(id); setView("project"); };
  const goToDispute = (id: number) => { setActiveDisputeId(id); setView("dispute"); };

  const Nav = () => (
    <header className="glass border-b border-[var(--border)] sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button
            onClick={() => setView("home")}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity group"
          >
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/30 transition-shadow">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">GigShield</span>
          </button>
          {address && (
            <nav className="hidden md:flex items-center gap-1">
              {[
                { label: "Projects", view: "projects" as View, icon: Briefcase },
                { label: "Arbitrate", view: "arbitrator" as View, icon: Gavel },
              ].map((item) => (
                <button
                  key={item.view}
                  onClick={() => setView(item.view)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    view === item.view
                      ? "bg-[var(--accent-subtle)] text-[var(--accent-text)] shadow-sm"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                  }`}
                >
                  <item.icon size={14} />
                  {item.label}
                </button>
              ))}
            </nav>
          )}
        </div>
        <ConnectWallet
          address={address}
          loading={loading}
          error={error}
          onConnect={connect}
          onDisconnect={disconnect}
        />
      </div>
    </header>
  );

  const BackBtn = ({ to, label }: { to: View; label: string }) => (
    <button
      onClick={() => setView(to)}
      className="inline-flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--accent-text)] mb-6 transition-colors group"
    >
      <ChevronRight size={12} className="rotate-180 group-hover:-translate-x-0.5 transition-transform" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen relative">
      <Nav />

      <main className="max-w-5xl mx-auto px-5 py-8 relative z-10">
        {/* ─── Home ─── */}
        {view === "home" && (
          <div className="animate-fade-in">
            {/* Hero */}
            <div className="relative text-center pt-20 pb-24">
              {/* Background dot grid */}
              <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />

              <div className="relative">
                <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-[var(--accent-subtle)] border border-[rgba(99,102,241,0.15)] rounded-full mb-8 animate-float">
                  <div className="relative">
                    <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                    <div className="absolute inset-0 w-2 h-2 rounded-full bg-[var(--accent)] animate-ping opacity-30" />
                  </div>
                  <span className="text-xs font-medium text-[var(--accent-text)]">Live on Conflux eSpace</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
                  Freelance payments,
                  <br />
                  <span className="gradient-text">finally fair</span>
                </h1>

                <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-lg mx-auto mb-12 leading-relaxed">
                  Lock funds in escrow. Release on milestones.
                  <br className="hidden md:block" />
                  Resolve disputes on-chain. Near-zero fees.
                </p>

                {address ? (
                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <button
                      onClick={() => setView("create")}
                      className="flex items-center gap-2.5 px-6 py-3 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--accent-hover)] transition-all btn-glow shadow-lg shadow-indigo-500/20"
                    >
                      <Plus size={16} /> New Project
                    </button>
                    <button
                      onClick={() => setView("projects")}
                      className="flex items-center gap-2.5 px-6 py-3 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-sm font-semibold hover:border-[var(--border-strong)] hover:bg-[var(--bg-card)] transition-all"
                    >
                      <Briefcase size={16} /> My Projects
                    </button>
                    <div className="flex items-center gap-1.5">
                      <div className="relative">
                        <input
                          type="number"
                          value={projectIdInput}
                          onChange={(e) => setProjectIdInput(e.target.value)}
                          placeholder="#"
                          className="w-16 px-3 py-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-center mono text-sm focus:border-[var(--accent)]"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const id = parseInt(projectIdInput);
                          if (!isNaN(id)) goToProject(id);
                        }}
                        disabled={!projectIdInput}
                        className="p-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl hover:border-[var(--border-strong)] hover:bg-[var(--bg-card)] transition-all disabled:opacity-30"
                      >
                        <Search size={15} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={connect}
                    disabled={loading}
                    className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--accent-hover)] transition-all btn-glow shadow-lg shadow-indigo-500/25"
                  >
                    Get Started <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-4 mb-16 max-w-2xl mx-auto stagger">
              {[
                { label: "Platform Fees", value: "0%", icon: TrendingUp },
                { label: "Avg Gas Cost", value: "<$0.001", icon: Zap },
                { label: "Dispute Resolution", value: "3-Panel", icon: Users },
              ].map((s) => (
                <div key={s.label} className="text-center py-4 px-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl">
                  <p className="mono text-lg font-bold gradient-text mb-1">{s.value}</p>
                  <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-4 mb-16 stagger">
              {[
                {
                  icon: Lock,
                  title: "Locked Escrow",
                  desc: "Funds locked on-chain until work is verified. Neither party can withdraw unilaterally.",
                  gradient: "from-indigo-500/10 to-purple-500/5",
                  iconBg: "bg-indigo-500/10",
                  iconColor: "text-indigo-400",
                },
                {
                  icon: Zap,
                  title: "Near-Zero Fees",
                  desc: "Transactions under $0.001 on Conflux. No platform cuts, no hidden charges. Keep what you earn.",
                  gradient: "from-emerald-500/10 to-teal-500/5",
                  iconBg: "bg-emerald-500/10",
                  iconColor: "text-emerald-400",
                },
                {
                  icon: Scale,
                  title: "Fair Arbitration",
                  desc: "3-person panel resolves disputes on-chain. Transparent votes, no black-box decisions.",
                  gradient: "from-violet-500/10 to-fuchsia-500/5",
                  iconBg: "bg-violet-500/10",
                  iconColor: "text-violet-400",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className={`relative overflow-hidden bg-gradient-to-br ${f.gradient} bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 card-hover group`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/[0.02] to-transparent rounded-bl-full" />
                  <div className={`w-10 h-10 rounded-xl ${f.iconBg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <f.icon size={18} className={f.iconColor} />
                  </div>
                  <h3 className="font-semibold text-[15px] mb-2">{f.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 md:p-10 mb-16">
              <h2 className="text-xs font-semibold mb-8 text-center uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                How it works
              </h2>
              <div className="grid md:grid-cols-4 gap-8 stagger">
                {[
                  { n: "01", title: "Create", desc: "Define milestones, amounts, and assign a freelancer", icon: Plus },
                  { n: "02", title: "Deposit", desc: "Lock the full project amount in the smart contract", icon: Lock },
                  { n: "03", title: "Deliver", desc: "Freelancer submits work, client reviews each milestone", icon: Clock },
                  { n: "04", title: "Get Paid", desc: "Approved milestones release funds instantly", icon: TrendingUp },
                ].map((s, i) => (
                  <div key={s.n} className="text-center group">
                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center mx-auto mb-4 group-hover:border-[var(--accent)] group-hover:bg-[var(--accent-subtle)] transition-all">
                      <span className="mono text-sm font-bold text-[var(--text-tertiary)] group-hover:text-[var(--accent-text)] transition-colors">{s.n}</span>
                    </div>
                    <h4 className="font-semibold text-sm mt-3 mb-1.5">{s.title}</h4>
                    <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pb-12">
              <div className="flex items-center justify-center gap-3 text-xs text-[var(--text-tertiary)]">
                <span>Built on</span>
                <a
                  href="https://confluxnetwork.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[var(--accent-text)] hover:underline"
                >
                  <Globe size={12} /> Conflux
                </a>
                <span className="text-[var(--border-strong)]">/</span>
                <span>Global Hackfest 2026</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── My Projects ─── */}
        {view === "projects" && address && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">My Projects</h2>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">Projects where you're a client or freelancer</p>
              </div>
              <button
                onClick={() => setView("create")}
                className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent)] text-white rounded-xl text-xs font-semibold hover:bg-[var(--accent-hover)] transition-all btn-glow"
              >
                <Plus size={14} /> New Project
              </button>
            </div>
            <MyProjects userAddress={address} onSelectProject={goToProject} />
          </div>
        )}

        {/* ─── Create ─── */}
        {view === "create" && (
          <div className="animate-fade-in">
            <BackBtn to="home" label="Back" />
            <CreateProject walletClient={walletClient} account={address} onProjectCreated={goToProject} />
          </div>
        )}

        {/* ─── Project Detail ─── */}
        {view === "project" && activeProjectId !== null && (
          <div className="animate-fade-in">
            <BackBtn to="projects" label="Projects" />
            <ProjectView projectId={activeProjectId} walletClient={walletClient} userAddress={address} />
          </div>
        )}

        {/* ─── Arbitrator ─── */}
        {view === "arbitrator" && address && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h2 className="text-xl font-bold">Arbitrator Dashboard</h2>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Review disputes and cast your votes</p>
            </div>
            <ArbitratorDashboard walletClient={walletClient} userAddress={address} onViewDispute={goToDispute} />
          </div>
        )}

        {/* ─── Dispute Detail ─── */}
        {view === "dispute" && activeDisputeId !== null && (
          <div className="animate-fade-in">
            <BackBtn to="arbitrator" label="Arbitrator" />
            <DisputeView disputeId={activeDisputeId} walletClient={walletClient} userAddress={address} />
          </div>
        )}
      </main>
    </div>
  );
}

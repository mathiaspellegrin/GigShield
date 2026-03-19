"use client";

import { useState } from "react";
import {
  Shield, Plus, Search, ArrowRight, Lock, Zap, Scale,
  Briefcase, Gavel, ChevronRight,
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

  const goToProject = (id: number) => {
    setActiveProjectId(id);
    setView("project");
  };

  const goToDispute = (id: number) => {
    setActiveDisputeId(id);
    setView("dispute");
  };

  const Nav = () => (
    <header className="bg-[var(--bg-card)]/80 backdrop-blur-xl border-b border-[var(--border)] sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setView("home")}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            <Shield size={20} className="text-[var(--accent)]" />
            <span className="font-semibold text-sm tracking-tight">GigShield</span>
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    view === item.view
                      ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                  }`}
                >
                  <item.icon size={13} />
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
      className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] mb-5 transition-colors"
    >
      &larr; {label}
    </button>
  );

  return (
    <div className="min-h-screen">
      <Nav />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* ─── Home ─── */}
        {view === "home" && (
          <div className="animate-fade-in">
            {/* Hero */}
            <div className="text-center pt-16 pb-20">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--accent-subtle)] rounded-full mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                <span className="text-[11px] font-medium text-[var(--accent-text)]">Live on Conflux eSpace</span>
              </div>
              <h1 className="text-4xl md:text-[3.5rem] font-bold leading-[1.1] tracking-tight mb-5">
                Freelance payments,
                <br />
                <span className="text-[var(--accent)]">finally fair</span>
              </h1>
              <p className="text-base md:text-lg text-[var(--text-secondary)] max-w-md mx-auto mb-10 leading-relaxed">
                Lock funds in escrow. Release on milestones.
                Resolve disputes on-chain. Zero fees.
              </p>

              {address ? (
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <button
                    onClick={() => setView("create")}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[var(--text-primary)] text-white rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <Plus size={16} /> New Project
                  </button>
                  <button
                    onClick={() => setView("projects")}
                    className="flex items-center gap-2 px-5 py-2.5 border border-[var(--border)] rounded-full text-sm font-medium hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    <Briefcase size={16} /> My Projects
                  </button>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={projectIdInput}
                      onChange={(e) => setProjectIdInput(e.target.value)}
                      placeholder="#"
                      className="w-16 px-3 py-2.5 border border-[var(--border)] rounded-full text-center mono text-sm bg-[var(--bg)]"
                    />
                    <button
                      onClick={() => {
                        const id = parseInt(projectIdInput);
                        if (!isNaN(id)) goToProject(id);
                      }}
                      disabled={!projectIdInput}
                      className="p-2.5 border border-[var(--border)] rounded-full hover:bg-[var(--bg-elevated)] transition-colors disabled:opacity-30"
                    >
                      <Search size={15} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={connect}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--text-primary)] text-white rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Get Started <ArrowRight size={16} />
                </button>
              )}
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-4 mb-16 stagger">
              {[
                {
                  icon: Lock,
                  title: "Locked Escrow",
                  desc: "Funds locked on-chain. Neither party can withdraw alone. Start work with confidence.",
                  color: "var(--accent)",
                  bg: "var(--accent-subtle)",
                },
                {
                  icon: Zap,
                  title: "Near-Zero Fees",
                  desc: "Transactions cost less than $0.001 on Conflux. No platform fees, no hidden charges.",
                  color: "var(--success)",
                  bg: "var(--success-subtle)",
                },
                {
                  icon: Scale,
                  title: "Fair Arbitration",
                  desc: "3-person panel resolves disputes. Transparent, on-chain, resolved in days not months.",
                  color: "#7c3aed",
                  bg: "#f5f3ff",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 card-hover"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: f.bg }}
                  >
                    <f.icon size={17} style={{ color: f.color }} />
                  </div>
                  <h3 className="font-semibold text-sm mb-1.5">{f.title}</h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 md:p-8 mb-16">
              <h2 className="text-sm font-semibold mb-6 text-center uppercase tracking-wider text-[var(--text-tertiary)]">
                How it works
              </h2>
              <div className="grid md:grid-cols-4 gap-6">
                {[
                  { n: "01", title: "Create", desc: "Define milestones and payment amounts" },
                  { n: "02", title: "Deposit", desc: "Lock funds in the escrow contract" },
                  { n: "03", title: "Deliver", desc: "Submit work, get milestone approval" },
                  { n: "04", title: "Get Paid", desc: "Funds release instantly, no waiting" },
                ].map((s, i) => (
                  <div key={s.n} className="text-center md:text-left">
                    <span className="mono text-2xl font-bold text-[var(--bg-inset)]">{s.n}</span>
                    <h4 className="font-medium text-sm mt-2 mb-1">{s.title}</h4>
                    <p className="text-xs text-[var(--text-tertiary)]">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-[var(--text-tertiary)] pb-10">
              Built on{" "}
              <a href="https://confluxnetwork.org" target="_blank" rel="noopener noreferrer" className="text-[var(--accent-text)] hover:underline">
                Conflux
              </a>
              {" "}&middot; Global Hackfest 2026
            </div>
          </div>
        )}

        {/* ─── My Projects ─── */}
        {view === "projects" && address && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">My Projects</h2>
              <button
                onClick={() => setView("create")}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[var(--text-primary)] text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
              >
                <Plus size={14} /> New
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
            <ProjectView
              projectId={activeProjectId}
              walletClient={walletClient}
              userAddress={address}
            />
          </div>
        )}

        {/* ─── Arbitrator ─── */}
        {view === "arbitrator" && address && (
          <div className="animate-fade-in">
            <h2 className="text-lg font-semibold mb-5">Arbitrator Dashboard</h2>
            <ArbitratorDashboard
              walletClient={walletClient}
              userAddress={address}
              onViewDispute={goToDispute}
            />
          </div>
        )}

        {/* ─── Dispute Detail ─── */}
        {view === "dispute" && activeDisputeId !== null && (
          <div className="animate-fade-in">
            <BackBtn to="arbitrator" label="Arbitrator" />
            <DisputeView
              disputeId={activeDisputeId}
              walletClient={walletClient}
              userAddress={address}
            />
          </div>
        )}
      </main>
    </div>
  );
}

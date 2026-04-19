"use client";

import { useEffect, useState } from "react";
import {
  Shield, Plus, Search, ArrowRight, Lock, Zap, Scale,
  Briefcase, Gavel, ChevronRight, ExternalLink, Globe,
  Users, TrendingUp, Clock, MoveRight, Sparkles, Github,
  CheckCircle2, ChevronDown, Coins,
} from "lucide-react";
import ConnectWallet from "@/components/ConnectWallet";
import CreateProject from "@/components/CreateProject";
import ProjectView from "@/components/ProjectView";
import MyProjects from "@/components/MyProjects";
import ArbitratorDashboard from "@/components/ArbitratorDashboard";
import DisputeView from "@/components/DisputeView";
import { useWallet } from "@/hooks/useWallet";

type View = "home" | "create" | "project" | "projects" | "arbitrator" | "dispute";

const CONTRACT_ADDRESS = "0x3F833d7c7fE06f65720DCD85791985d77dfcE7C2";
const CONTRACT_URL = `https://evm.confluxscan.io/address/${CONTRACT_ADDRESS}`;
const REPO_URL = "https://github.com/mathiaspellegrin/GigShield";
const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export default function Home() {
  const { address, walletClient, loading, error, connect, disconnect } = useWallet();
  const [view, setView] = useState<View>("home");
  const [projectIdInput, setProjectIdInput] = useState("");
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [activeDisputeId, setActiveDisputeId] = useState<number | null>(null);

  useEffect(() => {
    if (view !== "home") return;
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [view, address]);

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
            <div className="relative text-center pt-24 md:pt-32 pb-28 md:pb-36">
              {/* Animated mesh gradient background */}
              <div className="hero-mesh" />
              {/* Dot grid on top of mesh */}
              <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />

              <div className="relative">
                <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-[var(--accent-subtle)] border border-[rgba(99,102,241,0.2)] rounded-full mb-10 animate-float backdrop-blur-sm">
                  <div className="relative">
                    <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                    <div className="absolute inset-0 w-2 h-2 rounded-full bg-[var(--accent)] animate-ping opacity-40" />
                  </div>
                  <span className="text-xs font-medium text-[var(--accent-text)]">Live on Conflux eSpace Mainnet</span>
                </div>

                <h1 className="display-headline mb-6">
                  Freelance payments,
                  <br />
                  <span className="gradient-text">finally fair.</span>
                </h1>

                <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-xl mx-auto mb-12 leading-relaxed">
                  Lock funds in escrow. Release on milestones.
                  <br className="hidden md:block" />
                  Resolve disputes on-chain. <span className="text-[var(--text-primary)] font-medium">Near-zero fees.</span>
                </p>

                {address ? (
                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <button
                      onClick={() => setView("create")}
                      className="flex items-center gap-2.5 px-6 py-3.5 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--accent-hover)] transition-all btn-glow shadow-lg shadow-indigo-500/20"
                    >
                      <Plus size={16} /> New Project
                    </button>
                    <button
                      onClick={() => setView("projects")}
                      className="flex items-center gap-2.5 px-6 py-3.5 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-sm font-semibold hover:border-[var(--border-strong)] hover:bg-[var(--bg-card)] transition-all"
                    >
                      <Briefcase size={16} /> My Projects
                    </button>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={projectIdInput}
                        onChange={(e) => setProjectIdInput(e.target.value)}
                        placeholder="#"
                        className="w-16 px-3 py-3.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-center mono text-sm focus:border-[var(--accent)]"
                      />
                      <button
                        onClick={() => {
                          const id = parseInt(projectIdInput);
                          if (!isNaN(id)) goToProject(id);
                        }}
                        disabled={!projectIdInput}
                        className="p-3.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl hover:border-[var(--border-strong)] hover:bg-[var(--bg-card)] transition-all disabled:opacity-30"
                      >
                        <Search size={15} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <button
                      onClick={connect}
                      disabled={loading}
                      className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--accent-hover)] transition-all btn-glow shadow-lg shadow-indigo-500/25"
                    >
                      Get Started <ArrowRight size={16} />
                    </button>
                    <a
                      href={CONTRACT_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-3.5 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] rounded-xl text-sm font-medium hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] transition-all"
                    >
                      View Contract <ExternalLink size={14} />
                    </a>
                  </div>
                )}

                {/* Scroll hint */}
                <div className="mt-20 flex justify-center animate-float opacity-50" aria-hidden>
                  <ChevronDown size={20} className="text-[var(--text-tertiary)]" />
                </div>
              </div>
            </div>

            {/* ─── Trust strip (social proof) ─── */}
            <div className="reveal mb-20">
              <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 text-center">
                <span className="chain-chip">
                  <div className="relative">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-40" />
                  </div>
                  Mainnet · chainId 1030
                </span>
                <a href={CONTRACT_URL} target="_blank" rel="noopener noreferrer" className="chain-chip">
                  <Shield size={12} className="text-[var(--accent-text)]" />
                  <span className="mono">{shortAddr(CONTRACT_ADDRESS)}</span>
                  <ExternalLink size={10} className="opacity-60" />
                </a>
                <span className="chain-chip">
                  <Coins size={12} className="text-emerald-400" />
                  USDT0 + AxCNH
                </span>
                <span className="chain-chip">
                  <Sparkles size={12} className="text-amber-400" />
                  Gas sponsored by contract
                </span>
                <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="chain-chip">
                  <Github size={12} />
                  Open source
                  <ExternalLink size={10} className="opacity-60" />
                </a>
              </div>
            </div>

            {/* ─── Stats bar ─── */}
            <div className="reveal grid grid-cols-3 gap-3 md:gap-4 mb-20 max-w-2xl mx-auto">
              {[
                { label: "Platform Fees", value: "0%", icon: TrendingUp },
                { label: "Avg Gas Cost", value: "<$0.001", icon: Zap },
                { label: "Dispute Panel", value: "3-of-3", icon: Users },
              ].map((s) => (
                <div
                  key={s.label}
                  className="text-center py-5 px-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl hover:border-[var(--border-strong)] transition-colors"
                >
                  <p className="mono text-xl md:text-2xl font-bold gradient-text mb-1.5 number-glow">{s.value}</p>
                  <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">{s.label}</p>
                </div>
              ))}
            </div>

            {/* ─── Features ─── */}
            <div className="reveal mb-4">
              <p className="text-center text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)] mb-3">Why GigShield</p>
              <h2 className="text-center text-2xl md:text-3xl font-semibold tracking-tight mb-10">
                Protection built into every transaction
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mb-20">
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
              ].map((f, i) => (
                <div
                  key={f.title}
                  className={`reveal reveal-delay-${i + 1} relative overflow-hidden bg-gradient-to-br ${f.gradient} bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 card-hover group`}
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

            {/* ─── How it works (timeline) ─── */}
            <div className="reveal relative bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 md:p-12 mb-20 overflow-hidden">
              <div className="absolute inset-0 dot-grid opacity-[0.15] pointer-events-none" />
              <div className="relative">
                <p className="text-xs font-semibold text-center uppercase tracking-[0.2em] text-[var(--text-tertiary)] mb-2">
                  How it works
                </p>
                <h3 className="text-center text-xl md:text-2xl font-semibold mb-10">Four steps from handshake to paid</h3>
                <div className="grid md:grid-cols-4 gap-8 relative">
                  {/* Connecting line (desktop) */}
                  <div className="hidden md:block absolute top-6 left-[12%] right-[12%] h-px timeline-line pointer-events-none" />
                  {[
                    { n: "01", title: "Create", desc: "Define milestones, amounts, and assign a freelancer", icon: Plus },
                    { n: "02", title: "Deposit", desc: "Lock the full project amount in the smart contract", icon: Lock },
                    { n: "03", title: "Deliver", desc: "Freelancer submits, client reviews each milestone", icon: Clock },
                    { n: "04", title: "Get Paid", desc: "Approved milestones release funds instantly", icon: TrendingUp },
                  ].map((s, i) => (
                    <div key={s.n} className={`reveal reveal-delay-${i + 1} text-center group relative`}>
                      <div className="relative mx-auto w-12 h-12 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center mb-4 group-hover:border-[var(--accent)] group-hover:bg-[var(--accent-subtle)] transition-all z-10">
                        <span className="mono text-sm font-bold text-[var(--text-tertiary)] group-hover:text-[var(--accent-text)] transition-colors">{s.n}</span>
                      </div>
                      <h4 className="font-semibold text-sm mt-3 mb-1.5">{s.title}</h4>
                      <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ─── Bottom CTA ─── */}
            {!address && (
              <div className="reveal relative overflow-hidden text-center bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-transparent border border-[var(--border)] rounded-2xl p-10 md:p-14 mb-20">
                <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />
                <div className="relative">
                  <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
                    Stop chasing invoices. Start protecting gigs.
                  </h3>
                  <p className="text-sm md:text-base text-[var(--text-secondary)] max-w-lg mx-auto mb-8">
                    Connect a wallet and create your first escrow in under a minute. Free to try, live on Conflux eSpace Mainnet.
                  </p>
                  <button
                    onClick={connect}
                    disabled={loading}
                    className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--accent-hover)] transition-all btn-glow shadow-lg shadow-indigo-500/25"
                  >
                    Connect Wallet <MoveRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ─── Footer ─── */}
            <footer className="reveal border-t border-[var(--border)] pt-10 pb-12 mt-4">
              <div className="grid md:grid-cols-3 gap-8 md:gap-4 mb-10">
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-6 h-6 rounded-md bg-[var(--accent)] flex items-center justify-center">
                      <Shield size={12} className="text-white" />
                    </div>
                    <span className="font-bold text-sm tracking-tight">GigShield</span>
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] leading-relaxed max-w-xs">
                    Trustless escrow for independent freelancers. Built on Conflux eSpace for the Global Hackfest 2026.
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] mb-3">Product</p>
                  <div className="flex flex-col gap-2 text-xs">
                    <a href={CONTRACT_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-text)] transition-colors w-fit">
                      Contract <ExternalLink size={10} />
                    </a>
                    <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-text)] transition-colors w-fit">
                      <Github size={10} /> GitHub
                    </a>
                    <a href={`${REPO_URL}/blob/master/README.md`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-text)] transition-colors w-fit">
                      Documentation <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] mb-3">Network</p>
                  <div className="flex flex-col gap-2 text-xs">
                    <a href="https://confluxnetwork.org" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-text)] transition-colors w-fit">
                      <Globe size={10} /> Conflux Network
                    </a>
                    <a href="https://evm.confluxscan.io" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-text)] transition-colors w-fit">
                      ConfluxScan <ExternalLink size={10} />
                    </a>
                    <a href="https://github.com/conflux-fans/global-hackfest-2026" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-text)] transition-colors w-fit">
                      Global Hackfest 2026 <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-[var(--border)] text-[11px] text-[var(--text-tertiary)]">
                <span>© 2026 GigShield · MIT Licensed</span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  Deployed on Conflux eSpace Mainnet
                </span>
              </div>
            </footer>
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

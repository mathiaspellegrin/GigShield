# GigShield

**Trustless freelance escrow on Conflux eSpace** — milestone-based stablecoin payments with on-chain arbitration and auto-release protection.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Conflux](https://img.shields.io/badge/built%20on-Conflux%20eSpace-blue)](https://confluxnetwork.org)
[![Hackathon](https://img.shields.io/badge/Global%20Hackfest%202026-green)](https://github.com/conflux-fans/global-hackfest-2026)
[![Mainnet](https://img.shields.io/badge/Conflux%20eSpace-Mainnet%20(1030)-success)](https://evm.confluxscan.io/address/0x3F833d7c7fE06f65720DCD85791985d77dfcE7C2)
[![USDT0](https://img.shields.io/badge/USDT0-integrated-0d7a5f)](https://evm.confluxscan.io/address/0xaf37e8b6c9ed7f6318979f56fc287d76c30847ff)
[![AnchorX AxCNH](https://img.shields.io/badge/AnchorX%20AxCNH-integrated-ed8f2c)](https://evm.confluxscan.io/address/0x70bfd7f7eadf9b9827541272589a6b2bb760ae2e)

---

## 🔎 At a Glance

| Deliverable | Link |
|---|---|
| **Live dApp (production)** | https://gig-shield-jade.vercel.app |
| **Smart contract (Conflux eSpace Mainnet)** | [0x3F833d7c7fE06f65720DCD85791985d77dfcE7C2](https://evm.confluxscan.io/address/0x3F833d7c7fE06f65720DCD85791985d77dfcE7C2) |
| **Demo video** | https://www.youtube.com/watch?v=Culycr6G7l8 |
| **Participant intro video** | https://youtube.com/shorts/LTbEHbvlz80 |
| **Source code (GitHub)** | https://github.com/mathiaspellegrin/GigShield |
| **Integration grant proposal (Conflux Forum)** | https://forum.conflux.fun/t/integration-grants-application-26-gigshield/23574 |
| **Category tracks targeted** | Best USDT0 Integration · Best AnchorX Integration · Main Award |
| **Team** | MBP Enterprises LTD — Mathias Pellegrin |
| **Deployed, verified, working** | ✅ |

---

## 📋 Overview

GigShield is a **production-grade decentralized escrow platform** for independent freelancers. Clients lock stablecoins — **USDT0** or **AnchorX's AxCNH** (Chinese offshore yuan stablecoin) — into **milestone-based escrows**. Freelancers submit work, clients approve, and funds release instantly on-chain. If a client goes silent, a **7-day auto-release timer** protects the freelancer. Genuine disputes are resolved by a **3-arbitrator on-chain panel** voting with a 2-of-3 majority.

**Impact on the Conflux ecosystem:** freelancing is a globally-distributed, recurring-transaction use case — the exact category of real on-chain activity Conflux is growing the ecosystem around. GigShield ships **first-class support for both stablecoins Conflux is building its narrative around** (USDT0 and AnchorX AxCNH), anchoring the "stablecoin + real-world assets" story to a user-facing product, not another speculative pool. Every completed project is a real user, a real stablecoin transfer, and a real transaction — the kind of recurring activity the ecosystem needs.

---

## 🎯 How GigShield delivers on the judging criteria

This project was built with direct awareness of the five scoring dimensions. Here is the explicit mapping of evidence to rubric.

### 1. Technical Quality (25 pts)
- **Production-grade Solidity** — Single, auditable `GigShield.sol` contract (Solidity 0.8.20, optimizer 200 runs). Built on OpenZeppelin 5.x (`Ownable`, `ReentrancyGuard`, `SafeERC20`) — battle-tested primitives, not custom rolls.
- **Comprehensive test coverage** — 70 test cases (Mocha + Chai + Hardhat 3.x) covering the full lifecycle, every access-control path, dispute and arbitration flows, and attack scenarios (reentrancy, unauthorized access, zero-value inputs, max-milestone bounds).
- **Gas-efficient design** — Custom errors, packed storage, minimal external calls. Every state change emits a typed event.
- **Typed frontend** — Next.js 16, React 19, TypeScript, viem. No `any` leaks, typed ABI imports.
- **Clean repo hygiene** — MIT licensed, `.env.example` provided, no secrets committed, build passes (`npx hardhat test` and `npm run build` both green).

### 2. Conflux Integration (25 pts)
- **Conflux eSpace Mainnet deployment** — Live at chainId 1030, verified via ConfluxScan. Not a testnet prototype — a real contract users can transact with today.
- **USDT0 first-class integration** — USDT0 is a primary payment rail with a dedicated UI selector. Every escrow can be denominated in USDT0. Directly serves the Best USDT0 Integration track.
- **AnchorX AxCNH integration** — AxCNH is supported as a second native payment option, bringing CNH-denominated contracts on-chain. Directly serves the Best AnchorX Integration track. Expands the Conflux stablecoin narrative beyond USD.
- **Sponsorship-ready contract architecture** — The contract integrates Conflux's sponsorship model via `ISponsorWhitelistControl`. Full user-transparent gas sponsorship on eSpace requires Core Space + `CrossSpaceCall` bridging (CIP-90), which is documented and planned as the immediate post-hackathon step.
- **Native low-fee economics** — eSpace's base fees (~$0.0001–$0.001 per tx) are the specific property that makes small-value freelance escrow ($50–$500 contracts) economically viable on-chain — a market no Ethereum-L1-based escrow can serve profitably.

### 3. User Experience (20 pts)
- **Role-aware UI** — Dashboard, status banners, and actions adapt to whether the connected wallet is a client, freelancer, or arbitrator. Zero context-switching for the user.
- **Stablecoin-denominated flows** — Users never think in volatile crypto. They see "1,000 USDT0" and receive "1,000 USDT0".
- **One-minute onboarding** — Connect wallet → MetaMask auto-switches to Conflux eSpace → Create project. No manual network configuration, no token-adding dance.
- **Visual token picker** — Choose USDT0 or AxCNH with a single click; no address-pasting.
- **Confirmation modals** — Every fund-releasing action shows an amount-breakdown modal before the tx.
- **Dark-themed, responsive interface** — Tailwind + Lucide, polished enough for non-crypto-native users.

### 4. Innovation (20 pts)
GigShield is not the first escrow on a blockchain, and it does not pretend to be. The innovation is the **specific combination that no other submission will assemble**:

1. **Stablecoin-native milestone escrow** (USDT0 + AnchorX AxCNH)
2. **7-day auto-release timer** (anti-ghosting protection, with a one-time pause to prevent abuse)
3. **3-arbitrator on-chain dispute resolution** (pseudo-random assignment from a registered pool, 2-of-3 majority, fully transparent votes)
4. **Sponsorship-ready architecture** wired to Conflux's native sponsorship primitives
5. **Deployed on Conflux eSpace** — the only EVM chain where the sub-$100 segment of freelance work is economically viable

Individually these features exist elsewhere. Together, deployed on Conflux eSpace with first-class integration to the two stablecoins Conflux is building around, this is novel — a complete trustless alternative to Upwork/Fiverr's payment layer targeted at a market legacy platforms extract 10–20% from.

### 5. Presentation & Documentation (10 pts)
- **Demo video** showing a full end-to-end flow from both client and freelancer perspectives using USDT0, plus arbitration walkthrough — [YouTube](https://www.youtube.com/watch?v=Culycr6G7l8) (length confirmed with Conflux team).
- **30-second participant intro video** — [YouTube Shorts](https://youtube.com/shorts/LTbEHbvlz80).
- **Live production dApp** that judges can click through.
- **Go-to-market plan** with concrete channels, milestones, metrics, and revenue model (below).
- **Documentation** in `docs/ARCHITECTURE.md` and `docs/DESIGN_DECISIONS.md` explaining the "why" behind each major architectural choice.

---

## 🚀 Problem Statement

Freelance platforms (Upwork, Fiverr) take 10–20% in fees, hold funds for weeks, and resolve disputes behind closed doors. Independent freelancers working off-platform face worse: ghosting clients, scope creep with no recourse, zero trust infrastructure for small contracts ($50–$2,000).

Existing crypto-escrow solutions fail because gas costs on Ethereum L1 make small transactions uneconomical and the UX is too complex for non-crypto-native users.

**Billions are lost to late and missed payments every year.** The freelancers hit hardest are the ones least equipped to chase debts.

## 💡 Solution

GigShield is a **trustless, stablecoin-native escrow layer** built specifically for independent freelancers on Conflux eSpace:

- **Milestone-based payments** — Funds release incrementally as work is delivered and approved, with up to 20 milestones per project.
- **Auto-release timer** — If a client goes silent for 7 days after a milestone submission, funds release automatically to the freelancer. No more ghosting.
- **On-chain arbitration** — A 3-arbitrator panel votes on disputes with evidence from both sides. Transparent, final, verifiable.
- **Stablecoin-native** — USDT0 and AnchorX's AxCNH supported as first-class payment tokens, eliminating crypto volatility risk for both contract parties.
- **Conflux eSpace economics** — Native transaction fees (~$0.0001–$0.001) make even small freelance contracts ($50–$500) economically viable on-chain for the first time.

## 📈 Go-to-Market Plan (required)

**Target users.** Independent freelance developers, designers, and writers taking direct contracts outside platforms. Small agencies managing contractor relationships. Crypto-native freelancers already comfortable with wallets. Freelance markets in CNH-denominated regions (where AxCNH creates a natural on-ramp no other chain offers).

**Distribution channels:**
- Dev X/Twitter — threads showing real use cases, real on-chain escrows, contract transparency
- Reddit: r/freelance, r/forhire, r/Upwork — communities with constant "client ghosted me" and "Upwork took 20%" threads
- Indie Hackers, Farcaster — founder-grade audience already open to self-serve crypto tooling
- Direct outreach to crypto-native freelance communities (Bankless, Web3 DAOs with contributor programs)
- Conflux ecosystem cross-promotion (Best USDT0 Integration + AnchorX category alignment)

**Growth milestones & metrics:**
| Phase | Timeline | Metric |
|---|---|---|
| MVP live | Week 0 (hackathon) | Contract on mainnet, frontend deployed, demo recorded |
| Community seeding | Weeks 1–4 | 20 beta users, 50 on-chain escrows |
| Early adopters | Weeks 4–8 | 50 active users, $20K+ total escrow volume |
| Monetization launch | Week 8+ | Introduce 1% platform fee on successful releases |
| 90-day KPI | Day 90 | 500 active escrows, $100K+ total volume, 5% conversion from wallet-connect to escrow-funded |

**Revenue model.** Free during beta to drive adoption. Post-beta, 1% fee on successful escrow releases. No fee on disputes returned to clients. **Fee is competitive vs. 10–20% taken by Upwork/Fiverr**, by an order of magnitude.

**Why Conflux is the right chain for this product, specifically.** Native low fees + the USDT0 and AxCNH stablecoin ecosystem are the two properties small-value freelance escrow needs. Every completed project is a real transaction, a real user, and real stablecoin volume — directly growing the ecosystem's on-chain activity and anchoring its stablecoin narrative.

---

## ⚡ Conflux Integration

- [x] **Conflux eSpace Mainnet deployment** — Contract live at chainId 1030. Full EVM compatibility, verified on ConfluxScan.
- [x] **USDT0 first-class integration** — Primary payment rail, dedicated UI selector, contract-level denomination support. Target track: **Best USDT0 Integration**.
- [x] **AnchorX AxCNH integration** — Second native stablecoin, opens CNH-denominated contracts. Target track: **Best AnchorX Integration**.
- [x] **Multi-token architecture** — Visual token picker, not hard-coded; extensible to additional ecosystem stablecoins.
- [x] **Sponsorship-ready architecture** — Contract integrates `ISponsorWhitelistControl` interface; full gas-sponsored UX is planned via Core Space + `CrossSpaceCall` bridging (CIP-90) post-hackathon.
- [x] **Conflux-native economic model** — Sub-$100 freelance contracts become economically viable only because of eSpace's low native fees.

## ✨ Features

### Core Features
- **Milestone Escrow** — Up to 20 milestones per project, each with an independently-defined amount.
- **Full Escrow Deposit** — Client deposits total project amount upfront; no ambiguity about funding availability.
- **Client Approval + Revisions** — Confirmation modal with amount breakdown; revision requests before approval.
- **Auto-Release Timer** — 7-day countdown after milestone submission; funds release automatically if client is unresponsive.
- **Pause Mechanism** — Client can pause auto-release once per milestone (prevents abuse from either side).
- **Dispute System** — Either party files with evidence; 48-hour counter-evidence window; 3-arbitrator panel assigned pseudo-randomly; 2-of-3 majority decides.
- **Multi-Stablecoin Support** — USDT0 and AnchorX AxCNH with visual token picker.
- **Role-Aware UI** — Status banners, actions, and guidance adapt to whether you're a client, freelancer, or arbitrator.

### Future Features (Roadmap)
- On-chain reputation system for clients, freelancers, and arbitrators
- Partial milestone payments (percentage-based releases)
- Arbitrator staking + slashing for fully trustless dispute resolution
- Mobile-optimized native experience
- Security audit (planned via grant proposal)

## 🛠️ Technology Stack

### Smart Contracts
- **Language**: Solidity 0.8.20
- **Framework**: Hardhat 3.x + TypeScript
- **Libraries**: OpenZeppelin 5.x (`Ownable`, `ReentrancyGuard`, `SafeERC20`)
- **Testing**: Mocha + Chai, **70 test cases** covering lifecycle, disputes, arbitration, edge cases

### Frontend
- **Framework**: Next.js 16, React 19, TypeScript
- **Web3**: viem
- **Styling**: Tailwind CSS, Lucide React icons
- **Hosting**: Vercel (production)

### Blockchain
- **Network**: Conflux eSpace Mainnet (chainId 1030)
- **Payment Tokens**: USDT0, AnchorX AxCNH (ERC-20 stablecoins)

## 🏗️ Architecture

```
┌────────────────┐     ┌─────────────────────────┐     ┌──────────────────┐
│   Next.js 16   │────▶│   viem + MetaMask       │────▶│  GigShield.sol   │
│   Dark UI      │     │   (chainId 1030)        │     │  Conflux eSpace  │
└────────────────┘     └─────────────────────────┘     └──────────────────┘
        │                                                        │
        ▼                                                        ▼
┌────────────────┐                                     ┌──────────────────┐
│ Role-aware UX  │                                     │ USDT0 / AxCNH    │
│ client/freelan.│                                     │ ERC-20 transfers │
│ /arbitrator    │                                     │ (SafeERC20)      │
└────────────────┘                                     └──────────────────┘
```

GigShield is a single-contract system holding project state, milestones, disputes, and the arbitrator pool. Funds are held in-contract until a milestone is approved, auto-released after 7 days of client inactivity, or resolved by the 3-arbitrator voting panel.

## 📱 Usage

### For Clients
1. Connect wallet — auto-switches to Conflux eSpace
2. Create project — name, description, freelancer address, token (USDT0 or AxCNH), milestones
3. Deposit escrow — lock full amount in contract
4. Review milestones — approve to release payment, or request a revision
5. Dispute — file with evidence if work doesn't match scope

### For Freelancers
1. View project — milestones, amounts, escrow status
2. Submit work — mark milestones complete
3. Auto-release — trigger after 7 days of client silence
4. Respond to disputes — submit counter-evidence

### For Arbitrators
1. Dashboard — see disputes assigned to you
2. Review evidence — read both parties' submissions
3. Vote — 2-of-3 majority resolves

## 🎬 Demo

### Live Production dApp
https://gig-shield-jade.vercel.app

### Demo Video (full end-to-end walkthrough)
https://www.youtube.com/watch?v=Culycr6G7l8

### Participant Intro Video
https://youtube.com/shorts/LTbEHbvlz80

## 📄 Smart Contracts

### Conflux eSpace Mainnet (chainId 1030)
| Contract | Address | Explorer |
|----------|---------|----------|
| **GigShield** | `0x3F833d7c7fE06f65720DCD85791985d77dfcE7C2` | [ConfluxScan](https://evm.confluxscan.io/address/0x3F833d7c7fE06f65720DCD85791985d77dfcE7C2) |
| **USDT0 (stablecoin)** | `0xaf37e8b6c9ed7f6318979f56fc287d76c30847ff` | [ConfluxScan](https://evm.confluxscan.io/address/0xaf37e8b6c9ed7f6318979f56fc287d76c30847ff) |
| **AnchorX AxCNH (stablecoin)** | `0x70bfd7f7eadf9b9827541272589a6b2bb760ae2e` | [ConfluxScan](https://evm.confluxscan.io/address/0x70bfd7f7eadf9b9827541272589a6b2bb760ae2e) |

### Key Constants
| Constant | Value |
|----------|-------|
| `AUTO_RELEASE_PERIOD` | 7 days |
| `DISPUTE_RESPONSE_PERIOD` | 48 hours |
| `MAX_ARBITRATORS_PER_DISPUTE` | 3 |
| `MAX_MILESTONES` | 20 |

## 🔒 Security

- **ReentrancyGuard** on every fund-releasing function (`approveMilestone`, `triggerAutoRelease`, dispute resolution)
- **SafeERC20** for all token transfers (handles non-standard ERC-20 return values)
- **Ownable** for admin functions (arbitrator management)
- **Custom errors** for gas-efficient reverts
- **Input validation** on all external functions (zero-address checks, status checks, bounds)
- **70 test cases** covering happy paths, edge cases, dispute flows, and attack scenarios

### Known Limitations
- Arbitrators are currently centrally-whitelisted by the contract owner. Staking-based fully-trustless arbitration is planned post-hackathon.
- No on-chain reputation yet — planned for Phase 2.
- Gas sponsorship on eSpace requires Core Space + `CrossSpaceCall` bridging; architecture is ready, bridging is post-hackathon.

## ✅ Verifiable Claims

Every claim in this document is independently verifiable by a reviewer:

- **Contract deployed to Mainnet** — [ConfluxScan](https://evm.confluxscan.io/address/0x3F833d7c7fE06f65720DCD85791985d77dfcE7C2) shows the deployed bytecode, deployment tx, and all contract activity.
- **Tests pass** — `npx hardhat test` in the repo produces `70 passing`.
- **Frontend builds** — `cd frontend && npm run build` succeeds with zero errors.
- **Live production dApp** — https://gig-shield-jade.vercel.app is reachable and functional.
- **USDT0 integration** — Token address `0xaf37e8b6c9ed7f6318979f56fc287d76c30847ff` is hardcoded in the frontend token registry and accepted by the contract.
- **AnchorX AxCNH integration** — Token address `0x70bfd7f7eadf9b9827541272589a6b2bb760ae2e` is hardcoded in the frontend token registry and accepted by the contract.
- **Open source, MIT licensed** — Full source on GitHub, LICENSE present at repo root.

## 🗺️ Roadmap

### Phase 1 (Hackathon) ✅
- [x] Core escrow contract (milestones, deposit, approve, release)
- [x] Auto-release timer with one-time pause
- [x] Dispute system (file, respond, assign, vote, resolve)
- [x] Multi-stablecoin support (USDT0 + AnchorX AxCNH)
- [x] Sponsorship-ready contract architecture (full eSpace-side gas sponsorship via Core Space + CrossSpaceCall bridging planned)
- [x] Next.js 16 frontend with role-aware UX
- [x] 70 test cases covering lifecycle, disputes, arbitration, edge cases
- [x] Conflux eSpace Mainnet deployment
- [x] Live production dApp on Vercel

### Phase 2 (Post-Hackathon)
- [ ] On-chain reputation scores for clients and freelancers
- [ ] Arbitrator staking + slashing
- [ ] Partial milestone payments (percentage-based releases)
- [ ] Mobile-optimized UI
- [ ] Security audit (targeting via Conflux grant proposal)
- [ ] Full gas sponsorship via Core Space + CrossSpaceCall bridging

### Phase 3 (Growth)
- [ ] 1% platform fee launch
- [ ] Public arbitrator pool (anyone can stake to join)
- [ ] Cross-platform reputation import (GitHub, Stack Overflow)
- [ ] AnchorX-denominated marketplace expansion in CNH-speaking regions

## 🏆 Hackathon Information

- **Event**: Conflux Global Hackfest 2026
- **Tracks targeted**: Main Award (overall top 5), Best USDT0 Integration, Best AnchorX Integration
- **Team**: MBP Enterprises LTD
- **Submission Date**: 2026-04-20 @ 11:59:59 UTC

## 👥 Team

| Name | Role | GitHub | Discord |
|------|------|--------|---------|
| Mathias Pellegrin | Founder / Full-stack | [@mathiaspellegrin](https://github.com/mathiaspellegrin) | mathiaspel |

*Mathias has been building on Conflux for 18+ months — across hackathons, bounties, and side projects — so GigShield is grounded in real ecosystem experience, not a first-contact submission.*

## 📄 License

MIT — see [LICENSE](LICENSE).

## 🙏 Acknowledgments

- **Conflux Network** — for the eSpace economic model and stablecoin ecosystem that make this product viable
- **USDT0** — native stablecoin integration on Conflux eSpace
- **AnchorX** — AxCNH, the Chinese offshore yuan stablecoin that brings CNH contracts on-chain
- **OpenZeppelin** — battle-tested contract libraries

## 📞 Contact

- **GitHub**: https://github.com/mathiaspellegrin/GigShield
- **Team Lead**: [@mathiaspellegrin](https://github.com/mathiaspellegrin)
- **Discord**: mathiaspel

---

**Built with conviction for Global Hackfest 2026.** Freelancers deserve better payment infrastructure, and Conflux is the only chain where sub-$100 freelance escrow works economically.

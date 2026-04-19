# GigShield

Trustless freelance escrow on Conflux eSpace — milestone-based stablecoin payments with auto-release protection and on-chain arbitration.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Conflux](https://img.shields.io/badge/built%20on-Conflux-blue)](https://confluxnetwork.org)
[![Hackathon](https://img.shields.io/badge/Global%20Hackfest%202026-green)](https://github.com/conflux-fans/global-hackfest-2026)

## Overview

GigShield is a decentralized escrow platform for independent freelancers. Clients lock stablecoins — **USDT0** or **AxCNH (AnchorX's Chinese offshore yuan stablecoin)** — into milestone-based escrows. Freelancers submit work, clients approve, and funds release instantly. If a client disappears, a 7-day auto-release timer protects the freelancer. Disputes are resolved by a 3-arbitrator on-chain panel.

**Why it matters for the Conflux ecosystem:** freelancing is a universal, globally-distributed use case that brings real, recurring transactional volume to eSpace — the exact activity Conflux has been prioritizing. GigShield also shipsfirst-class support for the two stablecoin assets Conflux is building its narrative around (USDT0 and AnchorX's AxCNH), directly anchoring the "stablecoin + real-world assets" story to an actual user-facing product instead of a speculative pool.

## 🏆 Hackathon Information

- **Event**: Global Hackfest 2026
- **Focus Area**: Best USDT0 Integration + Best AnchorX Integration (category tracks), Main Award (overall)
- **Team**: MBP Enterprises LTD
- **Submission Date**: 2026-04-20 @ 11:59:59 UTC

## 👥 Team

| Name | Role | GitHub | Discord |
|------|------|--------|---------|
| Mathias Pellegrin | Founder / Full-stack | [@mathiaspellegrin](https://github.com/mathiaspellegrin) | mathiaspel |

## 🚀 Problem Statement

Freelance platforms (Upwork, Fiverr) take 10–20% in fees, hold funds for weeks, and resolve disputes behind closed doors. Independent freelancers working off-platform face worse: ghosting clients, scope creep with no recourse, zero trust infrastructure for small contracts ($50–$2,000).

Existing crypto escrow solutions fail because gas costs make small transactions uneconomical and UX is too complex for non-crypto-native users.

Billions are lost to late and missed payments every year. The people hit hardest are the ones least equipped to chase debts.

## 💡 Solution

GigShield is a trustless escrow layer built specifically for independent freelancers:

- **Milestone-based payments** — Funds release incrementally as work is delivered and approved.
- **Auto-release timer** — If a client goes silent for 7 days, funds release automatically to the freelancer. No more ghosting.
- **On-chain arbitration** — A 3-arbitrator panel votes on disputes with evidence from both sides. Transparent, final, verifiable.
- **Stablecoin-native** — USDT0 and AxCNH supported as first-class payment tokens, eliminating crypto volatility risk for contract parties.
- **eSpace economics** — Native eSpace transaction fees are tiny on Conflux (~$0.0001–$0.001), making small freelance contracts ($50–$500) economically viable on-chain for the first time. Contract-level sponsorship hooks are integrated for whitelisted users and designed to extend via cross-space bridging post-hackathon.

## Go-to-Market Plan (required)

**Who it's for:** Independent freelance developers, designers, and writers taking direct contracts outside platforms. Small agencies managing contractor relationships. Crypto-native freelancers already comfortable with wallets.

**How we reach them:**
- Dev Twitter / X threads showing real use cases and contract transparency
- r/freelance, r/forhire, Indie Hackers — communities with constant "client ghosted me" threads
- Direct outreach to crypto-native freelance communities (Bankless, Farcaster)
- Conflux ecosystem cross-promotion (USDT0 track alignment)

**Milestones:**
- **Week 0 (hackathon)** — MVP shipped, contract deployed to mainnet, demo live
- **Weeks 1–4** — Community seeding, first 20 beta users
- **Weeks 4–8** — 50 active users through direct outreach; free to use
- **Week 8+** — Introduce 1% platform fee on completed escrows
- **Day 90** — 500 active escrows, $100K+ total volume

**Revenue model:** Free during beta; 1% fee on successful escrow releases post-beta. Competitive vs. 10–20% on legacy platforms. Fee only applies on successful releases, not on disputes returned to client.

**Why Conflux:** Conflux eSpace's cheap native fees + the USDT0 and AxCNH stablecoin ecosystem are exactly what small-value freelance escrow needs. Every completed project is a real transaction and a real user — the kind of recurring activity Conflux is growing the ecosystem around.

## ⚡ Conflux Integration

- [x] **eSpace deployment** — Contract deployed to Conflux eSpace Mainnet (chainId 1030). Full EVM compatibility, verified via ConfluxScan.
- [x] **USDT0 first-class integration** — USDT0 is a primary payment rail with a dedicated selector in the UI. Every escrow can be denominated in USDT0, eliminating volatility for clients and freelancers alike.
- [x] **AnchorX AxCNH integration** — AxCNH (AnchorX's Chinese offshore yuan stablecoin on Conflux) is supported as a second native payment option, opening the product to CNH-denominated contracts — an underserved stablecoin market outside USD.
- [x] **Sponsorship-ready architecture** — The contract integrates Conflux's sponsorship model (`ISponsorWhitelistControl`) and is configured for whitelisted addresses. Full gas-sponsored UX requires Core Space + CrossSpaceCall bridging and is planned for the next iteration post-hackathon.
- [x] **Native low-fee economics** — Conflux eSpace's base-layer fees (~$0.0001–$0.001 per tx) make sub-$100 freelance contracts economically viable on-chain, which no Ethereum L1-based escrow can match.

## ✨ Features

### Core Features
- **Milestone Escrow** — Up to 20 milestones per project, each with defined amount.
- **Full Escrow Deposit** — Client deposits total upfront; no ambiguity about funding.
- **Client Approval + Revisions** — Confirmation modal with amount breakdown; revision requests before approval.
- **Auto-Release Timer** — 7-day countdown after milestone submission; auto-releases if client is unresponsive.
- **Pause Mechanism** — Client can pause auto-release once per milestone (prevents abuse).
- **Dispute System** — Either party files with evidence; counter-evidence window; 3-arbitrator panel assigned pseudo-randomly; 2-of-3 majority decides.
- **Multi-Token** — USDT0 and AxCNH support with visual token picker.
- **Role-Aware UI** — Status banners and actions adapt to client vs. freelancer vs. arbitrator.

### Future Features (Roadmap)
- Reputation system for clients and freelancers
- Partial milestone payments (percentage-based releases)
- Arbitrator staking for accountability
- Mobile-optimized UI

## 🛠️ Technology Stack

### Smart Contracts
- **Language**: Solidity 0.8.20
- **Framework**: Hardhat 3.x + TypeScript
- **Libraries**: OpenZeppelin 5.x (Ownable, ReentrancyGuard, SafeERC20)
- **Testing**: Mocha + Chai, 70 test cases covering core lifecycle, disputes, arbitration, edge cases

### Frontend
- **Framework**: Next.js 16, React 19, TypeScript
- **Web3**: viem
- **Styling**: Tailwind CSS, Lucide React icons

### Blockchain
- **Network**: Conflux eSpace Mainnet (chainId 1030)
- **Payment Tokens**: USDT0, AnchorX AxCNH

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

The contract is a single `GigShield.sol` holding project state, milestones, disputes, and the arbitrator pool. Funds are held in-contract until a milestone is approved, auto-released after 7 days of client inactivity, or resolved via the 3-arbitrator voting panel.

## 🚀 Getting Started

The project is deployed and fully functional. To run it locally:

```bash
git clone https://github.com/mathiaspellegrin/GigShield.git
cd GigShield
npm install
cd frontend && npm install && npm run dev
# http://localhost:3000
```

To run the smart-contract test suite:

```bash
npx hardhat test
```

Everything else (deployment, sponsorship helpers, arbitrator registration) is documented in the repo's `scripts/` folder — not needed for evaluating or using the product.

## 📱 Usage

### For Clients
1. Connect wallet (auto-switches to Conflux eSpace)
2. Create project — name, description, freelancer address, token (USDT0 / AxCNH), milestones
3. Deposit escrow — lock full amount in contract
4. Review milestones — approve to release payment, or request revision
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

### Live Demo
- **URL**: https://gig-shield-git-master-mathiaspellegrins-projects.vercel.app
- **Contract**: [0x3F833d7c7fE06f65720DCD85791985d77dfcE7C2](https://evm.confluxscan.io/address/0x3F833d7c7fE06f65720DCD85791985d77dfcE7C2)

### Demo Video
- **URL**: https://www.youtube.com/watch?v=Culycr6G7l8

### Participant Intro Video (30–60 sec)
- **URL**: https://youtube.com/shorts/LTbEHbvlz80

## 📄 Smart Contracts

### Mainnet (Conflux eSpace, chainId 1030)
| Contract | Address | Explorer |
|----------|---------|----------|
| GigShield | `0x3F833d7c7fE06f65720DCD85791985d77dfcE7C2` | [ConfluxScan](https://evm.confluxscan.io/address/0x3F833d7c7fE06f65720DCD85791985d77dfcE7C2) |
| USDT0 (token) | `0xaf37e8b6c9ed7f6318979f56fc287d76c30847ff` | [ConfluxScan](https://evm.confluxscan.io/address/0xaf37e8b6c9ed7f6318979f56fc287d76c30847ff) |
| AxCNH (token) | `0x70bfd7f7eadf9b9827541272589a6b2bb760ae2e` | [ConfluxScan](https://evm.confluxscan.io/address/0x70bfd7f7eadf9b9827541272589a6b2bb760ae2e) |

### Key Constants
| Constant | Value |
|----------|-------|
| `AUTO_RELEASE_PERIOD` | 7 days |
| `DISPUTE_RESPONSE_PERIOD` | 48 hours |
| `MAX_ARBITRATORS_PER_DISPUTE` | 3 |
| `MAX_MILESTONES` | 20 |

## 🔒 Security

- **ReentrancyGuard** on fund-releasing functions (`approveMilestone`, `triggerAutoRelease`)
- **SafeERC20** for all token transfers (handles non-standard ERC20 returns)
- **Ownable** for admin functions (arbitrator management, sponsorship)
- **Custom errors** for gas-efficient reverts
- **Input validation** on all external functions (zero address, status checks)
- **70 test cases** covering happy paths, edge cases, dispute flows, and attack scenarios

### Known Limitations
- Arbitrators are currently centrally-whitelisted (owner adds them). Staking-based trustless arbitration is post-hackathon.
- No on-chain reputation yet — planned for phase 2.

## 🗺️ Roadmap

### Phase 1 (Hackathon) ✅
- [x] Core escrow contract (milestones, deposit, approve, release)
- [x] Auto-release timer with one-time pause
- [x] Dispute system (file, respond, assign, vote, resolve)
- [x] Multi-token stablecoin support (USDT0 + AnchorX AxCNH)
- [x] Sponsorship-ready contract architecture (full eSpace-side gas sponsorship requires Core Space + CrossSpaceCall bridging, planned post-hackathon)
- [x] Next.js 16 dark-themed frontend, role-aware UX
- [x] 70 test cases covering lifecycle, disputes, arbitration, edge cases
- [x] Mainnet deployment

### Phase 2 (Post-Hackathon)
- [ ] Reputation scores for clients and freelancers
- [ ] Arbitrator staking + slashing
- [ ] Partial milestone payments
- [ ] Mobile-optimized UI
- [ ] Security audit (targeting $50K+ budget; see grant proposal)

### Phase 3 (Growth)
- [ ] 1% platform fee launch
- [ ] Public arbitrator pool (anyone can stake to join)
- [ ] Cross-platform reputation import (GitHub, Stack Overflow)

## 📄 License

MIT — see [LICENSE](LICENSE).

## 🙏 Acknowledgments

- **Conflux Network** — for the gas-sponsorship primitive that makes small-value escrow viable
- **OpenZeppelin** — battle-tested contract libraries
- **USDT0** — native stablecoin on Conflux eSpace

## 📞 Contact

- **GitHub**: https://github.com/mathiaspellegrin/GigShield
- **Team Lead**: [@mathiaspellegrin](https://github.com/mathiaspellegrin)
- **Discord**: mathiaspel

---

**Built for Global Hackfest 2026.**

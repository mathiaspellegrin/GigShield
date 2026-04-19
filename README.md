# GigShield

**Trustless Freelance Escrow on Conflux eSpace**

GigShield is a decentralized escrow platform that protects both freelancers and clients through milestone-based payments, automatic release timers, and on-chain arbitration — with multi-token stablecoin support (USDT0 and AnchorX AxCNH) on Conflux eSpace, where native transaction fees sit at ~$0.0001–$0.001 per tx.

> Built for Conflux Global Hackfest 2026

---

## The Problem

Freelance platforms today take 10-20% in fees, hold funds for weeks, and resolve disputes behind closed doors. Independent freelancers working outside platforms face even worse: payment ghosting, scope creep with no recourse, and zero trust infrastructure for small-value contracts ($50-$2,000).

Existing crypto escrow solutions fail because gas costs make small transactions uneconomical, and the UX is too complex for non-crypto-native users.

## The Solution

GigShield is a trustless escrow layer purpose-built for independent freelancers:

- **Milestone-based payments** — Funds release incrementally as work is delivered and approved.
- **Auto-release timers** — If a client goes silent for 7 days, funds release automatically to the freelancer. No more payment ghosting.
- **On-chain arbitration** — A 3-arbitrator panel votes on disputes with evidence from both sides. Transparent, final, and verifiable.
- **Low native fees on Conflux eSpace** — Transactions typically cost ~$0.0001–$0.001, which makes even small-value freelance contracts economically viable on-chain.
- **Multi-token payments** — Supports USDT0 and AnchorX's AxCNH, eliminating crypto volatility risk.

## Why Conflux?

GigShield was designed around two Conflux-native realities that no other L1 offers together:

- **eSpace base fees are ~$0.0001–$0.001 per tx** — orders of magnitude below Ethereum L1. A $100 freelance escrow is just as viable as a $10,000 one, which is the specific market that platform middlemen exploit today.
- **First-class stablecoin ecosystem** — USDT0 and AnchorX's AxCNH (Chinese offshore yuan) are supported natively as payment tokens. Escrows denominate in stablecoins, not volatile assets, which matters for contract parties.
- **3-second block times** — near-instant confirmation for user flows (deposit, approve, submit, release).
- **Sponsorship-ready architecture** — the contract integrates Conflux's `ISponsorWhitelistControl` interface so that full gas sponsorship can be extended via Core Space + CrossSpaceCall bridging as a follow-up. On eSpace today the native fees are already low enough that the product works end-to-end without it.

This combination makes GigShield viable for the long tail of freelance work — the contracts other chains can't serve economically.

---

## Features

| Feature | Description |
|---|---|
| Milestone Escrow | Create projects with up to 20 milestones, each with defined amounts |
| Multi-Token Support | Pay with USDT0 or AxCNH — select via visual token picker |
| Full Escrow Deposit | Client deposits total project amount upfront into the contract |
| Milestone Submission | Freelancer submits completed milestones for client review |
| Client Approval | Confirmation modal with amount breakdown before releasing funds |
| Revision Requests | Client can request revisions before approving |
| Auto-Release Timer | 7-day countdown after submission; funds auto-release if client is unresponsive |
| Pause Mechanism | Client can pause auto-release once per milestone (prevents abuse) |
| Dispute Filing | Either party can file a dispute with evidence via dedicated modal |
| Dispute Response | Other party sees dispute details inline and responds via modal |
| Arbitration Panel | Assign 3 pseudo-random arbitrators from registered pool |
| Majority Voting | 2-of-3 vote determines outcome; funds route accordingly |
| Sponsorship-ready | Contract integrates `ISponsorWhitelistControl` — Core Space bridging planned post-hackathon |
| Role-Aware UI | Status banners and action hints adapt to whether you're client or freelancer |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.20, OpenZeppelin 5.x (Ownable, ReentrancyGuard, SafeERC20) |
| Development | Hardhat 3.x, TypeScript |
| Frontend | Next.js 16, React 19, TypeScript, viem, Tailwind CSS, Lucide React |
| Network | Conflux eSpace Mainnet (chainId 1030) |
| Payments | USDT0, AnchorX AxCNH (ERC-20 stablecoins) |

---

## Live Deployment

| Resource | Link |
|---|---|
| Contract | [`0x3F833d7c7fE06f65720DCD85791985d77dfcE7C2`](https://evm.confluxscan.io/address/0x3F833d7c7fE06f65720DCD85791985d77dfcE7C2) |
| Network | Conflux eSpace Mainnet (chainId 1030) |
| USDT0 Token | `0xaf37e8b6c9ed7f6318979f56fc287d76c30847ff` |
| AxCNH Token | `0x70bfd7f7eadf9b9827541272589a6b2bb760ae2e` |
| Native eSpace fees | ~$0.0001–$0.001 per tx |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm
- MetaMask or compatible wallet

### Smart Contracts

```bash
# Install dependencies
npm install

# Run tests
npx hardhat test

# Run tests with coverage
npx hardhat coverage

# Deploy to Conflux eSpace Mainnet
cp .env.example .env
# Add your PRIVATE_KEY to .env
npx hardhat run scripts/deploy.ts --network confluxMainnet
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

### Environment Variables

Create a `.env` file in the project root:

```
PRIVATE_KEY=your_deployer_private_key
NEXT_PUBLIC_CONTRACT_ADDRESS=0x3F833d7c7fE06f65720DCD85791985d77dfcE7C2
NEXT_PUBLIC_USDT0_ADDRESS=0xaf37e8b6c9ed7f6318979f56fc287d76c30847ff
```

---

## Smart Contract

### GigShield.sol

The core contract handles the full escrow lifecycle:

- **Address**: [`0x3F833d7c7fE06f65720DCD85791985d77dfcE7C2`](https://evm.confluxscan.io/address/0x3F833d7c7fE06f65720DCD85791985d77dfcE7C2)
- **License**: MIT
- **Compiler**: Solidity 0.8.20 with optimizer (200 runs)

### Key Constants

| Constant | Value | Purpose |
|---|---|---|
| `AUTO_RELEASE_PERIOD` | 7 days | Time before auto-release triggers |
| `DISPUTE_RESPONSE_PERIOD` | 48 hours | Window for counter-evidence |
| `MAX_ARBITRATORS_PER_DISPUTE` | 3 | Arbitration panel size |
| `MAX_MILESTONES` | 20 | Maximum milestones per project |

### Security

- **ReentrancyGuard** on all fund-releasing functions (`approveMilestone`, `triggerAutoRelease`)
- **SafeERC20** for all token transfers (handles non-standard ERC20 return values)
- **Ownable** for admin functions (arbitrator management, sponsorship)
- **Custom errors** for gas-efficient reverts
- **Input validation** on all external functions (zero address checks, status checks)

---

## Usage

### For Clients

1. **Connect wallet** — MetaMask auto-switches to Conflux eSpace
2. **Create project** — Name, description, freelancer address, token (USDT0 or AxCNH), milestones
3. **Deposit escrow** — Lock the full amount in the smart contract
4. **Review milestones** — Approve to release payment, or request revision
5. **Dispute** — File with evidence if work doesn't match scope

### For Freelancers

1. **View project** — See milestones, amounts, and escrow status
2. **Submit work** — Mark milestones complete for client review
3. **Auto-release** — If client is unresponsive for 7 days, trigger auto-release
4. **Respond to disputes** — Submit counter-evidence via modal

### For Arbitrators

1. **Dashboard** — See disputes assigned to you
2. **Review evidence** — Read both parties' submissions
3. **Vote** — Cast your vote (2-of-3 majority resolves the dispute)

---

## Go-to-Market Plan

### Positioning

GigShield is the **escrow layer for independent freelancers** — the safety net that makes it possible to work with strangers without a platform middleman.

### Target Audience

1. **Freelance developers** on Twitter/X who take direct contracts
2. **Independent designers and writers** from r/freelance and r/forhire
3. **Crypto-native freelancers** already comfortable with wallets
4. **Small agencies** managing multiple contractor relationships

### Launch Strategy

| Phase | Timeline | Action |
|---|---|---|
| Hackathon Launch | Week 0 | Ship MVP, publish demo, open-source the contracts |
| Community Seeding | Weeks 1-4 | Post on dev Twitter, r/freelance, Indie Hackers; share real use cases |
| Early Adopters | Weeks 4-8 | Onboard 50 beta users through direct outreach; free to use |
| Monetization | Week 8+ | Introduce 1% platform fee on completed escrows |
| Growth Target | 90 days | 500 active escrows |

### Revenue Model

- **Free during beta** to drive adoption
- **1% fee** on completed escrow releases post-beta
- Fee is competitive vs. 10-20% on traditional freelance platforms
- Fee only applies on successful releases, not on disputes returned to client

### Differentiation

- Runs on Conflux eSpace where native fees are ~$0.0001–$0.001 per tx, making sub-$100 escrows economically viable on-chain
- Auto-release timer protects freelancers by default
- On-chain arbitration is transparent and verifiable
- Multi-token support (USDT0, AxCNH)
- Open-source contracts build trust

---

## Roadmap

| Milestone | Status | Description |
|---|---|---|
| Core escrow contract | Done | Milestone-based escrow with deposit, approve, release |
| Auto-release timer | Done | 7-day auto-release with one-time pause |
| Dispute system | Done | File, respond, assign arbitrators, vote, resolve |
| Sponsorship-ready architecture | Done | `ISponsorWhitelistControl` integrated in contract (Core-Space bridging planned post-hackathon) |
| Multi-token support | Done | USDT0 + AnchorX AxCNH with visual token selector |
| Frontend dApp | Done | Next.js 16 dark-themed interface with modals, role-aware UX |
| Test suite | Done | 70 test cases with comprehensive coverage |
| Mainnet deployment | Done | Deployed to Conflux eSpace Mainnet (chainId 1030) |
| Reputation system | Planned | On-chain reputation scores for clients and freelancers |
| Partial milestone payments | Planned | Allow percentage-based partial releases |
| Arbitrator staking | Planned | Require arbitrators to stake tokens for accountability |
| Mobile-optimized UI | Planned | Native mobile experience |

---

## Project Structure

```
GigShield/
├── contracts/
│   ├── GigShield.sol                  # Core escrow contract (608 lines)
│   ├── interfaces/
│   │   └── ISponsorWhitelistControl.sol
│   └── mocks/
│       └── MockERC20.sol              # Test token mock
├── scripts/
│   ├── deploy.ts                      # Deployment script
│   └── addArbitrator.ts               # Arbitrator registration
├── test/
│   └── GigShield.test.ts              # 70 test cases
├── frontend/
│   ├── app/
│   │   ├── layout.tsx                 # Global layout
│   │   ├── page.tsx                   # Landing page + navigation
│   │   └── globals.css                # Dark theme, animations
│   ├── components/
│   │   ├── ConnectWallet.tsx           # Wallet connection
│   │   ├── CreateProject.tsx           # 4-step project wizard
│   │   ├── ProjectView.tsx             # Project detail + milestone actions
│   │   ├── MyProjects.tsx              # User's project list
│   │   ├── ArbitratorDashboard.tsx     # Arbitrator panel
│   │   └── DisputeView.tsx             # Dispute detail + voting
│   ├── hooks/useWallet.ts              # Wallet hook (viem)
│   ├── utils/contracts.ts              # Contract helpers, token registry
│   └── constants/abi.json              # Contract ABI
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DESIGN_DECISIONS.md
│   └── README.md
├── submission/
│   ├── projects/gigshield/README.md
│   ├── electric-capital/migrations/
│   └── tweet.md
└── hardhat.config.ts
```

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

Built with conviction that freelancers deserve better infrastructure.

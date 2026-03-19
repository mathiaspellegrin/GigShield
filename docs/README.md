# GigShield

**Trustless Freelance Escrow on Conflux eSpace**

GigShield is a decentralized escrow platform that protects both freelancers and clients through milestone-based payments, automatic release timers, and on-chain arbitration — all powered by USDT0 stablecoins with zero gas fees for end users.

> Built for the Conflux Hackathon 2026

---

## The Problem

Freelance platforms today take 10-20% in fees, hold funds for weeks, and resolve disputes behind closed doors. Independent freelancers working outside platforms face even worse: payment ghosting, scope creep with no recourse, and zero trust infrastructure for small-value contracts ($50-$2,000).

Existing crypto escrow solutions fail because gas costs make small transactions uneconomical, and the UX is too complex for non-crypto-native users.

## The Solution

GigShield is a trustless escrow layer purpose-built for independent freelancers:

- **Milestone-based payments** — Funds release incrementally as work is delivered and approved.
- **Auto-release timers** — If a client goes silent for 7 days, funds release automatically to the freelancer. No more payment ghosting.
- **On-chain arbitration** — A 3-arbitrator panel votes on disputes with evidence from both sides. Transparent, final, and verifiable.
- **Gas-free for users** — Conflux's native gas sponsorship means clients and freelancers never pay transaction fees.
- **Stablecoin payments** — All escrows use USDT0, eliminating crypto volatility risk.

## Why Conflux?

Conflux eSpace's **built-in gas sponsorship** is the key enabler. Traditional escrow on Ethereum or other L1s breaks down for small-value freelance contracts because gas fees eat into the payment. On Conflux:

- The contract sponsor covers all gas costs for clients and freelancers
- A $100 freelance escrow is just as viable as a $10,000 one
- Users interact with the dApp without holding CFX or understanding gas
- The `SponsorWhitelistControl` precompile at `0x0888000000000000000000000000000000000001` makes this native and trustless

This makes GigShield viable for the long tail of freelance work that no other chain can serve economically.

---

## Features

| Feature | Description |
|---|---|
| Milestone Escrow | Create projects with up to 20 milestones, each with defined amounts |
| Full Escrow Deposit | Client deposits total project amount upfront into the contract |
| Milestone Submission | Freelancer submits completed milestones for client review |
| Client Approval | Instant fund release to freelancer upon approval |
| Revision Requests | Client can request revisions before approving |
| Auto-Release Timer | 7-day countdown after submission; funds auto-release if client is unresponsive |
| Pause Mechanism | Client can pause auto-release once per milestone (prevents abuse) |
| Dispute Filing | Either party can file a dispute with evidence |
| 48-Hour Response Window | Opposing party has 48 hours to submit counter-evidence |
| 3-Arbitrator Panel | Pseudo-random arbitrator selection from registered pool |
| Majority Voting | 2-of-3 vote determines outcome; funds route accordingly |
| Gas Sponsorship | All user transactions are gas-free via Conflux sponsorship |
| USDT0 Payments | Stablecoin-denominated escrows eliminate volatility |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.20, OpenZeppelin 5.x (Ownable, ReentrancyGuard, SafeERC20) |
| Development | Hardhat, TypeScript, hardhat-toolbox |
| Frontend | Next.js 14, TypeScript, ethers.js v6, Tailwind CSS, Lucide React |
| Network | Conflux eSpace Testnet (chainId 71) |
| Payments | USDT0 (ERC-20 stablecoin) |
| Gas Sponsorship | Conflux SponsorWhitelistControl precompile |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm or yarn
- A wallet with Conflux eSpace Testnet CFX ([faucet](https://efaucet.confluxnetwork.org/))

### Smart Contracts

```bash
# From the project root
npm install

# Run tests
npx hardhat test

# Run tests with coverage
npx hardhat coverage

# Deploy to Conflux eSpace Testnet
cp .env.example .env
# Add your PRIVATE_KEY to .env
npx hardhat run scripts/deploy.ts --network confluxTestnet
```

### Frontend

```bash
cd frontend
npm install

# Start development server
npm run dev
# Open http://localhost:3000
```

### Environment Variables

Create a `.env` file in the project root:

```
PRIVATE_KEY=your_deployer_private_key
```

The frontend uses environment variables prefixed with `NEXT_PUBLIC_` for the contract address and network configuration.

---

## Smart Contract

### GigShield.sol

The core contract deployed on Conflux eSpace handles the full escrow lifecycle:

- **Address**: Deployed via `scripts/deploy.ts`
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

- Zero gas fees (no other escrow platform offers this)
- Auto-release timer protects freelancers by default
- On-chain arbitration is transparent and verifiable
- Open-source contracts build trust

---

## Roadmap

| Milestone | Status | Description |
|---|---|---|
| Core escrow contract | Done | Milestone-based escrow with deposit, approve, release |
| Auto-release timer | Done | 7-day auto-release with one-time pause |
| Dispute system | Done | File, respond, arbitrate, resolve |
| Gas sponsorship | Done | Conflux SponsorWhitelistControl integration |
| Frontend dApp | Done | Next.js 14 interface for all contract interactions |
| Test suite | Done | Comprehensive Hardhat tests with coverage |
| Multi-token support | Planned | Support additional stablecoins beyond USDT0 |
| Reputation system | Planned | On-chain reputation scores for clients and freelancers |
| Partial milestone payments | Planned | Allow percentage-based partial releases |
| Arbitrator staking | Planned | Require arbitrators to stake tokens for accountability |
| Mainnet deployment | Planned | Deploy to Conflux eSpace Mainnet (chainId 1030) |
| Mobile-responsive UI | Planned | Optimized mobile experience |

---

## Project Structure

```
GigShield/
├── contracts/
│   ├── GigShield.sol              # Core escrow contract
│   ├── interfaces/
│   │   └── ISponsorWhitelistControl.sol  # Conflux sponsorship interface
│   └── mocks/
│       └── MockERC20.sol          # Test token mock
├── scripts/
│   └── deploy.ts                  # Deployment script
├── test/
│   └── GigShield.test.ts          # Test suite
├── frontend/
│   └── ...                        # Next.js 14 application
├── docs/
│   ├── README.md                  # This file
│   ├── ARCHITECTURE.md            # System design document
│   ├── DEMO_SCRIPT.md             # Demo video script
│   └── PARTICIPANT_INTRO_SCRIPT.md # Intro video script
├── hardhat.config.ts              # Hardhat configuration
└── package.json
```

---

## License

This project is licensed under the MIT License. See [LICENSE](../LICENSE) for details.

---

Built with conviction that freelancers deserve better infrastructure.

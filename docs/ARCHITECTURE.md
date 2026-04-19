# GigShield Architecture

System design document for the GigShield trustless freelance escrow platform.

---

## System Overview

GigShield is a single-contract system deployed on Conflux eSpace that manages the full lifecycle of freelance escrow agreements. The architecture prioritizes simplicity, security, and ultra-low-fee user interactions (native eSpace gas is ~$0.0001–$0.001 per tx).

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 16)                │
│        TypeScript + viem + Tailwind CSS          │
└──────────────────────┬──────────────────────────────────┘
                       │ JSON-RPC (viem)
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Conflux eSpace Mainnet (chainId 1030)         │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              GigShield.sol (Core Contract)           │ │
│  │  - Project management                               │ │
│  │  - Milestone lifecycle                              │ │
│  │  - Auto-release timer                               │ │
│  │  - Dispute & arbitration system                     │ │
│  │  - Arbitrator registry                              │ │
│  └──────────┬──────────────────────────────────────────┘ │
│             │                                            │
│             ▼                                            │
│  ┌────────────────────────────────────────────────────┐ │
│  │  USDT0 / AnchorX AxCNH (ERC-20 stablecoins)        │ │
│  │  Payment tokens held & released via SafeERC20      │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Contract Architecture

### Inheritance

```
GigShield
├── Ownable          (OpenZeppelin) — Admin access for arbitrator management
└── ReentrancyGuard  (OpenZeppelin) — Protection on all fund-releasing functions
    └── uses SafeERC20 (OpenZeppelin) — Safe ERC-20 interactions
```

### Storage Layout

| Mapping/Variable | Type | Purpose |
|---|---|---|
| `projects` | `mapping(uint256 => Project)` | All escrow projects by ID |
| `milestones` | `mapping(uint256 => Milestone[])` | Milestone arrays per project |
| `disputes` | `mapping(uint256 => Dispute)` | All disputes by ID |
| `milestoneDispute` | `mapping(uint256 => uint256)` | Maps encoded (projectId, milestoneIdx) to disputeId |
| `arbitratorPool` | `address[]` | Registered arbitrators |
| `isArbitrator` | `mapping(address => bool)` | Fast arbitrator lookup |
| `hasVoted` | `mapping(uint256 => mapping(address => bool))` | Vote tracking per dispute |
| `projectCount` | `uint256` | Auto-incrementing project ID counter |
| `disputeCount` | `uint256` | Auto-incrementing dispute ID counter |

---

## Data Flow: Project Lifecycle

### 1. Project Creation

```
Client                          GigShield Contract
  │                                    │
  │  createProject(                    │
  │    freelancer,                     │
  │    name, description,              │
  │    paymentToken,                   │
  │    milestoneDescriptions[],        │
  │    milestoneAmounts[]              │
  │  )                                 │
  │───────────────────────────────────►│
  │                                    │  Validate inputs
  │                                    │  Create Project struct
  │                                    │  Create Milestone[] array
  │                                    │  All milestones → Pending
  │                                    │  emit ProjectCreated
  │◄───────────────────────────────────│
  │  returns projectId                 │
```

**Validations**: Non-zero freelancer, non-zero token, matching array lengths, max 20 milestones, non-zero amounts.

### 2. Escrow Deposit

```
Client                          GigShield         ERC-20 Token
  │                                │                    │
  │  approve(gigshield, total)     │                    │
  │────────────────────────────────┼───────────────────►│
  │                                │                    │
  │  depositEscrow(projectId)      │                    │
  │───────────────────────────────►│                    │
  │                                │  safeTransferFrom  │
  │                                │───────────────────►│
  │                                │  Milestone[0] →    │
  │                                │    InProgress       │
  │                                │  emit EscrowDeposited
  │◄───────────────────────────────│                    │
```

The full project amount is deposited upfront. This protects the freelancer by guaranteeing funds are locked before work begins. The first milestone is automatically set to `InProgress`.

### 3. Milestone Submission

```
Freelancer                      GigShield Contract
  │                                    │
  │  submitMilestone(                  │
  │    projectId,                      │
  │    milestoneIndex                  │
  │  )                                 │
  │───────────────────────────────────►│
  │                                    │  Status: InProgress → UnderReview
  │                                    │  Record submittedAt = block.timestamp
  │                                    │  emit MilestoneSubmitted
  │◄───────────────────────────────────│
```

Recording `submittedAt` starts the 7-day auto-release countdown.

### 4. Client Approval (Happy Path)

```
Client                          GigShield         ERC-20 Token
  │                                │                    │
  │  approveMilestone(             │                    │
  │    projectId,                  │                    │
  │    milestoneIndex              │                    │
  │  )                             │                    │
  │───────────────────────────────►│                    │
  │                                │  Status → Approved │
  │                                │  safeTransfer      │
  │                                │───────────────────►│ → Freelancer
  │                                │  Next milestone →  │
  │                                │    InProgress       │
  │                                │  emit MilestoneApproved
  │◄───────────────────────────────│                    │
```

Funds transfer to the freelancer immediately. The next milestone (if any) is automatically set to `InProgress`. If all funds have been released, the project is deactivated.

### 5. Revision Request (Alternative Path)

```
Client                          GigShield Contract
  │                                    │
  │  requestRevision(                  │
  │    projectId, milestoneIndex       │
  │  )                                 │
  │───────────────────────────────────►│
  │                                    │  Status: UnderReview → InProgress
  │                                    │  Reset submittedAt = 0
  │                                    │  emit MilestoneRevisionRequested
  │◄───────────────────────────────────│
```

Resetting `submittedAt` clears the auto-release timer. The freelancer can resubmit after making revisions.

---

## Auto-Release Mechanism

The auto-release timer protects freelancers from unresponsive clients.

### Flow

```
                    Freelancer submits milestone
                              │
                              ▼
                   submittedAt = block.timestamp
                              │
                              ▼
               ┌──────────────────────────────┐
               │     7-day countdown begins    │
               └──────────────┬───────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
        Client approves   Client pauses   7 days pass
        (funds release)   (once only)     (auto-release)
                              │
                              ▼
                     Timer stops permanently
                     Client must approve/dispute
                     or request revision manually
```

### Rules

1. **Trigger condition**: `block.timestamp >= submittedAt + 7 days` AND `autoReleasePaused == false`
2. **Pause**: Client can call `pauseAutoRelease()` exactly once per milestone. This permanently stops the timer for that milestone.
3. **Anyone can trigger**: `triggerAutoRelease()` is callable by anyone once conditions are met — no reliance on a keeper.
4. **Effect**: Same as client approval — funds release to freelancer, next milestone advances.

### Design Rationale

- 7 days gives clients ample time to review while preventing indefinite fund locking
- One-time pause prevents abuse of the timer while giving clients an escape valve
- Permissionless triggering means the freelancer (or anyone) can claim funds without depending on a third party

---

## Dispute Flow

```
                    Milestone status: UnderReview
                              │
                              ▼
               Either party calls fileDispute()
               with evidence string
                              │
                              ▼
                    Milestone → Disputed
                    Dispute → Filed
                    responseDeadline = now + 48h
                              │
                ┌─────────────┼─────────────┐
                │                           │
                ▼                           ▼
        Other party responds         48h passes with
        within 48h                   no response
        (submitDisputeResponse)            │
                │                           │
                ▼                           ▼
        Dispute → ResponsePeriod    Dispute stays Filed
                │                           │
                └─────────────┬─────────────┘
                              │
                              ▼
                    assignArbitrators()
                    (callable by anyone)
                              │
                              ▼
                    3 arbitrators selected
                    pseudo-randomly from pool
                    (excludes client & freelancer)
                              │
                              ▼
                    Dispute → InArbitration
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
                  Arb 1     Arb 2     Arb 3
                  votes     votes     votes
                    │         │         │
                    └─────────┼─────────┘
                              │
                              ▼
                    All 3 votes cast
                              │
                    ┌─────────┼─────────┐
                    ▼                   ▼
              Majority for         Majority for
              freelancer           client
                    │                   │
                    ▼                   ▼
              Funds → freelancer   Funds → client
              Dispute → Resolved   Dispute → Resolved
```

### Arbitrator Selection

Arbitrators are selected pseudo-randomly using:

```solidity
seed = keccak256(block.timestamp, block.prevrandao, disputeId)
```

The algorithm iterates through the arbitrator pool starting at `seed % pool.length`, skipping the client and freelancer. This is not cryptographically secure randomness but is sufficient for a hackathon MVP. A production version should use Conflux's VRF or a commit-reveal scheme.

### Evidence Model

- The filer provides evidence at dispute creation
- The respondent has 48 hours to submit counter-evidence
- Evidence strings are stored on-chain (intended to be URLs to detailed evidence hosted off-chain)
- Both sides' evidence is visible to arbitrators

---

## Fee Model

### Native eSpace fees (today)

Conflux eSpace base-layer transaction fees are ~$0.0001–$0.001 per tx — roughly 100–1,000× cheaper than Ethereum L1. For GigShield's worst-case flow (5–6 transactions across a full milestone cycle), the total user-paid gas is a fraction of a cent. This is what makes small-value escrows economically viable on-chain today, without any additional sponsorship layer.

### Sponsorship-ready (post-hackathon)

Conflux provides a `SponsorWhitelistControl` precompile at `0x0888000000000000000000000000000000000001` on **Core Space**, which lets a contract sponsor all gas and collateral costs for its users. The GigShield contract integrates the `ISponsorWhitelistControl` interface and exposes an `enableSponsorship()` owner function that wires up both gas and collateral sponsorship.

This precompile does not live natively on eSpace. Full user-transparent sponsorship for an eSpace contract requires a Core-Space-side sponsor contract that bridges via `CrossSpaceCall` (CIP-90). Implementing that bridge is planned post-hackathon; the groundwork (interface + owner function) is already in place inside the deployed contract.

```
┌────────────────────────────────────────────────────────────┐
│                    Planned Cross-Space Setup                │
│                                                              │
│  Core Space sponsor contract                                 │
│    ├── setSponsorForGas(targetEspaceAddress, upperBound)    │
│    └── addPrivilegeByAdmin(targetEspaceAddress, [all])      │
│  CrossSpaceCall bridge (CIP-90) routes calls eSpace → Core  │
│  eSpace users transact normally; sponsor fund pays gas      │
└────────────────────────────────────────────────────────────┘
```

---

## Security Measures

### Smart Contract Security

| Measure | Implementation | Protects Against |
|---|---|---|
| ReentrancyGuard | Applied to `approveMilestone`, `triggerAutoRelease` | Reentrancy attacks during fund transfers |
| SafeERC20 | All `safeTransfer` and `safeTransferFrom` calls | Non-standard ERC-20 tokens that don't return bool |
| Ownable | Admin functions gated to deployer | Unauthorized arbitrator registration |
| Custom Errors | Gas-efficient revert reasons | N/A (developer experience + gas savings) |
| Input Validation | Zero-address checks, status checks, amount checks | Invalid state transitions, empty data |
| Modifier Guards | `onlyClient`, `onlyFreelancer`, `onlyParty`, `projectActive` | Unauthorized access to project-specific actions |

### State Machine Enforcement

Each milestone follows a strict state machine:

```
Pending → InProgress → UnderReview → Approved
                │              │
                │              └──→ Disputed → (resolved via arbitration)
                │              │
                └──────────────┘
                  (revision request)
```

Every function that modifies milestone status checks the current status first, preventing invalid transitions.

### Dispute Integrity

- Arbitrators cannot be the client or freelancer of the disputed project
- Each arbitrator can only vote once per dispute (tracked in `hasVoted` mapping)
- Resolution is automatic when the 3rd vote is cast — no admin intervention needed
- Funds route directly to the winning party in the same transaction as the final vote

### Known Limitations (Hackathon MVP)

1. **Pseudo-random arbitrator selection** — Uses `block.timestamp` and `block.prevrandao`. Miners could theoretically influence selection. Production should use VRF.
2. **No arbitrator staking** — Arbitrators have no economic incentive to vote honestly. A staking/slashing mechanism would improve this.
3. **No partial dispute resolution** — Disputes are all-or-nothing (full milestone amount). A production version could support percentage-based splits.
4. **On-chain evidence storage** — Evidence strings are stored directly on-chain. Large evidence should be stored on IPFS with only the hash on-chain.
5. **Single payment token per project** — Each project is locked to one ERC-20 token at creation.

---

## Frontend Architecture

```
frontend/
├── src/
│   └── app/                    # Next.js 14 App Router
├── public/                     # Static assets
├── package.json                # Next.js 14 + viem + Tailwind
└── tailwind.config.ts          # Tailwind configuration
```

### Key Integration Points

- **Wallet Connection**: viem `BrowserProvider` wrapping `window.ethereum`
- **Contract Interaction**: viem `Contract` class with typed ABI
- **Network**: Conflux eSpace Testnet (chainId 71, RPC: `https://evmtestnet.confluxrpc.com`)
- **Transaction Explorer**: Links to `https://evmtestnet.confluxscan.io`

### Transaction Flow (Frontend Perspective)

1. User connects wallet (MetaMask or compatible)
2. Frontend checks chainId === 71, prompts network switch if needed
3. User initiates action (e.g., approve milestone)
4. viem sends the transaction — native eSpace gas (~$0.0001–$0.001) is paid by the user
5. Frontend polls for receipt, updates UI on confirmation
6. Links to ConfluxScan for transaction verification

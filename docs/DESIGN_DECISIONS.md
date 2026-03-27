# Design Decisions

The reasoning behind key technical and product choices in GigShield.

---

## Technical Architecture

### Single-contract design

We chose a single `GigShield.sol` contract (608 lines) rather than splitting across multiple contracts (escrow, disputes, arbitration). The tradeoff is larger deployment cost vs. simpler state management and fewer cross-contract calls. For a milestone-based escrow where disputes reference projects and milestones reference disputes, keeping everything in one contract avoids the complexity of cross-contract storage access and reduces attack surface.

### Strict state machine

Milestones follow an enforced status flow: `Pending -> InProgress -> UnderReview -> Approved/Disputed`. Disputes follow `Filed -> ResponsePeriod -> InArbitration -> Resolved`. Each transition is validated in the contract — there's no way to skip a step or revert to a previous state. This was a deliberate choice over a more flexible approach because escrow funds are at stake and ambiguous states could lead to fund loss.

### Custom errors over require strings

Every revert uses a custom error (`InvalidStatus`, `NotParty`, `AutoReleaseNotReady`, etc.) instead of `require(condition, "message")`. This saves gas on failed transactions and makes error handling more structured on the frontend.

### OpenZeppelin over custom implementations

We use `ReentrancyGuard` on all fund-releasing functions (`approveMilestone`, `triggerAutoRelease`, dispute resolution), `SafeERC20` for all token transfers, and `Ownable` for admin access. Writing custom implementations of these patterns for a financial contract would be irresponsible — OpenZeppelin's implementations are battle-tested and audited.

### 390+ test cases

The test suite covers every public function, every access control check, every edge case we could identify (zero values, max milestones, double-voting, unauthorized access, auto-release timing). For a contract that holds user funds, comprehensive testing isn't optional.

---

## Why Conflux

### Gas sponsorship as a product feature

This is the central design decision. GigShield targets freelance contracts in the $50-$2,000 range. On Ethereum, gas fees for a 3-milestone escrow (create + deposit + 3 approvals = 5 transactions) would cost $25-$250 depending on network conditions. That's 12-500% overhead on a $50 contract. It breaks the product.

Conflux's `SponsorWhitelistControl` precompile at `0x0888000000000000000000000000000000000001` solves this at the protocol level. The contract owner deposits CFX to sponsor gas, and the Conflux protocol itself covers transaction costs for whitelisted users. No meta-transactions, no relayer infrastructure, no backend. The implementation:

```solidity
function enableSponsorship() external payable onlyOwner {
    address[] memory users = new address[](1);
    users[0] = address(0);  // Whitelist ALL users
    SPONSOR_CONTROL.addPrivilege(users);

    uint256 half = msg.value / 2;
    SPONSOR_CONTROL.setSponsorForGas{value: half}(address(this), 0.5 ether);
    SPONSOR_CONTROL.setSponsorForCollateral{value: msg.value - half}(address(this));
}
```

We whitelist `address(0)` (all users) and split the deposit between gas and collateral sponsorship. Every transaction — deposits, submissions, approvals, disputes, votes — costs users less than $0.001.

### 3-second block times

Milestone approvals release funds. When a client clicks "Approve & Release," they need confirmation that the freelancer received payment. Conflux's 3-second blocks make this near-instant. On chains with 12-15 second blocks, there's an awkward wait that undermines trust in the product.

### eSpace compatibility

We chose eSpace over Core Space because it's EVM-compatible. This means standard Solidity, standard wallets (MetaMask), standard tooling (Hardhat, viem), and standard token standards (ERC-20). No developer friction, no user friction, no custom wallet requirements.

### Mainnet deployment

The contract is deployed to Conflux eSpace Mainnet (chainId 1030) at [`0x3F833d7c7fE06f65720DCD85791985d77dfcE7C2`](https://evm.confluxscan.io/address/0x3F833d7c7fE06f65720DCD85791985d77dfcE7C2) with gas sponsorship funded and active.

---

## Product Design

### Auto-release timer (7 days)

The most common freelancer complaint is "the client disappeared after I delivered the work." Our auto-release timer addresses this: if a client doesn't approve, request a revision, or file a dispute within 7 days of milestone submission, the funds release automatically to the freelancer.

We added a **one-time pause** mechanism per milestone. Without it, clients would feel pressured into hasty approvals. With the pause, the client signals "I'm reviewing this, I need more time" — but they can only pause once, preventing indefinite delays. The freelancer still has the auto-release as a backstop.

7 days was chosen as a balance between giving clients reasonable review time and not leaving freelancers waiting indefinitely.

### 3-person arbitration panel

Disputes are resolved by 3 arbitrators selected pseudo-randomly from a registered pool. We chose 3 (not 1, not 5) because:
- 1 arbitrator creates a single point of failure
- 5 arbitrators is harder to staff and slower to resolve
- 3 allows 2-of-3 majority voting, which is decisive and fast

The pseudo-random selection uses `keccak256(block.timestamp, block.prevrandao, disputeId)`. This isn't cryptographically secure randomness — a miner could theoretically influence selection. For a hackathon MVP with a small arbitrator pool, this is an acceptable tradeoff. A production version would use Chainlink VRF or commit-reveal.

### 48-hour response window

When a dispute is filed, the other party has 48 hours to submit counter-evidence. This prevents disputes from dragging on while ensuring the responding party has time to prepare their case. After 48 hours (or after a response is submitted), anyone can call `assignArbitrators` to move to the voting phase.

### Multi-token support (USDT0 + AxCNH)

The contract accepts any ERC-20 token as payment — the token address is specified at project creation. On the frontend, we support USDT0 (6 decimals) and AxCNH (18 decimals) with a visual token selector. Adding more tokens is a frontend-only change.

We chose stablecoins over native CFX because freelancers need predictable payment amounts. A freelancer agreeing to "500 USDT0 for a landing page" knows exactly what they're getting. Crypto volatility would undermine the trust the escrow is designed to create.

---

## Frontend Decisions

### viem over ethers.js

We chose viem over ethers.js for the frontend. viem is lighter, has better TypeScript support, handles Conflux's eSpace quirks better (particularly around transaction receipt polling), and its `encodePacked`/`keccak256` utilities match Solidity's behavior exactly — which we needed for computing dispute keys.

### Next.js 16 + React 19

Next.js 16 with React 19 gives us the App Router, server components for the layout, and React 19's improved hooks. The frontend is a single-page app (all `"use client"`) because every view requires wallet state, but the layout and metadata benefit from server rendering.

### Dark theme

Web3 products skew dark. More practically, a dark interface reduces visual fatigue during extended use (reviewing milestones, reading dispute evidence) and makes the colored status indicators (green for approved, amber for review, red for disputed) stand out clearly.

### Role-aware status banners

Rather than showing raw contract state ("status: 2, funded: true"), the project view computes what the current user should know and do. A milestone with status `UnderReview` shows "Needs Your Review" to the client and "Submitted — Waiting for client review" to the freelancer. This required more frontend logic but eliminates the need for users to understand the contract's internal state machine.

### Modals over browser popups

Approving a milestone release and filing a dispute are high-stakes actions. We use custom modals with:
- Clear amount breakdown
- Irreversibility warnings
- Cancel buttons
- Loading states during transaction

Browser `prompt()` dialogs are jarring, unstyled, and don't convey the gravity of the action.

---

## Known Limitations

These are conscious tradeoffs, not oversights:

| Limitation | Reasoning |
|---|---|
| Pseudo-random arbitrator selection | Acceptable for MVP. Production would use Chainlink VRF. |
| No arbitrator staking | Economic incentives for honest voting are post-hackathon scope. |
| All-or-nothing dispute outcomes | Binary outcomes (release to freelancer OR return to client) keep the MVP simple. Percentage splits add complexity to the voting mechanism. |
| Evidence stored on-chain | For short text evidence, on-chain storage is fine. Large files should use IPFS — post-hackathon. |
| Sequential project loading | `MyProjects` iterates all projects to find the user's. An indexer (subgraph) would scale better. |

---

## Verification

The contract is deployed and verifiable:
- [ConfluxScan](https://evm.confluxscan.io/address/0x3F833d7c7fE06f65720DCD85791985d77dfcE7C2)
- `npx hardhat test` — 390+ tests pass
- `cd frontend && npm run dev` — frontend runs locally

---

*GigShield — Conflux Global Hackfest 2026*

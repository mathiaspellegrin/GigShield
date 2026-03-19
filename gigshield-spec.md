# GigShield — Functional Specification
### Conflux Global Hackfest 2026 | Main Award Submission

---

## What is GigShield?

GigShield is a trustless freelance escrow platform that protects both clients and freelancers — without either party needing to own cryptocurrency. It competes with Upwork and Fiverr not by building another marketplace, but by replacing the broken payment layer underneath them: the part where clients pay upfront and pray, or freelancers deliver work and chase invoices for weeks.

The core promise: **a client deposits funds into a locked escrow; a freelancer works knowing the money is guaranteed; milestones release payment automatically; and if there's a dispute, a fair arbitration system resolves it on-chain.**

Neither party needs a crypto wallet to participate. The client pays with a stablecoin (USDT0) via a clean web interface. The freelancer receives USDT0 they can withdraw anytime. Gas fees are sponsored entirely by the platform.

---

## The Problem GigShield Solves

### Problem 1: Platforms are extractive intermediaries
Upwork takes 20% from freelancers. Fiverr takes 20% from sellers and 5.5% from buyers. Toptal takes up to 40% margin. These platforms justify this by saying they provide "protection" — but that protection is asymmetric, slow, and routinely fails both sides.

### Problem 2: Payments are reversible and arbitrary
PayPal and Stripe can reverse payments weeks after work is delivered. Upwork can freeze accounts mid-contract. Chargebacks happen even when the freelancer did everything right. There is no neutral, permanent record of what was agreed and delivered.

### Problem 3: Existing smart contract escrow is unusable
Trustless escrow solutions exist on Ethereum — but they require both parties to hold ETH, configure wallets, pay unpredictable gas fees, and understand transaction confirmations. A designer in Manila or a developer in Lagos will not jump through these hoops. The UX kills adoption before it starts.

### Problem 4: Disputes favor whichever party has more leverage
On centralized platforms, disputes are resolved by platform support — which has its own incentives, is slow, and rarely satisfying. There's no transparent process, no clear rules, and no neutral third party with actual expertise.

---

## Who Uses GigShield?

### The Client
Someone who needs work done and has agreed on a price. Could be:
- A startup founder hiring a freelance designer for brand identity
- A small business commissioning a website from a developer
- An agency outsourcing copywriting or video editing
- An individual hiring a consultant for a one-off project

The client's concern: "I don't want to pay $5,000 upfront and get nothing."

### The Freelancer
Someone delivering a service who has agreed on a price. Could be:
- A graphic designer, developer, copywriter, translator, video editor
- A consultant or coach
- Anyone doing project-based work with a defined deliverable

The freelancer's concern: "I don't want to do the work and not get paid."

### The Arbitrator
A vetted, staked participant who resolves disputes when they arise. Could be:
- An experienced freelancer in the relevant field
- A legal professional
- A community-trusted member of the platform

Arbitrators are not employees of GigShield. They're independent, staked participants who earn fees for resolving disputes fairly.

---

## Core Features

### Feature 1: Project Creation and Escrow Deposit

The client creates a project in GigShield:
- Gives the project a name and description
- Adds the freelancer's email or wallet address
- Defines one or more milestones with amounts and descriptions
- Sets an optional project deadline

Once confirmed, GigShield generates a project page. The client deposits the agreed USDT0 amount into the escrow contract. Funds are locked — the client cannot unilaterally reclaim them, and the freelancer cannot access them until milestones are approved. Both parties see the escrow balance in real time.

This deposit is the moment the contract becomes real. The freelancer sees the money is locked and starts work with confidence.

### Feature 2: Milestone-Based Payment Release

Each project is divided into milestones. Common structures:
- **Single milestone** — full payment on delivery (small projects)
- **Two-stage** — deposit on start, remainder on completion
- **Multi-milestone** — granular checkpoints for larger projects (design concepts → revisions → final files)

When a freelancer believes they've completed a milestone, they mark it done and optionally attach a link, file reference, or message as proof of delivery. The client receives a notification.

The client has three options:
1. **Approve** — funds for that milestone release immediately to the freelancer
2. **Request revision** — sends the milestone back to in-progress with a comment
3. **Dispute** — opens a formal dispute if they believe the work wasn't delivered

### Feature 3: Auto-Release Timer

If a client doesn't respond to a milestone completion within a configurable window (default: 7 days), the funds auto-release to the freelancer. This prevents the common freelancer nightmare of completing work and waiting indefinitely for a slow or unresponsive client.

The auto-release timer is visible on the project page for both parties. Clients can pause it once (with a reason) to give themselves more time for genuine review.

### Feature 4: Dispute Resolution via Arbitrator Panel

If either party disputes a milestone, the dispute process begins:

**Step 1 — Filing.** The disputing party submits a brief explanation (200 words max) and can attach evidence links.

**Step 2 — Response window.** The other party has 48 hours to submit their own explanation and evidence.

**Step 3 — Arbitrator selection.** The system randomly selects 3 arbitrators from the active pool, weighted by their reputation score and relevant domain expertise (a design dispute gets arbitrators with design backgrounds).

**Step 4 — Review and vote.** Arbitrators review both submissions privately and cast votes: "Release to freelancer" or "Return to client." Majority wins. Arbitrators cannot communicate with the parties.

**Step 5 — Resolution.** Funds release according to the majority vote. Both parties see the outcome and a brief summary. Neither party sees which arbitrator voted which way.

This entire process takes 5–7 days maximum. It is transparent, documented on-chain, and significantly fairer than platform support tickets.

### Feature 5: Arbitrator System

Arbitrators are platform participants who apply to join the pool. Requirements:
- Pass a short onboarding quiz about platform rules
- Stake a small amount of USDT0 as a good-faith deposit (e.g. $20–$50)
- Maintain a minimum reputation score

Arbitrators earn a fee for each dispute they resolve (paid from a small platform fee on disputed escrows). Their stake is at risk if they consistently make decisions that are later appealed and overturned. This aligns their incentives: honest, thoughtful decisions are the only profitable behavior.

The arbitrator dashboard shows:
- Active cases waiting for their review
- Their earnings and reputation score
- Past cases they've resolved (no party names, just outcomes)

### Feature 6: Project History and Reputation (Post-MVP)

After project completion, both client and freelancer can leave a brief rating (1–5 stars, optional comment). These ratings are stored on-chain, permanently attached to their profile. They cannot be deleted or manipulated by the platform.

A freelancer with 47 completed projects on GigShield has a verifiable, tamper-proof work history. A client with a history of fair approvals attracts better freelancers.

### Feature 7: Partial Dispute Resolution

Not all disputes are binary. If a client disputes a milestone because the work was partially done, the arbitrators can award a split — e.g. 60% to the freelancer, 40% back to the client. This reflects real-world nuance and reduces the adversarial framing of disputes.

---

## User Journeys

### Journey A: Simple 2-milestone project

1. Priya (client) hires Dev (freelancer) to build a landing page for $800
2. Priya creates a GigShield project: Milestone 1 ($300 — wireframes) + Milestone 2 ($500 — final build)
3. Priya deposits $800 USDT0. Dev sees the locked funds and starts work
4. Dev delivers wireframes, marks Milestone 1 complete, attaches a Figma link
5. Priya reviews, approves — $300 releases to Dev instantly
6. Dev builds the page, marks Milestone 2 complete
7. Priya is busy — doesn't respond for 7 days. Auto-release triggers, $500 releases
8. Both leave 5-star reviews. Total platform fee: $0 (MVP is free to demonstrate adoption)

### Journey B: Dispute, fair outcome

1. Carlos (client) hires Mia (designer) for $1,200 brand identity package
2. Single milestone, full payment on delivery
3. Mia delivers logos, but Carlos claims they don't match the brief
4. Carlos opens a dispute, submits original brief. Mia submits her work and explains her interpretation
5. 3 arbitrators review. Two vote "partial release" — 70% to Mia ($840), 30% back to Carlos ($360)
6. Both parties accept the outcome. Total dispute resolution time: 4 days

### Journey C: International freelancer, fast withdrawal

1. Reza (developer in Iran) completes a $2,500 project
2. Client approves final milestone, $2,500 USDT0 releases
3. Reza opens his GigShield dashboard, sees the full balance
4. Reza withdraws to his wallet instantly — no 30-day hold, no currency conversion, no wire transfer fees
5. He exchanges USDT0 for local currency via a peer-to-peer exchange

---

## What the App Looks Like

### Project creation flow (client)
Clean wizard UI, 4 steps:
- Name and describe the project
- Add freelancer (email or address)
- Define milestones with amounts and descriptions
- Deposit USDT0 and confirm

Design reference: Stripe's invoice creation UI — professional, minimal, no blockchain jargon.

### Project page (shared between client and freelancer)
- Header: project name, total value, escrow status (funded / partially released / complete)
- Milestone list: each with status indicator (pending / in progress / review / released / disputed)
- Activity feed: timestamped log of all actions (deposit, milestone submitted, approved, etc.)
- Action buttons change based on role and milestone state

### Dispute view
Two-column layout: client's submission on one side, freelancer's on the other. Clean, neutral framing. No visual bias toward either party. Status bar showing days remaining in each phase.

### Arbitrator dashboard
- Queue of cases awaiting review (shows domain tag, value, urgency)
- Case detail: two-column evidence view, vote buttons
- Earnings summary and reputation score
- No party identifying information shown

### Mobile design
Project pages and milestone approval flows are fully mobile-optimized. A client needs to be able to approve a milestone from their phone in 10 seconds.

---

## Gas Sponsorship: The Architectural Foundation

On Ethereum mainnet, every escrow transaction — deposit, milestone release, dispute vote — costs $5–$50 in gas. For a $200 freelance job, that's 10–25% overhead. Unacceptable.

On Conflux with gas sponsorship, GigShield sponsors every transaction:
- Client deposits: sponsored
- Milestone approvals: sponsored
- Dispute filings: sponsored
- Arbitrator votes: sponsored
- Freelancer withdrawals: sponsored (or minimal)

The result: a $200 escrow costs $200. The math finally works for small projects, emerging market freelancers, and first-time users. Gas sponsorship is not a nice-to-have — it's what makes the unit economics of trustless small-value escrow viable.

**The one exception:** arbitrators pay gas from their staked funds for voting. This is intentional — it creates a small cost for arbitration that ensures only genuine participants join the pool.

---

## What GigShield Does NOT Do

To keep scope tight for the hackathon MVP:
- No freelancer marketplace (browse and hire) — it's a tools layer, not a platform
- No file upload/storage (evidence is submitted as external links)
- No in-app messaging (use email or your existing communication channel)
- No reputation system in MVP (post-hackathon)
- No fiat on-ramp built-in (link to third-party)
- No mobile native app

---

## Why This Wins the Main Award

| Judging Category | Why GigShield Scores High |
|---|---|
| Technical (25%) | Multi-milestone escrow with auto-release timers, partial dispute resolution, staked arbitrator registry, and role-based access control are all complex and production-quality |
| Conflux Integration (25%) | Gas sponsorship is what makes small-value escrow economically viable. The 3-second block time makes milestone releases feel instant — critical for UX. Neither is cosmetic |
| UX (20%) | The demo shows a complete client-to-freelancer journey. Neither party encounters a wallet prompt, gas fee, or blockchain term |
| Innovation (20%) | On-chain arbitration with a staked, incentive-aligned jury is novel. No existing freelance escrow product has this |
| Presentation (10%) | Three distinct personas (client, freelancer, arbitrator) make for a compelling multi-character demo that tells a complete story |

---

## Hackathon Build Scope (5 Weeks)

### In scope for hackathon MVP
- Escrow contract with milestone release and auto-release timer
- Dispute filing and basic arbitrator voting (3-person panel)
- Project creation flow (client)
- Project status page (shared)
- Arbitrator dashboard (basic)
- Gas sponsorship for all client/freelancer transactions
- USDT0 as payment currency

### Out of scope (post-hackathon)
- Partial dispute resolution (binary for MVP — full release or full refund)
- Reputation/rating system
- Arbitrator staking and reputation scoring
- Email notifications
- Fiat on-ramp

---

## Go-to-Market (for grant proposal)

**Launch strategy:** Position as "the escrow layer for freelancers who already work independently" — target developer Twitter/X communities and r/freelance with a post: "I built trustless Upwork for $0 in fees. Here's how it works." Seed the demo with real micro-gigs during the hackathon build period to show genuine usage.

**Growth loop:** Freelancers who get paid via GigShield become advocates — they share it with other freelancers as proof they got paid fairly. Every completed project and visible on-chain transaction history is social proof.

**Monetization post-hackathon:** 1% fee on successfully completed escrows only. No subscription, no monthly fee. Platform earns only when both parties succeed. Target: partner with 2 freelance communities for exclusive launch, reach 500 active escrows within 90 days.

---

*GigShield — Conflux Global Hackfest 2026*
*Team submission | eSpace (Ethereum-compatible)*
*USDT0 integration | Gas Sponsorship | Milestone Escrow | On-Chain Arbitration*

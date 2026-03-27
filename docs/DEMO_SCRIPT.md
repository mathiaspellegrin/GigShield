# GigShield Demo Video Script

**Target length**: 3-5 minutes
**Format**: Screen recording with voiceover
**Tools needed**: Browser with MetaMask (2 accounts), GigShield frontend, ConfluxScan

---

## Pre-Demo Setup

Before recording:

1. Deploy GigShield to Conflux eSpace Mainnet with gas sponsorship enabled
2. Prepare two browser profiles (or two browsers) with MetaMask:
   - **Client wallet** — funded with USDT0 or AxCNH tokens
   - **Freelancer wallet** — empty (to demonstrate gas-free experience)
3. Register at least 3 arbitrator addresses via `registerArbitrator()`
4. Have ConfluxScan open in a tab
5. Clear any existing test projects so the demo starts fresh

---

## Script

### Opening (30 seconds)

**[Show title card: "GigShield — Trustless Freelance Escrow"]**

> "Every year, freelancers lose billions to payment disputes, ghosting clients, and platform fees that eat 10 to 20 percent of their earnings. What if there was a way to work with anyone, anywhere, with guaranteed payment and zero fees?"
>
> "This is GigShield — a trustless escrow platform built on Conflux eSpace. Milestone-based payments, automatic release timers, on-chain arbitration, and thanks to Conflux's gas sponsorship, completely free to use."
>
> "Let me show you how it works."

---

### Part 1: Creating a Project (45 seconds)

**[Switch to browser — Client wallet connected]**

> "I'm logged in as a client. I need a freelance developer to build a landing page. Let's create a project with two milestones."

**[Click "Create Project" and fill in the form]**

- Project name: "Landing Page Redesign"
- Freelancer address: *paste freelancer address*
- Payment token: USDT0
- Milestone 1: "Design mockups" — 300 USDT0
- Milestone 2: "Development and deployment" — 700 USDT0

> "Two milestones, 1,000 USDT0 total. Notice that I'm not paying any gas fees — Conflux's sponsorship covers that."

**[Submit transaction — show MetaMask popup with 0 CFX gas cost]**

> "Transaction confirmed. The project is created on-chain."

---

### Part 2: Depositing Escrow (30 seconds)

**[Still as Client]**

> "Now I'll deposit the full 1,000 USDT0 into escrow. First, I approve the token transfer, then deposit."

**[Approve USDT0, then call depositEscrow — show both transactions]**

> "Funds are now locked in the smart contract. The freelancer can see the escrow is fully funded and start working with confidence. Milestone one is automatically set to 'In Progress'."

---

### Part 3: Freelancer Submits Work (30 seconds)

**[Switch to Freelancer wallet/browser]**

> "Switching to the freelancer's perspective. The design mockups are done, so I'll submit milestone one for review."

**[Click "Submit Milestone" on milestone 1]**

> "Submitted. The client now has 7 days to review and approve. If they go silent, the funds auto-release to me. That's the safety net — no more chasing payments."

**[Point out the auto-release countdown timer in the UI]**

---

### Part 4: Client Approves — Instant Release (45 seconds)

**[Switch back to Client wallet]**

> "Back as the client. The work looks great. I'll approve milestone one."

**[Click "Approve Milestone"]**

> "And just like that, 300 USDT0 is transferred directly to the freelancer. Instantly. No waiting period, no intermediary, no fees."

**[Show the freelancer's USDT0 balance updating]**

> "Milestone two is now automatically in progress. The freelancer can continue working."

**[Open ConfluxScan in a new tab]**

> "Let's verify this on ConfluxScan. Here's the transaction — you can see the ERC-20 transfer from the contract to the freelancer's address. Fully transparent, fully verifiable."

**[Show the transaction details on ConfluxScan: method, from, to, token transfer]**

---

### Part 5: Dispute Flow (45 seconds)

**[Switch to a different project or describe the scenario]**

> "But what if there's a disagreement? Let's say the freelancer submits work that doesn't match the requirements. Either party can file a dispute."

**[As Client, click "File Dispute" on a milestone, enter evidence]**

> "I file a dispute with a link to the requirements and screenshots showing the gaps. The freelancer has 48 hours to respond with their side of the story."

**[Show dispute status: "Filed — Awaiting Response"]**

> "After the response period, three arbitrators are randomly selected from our registered pool. They review both sides' evidence and vote."

**[Show the arbitration panel UI]**

> "It's a simple majority — two out of three votes decide the outcome. If the freelancer wins, funds release to them. If the client wins, funds return to the client. All on-chain, all transparent."

---

### Closing (30 seconds)

**[Return to the main dashboard view]**

> "Let's recap what makes GigShield different:"
>
> "One — milestone-based escrow locks funds upfront and releases them incrementally."
>
> "Two — auto-release timers mean freelancers can never be ghosted."
>
> "Three — on-chain arbitration replaces opaque platform decisions with transparent voting."
>
> "And four — Conflux gas sponsorship makes all of this completely free for users. A fifty-dollar escrow works just as well as a ten-thousand-dollar one."
>
> "GigShield. Trustless escrow for the independent workforce."

**[End card with project links: GitHub, deployed dApp URL]**

---

## Key Points to Emphasize

Throughout the demo, reinforce these messages:

1. **Gas-free UX** — Show the MetaMask popup with 0 CFX gas on at least two transactions. Call this out explicitly.
2. **Speed** — Approvals release funds instantly. No waiting, no manual claims.
3. **Freelancer protection** — The auto-release timer is the standout feature. Emphasize that clients cannot indefinitely hold funds.
4. **Transparency** — Show ConfluxScan at least once to prove everything is verifiable on-chain.
5. **Simplicity** — The UI should feel like a normal web app, not a crypto dApp.

## Timing Guide

| Section | Duration | Cumulative |
|---|---|---|
| Opening | 0:30 | 0:30 |
| Create Project | 0:45 | 1:15 |
| Deposit Escrow | 0:30 | 1:45 |
| Freelancer Submits | 0:30 | 2:15 |
| Client Approves | 0:45 | 3:00 |
| Dispute Flow | 0:45 | 3:45 |
| Closing | 0:30 | 4:15 |

Total: approximately 4 minutes 15 seconds.

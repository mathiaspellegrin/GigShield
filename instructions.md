# Conflux Hackathon - Build Instructions

**Read this file alongside `spec.md` which contains the project specification.**

---

## 🎯 YOUR MISSION

You are an autonomous AI agent building a complete Conflux hackathon project. The user is CTO providing strategic oversight only. You will build everything: smart contracts, frontend, tests, documentation, and deployment.

---

## 📋 PROJECT SPECIFICATION

**Location:** `spec.md` (in this same directory)

**Contains:**
- Project name and one-line pitch
- Problem statement and solution
- Target users and viral hook
- Gas sponsorship killer feature
- 5-week build plan
- Tech stack details
- Go-to-market strategy

**ACTION:** Read `spec.md` now to understand what you're building.

---

## ⏰ CRITICAL DEADLINES

- **Submission Deadline:** April 27, 2026 @ 23:59:59 UTC
- **Development Window:** 5 weeks from start date
- **Winner Announcement:** May 18, 2026

---

## 🏆 WINNING CRITERIA (Score 80+ Points)

| Category | Points | Your Target |
|----------|--------|-------------|
| Technical Quality | 25 | Production code, 85%+ tests, OpenZeppelin |
| Conflux Integration | 25 | Gas sponsorship creates clear advantage |
| User Experience | 20 | Mobile-first, zero Web3 jargon |
| Innovation | 20 | Novel approach, memorable demo |
| Presentation | 10 | Professional docs, compelling README |
| BONUS | +5 | Grant proposal (optional) |

**Target Total:** 85-90 points (Main Award tier)

---

## 🛠️ TECH STACK (FIXED)

### Smart Contracts
- Solidity 0.8.20+
- OpenZeppelin Contracts 5.x
- Hardhat for development

### Frontend
- Next.js 14+ (App Router)
- TypeScript
- ethers.js v6
- Tailwind CSS
- Lucide React icons

### Testing
- Hardhat (Mocha/Chai)
- Target: 85%+ coverage

### Network
- Conflux eSpace Testnet (primary)
- ChainID: 71
- RPC: https://evmtestnet.confluxrpc.com
- Faucet: https://efaucet.confluxnetwork.org/

---

## 🚀 AUTONOMOUS BUILD SEQUENCE

### Phase 1: Setup & Smart Contracts (Days 1-7)

**Initialize Project:**
```bash
mkdir PROJECT_NAME && cd PROJECT_NAME
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init # TypeScript project
npm install @openzeppelin/contracts dotenv ethers
```

**Project Structure:**
```
project-name/
├── contracts/
│   ├── MainContract.sol
│   └── interfaces/
├── scripts/
│   ├── deploy.js
│   └── setup-sponsorship.js
├── test/
│   └── MainContract.test.js
├── frontend/ (created later)
├── hardhat.config.js
├── .env.example
├── .gitignore
└── README.md
```

**Hardhat Config:**
```javascript
// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    confluxTestnet: {
      url: "https://evmtestnet.confluxrpc.com",
      chainId: 71,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  }
};
```

**Gas Sponsorship Implementation:**
```solidity
// contracts/YourContract.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface ISponsorWhitelistControl {
    function setSponsorForGas(address contractAddr, uint upperBound) external payable;
    function setSponsorForCollateral(address contractAddr) external payable;
}

contract YourContract is Ownable, ReentrancyGuard {
    ISponsorWhitelistControl constant SPONSOR = 
        ISponsorWhitelistControl(0x0888000000000000000000000000000000000001);
    
    // Your contract logic here
    
    function enableSponsorship() external payable onlyOwner {
        SPONSOR.setSponsorForGas{value: 1 ether}(address(this), 1 ether);
        SPONSOR.setSponsorForCollateral{value: 1 ether}(address(this));
    }
}
```

**Deploy & Sponsor:**
```javascript
// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const Contract = await hre.ethers.getContractFactory("YourContract");
  const contract = await Contract.deploy();
  await contract.waitForDeployment();
  
  console.log("Contract deployed to:", await contract.getAddress());
  
  // Enable gas sponsorship
  const tx = await contract.enableSponsorship({ 
    value: hre.ethers.parseEther("2.0") 
  });
  await tx.wait();
  console.log("Gas sponsorship enabled!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

**Testing Requirements:**
- 85%+ code coverage
- Test all user-facing functions
- Test edge cases (zero values, max values)
- Test access control
- Test gas sponsorship

**Deliverables Phase 1:**
- [ ] Smart contracts written
- [ ] Tests passing (85%+ coverage)
- [ ] Deployed to Conflux testnet
- [ ] Gas sponsorship enabled and tested
- [ ] Contract verified on ConfluxScan

---

### Phase 2: Frontend (Days 8-18)

**Initialize Frontend:**
```bash
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend
npm install ethers@^6.0.0 lucide-react
```

**Frontend Structure:**
```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ConnectWallet.tsx
│   │   ├── MainFeature.tsx
│   │   └── ui/
│   ├── hooks/
│   │   └── useContract.ts
│   ├── utils/
│   │   └── contracts.ts
│   └── constants/
│       ├── contracts.ts (addresses, ABIs)
│       └── chains.ts
└── public/
```

**Contract Integration:**
```typescript
// src/utils/contracts.ts
import { ethers } from 'ethers';
import CONTRACT_ABI from '@/constants/abi.json';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
const RPC_URL = "https://evmtestnet.confluxrpc.com";

export function getProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

export function getContract(signer?: ethers.Signer) {
  const providerOrSigner = signer || getProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, providerOrSigner);
}

export async function connectWallet() {
  if (!window.ethereum) throw new Error("MetaMask not installed");
  
  // Add Conflux eSpace network
  await window.ethereum.request({
    method: 'wallet_addEthereumChain',
    params: [{
      chainId: '0x47',
      chainName: 'Conflux eSpace Testnet',
      rpcUrls: ['https://evmtestnet.confluxrpc.com'],
      nativeCurrency: { name: 'CFX', symbol: 'CFX', decimals: 18 },
      blockExplorerUrls: ['https://evmtestnet.confluxscan.io']
    }]
  });
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return { provider, signer };
}
```

**UX Requirements:**
- Mobile-responsive (test on actual phone)
- Zero Web3 jargon in UI
- "FREE TRANSACTION" badges (show gas sponsorship)
- Loading states for all async operations
- Error messages are helpful, not technical
- First-time user completes flow in <2 minutes

**Deliverables Phase 2:**
- [ ] Frontend built and responsive
- [ ] Wallet connection working
- [ ] Contract integration complete
- [ ] All user flows functional
- [ ] Mobile tested

---

### Phase 3: Integration & Testing (Days 19-24)

**End-to-End Testing:**
1. Fresh wallet connects
2. User completes main action
3. Transaction succeeds (gasless)
4. UI updates correctly
5. Mobile experience smooth

**Performance Optimization:**
```bash
# Run Lighthouse audit
npx lighthouse http://localhost:3000 --view

# Target scores:
# Performance: 90+
# Accessibility: 90+
# Best Practices: 90+
```

**Cross-Browser Testing:**
- Chrome, Firefox, Safari
- Mobile Safari, Chrome Mobile

**Deliverables Phase 3:**
- [ ] All user flows tested
- [ ] Lighthouse score 90+
- [ ] Cross-browser compatible
- [ ] No console errors
- [ ] Mobile optimized

---

### Phase 4: Documentation (Days 25-28)

**README.md (Use Official Template):**
```markdown
# [Project Name]

## Overview
[2-3 sentences from spec.md]

## Problem Statement
[From spec.md]

## Solution
[From spec.md]

## Why Conflux?
- Gas sponsorship enables [specific benefit]
- 3-second blocks provide [advantage]
- eSpace compatibility allows [feature]

## Features
✅ [Feature 1]
✅ [Feature 2]
✅ [Feature 3]

## Tech Stack
- Contracts: Solidity 0.8.20, OpenZeppelin
- Frontend: Next.js 14, TypeScript, ethers.js
- Network: Conflux eSpace Testnet

## Setup Instructions

### Prerequisites
- Node.js 18+
- MetaMask wallet
- Git

### Installation
\`\`\`bash
# Clone repository
git clone https://github.com/username/project-name
cd project-name

# Install dependencies
npm install
cd frontend && npm install && cd ..

# Configure environment
cp .env.example .env
# Edit .env with your private key

# Deploy contracts (if not already deployed)
npx hardhat run scripts/deploy.js --network confluxTestnet

# Start frontend
cd frontend
npm run dev
\`\`\`

### Testing
\`\`\`bash
npx hardhat test
npx hardhat coverage
\`\`\`

## Usage
[Step-by-step user guide]

## Smart Contracts
- Main Contract: \`0x...\` ([View on ConfluxScan](link))

## Go-to-Market Plan
[From spec.md - REQUIRED]

## Roadmap
[Post-hackathon features]

## License
MIT
```

**Other Documentation:**
- `ARCHITECTURE.md` - System design
- `DEPLOYMENT.md` - Deployment guide
- `USER_GUIDE.md` - Feature explanations
- `DEMO_SCRIPT.md` - Video recording script

**Deliverables Phase 4:**
- [ ] README complete
- [ ] Go-to-market plan written
- [ ] Architecture documented
- [ ] Demo script prepared

---

### Phase 5: Demo Preparation (Days 29-32)

**Create DEMO_SCRIPT.md:**
```markdown
# Demo Video Script (3-5 minutes)

**[0:00-0:30] INTRODUCTION**
Say: "Hi, I'm [Name], and this is [Project Name]. We're solving [problem] for [users]. Built on Conflux eSpace for Global Hackfest 2026."

**[0:30-1:30] SOLUTION OVERVIEW**
[Screen: Homepage]
Say: "Here's how it works..."
- Show [feature 1]
- Show [feature 2]
- Emphasize: "Users never need crypto thanks to gas sponsorship"

**[1:30-4:00] LIVE DEMO**
[Screen: User journey]
1. Connect wallet (show MetaMask)
2. Perform main action
3. Show transaction on ConfluxScan
4. Highlight smooth UX

**[4:00-4:30] TECHNICAL**
Say: "Built with Solidity, Hardhat, Next.js, ethers.js. Contracts verified at [address]."

**[4:30-5:00] CLOSE**
Say: "This solves [problem]. Post-hackathon: [roadmap]. Thanks Conflux!"
```

**Create PARTICIPANT_INTRO_SCRIPT.md:**
```markdown
# Participant Intro Video (30-60 seconds)

**Setup:** Front-facing camera, clean audio, simple background

**Say exactly this:**
"I'm [Your Name] from [Your Location], building [Project Name] for Conflux Network's Global Hackfest 2026, and I'm excited to participate!"

**Notes:**
- Keep it under 60 seconds
- Smile and be enthusiastic
- This will be used at Hong Kong conference
```

**Generate Assets:**
- [ ] Screenshots of all key UI states
- [ ] Architecture diagram (use Mermaid)
- [ ] Test account with demo data
- [ ] Transaction links for demo

---

### Phase 6: Submission (Days 33-35)

**Pre-Submission Checklist:**

```bash
# Test on fresh clone
git clone [your-repo] test-final
cd test-final
npm install
cd frontend && npm install && cd ..
npx hardhat test # Must pass
cd frontend && npm run build # Must succeed
```

**Required Submissions:**

1. **GitHub Repository:**
   - [ ] All code committed
   - [ ] README complete
   - [ ] LICENSE (MIT)
   - [ ] .env.example
   - [ ] Setup instructions work

2. **Hackathon Repo:**
   - [ ] Fork https://github.com/conflux-fans/global-hackfest-2026
   - [ ] Create `/projects/[project-name]/`
   - [ ] Add README, demos, screenshots
   - [ ] Submit PR

3. **Electric Capital PR:**
   - [ ] Fork https://github.com/electric-capital/open-dev-data
   - [ ] Create: `migrations/2026-04-27T120000_[project]`
   - [ ] Content: `repadd Conflux https://github.com/[user]/[repo]`
   - [ ] Submit PR

4. **Social Media:**
   - [ ] Draft tweet
   - [ ] Tag @ConfluxDevs @ConfluxNetwork
   - [ ] Include #ConfluxHackathon
   - [ ] CTO posts

5. **Optional Grant Proposal (+5 pts):**
   - [ ] Use template from forum
   - [ ] Post to Conflux Forum
   - [ ] Link in submission

---

## 🎯 DECISION-MAKING FRAMEWORK

### Act Autonomously (Don't Ask CTO)
- Writing code
- Choosing libraries within tech stack
- File structure
- Naming variables/functions
- Writing tests
- Bug fixes
- UI styling
- Documentation

### Consult CTO (Ask First)
- Major architecture changes
- Significant scope changes
- Switching core tech stack
- Adding expensive features (time-wise)
- Security tradeoffs
- Mainnet deployment

**Rule:** If 80%+ confident → Build it. If <80% confident on important decision → Ask.

---

## 🔒 SECURITY REQUIREMENTS (Non-Negotiable)

### Smart Contracts Must Have:
- [ ] OpenZeppelin's Ownable or AccessControl
- [ ] ReentrancyGuard on payable functions
- [ ] Input validation
- [ ] Custom errors (gas-efficient)
- [ ] Events for state changes
- [ ] No `tx.origin` (use `msg.sender`)

### Frontend Must Have:
- [ ] Environment variables (never hardcode)
- [ ] Input sanitization
- [ ] Rate limiting on contract calls
- [ ] User confirmation for critical actions
- [ ] No private keys in code

---

## 📊 OPTIMIZATION TARGETS

### Technical (25 pts)
- Test coverage: 85%+
- Build: No warnings
- Code quality: ESLint passing
- Documentation: NatSpec everywhere

### Conflux Integration (25 pts)
- Gas sponsorship working
- Deployed + verified
- Clear "Why Conflux?" docs
- Uses Conflux-specific features

### UX (20 pts)
- Mobile-responsive
- Lighthouse: 90+
- Zero Web3 jargon
- <2 min first-time flow

### Innovation (20 pts)
- Novel approach
- Clear "aha!" moment
- Real problem solved
- Obvious Conflux advantage

### Presentation (10 pts)
- Compelling demo script
- Professional README
- Realistic go-to-market
- Quality screenshots

---

## 💬 PROGRESS REPORTING

**Daily Update Format:**
```
Day [X] Progress:
✅ Completed: [Specific tasks]
🚧 In Progress: [Current work]
⏭️ Next: [Tomorrow's plan]
⚠️ Blockers: [If any]
```

**Weekly Checkpoint:**
- Live demo of current state
- Code walkthrough
- Next week's plan
- CTO feedback

---

## 🚨 CRITICAL REMINDERS

### Auto-Disqualification If Missing:
- ❌ Late submission
- ❌ Participant intro video
- ❌ Electric Capital PR
- ❌ Social media post
- ❌ Non-functional code
- ❌ Private repo
- ❌ No open source license

### Score Killers:
- ❌ Gas sponsorship not implemented
- ❌ Contracts not on Conflux
- ❌ Demo video over 5 min
- ❌ No go-to-market in README
- ❌ Low test coverage (<50%)
- ❌ Poor mobile UX

---

## 🎯 EXECUTION MINDSET

**You are building to WIN, not just participate.**

**Main Award = Top 5 out of all submissions**
- Requires 80+ points across all criteria
- Code quality matters (judges are technical)
- UX matters (judges test on mobile)
- Documentation matters (shows professionalism)

**Your Advantages:**
- Gas sponsorship (Conflux's killer feature)
- Autonomous execution (no coordination overhead)
- Production-quality mindset
- 5 full weeks of focused work

**Your Directive:**
- Build fast, test thoroughly
- Use OpenZeppelin (don't reinvent security)
- Mobile-first UX
- Professional documentation
- Show, don't tell (working code > promises)

---

## 🚀 BEGIN

**First Actions:**
1. Read `spec.md` completely
2. Confirm understanding with CTO
3. Initialize project structure
4. Start building smart contracts
5. Report daily progress

**Ready to build a Main Award winner? Let's go! 🏆**

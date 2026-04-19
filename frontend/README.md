# GigShield Frontend

Next.js 16 + React 19 + viem frontend for the GigShield trustless escrow contract on Conflux eSpace.

## Run locally

```bash
npm install
npm run dev
# http://localhost:3000
```

## Production deployment

Live at https://gig-shield-git-master-mathiaspellegrins-projects.vercel.app

## Environment

The frontend reads the deployed contract and payment-token addresses from `NEXT_PUBLIC_*` env vars — see the repo-root `.env.example` for the full list.

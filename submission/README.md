# GigShield — Submission Staging

Everything here is drafted, reviewed, and ready to be copied into the right place on submission day. Nothing is pushed yet.

**Deadline: 2026-04-20 @ 11:59:59 UTC.**

## What goes where

| File | Destination | Action |
|------|-------------|--------|
| `projects/gigshield/README.md` | Fork of `conflux-fans/global-hackfest-2026` → `/projects/gigshield/README.md` | Open PR |
| `electric-capital/migrations/2026-04-20T120000_add_gigshield` | Fork of `electric-capital/open-dev-data` → `/migrations/` | Open PR |
| `tweet.md` | X / Twitter | Post from your account |

## Before you submit — fill in the TODOs

Search `submission/projects/gigshield/README.md` for `<!-- TODO` and fill in:

1. **Team name** (or "Solo")
2. **Your full name** in the team table
3. **Discord handle** (two places)
4. **Demo video URL** (paste after upload)
5. **Participant intro video URL** (paste after upload)
6. **Live demo URL** (optional — if you host the frontend)

## Recording the videos

Scripts are in:
- `docs/DEMO_SCRIPT.md` — 3–5 min demo
- `docs/PARTICIPANT_INTRO_SCRIPT.md` — 30–60 sec intro (used at a Conflux event in Hong Kong, May 2026)

Upload to YouTube (unlisted is fine) or Loom, then paste the URLs into the submission README.

## Final pre-flight (do this before opening the PR)

- [ ] `npx hardhat test` → 70 passing
- [ ] `cd frontend && npm run build` → succeeds
- [ ] Both video URLs pasted into `projects/gigshield/README.md`
- [ ] All `<!-- TODO` markers resolved
- [ ] You can load the live contract in MetaMask and complete one full escrow flow

## Submission order on the day

1. Push any final commits to `master` on your main repo
2. Open the PR to `conflux-fans/global-hackfest-2026`
3. Open the PR to `electric-capital/open-dev-data`
4. Post the tweet
5. (Optional, +5 pts) Post the grant proposal on Conflux Forum, link it in the submission README

## Optional +5 pts: grant proposal

Not drafted yet. If you want it, follow the integration-grants template on forum.conflux.network. Workshop advice from Conflux team: keep it focused, one or two clear milestones, concrete KPIs tied to payment triggers, and include go-to-market KPIs (user growth, campaigns) — not just tech milestones. Ask a Conflux team member to review the draft before posting.

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

## Videos

Both videos are recorded and linked in `submission/projects/gigshield/README.md`:
- Demo: https://www.youtube.com/watch?v=Culycr6G7l8
- Participant intro: https://youtube.com/shorts/LTbEHbvlz80

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

## +5 pts: grant proposal

✅ Posted: https://forum.conflux.fun/t/integration-grants-application-26-gigshield/23574

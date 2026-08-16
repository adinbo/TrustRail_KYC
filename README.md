# TrustRail-KYC

The KYC module (identity verification + sanctions screening) from
`TrustRail-Documentation.docx`, built standalone before integration into
CediRamp's Conversion Rail. See `PLAN.md` for the full design and what's
verified vs. still open.

## What's here this pass

- **NIA registry check** — mocked (no public sandbox exists yet).
- **Identity vendor check** — real, against an actual vendor API. Two
  vendors are wired up behind the same interface, picked via `KYC_VENDOR`:
  - `smile` (default) — Smile ID, biometric/registry KYC.
  - `qoreid` — QoreID's Ghana Card endpoint. Added because Smile ID's
    signup form rejects `gmail.com` addresses; use whichever vendor you can
    actually get an account with.
- **Sanctions/PEP screening** — real, against OpenSanctions' matching API
  (sanctions, PEP, and other watchlists), behind `SANCTIONS_MODE`:
  - `mock` (default) — always passes, exercises the plumbing only.
  - `opensanctions` — real screening; a watchlist hit fails the check.

## Setup

```powershell
npm install
copy .env.example .env
```

Fill in `.env`:
- `KYC_VENDOR` — `smile` or `qoreid`. Only that vendor's credentials below
  need to be set.
- **Smile ID**: `SMILE_PARTNER_ID` / `SMILE_API_KEY` — free sandbox signup
  at [usesmileid.com](https://usesmileid.com) (business email required;
  gmail.com is rejected).
- **QoreID**: `QOREID_CLIENT_ID` / `QOREID_CLIENT_SECRET` — signup at
  [qoreid.com](https://qoreid.com), then use the **Test** credential pair
  from the dashboard (not Live) — their test environment has an unlimited
  free wallet.
- **OpenSanctions** (only if `SANCTIONS_MODE=opensanctions`):
  `OPENSANCTIONS_API_KEY` — signup at
  [opensanctions.org](https://www.opensanctions.org) (free trial). Leave
  `SANCTIONS_MODE=mock` to skip this and keep sanctions screening mocked.
- Without credentials for the chosen vendor(s), the test suite and example
  script both still run — the vendor-specific tests just skip themselves
  rather than failing.
- Leave `NIA_MODE=mock` — that's the only supported mode this pass.

## Running things

```powershell
npm run typecheck    # tsc --noEmit
npm test             # vitest — runs unit tests, adapters, masking, validation, & live tests if creds set
npm run diagnostics  # diagnostic runner probing active vendor and sanctions configuration
npm run example      # a runnable end-to-end script (needs real vendor creds)
```

## Where things stand

See `PLAN.md` for the full detail. Short version: identity verification's
plumbing is built and tested (NIA mocked; Smile ID and QoreID both wired to
their real APIs behind a shared `IdVerificationClient` interface, verified
against real docs/SDK source, not guessed). **QoreID has been exercised
end-to-end against a real Test account** — token exchange and the Ghana
Card lookup both work exactly as documented (see PLAN.md for the exact
response, and the small `??` vs `||` bug this live run caught and fixed).
Smile ID's signup is still blocked (rejects gmail.com), so it remains
untested against a live account. **Sanctions/PEP screening is real too now**
(OpenSanctions), behind `SANCTIONS_MODE` the same way identity vendors sit
behind `KYC_VENDOR` — see PLAN.md for what's verified. Integration into
CediRamp's `POST /v1/users` route hasn't started — that's the next step
now that this module's identity and sanctions plumbing are both solid.

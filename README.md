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
- **Biometric Face Match & Document OCR** — supports selfie liveness & 1:1 facial biometric matching (`job_type: 1`) and physical document verification (`job_type: 6`) alongside text-only registry lookups (`job_type: 5`).
- **ID Expiry & Validity Verification** — validates document validity periods and prevents expired cards from passing.
- **Proof of Address (GhanaPost GPS)** — validates GhanaPost GPS digital addresses (`XX-NNN-NNNN`, e.g. `AK-039-5028`) with automated regional metadata resolution.
- **Granular AML: Sanctions vs. PEP vs. Adverse Media** — distinguishes hard mandatory sanctions blocks (`SANCTION`) from compliance review flags (`PEP` / `ADVERSE_MEDIA` for Enhanced Due Diligence).
- **Async Webhook Callback Receiver** — processes asynchronous vendor events with HMAC-SHA256 signature verification.
- **Periodic Ongoing Re-Screening Manager** — automated batch re-screening worker for scheduled watchlist monitoring.
- **Validation & Normalization** — pre-flight format validation for Ghana Cards (`GHA-XXXXXXXXX-X`), regulatory age verification ($\ge 18$), and phone number normalization.
- **PII Masking** — redaction helpers for Ghana Cards (`GHA-***-X`), phone numbers, and emails for safe audit logging.
- **Standalone Web Console & API** — built-in HTTP server and interactive UI for standalone manual/curl testing (`npm run serve`).
- **CediRamp Adapter** — drop-in integration bridge (`CediRampKycAdapter`) for user onboarding pipelines (`POST /v1/users`).

## Setup

```powershell
npm install
copy .env.example .env
```

Fill in `.env`:
- `KYC_VENDOR` — `smile`, `qoreid`, or `mock`. Only that vendor's credentials below
  need to be set (`mock` requires no credentials at all).
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

## Running & Testing

```powershell
# 1. Start the standalone web testing console & REST API (http://localhost:3333)
npm run serve

# 2. Run diagnostic probe against active vendor credentials & endpoints
npm run diagnostics

# 3. Run full automated test suite (validation, masking, adapter, mock & live tests)
npm test

# 4. Typecheck codebase
npm run typecheck

# 5. Run single end-to-end verification script
npm run example
```

## Validation & Formatting Helpers

Importable directly from `trustrail-kyc`:

```typescript
import {
  isValidGhanaCard,      // Validates GHA-XXXXXXXXX-X format
  normalizeGhanaCard,    // Trims and uppercases ID numbers
  validateDateOfBirth,   // Validates YYYY-MM-DD and minimum age (e.g. >= 18)
  normalizePhoneNumber,  // Strips formatting delimiters
  GHANA_CARD_REGEX,      // /^GHA-\d{9}-\d$/i
} from "trustrail-kyc";
```

### Validation Rules:
- **Ghana Card**: Must match `GHA-XXXXXXXXX-X` (where `X` are digits).
- **Date of Birth**: Strict ISO 8601 `YYYY-MM-DD`; rejects minors under 18 years old.
- **Phone Number**: Strips spaces, dashes, and parentheses into standard format.

## PII Masking Utilities

Mask sensitive identity fields for safe audit logs and ops reporting:

```typescript
import { maskGhanaCard, maskEmail, maskPhoneNumber, maskIdentityInput } from "trustrail-kyc";

maskGhanaCard("GHA-712345678-1"); // "GHA-***-1"
maskEmail("amina.clearwater@example.com"); // "a***r@example.com"
maskPhoneNumber("+233241234567"); // "+23****567"
```

## Standalone Web Console & API (`npm run serve`)

You can run and test KYC entirely on its own without a partner:

- **Interactive UI**: Navigate to `http://localhost:3333` to test identity verification directly from your browser.
- **REST API Endpoint**:
  ```bash
  curl -X POST http://localhost:3333/api/verify \
    -H "Content-Type: application/json" \
    -d '{
      "fullName": "Amina Fatou Clearwater",
      "idNumber": "GHA-712345678-1",
      "dateOfBirth": "1992-04-12",
      "email": "amina.clearwater@example.com"
    }'
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
CediRamp's `POST /v1/users` route is ready via `CediRampKycAdapter`.

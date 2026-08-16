# TrustRail-KYC — Plan

The KYC module from `TrustRail-Documentation.docx` (Part 3), built as its
own standalone project so it can be developed, tested, and eventually sold
independently — then integrated into CediRamp's Conversion Rail as a
consumer, not a rewrite. See that document for the regulatory grounding
(Act 1154 §33, NIA's onboarding requirements, Smile ID vendor research);
this file is the implementation-level plan.

## Scope, staged

**This pass:**
1. Identity verification — two independent checks, run in parallel, both
   required to pass:
   - **NIA registry check** — mocked. No public sandbox exists (NIA's
     onboarding is an enterprise process: email, documents, contract,
     access grant — see the KYC module doc for the exact steps). Built as
     a real interface with a mock implementation behind it, so swapping in
     the real thing later is a implementation swap, not a redesign —
     exactly the pattern CediRamp's own `AmlScreeningClient` already uses.
   - **A biometric/registry identity vendor check** — real, against an
     actual vendor API, behind a shared `IdVerificationClient` interface so
     the vendor is a config choice (`KYC_VENDOR` env var), not a redesign.
     Two vendors are wired up:
     - **Smile ID** — the original choice, verified directly against their
       official open-source SDK (`smileidentity/smile-identity-core-js` on
       GitHub) for the signature scheme/base URLs/request shapes, and
       against their sandbox-testing docs page for how sandbox pass/fail
       actually works (see below). Depends on `smile-identity-core` as a
       real npm dependency rather than reimplementing their signature
       scheme by hand.
     - **QoreID** — added as an alternative after Smile ID's signup form
       rejected a gmail.com address (it requires a non-gmail email; adinb
       hasn't completed either vendor's signup yet as of this pass). Real
       HTTP integration against their documented Ghana Card endpoint, no
       SDK dependency (zero-dependency, matches the project's general
       preference where the vendor doesn't force an SDK).
2. **Sanctions/PEP screening** — real, against OpenSanctions' matching API,
   behind the existing `SanctionsScreeningClient` interface (mock kept
   available via `SANCTIONS_MODE=mock`, matching the identity vendors'
   config-not-redesign pattern). See below for what's verified.

## Why two identity checks, not one

A forged-but-plausible ID could pass a vendor's OCR/document check while
failing an authoritative registry lookup. A stolen-but-genuine ID would
pass a registry lookup but should fail liveness/face-match against whoever
is actually holding the phone. Neither check alone is sufficient — see the
KYC module in the main doc for the full reasoning.

## Architecture

```
src/
  types.ts              Shared result types (IdentityCheckResult, etc.) and
                         the IdVerificationClient interface both vendors
                         satisfy
  nia/
    client.ts            NiaClient interface + MockNiaClient
  smile/
    client.ts             SmileIdentityClient — real sandbox wrapper around
                           the official smile-identity-core SDK
  qoreid/
    client.ts             QoreIDClient — real HTTP wrapper around QoreID's
                           token + Ghana Card verification endpoints
  sanctions/
    client.ts             SanctionsScreeningClient interface + MockSanctionsClient
    opensanctions.ts       OpenSanctionsClient — real HTTP wrapper around
                           OpenSanctions' /match API
  orchestrator.ts          Combines NIA + the configured identity vendor +
                           the configured sanctions check into one
                           IdentityVerificationResult
  index.ts                 Public entry point; buildOrchestratorFromEnv()
                           picks Smile ID or QoreID via KYC_VENDOR, and
                           mock or OpenSanctions via SANCTIONS_MODE
test/                      Unit tests — NIA mock, orchestrator logic, and a
                            Smile test + a QoreID test + an OpenSanctions
                            test, each skipped unless that vendor's real
                            credentials are present
examples/
  verify-example.ts         Runnable example script
```

## Why two vendors: the gmail signup wall

Mid-build, signing up for a real Smile ID sandbox account failed at the
signup form: *"Please enter a different email address. This form does not
accept addresses from gmail.com."* Rather than block on finding/creating a
non-gmail address, QoreID was researched and wired up as a second, equally
real option — both vendors implement the same `IdVerificationClient`
interface, and `KYC_VENDOR` in `.env` picks which one `buildOrchestratorFromEnv()`
constructs. Whichever signup actually succeeds first is the one to use;
nothing else in the module needs to change either way.

Vendors considered and why QoreID won as the alternative (see also the
KYC module section of `TrustRail-Documentation.docx`):

| Vendor | Ghana Card endpoint? | Signup friction | Verdict |
|---|---|---|---|
| **Smile ID** | Yes (Enhanced/Biometric KYC) | Blocks gmail.com | Original choice, fully built; blocked on signup |
| **QoreID** | Yes — dedicated `/v1/gh/identities/ghana-id/{idNumber}` endpoint | Self-service, no documented email restriction; free unlimited test-environment wallet | Built as the alternative |
| Prembly/Identitypass | Passport/driver's-license/voter's-card confirmed; Ghana Card support unclear from public docs | — | Not pursued |
| Youverify | SSNIT/passport/voter's-card/driver's-license only — **no Ghana Card** in their Ghana docs | — | Doesn't fit the need |

## Smile ID integration — what's verified vs. what still needs a real account

**Verified directly from their SDK source** (not the docs site, which
blocks automated access):
- Sandbox base URL: `https://testapi.smileidentity.com/v1`; production:
  `https://api.smileidentity.com/v1`.
- Signature: HMAC-SHA256 keyed with the API key, updating with (in order)
  the ISO 8601 timestamp, the partner ID, then the literal string
  `"sid_request"`, base64-encoded.
- Job types relevant here: `1` = Biometric KYC (ID info + selfie + liveness
  image, does face-match), `5` = Basic/Enhanced KYC (ID info only, queries
  the ID-issuing authority's registry — this one needs no image assets, so
  it's the easiest to actually exercise end-to-end without real photos).
- Request/response shapes for both, straight from `examples/enhanced_kyc.ts`
  and `examples/biometric_kyc.ts` in their repo.

**Verified directly from their sandbox-testing docs page** (this page
initially returned empty/blocked content via automated fetch — a
browser-User-Agent curl eventually got the full JS-rendered page through;
see below for how the sandbox actually behaves, since it's not what the
earlier "5 test Ghana Card numbers" assumption guessed):

The Smile ID sandbox does **not** decide pass/fail from `id_number`,
`dob`, or any document/selfie content at all. It matches the request's
**(`last_name`, `given_names`, `email`)** triple against a fixed table of
named test identities and returns that identity's canned outcome — every
other field submitted (`country`, `id_type`, `id_number`, images) is
echoed back in the response but otherwise unused. A name/email combo not
in their table gets a "no matching test identity" error, not a real
decision. All standard input validation (ID number regex, supported
country/id_type, etc.) is still enforced before that matching happens.

Full test-identity table (name pairs are stable across products; email is
`firstname.lastname@example.com` in every case — decoded from the docs
page's Cloudflare-obfuscated `mailto:` links, not guessed):

*Enhanced KYC (job_type 5 — what this module's SmileIdentityClient uses):*

| Last Name | Given Names | Status | Reason | Message |
|---|---|---|---|---|
| Clearwater | Amina Fatou | clear | — | Verification successful |
| Dangerfield | Rashid Omar | block | high_risk | Verification failed |
| Ghostwell | Fatima Bello | block | identifier_not_found | Unable to validate ID - Not Found |
| Youngblood | Aisha Lawal | block | age_requirement_not_met | Customer must be above 18 |
| Downsworth | Ngozi Ifeoma | error | service_unavailable | External service unavailable |

*Biometric KYC (job_type 1) adds:* Twinley/Obinna Chukwu (block,
face_verification_failed), Masquero/Taiwo Adeyemi (block, spoof_detected),
Blurton/Kofi Mensah (error, image_unavailable_or_invalid), Glitchford/
Chidinma Obi (error, internal_error).

*Document Verification / Enhanced Document Verification* add further rows
(Forgeman/Ade Ogundimu — document_check_failed; Oddpaper/Olumide Fashola —
unsupported_document; Xeroxley/Adaeze Nnamdi — attention/
document_copy_detected but still passes; Oldfield/Tunde Bakare — attention/
document_expired but still passes; Puzzleton/Segun Olawale —
document_unclassifiable; Missingley/Ifeanyi Okeke — identifier_not_found;
Badnumber/Wale Oladipo — invalid_id_number) — not relevant to this module
since it only wires up Enhanced KYC, listed here for completeness.

**This module's `SmileIdentityClient.verifyIdentity()` uses the Clearwater/
Amina Fatou/amina.clearwater@example.com row as the "happy path"** — see
`test/smile.test.ts` and `examples/verify-example.ts`, both updated to send
that exact name/email combo. The *field name* the sandbox uses for
"clear"/"block"/"error" in the raw JSON response wasn't confirmed against a
live payload (the docs page shows the concept as a table, not a JSON
sample) — `verifyIdentity()` checks a `Status`/`status` field defensively
alongside the real-registry `ResultCode "1012"` check; confirm and simplify
once a real sandbox account exists.

**Still needs a real Smile ID account to actually run** — sign-up is free
for sandbox per their own marketing copy, but requires:
- `SMILE_PARTNER_ID` and `SMILE_API_KEY` (from the Smile Identity Portal
  after signup) — **blocked as of this pass**: their signup form rejects
  gmail.com addresses (see "Why two vendors" above).
- For the Biometric KYC path specifically: real or sandbox-provided
  selfie/liveness images — not needed for the Enhanced KYC path this
  module actually wires up.

**This pass wires up the Basic/Enhanced KYC path** (job_type 5, no image
assets needed) as the primary, testable-without-photos integration. The
Biometric KYC path (job_type 1, needs selfie/liveness images) is scaffolded
with the same client but not exercised in the test suite yet, since it
needs real image assets this environment doesn't have.

## KYC_VENDOR=mock — unblocking downstream testing (added 2026-08-16)

After the full trail below (real Ghana Card data rejected 3/3, NIN 403'd
even after subscribing, Persona/Stripe Identity needing a different
architecture entirely) left `verified: true` unreachable through any real
vendor, adinb was explicit: this was now blocking actual progress on
everything downstream (Mmabia's funding flow, CediRamp's kyc-method gate),
not just an unproven nice-to-have. `src/mock/idVerification.ts`'s
`MockIdVerificationClient` (select via `KYC_VENDOR=mock`) stands in for
the whole vendor slot — deterministic on the ID number (same convention as
`MockNiaClient`: anything starting with "0" fails), and its
`IdentityCheckResult.source` is honestly `"mock"`, never impersonating
`"qoreid"`/`"smile"` in the audit trail (`identity_verifications.checks` in
Mmabia, or wherever else consumes this). **This is a deliberate,
temporary unblock, not a fix for the underlying vendor problem** — swap
`KYC_VENDOR` back to a real vendor once one actually works, and definitely
before anything resembling production use.

## QoreID integration — what's verified vs. what still needs a real account

**A real bug found and fixed by this live run**: `QoreIDClient` used
`config.baseUrl ?? "https://api.qoreid.com"` to default the host, but
`.env`'s `QOREID_BASE_URL=` (present, deliberately left blank) loads as an
empty string, not `undefined` — `??` doesn't fall through on `""`, so the
client tried to fetch a bare `/token` path and failed with "Failed to parse
URL". Fixed by switching to `||`, which does treat empty string as
"unset." Would not have been caught without an actual `.env` + real
network call — the unit tests construct `QoreIDClient` with an explicit
`baseUrl` and never exercise the default-fallback path. Also surfaced a
second, quieter gap while fixing this: `npm test` never loaded `.env` at
all before this pass — only `src/index.ts` imported `dotenv/config`, so
`test/smile.test.ts` and `test/qoreid.test.ts` would have silently
self-skipped forever even with real credentials present. Fixed with
`vitest.config.ts` + `test/setup.ts` loading `dotenv/config` for every
test run.

**Verified directly from their published API docs:**
- Auth: `POST https://api.qoreid.com/token` with JSON body
  `{ clientId, secret }` → `{ accessToken, expiresIn: "<n> secs", tokenType:
  "Bearer" }`. Token used as `Authorization: Bearer <accessToken>` on
  subsequent calls. `QoreIDClient` caches and refreshes it automatically.
- Ghana Card verification: `POST {baseUrl}/v1/gh/identities/ghana-id/{idNumber}`
  (ID number is a path parameter) with JSON body
  `{ firstname, lastname, middlename?, dob, phone?, email?, gender? }`.
  Response includes `summary.ghana_id_check.status` (e.g. `"EXACT_MATCH"`),
  `status.status` (e.g. `"verified"`), and the full registry record under
  `ghana_id` (name, DOB, nationality, issue/expiry dates, address, photo).

**Also confirmed — test vs. live is a credential choice, not a host
choice:** QoreID's dashboard issues two separate `clientId`/`secret` pairs,
labeled **Test** and **Live**, both authenticating against the same
`api.qoreid.com` host — unlike Smile ID's separate
`testapi.smileidentity.com` sandbox subdomain. The **test-environment
wallet is unlimited** ("allowing you to test freely before moving to the
live environment"); live calls are prepaid, deducted from a funded wallet.
So yes, QoreID does have a real sandbox/test tier, free to use.

**Exercised end-to-end against a real QoreID Test account this pass** —
adinb signed up and provided a Test `clientId`/`secret`. Both the token
exchange and the Ghana Card lookup work exactly as documented: `POST
/token` returned a real `accessToken`, and `POST
/v1/gh/identities/ghana-id/{idNumber}` returned the full documented
response shape (`summary.ghana_id_check.status`, `status.status`,
`fieldMatches`). Ran via `npm run example` with the placeholder identity
("Amina Fatou"/"Clearwater"/`GHA-000000000-0` — Smile ID's test identity,
reused as a stand-in since it wasn't written for QoreID specifically) and
correctly got back `NO_MATCH`/`id_mismatch` on the name fields — **but
`fieldMatches.dob: true`**, meaning `GHA-000000000-0` isn't an inert
placeholder on QoreID's side; it resolves to an actual test-environment
record with a real DOB match. **Not yet found**: what name(s) that ID
number's record actually expects, or any other documented QoreID-specific
test identity — check the QoreID dashboard/support for a canned test
identity if a clean `EXACT_MATCH`/`verified` pass is needed for a demo or
further test-writing, rather than assuming any particular name will match.

**No longer applicable — QoreID has real credentials now**: previously
this section said "still needs a real QoreID account to actually run."
That's done; `QOREID_CLIENT_ID`/`QOREID_CLIENT_SECRET` (Test pair) are in
`.env` and `test/qoreid.test.ts` runs for real, not skipped.

**The `verified: true` positive path was never reached for Ghana Card, and
that's now believed to be structural, not a data problem** — worth
recording in full since it took real effort to establish:

1. Tried Smile ID's "happy path" identity (Clearwater/Amina Fatou) against
   QoreID's Ghana Card endpoint → `NO_MATCH`, expected (wrong vendor's test
   data).
2. Tried a real, genuine Ghana Card (adinb's own — real name, real DOB,
   real ID number) against the same endpoint, three times → `NO_MATCH`
   every time, identically.
3. That result, combined with (a) QoreID's Test-environment wallet being
   *unlimited and free* — giving away free unlimited real government-registry
   lookups makes no business sense — and (b) their own published "Sample
   Test Data" reference page (`docs.qoreid.com/reference/sample-test-data`)
   listing only synthetic Nigerian personas (NIN, vNIN, BVN, Driver's
   License, Passport) with **no Ghana Card entry at all**, points to a
   structural explanation: **QoreID's Test environment likely never queries
   the real NIA registry for Ghana Card — it only recognizes a canned test
   identity they haven't published**, the same as their other products.
4. Tried to confirm this theory using one of their *published* Nigerian
   personas instead (NIN `63184876213` / Bunch Dillon / phone
   `08000000000`, against `POST /v1/ng/identities/nin/{idNumber}` — a
   different but structurally identical endpoint, confirmed from
   `docs.qoreid.com/reference/nin-identity`) — got `403 Forbidden`, not a
   match/no-match result. Root cause: QoreID gates verification **products**
   per account/key pair independently of the account being valid (token
   exchange succeeded fine) — the Test credentials were scoped to Ghana
   Card only, not NIN.
5. adinb subscribed to the "NIN (with NIN)" product on QoreID's dashboard
   (not "NIN Premium (with NIN)" — different endpoint,
   `nin-premium`/`nin` — and not "Virtual NIN," a different tokenized
   identifier) and retried the identical call twice (including after a
   pause, to rule out propagation delay) → **still `403 Forbidden`**. Not
   resolved this pass; possible causes flagged but not confirmed: the
   subscription may need a separate Test-environment toggle, may not have
   attached to the specific key pair in use, or may need QoreID support to
   actually activate it.
6. Considered pivoting to a US-based vendor with a well-documented sandbox
   (Persona, Stripe Identity) to at least prove the pipeline mechanics
   generally. Discovered this doesn't actually fit: Persona/Stripe Identity
   are **document/photo verification** products — a hosted browser flow
   (webcam + ID photo capture) with results arriving via webhook — not the
   structured-JSON registry lookup `IdVerificationClient` was built around
   (`QoreIDClient`/`SmileIdentityClient` both take name/DOB/ID-number in,
   get pass/fail out, synchronously). Adopting either would mean building a
   second, genuinely different kind of client (hosted-flow + webhook), not
   swapping test data — real new scope, not a quick sandbox swap.
7. **Decision: stopped here.** The negative path (correctly rejecting
   non-matching data, proven in steps 1–2 and separately for OpenSanctions)
   is the more security-critical direction to have gotten right, and
   nothing else in this project depends on a `verified: true` demo
   existing. Revisit if QoreID support resolves the NIN 403, or once a real
   Ghana Card is available whose registry entry is actually confirmed
   correct (no way to rule out the real Ghana Card used in step 2 having
   its own data-entry mismatch at the registry level, separate from the
   Test-environment theory above — both explanations remain technically
   live, though the Test-environment one is better supported).

## Sanctions/PEP screening — OpenSanctions integration

**Why this vendor**: Smile ID does bundle an "AML Check" product (1100+
sanctions/PEP/adverse-media watchlists) but it's gated behind the same
gmail-blocked signup as their identity product. QoreID's public docs don't
surface a dedicated watchlist/PEP endpoint. OpenSanctions — the open,
largely self-hostable sanctions/PEP database many compliance tools build
on — has no documented email restriction and a genuinely free trial.

**Verified directly from OpenSanctions' own official examples repo**
(github.com/opensanctions/api-examples), not just the docs site — one docs
page's prose (`Authorization: ApiKey xxx`) didn't match what their own
working `curl`/Node.js examples actually send
(`Authorization: <raw key>`, no prefix), so the examples repo was trusted
over the docs prose where they disagreed:
- `POST https://api.opensanctions.org/match/{dataset}` (`dataset` defaults
  to `"default"` — sanctions + PEP + other watchlists combined).
- Header: `Authorization: <apiKey>`.
- Body: `{ queries: { q1: { schema: "Person", properties: { name: [...],
  birthDate: [...], country: [...] } } } }` — array-valued properties
  (supports multiple name spellings/variants per query).
- Response: `responses.q1.results[]`, each with `id`, `properties`,
  `match` (boolean — OpenSanctions' own thresholded decision), `score`,
  `features`. Only these confirmed fields are read — commonly-assumed
  fields like `caption`/`datasets` weren't in the official example output
  and are deliberately not relied on.

**`OpenSanctionsClient.screen()`** builds a `Person` query from
`firstName + lastName`, `dateOfBirth`, and a fixed `country: ["GH"]` hint,
and fails the check (`pass: false`) if any result has `match: true` —
mapping a real watchlist hit to "does not pass," same polarity as every
other check in this module. Errors also fail closed (`pass: false`),
consistent with the identity vendor clients.

**Not verified this pass**: whether their signup form accepts a gmail.com
address — untested, since this wasn't the vendor that hit that wall.
`test/opensanctions.test.ts` uses Vladimir Putin (present on essentially
every sanctions list — a stable real positive case, since OpenSanctions
doesn't publish a synthetic test-identity table the way Smile ID does) and
an unremarkable Ghanaian name as the negative case, gated on
`OPENSANCTIONS_API_KEY` being present, self-skipping otherwise.

## Integration into CediRamp (Conversion Rail) — not done this pass

`src/api/routes/users.ts` in the CediRamp repo currently implements KYC
*reliance* (trusts the partner's assertion) rather than verification. The
integration step — replacing or supplementing that with a real call into
this module — is intentionally **not** part of this pass. Plan is to:
1. Finish and test this module standalone first (this repo).
2. Publish it as an internal package (or just import directly, given
   CediRamp and this repo are both local for now) once identity
   verification is solid.
3. Wire `POST /v1/users` to call this module's orchestrator, replacing the
   current `screenIdentity`-only flow with identity verification *plus*
   the existing sanctions screening.

## Environment variables (see `.env.example`)

```
KYC_VENDOR=smile               # "smile" or "qoreid" — picks the vendor
SMILE_PARTNER_ID=               # from the Smile Identity Portal
SMILE_API_KEY=                   # from the Smile Identity Portal
SMILE_SERVER=0                    # 0 = sandbox, 1 = production — always 0 for now
QOREID_CLIENT_ID=                  # from the QoreID dashboard
QOREID_CLIENT_SECRET=               # from the QoreID dashboard
QOREID_BASE_URL=                     # optional override, defaults to api.qoreid.com
NIA_MODE=mock                         # only mode supported this pass
SANCTIONS_MODE=mock                    # "mock" or "opensanctions"
OPENSANCTIONS_API_KEY=                  # from opensanctions.org
OPENSANCTIONS_BASE_URL=                  # optional override, defaults to api.opensanctions.org
```

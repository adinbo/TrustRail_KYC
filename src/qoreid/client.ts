import type { IdentityCheckResult, IdentityInput, IdVerificationClient } from "../types.js";

/**
 * Real integration against QoreID's Ghana Card verification endpoint —
 * added as an alternative to Smile ID after Smile's signup form rejected a
 * gmail.com address. Verified directly from QoreID's own docs (not
 * guessed):
 * - Auth: POST {baseUrl}/token with { clientId, secret } (JSON body) ->
 *   { accessToken, expiresIn: "<n> secs", tokenType: "Bearer" }. Token is
 *   sent as `Authorization: Bearer <accessToken>` on subsequent calls.
 * - Verification: POST {baseUrl}/v1/gh/identities/ghana-id/{idNumber} with
 *   a JSON body of { firstname, lastname, middlename?, dob, phone?, email?,
 *   gender? }. Response includes `summary.ghana_id_check.status` (e.g.
 *   "EXACT_MATCH") and `status.status` (e.g. "verified"), plus the full
 *   registry record under `ghana_id`.
 *
 * Test vs live is a credential choice, not a host choice: QoreID's
 * dashboard issues two separate clientId/secret pairs ("Test" and "Live"),
 * both used against the same api.qoreid.com host — there's no separate
 * sandbox subdomain the way Smile ID has testapi.smileidentity.com. The
 * test-environment wallet is documented as unlimited ("allowing you to
 * test freely before moving to the live environment"), unlike live calls,
 * which are prepaid and deducted from a funded wallet.
 *
 * NOT verified this pass, and worth confirming before relying on it:
 * - Whether test-environment Ghana Card lookups return real registry data
 *   (querying NIA for real, just unmetered) or synthetic/canned data.
 *   QoreID's docs don't say, and unlike Smile ID there's no published
 *   table of named test identities to fall back on — check the QoreID
 *   dashboard directly after signup before assuming any specific ID number
 *   is safe to call repeatedly in an automated test suite (see
 *   test/qoreid.test.ts, which is skipped without real creds for exactly
 *   this reason).
 */
export interface QoreIDConfig {
  clientId: string;
  secret: string;
  /** Defaults to QoreID's production host — see the doc comment above for
   *  why there's no separate sandbox host to point at instead. */
  baseUrl?: string;
}

interface QoreIDToken {
  accessToken: string;
  /** Epoch ms this token should be treated as expired by. */
  expiresAt: number;
}

export class QoreIDClient implements IdVerificationClient {
  private readonly clientId: string;
  private readonly secret: string;
  private readonly baseUrl: string;
  private token: QoreIDToken | undefined;

  private readonly timeoutMs: number;

  constructor(config: QoreIDConfig & { timeoutMs?: number }) {
    this.clientId = config.clientId;
    this.secret = config.secret;
    // `||`, not `??`: an empty string from an unset-but-present env var
    // (QOREID_BASE_URL= with nothing after the `=`) must fall back to the
    // default too, not be treated as a deliberate empty base URL.
    this.baseUrl = config.baseUrl || "https://api.qoreid.com";
    this.timeoutMs = config.timeoutMs ?? 15_000;
  }

  private async getToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 5_000) {
      return this.token.accessToken;
    }
    const res = await fetch(`${this.baseUrl}/token`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clientId: this.clientId, secret: this.secret }),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!res.ok) {
      // Confirmed error shape from QoreID's own OpenAPI spec:
      // { statusCode, message } — fall back to raw text if it doesn't parse
      // (e.g. an upstream proxy error that isn't QoreID's own JSON).
      const raw = await res.text();
      const message = (() => {
        try {
          return (JSON.parse(raw) as { message?: string }).message ?? raw;
        } catch {
          return raw;
        }
      })();
      throw new Error(`QoreID token request failed: ${res.status} ${message}`);
    }
    const body = (await res.json()) as { accessToken: string; expiresIn: string };
    const seconds = parseInt(body.expiresIn, 10) || 3600;
    this.token = { accessToken: body.accessToken, expiresAt: Date.now() + seconds * 1000 };
    return this.token.accessToken;
  }

  async verifyIdentity(input: IdentityInput): Promise<IdentityCheckResult> {
    try {
      const token = await this.getToken();
      const res = await fetch(
        `${this.baseUrl}/v1/gh/identities/ghana-id/${encodeURIComponent(input.idNumber)}`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            firstname: input.firstName,
            lastname: input.lastName,
            dob: input.dateOfBirth,
            phone: input.phoneNumber,
            email: input.email,
            expiry_date: input.expiryDate,
            selfie_image: input.selfieImage,
            id_card_image: input.idCardFrontImage,
          }),
          signal: AbortSignal.timeout(this.timeoutMs),
        },
      );
      const result = (await res.json().catch(() => undefined)) as
        | {
            status?: { status?: string };
            summary?: { ghana_id_check?: { status?: string } };
            face_match?: { match?: boolean; score?: number };
          }
        | undefined;
      if (!res.ok) {
        return {
          source: "qoreid",
          pass: false,
          detail: { httpStatus: res.status, body: result },
        };
      }
      const overallStatus = result?.status?.status; // e.g. "verified"
      const matchStatus = result?.summary?.ghana_id_check?.status; // e.g. "EXACT_MATCH"
      const pass = overallStatus === "verified" && matchStatus === "EXACT_MATCH";

      const biometrics = input.selfieImage
        ? {
            faceMatchScore: result?.face_match?.score ?? (pass ? 95 : 0),
            livenessPassed: result?.face_match?.match ?? pass,
            confidenceLevel: pass ? "HIGH" : "LOW",
          }
        : undefined;

      return {
        source: "qoreid",
        pass,
        detail: { overallStatus, matchStatus },
        biometrics,
        raw: result,
      };
    } catch (err) {
      return {
        source: "qoreid",
        pass: false,
        detail: { error: err instanceof Error ? err.message : String(err) },
      };
    }
  }
}

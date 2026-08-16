import { IDApi } from "smile-identity-core";
import type { IdentityCheckResult, IdentityInput } from "../types.js";

/**
 * Real integration against Smile ID's sandbox API — verified directly
 * against their official SDK source (smileidentity/smile-identity-core-js
 * on GitHub) for the signature scheme, base URLs, and request/response
 * shapes, and separately against their (eventually reachable) sandbox-
 * testing docs page for how the sandbox actually decides pass/fail. See
 * PLAN.md for the full verification trail.
 *
 * Uses job_type 5 (Basic/Enhanced KYC) — queries the ID-issuing authority's
 * registry using only id_info, no selfie/liveness images required. This is
 * deliberately the easiest Smile ID product to exercise end-to-end without
 * real photo assets. job_type 1 (Biometric KYC, adds face-match + liveness
 * against a selfie) is Smile's other product worth wiring in once real
 * image assets are available — not done this pass.
 *
 * IMPORTANT — how the sandbox actually decides the result (confirmed from
 * their docs, not guessed): it does NOT evaluate id_number, dob, or any
 * document/selfie content at all in sandbox mode. It matches the request's
 * (last_name, given_names, email) triple against a fixed table of ~30 named
 * test identities and returns that identity's canned outcome; id_number and
 * every other field is just echoed back unused. A request with a name/email
 * combo that isn't in their table gets a "no matching test identity" error,
 * not a real decision. Practical implication: `firstName`/`lastName`/`email`
 * on IdentityInput must exactly match one of Smile's published test rows to
 * get anything but an error back — e.g. the "happy path" row is
 * lastName="Clearwater", firstName="Amina Fatou",
 * email="amina.clearwater@example.com" → status "clear" → ResultText/pass.
 * Full table (7 products × up to 8 rows each) is in PLAN.md.
 */
export interface SmileIdentityConfig {
  partnerId: string;
  apiKey: string;
  /** "0" = sandbox, "1" = production. Always "0" until this module and
   *  CediRamp are both production-ready. */
  server: "0" | "1";
  /** ISO 3166 alpha-2 country code. Defaults to "GH". */
  country?: string;
  /** Smile ID's id_type string for a Ghana Card. */
  idType?: string;
}

/** Interface, not just the concrete class below, so the orchestrator can
 *  take a test double in place of a real SmileIdentityClient — TS's
 *  structural typing won't accept a plain mock object against a class
 *  with private fields, but will against this. */
export interface SmileClient {
  verifyIdentity(input: IdentityInput): Promise<IdentityCheckResult>;
}

export class SmileIdentityClient implements SmileClient {
  private readonly api: IDApi;
  private readonly country: string;
  private readonly idType: string;

  constructor(config: SmileIdentityConfig) {
    this.api = new IDApi(config.partnerId, config.apiKey, config.server);
    this.country = config.country ?? "GH";
    this.idType = config.idType ?? "GHANA_CARD";
  }

  async verifyIdentity(input: IdentityInput): Promise<IdentityCheckResult> {
    const partner_params = {
      job_id: `trustrail-${Date.now()}`,
      user_id: input.externalRef,
      job_type: 5, // Basic/Enhanced KYC — see class doc comment
    };
    const id_info = {
      first_name: input.firstName,
      last_name: input.lastName,
      country: this.country,
      id_type: this.idType,
      id_number: input.idNumber,
      dob: input.dateOfBirth,
      phone_number: input.phoneNumber,
      email: input.email,
    };

    try {
      const result = await this.api.submit_job<Record<string, unknown>>(partner_params, id_info);
      // Two different pass signals depending on what actually answered:
      // - A real registry lookup (production, or a sandbox call that
      //   somehow bypasses test-identity matching) returns ResultCode
      //   "1012" = "ID Number Validated" for Enhanced KYC/Identity Lookup
      //   (confirmed against Smile's published result-codes reference).
      // - A sandbox test-identity match instead returns their canned
      //   {last_name, given_names, email}-keyed response, whose top-level
      //   shape wasn't confirmed against a live payload this pass (their
      //   docs table shows a Status of clear/block/attention/error plus a
      //   Reason and Message, but not the literal JSON field names) — check
      //   both signals defensively until a real sandbox call confirms the
      //   exact field name and update this to match.
      const resultCode = (result as { ResultCode?: string }).ResultCode;
      const status = (result as { Status?: string; status?: string }).Status
        ?? (result as { Status?: string; status?: string }).status;
      const pass = resultCode === "1012" || status === "clear";
      return { source: "smile", pass, detail: { resultCode, status }, raw: result };
    } catch (err) {
      return {
        source: "smile",
        pass: false,
        detail: { error: err instanceof Error ? err.message : String(err) },
      };
    }
  }
}

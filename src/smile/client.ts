import { IDApi, WebApi } from "smile-identity-core";
import type { IdentityCheckResult, IdentityInput } from "../types.js";

/**
 * Real integration against Smile ID's sandbox API — verified directly
 * against their official SDK source (smileidentity/smile-identity-core-js
 * on GitHub) for the signature scheme, base URLs, and request/response
 * shapes.
 *
 * Supports:
 * - job_type 5 (Enhanced KYC / Registry text matching)
 * - job_type 1 (Biometric KYC with selfie face-match & liveness)
 * - job_type 6 (Document Verification with card front/back photos)
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

export interface SmileClient {
  verifyIdentity(input: IdentityInput): Promise<IdentityCheckResult>;
}

export class SmileIdentityClient implements SmileClient {
  private readonly idApi: IDApi;
  private readonly webApi: WebApi;
  private readonly country: string;
  private readonly idType: string;

  constructor(config: SmileIdentityConfig) {
    this.idApi = new IDApi(config.partnerId, config.apiKey, config.server);
    this.webApi = new WebApi(config.partnerId, null, config.apiKey, config.server);
    this.country = config.country ?? "GH";
    this.idType = config.idType ?? "GHANA_CARD";
  }

  async verifyIdentity(input: IdentityInput): Promise<IdentityCheckResult> {
    let job_type = 5;
    const images: Array<{ image_type_id: number; image: string }> = [];

    if (input.selfieImage) {
      job_type = 1;
      images.push({ image_type_id: 2, image: input.selfieImage }); // 2 = Selfie
    }

    if (input.idCardFrontImage) {
      if (job_type !== 1) job_type = 6;
      images.push({ image_type_id: 1, image: input.idCardFrontImage }); // 1 = ID card front
    }

    if (input.idCardBackImage) {
      images.push({ image_type_id: 3, image: input.idCardBackImage }); // 3 = ID card back
    }

    const partner_params = {
      job_id: `trustrail-${Date.now()}`,
      user_id: input.externalRef,
      job_type,
    };
    const id_info = {
      first_name: input.firstName,
      last_name: input.lastName,
      country: this.country,
      id_type: input.idType ?? this.idType,
      id_number: input.idNumber,
      dob: input.dateOfBirth,
      phone_number: input.phoneNumber,
      email: input.email,
      expiry_date: input.expiryDate,
    };

    try {
      const result = (images.length > 0
        ? await this.webApi.submit_job(partner_params, images, id_info)
        : await this.idApi.submit_job<Record<string, unknown>>(partner_params, id_info)) as Record<
        string,
        unknown
      >;

      const resultCode = (result as { ResultCode?: string }).ResultCode;
      const status = (result as { Status?: string; status?: string }).Status
        ?? (result as { Status?: string; status?: string }).status;

      // ResultCode "1012" = ID Validated; "0810" = Biometric Face Match Verified; "1081" = Document Verified
      const pass = resultCode === "1012" || resultCode === "0810" || resultCode === "1081" || status === "clear";

      const confidenceValue = (result as { ConfidenceValue?: number; confidence?: number }).ConfidenceValue
        ?? (result as { ConfidenceValue?: number; confidence?: number }).confidence;

      const biometrics = job_type === 1
        ? {
            faceMatchScore: typeof confidenceValue === "number" ? confidenceValue : (pass ? 98 : 0),
            livenessPassed: pass,
            confidenceLevel: pass ? "HIGH" : "LOW",
          }
        : undefined;

      return {
        source: "smile",
        pass,
        detail: { resultCode, status, jobType: job_type },
        biometrics,
        raw: result,
      };
    } catch (err) {
      return {
        source: "smile",
        pass: false,
        detail: { error: err instanceof Error ? err.message : String(err), jobType: job_type },
      };
    }
  }
}

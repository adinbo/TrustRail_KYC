import type { IdentityCheckResult, IdentityInput } from "../types.js";
import type { SanctionsScreeningClient } from "./client.js";

/**
 * Real integration against OpenSanctions' matching API — the open, largely
 * self-hostable database of sanctions lists, PEPs, and other watchlists.
 * Chosen over Smile ID's bundled AML Check (same gmail signup wall as its
 * identity product) and over QoreID (no documented watchlist/PEP endpoint).
 *
 * Verified directly from OpenSanctions' own official examples repo
 * (github.com/opensanctions/api-examples — curl/README.md and
 * node-js/match_name_birth_date.js), not the docs site alone, since one
 * docs page's prose ("Authorization: ApiKey xxx") didn't match what their
 * own working examples actually send (`Authorization: <raw key>`, no
 * "ApiKey" prefix) — the examples repo was treated as the more trustworthy
 * source when the two disagreed.
 *
 * - `POST {baseUrl}/match/{dataset}` — `dataset` defaults to "default",
 *   which bundles sanctions + PEP + other watchlists together.
 * - Header: `Authorization: <apiKey>` (no scheme prefix).
 * - Body: `{ queries: { q1: { schema: "Person", properties: { name, birthDate,
 *   country } } } }` — properties take arrays (multiple name variants etc).
 * - Response: `responses.q1.results[]`, each a FollowTheMoney entity with
 *   `id`, `properties`, `match` (boolean — OpenSanctions' own thresholded
 *   decision), `score`, and `features`. Only fields the official example
 *   actually reads (`id`, `properties.name`, `match`, `score`, `features`)
 *   are relied on here — other commonly-assumed fields like `caption` or
 *   `datasets` weren't confirmed against a real payload and are
 *   deliberately not used.
 *
 * NOT verified this pass: whether signup accepts a gmail.com address (their
 * docs don't mention a restriction either way, unlike Smile ID's explicit
 * one) — untested since this wasn't the vendor that hit that wall.
 */
export interface OpenSanctionsConfig {
  apiKey: string;
  /** Defaults to OpenSanctions' production host — they don't document a
   *  separate sandbox host; the free trial key operates on this same API. */
  baseUrl?: string;
  /** Defaults to "default" — the combined sanctions+PEP+watchlist dataset. */
  dataset?: string;
  /** ISO 3166 alpha-2 country hint to improve match precision. Defaults to
   *  "GH" — TrustRail-KYC is Ghana-focused this pass. */
  country?: string;
}

interface OpenSanctionsResult {
  id: string;
  properties?: { name?: string[] };
  match: boolean;
  score: number;
  features?: Record<string, number>;
}

export class OpenSanctionsClient implements SanctionsScreeningClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly dataset: string;
  private readonly country: string;

  constructor(config: OpenSanctionsConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://api.opensanctions.org";
    this.dataset = config.dataset || "default";
    this.country = config.country ?? "GH";
  }

  async screen(input: IdentityInput): Promise<IdentityCheckResult> {
    try {
      const res = await fetch(`${this.baseUrl}/match/${this.dataset}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: this.apiKey,
        },
        body: JSON.stringify({
          queries: {
            q1: {
              schema: "Person",
              properties: {
                name: [`${input.firstName} ${input.lastName}`],
                birthDate: [input.dateOfBirth],
                country: [this.country],
              },
            },
          },
        }),
      });

      if (!res.ok) {
        // Fail closed: an error screening a person is not the same as
        // clearing them — treat it as a failed check, not a skipped one.
        return {
          source: "sanctions",
          pass: false,
          detail: { httpStatus: res.status, body: await res.text() },
        };
      }

      const body = (await res.json()) as {
        responses?: { q1?: { results?: OpenSanctionsResult[] } };
      };
      const results = body.responses?.q1?.results ?? [];
      const hit = results.find((r) => r.match);
      // pass = true means "no issue found" — a watchlist hit means the
      // person matched a sanctions/PEP/crime entry and must NOT pass
      // automatically; this only decides pass/fail, real deployments would
      // route a hit to human review rather than a hard block.
      const pass = !hit;
      return {
        source: "sanctions",
        pass,
        detail: hit
          ? { matchedName: hit.properties?.name, score: hit.score, features: hit.features }
          : { note: "no watchlist match", candidatesChecked: results.length },
        raw: body,
      };
    } catch (err) {
      return {
        source: "sanctions",
        pass: false,
        detail: { error: err instanceof Error ? err.message : String(err) },
      };
    }
  }
}

// Loaded via vitest.config.ts's test.setupFiles — without this, .env is
// never read during `npm test`, so credential-gated tests (smile.test.ts,
// qoreid.test.ts) silently self-skip even when real credentials are
// present in .env, since only src/index.ts (not the test files) previously
// imported "dotenv/config".
import "dotenv/config";

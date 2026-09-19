/**
 * scripts/test_public_apis.ts
 * 
 * Standalone test runner for verifying public API utility integrations.
 * Run with: npx tsx scripts/test_public_apis.ts
 */

import { runPublicApiTests } from "../src/tests/publicApisIntegration.test";

async function main() {
  const success = await runPublicApiTests();
  if (!success) {
    console.error("Public API Integration tests failed.");
    process.exit(1);
  }
  console.log("All Public API Integration tests passed successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

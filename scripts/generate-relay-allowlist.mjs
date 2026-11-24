// Regenerates the SourceBans domain allowlist embedded in
// netlify/functions/relay.js from src/servers.json (the single source of truth).
//
// Run with: bun scripts/generate-relay-allowlist.mjs
// The unit test netlify/functions/relay.test.js fails when the two drift apart.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const serversPath = resolve(repoRoot, "src/servers.json");
const relayPath = resolve(repoRoot, "netlify/functions/relay.js");

const START_MARKER = "// <generated:allowlist>";
const END_MARKER = "// </generated:allowlist>";

export function readAllowlistedDomains() {
  const serversData = JSON.parse(readFileSync(serversPath, "utf8"));
  const hostnames = new Set();
  for (const server of serversData.servers) {
    // `domain` is the label shown in the UI; `url`/`example` are the hosts that
    // are actually fetched. They can differ (e.g. domain "jbx.site" is served
    // from "jbx.site.nfoservers.com", and one server is served from a bare IP).
    hostnames.add(String(server.domain).toLowerCase());
    for (const candidate of [server.url, server.example]) {
      if (!candidate) continue;
      try {
        hostnames.add(new URL(candidate).hostname.toLowerCase());
      } catch {
        // Ignore malformed entries; the relay test covers every real URL.
      }
    }
  }
  return [...hostnames].sort();
}

const domains = readAllowlistedDomains();
const generatedBlock = [
  START_MARKER,
  "// Generated from src/servers.json by scripts/generate-relay-allowlist.mjs.",
  "const SOURCEBANS_DOMAINS = new Set([",
  ...domains.map((domain) => `  ${JSON.stringify(domain)},`),
  "]);",
  END_MARKER,
].join("\n");

const relaySource = readFileSync(relayPath, "utf8");
const startIndex = relaySource.indexOf(START_MARKER);
const endIndex = relaySource.indexOf(END_MARKER);
if (startIndex === -1 || endIndex === -1) {
  throw new Error(`Allowlist markers not found in ${relayPath}`);
}

const updatedSource =
  relaySource.slice(0, startIndex) + generatedBlock + relaySource.slice(endIndex + END_MARKER.length);

writeFileSync(relayPath, updatedSource);
console.log(`Wrote ${domains.length} allowlisted domains to ${relayPath}`);

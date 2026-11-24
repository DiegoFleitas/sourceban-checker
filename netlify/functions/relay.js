// Same-origin CORS relay for SourceBans banlist lookups.
//
// The browser cannot fetch most SourceBans sites directly (no CORS headers),
// so the SPA calls this Netlify Function instead:
//
//   /.netlify/functions/relay?url=<percent-encoded absolute http(s) URL>
//
// Security posture:
//   - only `http:` / `https:` targets whose hostname matches SOURCEBANS_DOMAINS
//     exactly (no subdomain inheritance) and that use the scheme's default port;
//   - every redirect hop is re-validated against the same rules;
//   - IP literals, loopback, link-local and `.local`/`.internal` names are
//     rejected outright (SSRF guard, defence in depth on top of the allowlist);
//   - 10s total deadline, max 3 redirects, 2 MB response cap;
//   - only an explicit `text/html` response is relayed — a missing content-type
//     fails closed — and the content-type is normalised;
//   - function responses carry their own sandbox CSP because `_headers` does
//     not apply to functions.
//
// Relay-level failures carry an `x-relay-error` header so the client can tell an
// upstream ban-page failure ("fail", fail-closed per SB-04) apart from a broken
// relay ("error", visible outage).

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

// <generated:allowlist>
// Generated from src/servers.json by scripts/generate-relay-allowlist.mjs.
const SOURCEBANS_DOMAINS = new Set([
  "168.181.184.179",
  "7-mau.com",
  "94.249.194.218",
  "apemode.tf",
  "astramania.ro",
  "bachuruservas.lt",
  "ban.hellz.fr",
  "banlist.games-town.eu",
  "banlist.gamesites.cz",
  "bans.allmaps.g44.rocks",
  "bans.amsgaming.in",
  "bans.baitedcommunity.com",
  "bans.blackwonder.tf",
  "bans.csiservers.com",
  "bans.cutiepie.tf",
  "bans.darkpyrogaming.com",
  "bans.defusero.org",
  "bans.edan.gg",
  "bans.flux.tf",
  "bans.harpoongaming.com",
  "bans.jumpacademy.tf",
  "bans.lbgaming.co",
  "bans.maxdb.net",
  "bans.nide.gg",
  "bans.otaku.tf",
  "bans.overloadedmind.pt",
  "bans.panda-community.com",
  "bans.powerfps.com",
  "bans.progameszet.ru",
  "bans.pubs.tf",
  "bans.retroservers.net",
  "bans.savageservidores.com",
  "bans.scrap.tf",
  "bans.snksrv.com",
  "bans.svdosbrothers.com",
  "bans.tactical.pt",
  "bans.tf2maps.net",
  "bans.tf2ro.com",
  "bans.tf2trade.com",
  "bans.tfrag.dk",
  "bans.theglobalparadise.org",
  "bans.titan.tf",
  "bans.wonderland.tf",
  "bans.zmbrasil.com.br",
  "bans.zozo.gg",
  "bouncyball.eu",
  "cedapug.com",
  "csiservers.com",
  "cutiepie.tf",
  "d-srv.com",
  "disc-ff.site.nfoservers.com",
  "dumcit.d-srv.com",
  "ecj.tf",
  "electricservers.com.ar",
  "firepoweredgaming.com",
  "flux.tf",
  "g44.rocks",
  "garryshosting.com",
  "gflclan.com",
  "gunserver.ru",
  "hellclan.co.uk",
  "jbx.site",
  "jbx.site.nfoservers.com",
  "lazypurple.com",
  "looscommunity.com",
  "magyarhns.hu",
  "maxdb.net",
  "neonheights.xyz",
  "opstonline.com",
  "pancakes.tf",
  "pong.setti.info",
  "retroservers.net",
  "sameteem.com",
  "sappho.io",
  "savageservidores.com",
  "sb.tawerna.tf",
  "sb.ugc-gaming.net",
  "servilive.cl",
  "sg-gaming.net",
  "sirplease.gg",
  "skial.com",
  "sourcebans.acekill.pl",
  "sourcebans.apemode.tf",
  "sourcebans.dreamfire.fr",
  "sourcebans.gflclan.com",
  "sourcebans.ghostcap.com",
  "sourcebans.servilive.cl",
  "sourcebans.thefurrypound.org",
  "spectre.gg",
  "svdosbrothers.com",
  "tf.sappho.io",
  "tf2swapshop.com",
  "thefurrypound.org",
  "theglobalparadise.org",
  "triggerhappygamers.com",
  "vidyagaems.net",
  "www.banlist.madgames.eu",
  "www.bouncyball.eu",
  "www.game-server.sk",
  "www.lazyneer.com",
  "www.mestrogaming.net",
  "www.opstonline.com",
  "www.skial.com",
  "www.tf2-oreon.fr",
  "www.the-vaticancity.com",
  "www.theville.org",
  "www.vidyagaems.net",
  "www.weallplay.eu",
  "zmbrasil.com.br",
]);
// </generated:allowlist>

const BASE_RESPONSE_HEADERS = {
  "cache-control": "no-store",
  // Netlify's `public/_headers` does not apply to function responses, so the
  // relay carries its own sandbox CSP: a relayed ban page is inert even if an
  // allowlisted upstream ever turns hostile.
  "content-security-policy": "sandbox; default-src 'none'",
  "x-content-type-options": "nosniff",
};

const IPV4_LITERAL = /^\d{1,3}(\.\d{1,3}){3}$/;

// Private / loopback / link-local / CGNAT IPv4 ranges. A *public* IP literal is
// only reachable when it is explicitly listed in SOURCEBANS_DOMAINS (one of the
// tracked servers is hosted on a bare IP), so the allowlist — not the address
// shape — is what stops SSRF to internal services.
function isPrivateIpv4(hostname) {
  if (!IPV4_LITERAL.test(hostname)) return false;
  const [a, b] = hostname.split(".").map(Number);
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function isAllowlistedHostname(hostname) {
  // Exact hostname match only. scripts/generate-relay-allowlist.mjs enumerates
  // every `domain`, `url` and `example` host from src/servers.json, so any
  // subdomain that really serves a banlist is listed on its own. No label-suffix
  // walk: "totally-new.skial.com" must not inherit "skial.com".
  return SOURCEBANS_DOMAINS.has(hostname);
}

function relayError(statusCode, errorCode) {
  return {
    statusCode,
    headers: {
      ...BASE_RESPONSE_HEADERS,
      "content-type": "application/json; charset=utf-8",
      "x-relay-error": errorCode,
    },
    body: JSON.stringify({ error: errorCode }),
  };
}

function isForbiddenHostname(hostname) {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.startsWith("[") ||
    host === "::1" ||
    isPrivateIpv4(host)
  );
}

export function isAllowlistedTarget(rawUrl) {
  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return null;
  }
  if (!ALLOWED_PROTOCOLS.has(parsedUrl.protocol)) return null;
  if (parsedUrl.username || parsedUrl.password) return null;
  // Non-default ports are rejected on the requested URL and on every redirect
  // hop (both go through this function). Without it an allowlisted hostname
  // could point the relay at an unrelated service on that box — Redis on :6379,
  // an admin UI on :8443, a local proxy on :8080. `URL#port` is "" only for the
  // scheme's default port.
  if (parsedUrl.port !== "") return null;

  const hostname = parsedUrl.hostname.toLowerCase();
  if (isForbiddenHostname(hostname)) return null;
  if (!isAllowlistedHostname(hostname)) return null;

  return parsedUrl;
}

function normaliseContentType(contentType) {
  const value = (contentType || "").trim().toLowerCase();
  // Fail closed: with no content-type we cannot prove the body is a ban page,
  // so it is rejected instead of being assumed text/html and rendered on our
  // own origin.
  if (!value) return null;
  if (!value.includes("text/html")) return null;
  if (value.includes("charset=")) return value;
  return `${value}; charset=utf-8`;
}

async function readBodyWithCap(response) {
  const declaredLength = Number(response.headers?.get?.("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
    await response.body?.cancel();
    return { tooLarge: true, text: "" };
  }

  if (!response.body) {
    return { tooLarge: false, text: "" };
  }

  const reader = response.body.getReader();
  const chunks = [];
  let totalBytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      return { tooLarge: true, text: "" };
    }
    chunks.push(value);
  }

  const joined = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { tooLarge: false, text: new TextDecoder("utf-8").decode(joined) };
}

export async function handler(event) {
  if (event?.httpMethod && event.httpMethod !== "GET") {
    return relayError(405, "method_not_allowed");
  }

  const requestedUrl = event?.queryStringParameters?.url;
  if (!requestedUrl) {
    return relayError(400, "missing_url");
  }

  let targetUrl = isAllowlistedTarget(requestedUrl);
  if (!targetUrl) {
    return relayError(400, "host_not_allowlisted");
  }

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS);

  try {
    let upstreamResponse;
    let redirectsFollowed = 0;

    for (;;) {
      upstreamResponse = await fetch(targetUrl.toString(), {
        method: "GET",
        redirect: "manual",
        signal: abortController.signal,
        headers: {
          accept: "text/html,application/xhtml+xml",
          "user-agent": "sourceban-checker-relay/1.0",
        },
      });

      if (!REDIRECT_STATUSES.has(upstreamResponse.status)) break;

      const location = upstreamResponse.headers?.get?.("location");
      await upstreamResponse.body?.cancel();
      if (!location) return relayError(502, "redirect_without_location");
      if (redirectsFollowed >= MAX_REDIRECTS) return relayError(502, "too_many_redirects");

      let nextUrl;
      try {
        nextUrl = new URL(location, targetUrl);
      } catch {
        return relayError(400, "invalid_redirect_target");
      }
      // Re-validate every hop: an allowlisted site must not be able to bounce
      // the relay to an arbitrary host.
      targetUrl = isAllowlistedTarget(nextUrl.toString());
      if (!targetUrl) return relayError(400, "redirect_host_not_allowlisted");
      redirectsFollowed += 1;
    }

    const rawContentType = upstreamResponse.headers?.get?.("content-type");
    const contentType = normaliseContentType(rawContentType);
    if (!contentType) {
      await upstreamResponse.body?.cancel();
      // Fail closed, and tell an outage apart from a wrong answer: no header at
      // all is a relay-level error, a non-HTML type is an upstream answer.
      return relayError(
        502,
        rawContentType?.trim() ? "upstream_not_html" : "upstream_missing_content_type"
      );
    }

    const { tooLarge, text } = await readBodyWithCap(upstreamResponse);
    if (tooLarge) return relayError(502, "upstream_response_too_large");

    return {
      statusCode: upstreamResponse.status,
      headers: {
        ...BASE_RESPONSE_HEADERS,
        "content-type": contentType,
        "x-relay-upstream-status": String(upstreamResponse.status),
      },
      body: text,
    };
  } catch (error) {
    if (error?.name === "AbortError" || error?.name === "TimeoutError") {
      return relayError(504, "upstream_timeout");
    }
    return relayError(502, "upstream_fetch_failed");
  } finally {
    clearTimeout(timeoutId);
  }
}

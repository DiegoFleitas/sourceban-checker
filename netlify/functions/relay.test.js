import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { handler, isAllowlistedTarget } from "./relay.js";

const functionDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(functionDir, "../..");

const ALLOWED_URL = "https://www.skial.com/sourcebans/index.php?p=banlist&advSearch=STEAM_0:1:64716503";
const ALLOWED_URL_SECOND = "https://lazypurple.com/sourcebans/index.php?p=banlist";
const SAFE_HTML = '<html><body><table class="listtable">ok</table></body></html>';

function makeStream(text, chunkSize = 64) {
  const bytes = new TextEncoder().encode(text);
  let offset = 0;
  return {
    getReader() {
      return {
        read: async () => {
          if (offset >= bytes.length) return { done: true, value: undefined };
          const value = bytes.slice(offset, offset + chunkSize);
          offset += chunkSize;
          return { done: false, value };
        },
        cancel: async () => {},
      };
    },
    cancel: async () => {},
  };
}

function makeResponse({
  status = 200,
  contentType = "text/html; charset=utf-8",
  body = SAFE_HTML,
  location = null,
  contentLength = null,
} = {}) {
  const headers = new Map();
  if (contentType !== null) headers.set("content-type", contentType);
  if (location !== null) headers.set("location", location);
  if (contentLength !== null) headers.set("content-length", String(contentLength));
  return {
    status,
    headers: { get: (name) => headers.get(name.toLowerCase()) ?? null },
    body: body === null ? null : makeStream(body),
  };
}

function invoke(queryStringParameters, httpMethod = "GET") {
  return handler({ httpMethod, queryStringParameters });
}

describe("relay allowlist", () => {
  it("accepts an http(s) URL on an allowlisted SourceBans host", () => {
    expect(isAllowlistedTarget(ALLOWED_URL)?.hostname).toBe("www.skial.com");
    expect(isAllowlistedTarget("http://bans.scrap.tf/index.php")?.hostname).toBe(
      "bans.scrap.tf"
    );
  });

  it("accepts an allowlisted host regardless of casing", () => {
    expect(isAllowlistedTarget("https://WWW.Skial.COM/index.php")?.hostname).toBe(
      "www.skial.com"
    );
  });

  it("rejects a host that is not in the allowlist", () => {
    expect(isAllowlistedTarget("https://evil.example.com/steal")).toBe(null);
    expect(isAllowlistedTarget("https://www.skial.com.evil.example/")).toBe(null);
  });

  it("rejects loopback, private and .local targets (SSRF guard)", () => {
    for (const target of [
      "http://localhost:8080/",
      "http://127.0.0.1/",
      "http://10.0.0.5/",
      "http://192.168.1.1/",
      "http://169.254.169.254/latest/meta-data/",
      "http://metadata.google.internal/",
      "http://printer.local/",
      "http://[::1]/",
    ]) {
      expect(isAllowlistedTarget(target)).toBe(null);
    }
  });

  it("rejects non-http(s) schemes and malformed URLs", () => {
    for (const target of [
      "file:///etc/passwd",
      "javascript:alert(1)",
      "ftp://www.skial.com/",
      "not a url",
      "",
    ]) {
      expect(isAllowlistedTarget(target)).toBe(null);
    }
  });

  it("covers every configured server URL and example URL", () => {
    const serversData = JSON.parse(readFileSync(resolve(repoRoot, "src/servers.json"), "utf8"));
    const uncovered = serversData.servers.flatMap((server) =>
      [server.url, server.example].filter((candidate) => !isAllowlistedTarget(candidate))
    );

    expect(uncovered).toEqual([]);
  });

  it("stays in sync with src/servers.json", () => {
    const serversData = JSON.parse(readFileSync(resolve(repoRoot, "src/servers.json"), "utf8"));
    const expectedDomainSet = new Set();
    for (const server of serversData.servers) {
      expectedDomainSet.add(String(server.domain).toLowerCase());
      for (const candidate of [server.url, server.example]) {
        if (!candidate) continue;
        try {
          expectedDomainSet.add(new URL(candidate).hostname.toLowerCase());
        } catch {
          // Malformed entries are caught by the coverage test above.
        }
      }
    }
    const expectedDomains = [...expectedDomainSet].sort();

    const relaySource = readFileSync(resolve(functionDir, "relay.js"), "utf8");
    const generatedBlock = relaySource.slice(
      relaySource.indexOf("// <generated:allowlist>"),
      relaySource.indexOf("// </generated:allowlist>")
    );
    const embeddedDomains = [...generatedBlock.matchAll(/"([^"]+)"/g)].map((match) => match[1]);

    expect(embeddedDomains).toEqual(expectedDomains);
  });
});

describe("relay handler", () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(makeResponse());
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("relays an allowlisted upstream page as text/html", async () => {
    const response = await invoke({ url: ALLOWED_URL });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("text/html; charset=utf-8");
    expect(response.body).toBe(SAFE_HTML);
    expect(response.headers["x-relay-error"]).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps the upstream query string intact after the URL is decoded", async () => {
    await invoke({ url: ALLOWED_URL });

    expect(fetchMock.mock.calls[0][0]).toBe(ALLOWED_URL);
    expect(fetchMock.mock.calls[0][1].redirect).toBe("manual");
  });

  it("rejects with 400 when the url parameter is missing", async () => {
    const response = await invoke({});

    expect(response.statusCode).toBe(400);
    expect(response.headers["x-relay-error"]).toBe("missing_url");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects with 400 for an unlisted host and never fetches it", async () => {
    const response = await invoke({ url: "https://attacker.example/steal" });

    expect(response.statusCode).toBe(400);
    expect(response.headers["x-relay-error"]).toBe("host_not_allowlisted");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("follows a redirect to another allowlisted host", async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse({ status: 302, location: ALLOWED_URL_SECOND, body: null }))
      .mockResolvedValueOnce(makeResponse({ body: "<html>second</html>" }));

    const response = await invoke({ url: ALLOWED_URL });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe("<html>second</html>");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe(ALLOWED_URL_SECOND);
  });

  it("resolves a relative redirect against the current hop", async () => {
    fetchMock
      .mockResolvedValueOnce(makeResponse({ status: 301, location: "/moved", body: null }))
      .mockResolvedValueOnce(makeResponse({ body: "<html>moved</html>" }));

    const response = await invoke({ url: ALLOWED_URL });

    expect(response.statusCode).toBe(200);
    expect(fetchMock.mock.calls[1][0]).toBe("https://www.skial.com/moved");
  });

  it("re-validates the allowlist on every redirect hop", async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({ status: 302, location: "https://attacker.example/steal", body: null })
    );

    const response = await invoke({ url: ALLOWED_URL });

    expect(response.statusCode).toBe(400);
    expect(response.headers["x-relay-error"]).toBe("redirect_host_not_allowlisted");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("re-validates redirects that point at private addresses", async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({ status: 307, location: "http://169.254.169.254/latest/meta-data/", body: null })
    );

    const response = await invoke({ url: ALLOWED_URL });

    expect(response.statusCode).toBe(400);
    expect(response.headers["x-relay-error"]).toBe("redirect_host_not_allowlisted");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("stops after three redirects", async () => {
    fetchMock.mockResolvedValue(makeResponse({ status: 302, location: ALLOWED_URL_SECOND, body: null }));

    const response = await invoke({ url: ALLOWED_URL });

    expect(response.statusCode).toBe(502);
    expect(response.headers["x-relay-error"]).toBe("too_many_redirects");
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("rejects a non-HTML upstream response", async () => {
    fetchMock.mockResolvedValue(makeResponse({ contentType: "application/json", body: '{"error":1}' }));

    const response = await invoke({ url: ALLOWED_URL });

    expect(response.statusCode).toBe(502);
    expect(response.headers["x-relay-error"]).toBe("upstream_not_html");
  });

  it("rejects an upstream body larger than the cap", async () => {
    fetchMock.mockResolvedValue(makeResponse({ contentLength: 5 * 1024 * 1024 }));

    const response = await invoke({ url: ALLOWED_URL });

    expect(response.statusCode).toBe(502);
    expect(response.headers["x-relay-error"]).toBe("upstream_response_too_large");
  });

  it("caps a streamed body that declares no content-length", async () => {
    fetchMock.mockResolvedValue(makeResponse({ body: "x".repeat(3 * 1024 * 1024) }));

    const response = await invoke({ url: ALLOWED_URL });

    expect(response.statusCode).toBe(502);
    expect(response.headers["x-relay-error"]).toBe("upstream_response_too_large");
  });

  it("passes an upstream non-2xx status through without the relay error marker", async () => {
    fetchMock.mockResolvedValue(makeResponse({ status: 503, body: "<html>down</html>" }));

    const response = await invoke({ url: ALLOWED_URL });

    expect(response.statusCode).toBe(503);
    expect(response.headers["x-relay-error"]).toBeUndefined();
    expect(response.headers["x-relay-upstream-status"]).toBe("503");
  });

  it("maps a timeout to 504", async () => {
    const abortError = Object.assign(new Error("aborted"), { name: "AbortError" });
    fetchMock.mockRejectedValue(abortError);

    const response = await invoke({ url: ALLOWED_URL });

    expect(response.statusCode).toBe(504);
    expect(response.headers["x-relay-error"]).toBe("upstream_timeout");
  });

  it("maps a transport failure to 502", async () => {
    fetchMock.mockRejectedValue(new Error("getaddrinfo ENOTFOUND"));

    const response = await invoke({ url: ALLOWED_URL });

    expect(response.statusCode).toBe(502);
    expect(response.headers["x-relay-error"]).toBe("upstream_fetch_failed");
  });

  it("never forwards client Cookie or Authorization headers upstream", async () => {
    await handler({
      httpMethod: "GET",
      queryStringParameters: { url: ALLOWED_URL },
      headers: {
        cookie: "session=secret",
        authorization: "Bearer secret",
        "proxy-authorization": "Basic c2VjcmV0",
        "x-api-key": "secret",
      },
    });

    const forwardedHeaders = fetchMock.mock.calls[0][1].headers;
    const forwardedNames = Object.keys(forwardedHeaders).map((name) => name.toLowerCase());
    expect(forwardedNames.sort()).toEqual(["accept", "user-agent"]);
    expect(JSON.stringify(forwardedHeaders)).not.toMatch(/secret|Bearer|Basic/i);
  });

  it("does not set cookies on the relay response", async () => {
    const response = await invoke({ url: ALLOWED_URL });

    const responseHeaderNames = Object.keys(response.headers).map((name) => name.toLowerCase());
    expect(responseHeaderNames).not.toContain("set-cookie");
  });

  it("uses no environment secrets", () => {
    const source = readFileSync(resolve(functionDir, "relay.js"), "utf8");

    expect(source).not.toMatch(/process\.env/);
  });

  it("rejects non-GET methods", async () => {
    const response = await invoke({ url: ALLOWED_URL }, "POST");

    expect(response.statusCode).toBe(405);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

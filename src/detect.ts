// ── Extension detection ──

/**
 * Minimum extension version supported by this SDK. Older builds (pre-1.0.2)
 * inject the inpage provider via a `<script src=chrome-extension://…>` tag,
 * which gets blocked on sites with strict `script-src 'self'` CSPs — the
 * connect flow silently hangs. 1.0.2+ uses manifest `world: "MAIN"` to inject
 * the provider directly into the page context, bypassing CSP.
 */
export const MIN_EXTENSION_VERSION = "1.0.2";

/** Extension download / update URLs */
export const EXTENSION_URL = "https://chromewebstore.google.com/detail/satuchain-wallet/iebnldgkdbggagccmehcoocmkghaalhl";
export const WEBSITE_URL = "https://wallet.satuchain.com";

/** Get the injected SatuChain provider object, or null if not installed. */
export function getSatuChainProvider(): any {
  if (typeof window === "undefined") return null;
  const w = window as any;
  // Prefer `window.satuchain` (purpose-specific handle) but also accept
  // the EIP-1193 provider when it announces SatuChain via `isSatuChain`.
  return w.satuchain || (w.ethereum && w.ethereum.isSatuChain ? w.ethereum : null);
}

/** Check if SatuChain extension is installed (any version). */
export function isSatuChainInstalled(): boolean {
  return getSatuChainProvider() != null;
}

/** Get installed extension version string, or null if unavailable. */
export function getExtensionVersion(): string | null {
  const p = getSatuChainProvider();
  return p?.version ?? null;
}

/** Compare two dotted version strings (e.g. "1.0.2" vs "1.0.1") → -1, 0, 1. */
function cmpVersion(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

/**
 * True if extension is installed but its version is below
 * `MIN_EXTENSION_VERSION`. DApps should prompt the user to update before
 * attempting `connect()` to avoid the CSP-block hang on old builds.
 */
export function isExtensionOutdated(minVersion: string = MIN_EXTENSION_VERSION): boolean {
  const v = getExtensionVersion();
  if (v == null) return false; // not installed or version not exposed
  return cmpVersion(v, minVersion) < 0;
}

/**
 * Wait for SatuChain extension to be injected. The extension dispatches
 * `ethereum#initialized` after its inpage provider mounts — we listen for it
 * and fall back to polling.
 */
export function waitForSatuChain(timeoutMs = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (isSatuChainInstalled()) return resolve(true);

    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearInterval(poll);
      clearTimeout(timer);
      window.removeEventListener("ethereum#initialized", onInit);
      resolve(ok);
    };

    const onInit = () => { if (isSatuChainInstalled()) finish(true); };
    window.addEventListener("ethereum#initialized", onInit, { once: true });

    const poll = setInterval(() => {
      if (isSatuChainInstalled()) finish(true);
    }, 100);

    const timer = setTimeout(() => finish(false), timeoutMs);
  });
}

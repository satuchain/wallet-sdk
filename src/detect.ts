// ── Extension detection ──

/**
 * Minimum extension version supported by this SDK. Older builds (pre-1.0.2)
 * inject the inpage provider via a `<script src=chrome-extension://…>` tag,
 * which gets blocked on sites with strict `script-src 'self'` CSPs — the
 * connect flow silently hangs. 1.0.2+ uses manifest `world: "MAIN"` to inject
 * the provider directly into the page context, bypassing CSP.
 */
export const MIN_EXTENSION_VERSION = "1.0.2";

/**
 * Recommended extension version — has the full feature set aligned with this
 * SDK release: EIP-6963 multi-wallet announce, chainChanged / accountsChanged /
 * disconnect event broadcast, EIP-2255 permissions, non-clobbering window.ethereum
 * injection, and dedicated Solana / TON sub-providers at window.solana / window.ton.
 *
 * DApps that want the best UX should nudge users below this version to update
 * (non-blocking). Users on `MIN_EXTENSION_VERSION` still work but miss the
 * auto-broadcast events and may have injection collisions with other wallets.
 */
export const RECOMMENDED_EXTENSION_VERSION = "1.0.3";

/** Extension download / update URLs */
export const EXTENSION_URL = "https://chromewebstore.google.com/detail/satuchain-wallet/iebnldgkdbggagccmehcoocmkghaalhl";
export const WEBSITE_URL = "https://wallet.satuchain.com";

/** EIP-6963 rdns — stable identifier we register on announceProvider. */
export const SATUCHAIN_RDNS = "com.satuchain.wallet";

/**
 * Cached EIP-6963 announcement. The extension fires `announceProvider` early
 * in the page lifecycle; we listen as soon as the SDK module loads so a later
 * `getSatuChainProvider()` call doesn't miss the event.
 */
let _eip6963Provider: any = null;
if (typeof window !== "undefined") {
  try {
    window.addEventListener("eip6963:announceProvider", (event: Event) => {
      const e = event as CustomEvent<{ info?: { rdns?: string }; provider?: any }>;
      if (e.detail?.info?.rdns === SATUCHAIN_RDNS && e.detail.provider) {
        _eip6963Provider = e.detail.provider;
      }
    });
    window.dispatchEvent(new Event("eip6963:requestProvider"));
  } catch { /* headless / non-DOM environments */ }
}

/**
 * Get the injected SatuChain provider. Detection order — most robust first:
 *   1. `window.satuchain`        → our dedicated namespace, impossible to spoof
 *   2. EIP-6963 announcement     → works even when another wallet owns window.ethereum
 *   3. `window.ethereum.providers[]` → multi-wallet array (EIP-5749-ish legacy)
 *   4. `window.ethereum.isSatuChain` → single-wallet environment
 *
 * Returns null when only non-SatuChain wallets (MetaMask, Rabby, Coinbase)
 * are present, so dApps can show a proper "SatuChain Wallet required" error.
 */
export function getSatuChainProvider(): any {
  if (typeof window === "undefined") return null;
  const w = window as any;

  // 1. Own namespace (set by inpage.js even when another wallet is on window.ethereum)
  if (w.satuchain && w.satuchain.isSatuChain) return w.satuchain;

  // 2. EIP-6963 cache (captured by the module-level listener above)
  if (_eip6963Provider) return _eip6963Provider;

  // 3. Multi-wallet providers array
  const eth = w.ethereum;
  if (eth && Array.isArray(eth.providers)) {
    const satu = eth.providers.find((p: any) => p && p.isSatuChain === true);
    if (satu) return satu;
  }

  // 4. Single-wallet fallback
  if (eth && eth.isSatuChain === true) return eth;

  return null;
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
 * True if extension is installed but below the recommended version. Unlike
 * `isExtensionOutdated`, this is a soft signal — connect will still work,
 * but some UX polish (chainChanged broadcast, EIP-6963 announce, non-clobber
 * injection) is missing. Use it to show a dismissible "Update for best
 * experience" banner.
 */
export function isExtensionBelowRecommended(): boolean {
  const v = getExtensionVersion();
  if (v == null) return false;
  return cmpVersion(v, RECOMMENDED_EXTENSION_VERSION) < 0;
}

/**
 * Wait for SatuChain extension to be injected. The extension dispatches
 * `ethereum#initialized` after its inpage provider mounts AND fires the
 * EIP-6963 `announceProvider` event — we listen for both and fall back to
 * polling for headless scenarios.
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
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
      resolve(ok);
    };

    const onInit = () => { if (isSatuChainInstalled()) finish(true); };
    const onAnnounce = (event: Event) => {
      const e = event as CustomEvent<{ info?: { rdns?: string } }>;
      if (e.detail?.info?.rdns === SATUCHAIN_RDNS) finish(true);
    };
    window.addEventListener("ethereum#initialized", onInit, { once: true });
    window.addEventListener("eip6963:announceProvider", onAnnounce);

    // Nudge the extension to re-announce — captured by our module-level
    // listener which sets `_eip6963Provider` for future calls.
    try { window.dispatchEvent(new Event("eip6963:requestProvider")); } catch {}

    const poll = setInterval(() => {
      if (isSatuChainInstalled()) finish(true);
    }, 100);

    const timer = setTimeout(() => finish(false), timeoutMs);
  });
}

/** Get Solana sub-provider if available (requires extension 1.0.3+). */
export function getSatuChainSolanaProvider(): any {
  if (typeof window === "undefined") return null;
  const w = window as any;
  // Prefer nested handle so we don't steal from Phantom if user has both
  const satu = getSatuChainProvider();
  if (satu?.solana) return satu.solana;
  if (w.solana?.isSatuChain) return w.solana;
  return null;
}

/** Get TON sub-provider if available (requires extension 1.0.3+). */
export function getSatuChainTonProvider(): any {
  if (typeof window === "undefined") return null;
  const w = window as any;
  const satu = getSatuChainProvider();
  if (satu?.ton) return satu.ton;
  if (w.ton?.isSatuChain) return w.ton;
  return null;
}

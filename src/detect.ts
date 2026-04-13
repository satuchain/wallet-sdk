// ── Extension detection ──

/** Check if SatuChain extension is installed */
export function isSatuChainInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as any).satuchain;
}

/** Wait for SatuChain extension to be injected (max 3s) */
export function waitForSatuChain(timeoutMs = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    if (isSatuChainInstalled()) return resolve(true);

    const start = Date.now();
    const check = setInterval(() => {
      if (isSatuChainInstalled()) {
        clearInterval(check);
        resolve(true);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(check);
        resolve(false);
      }
    }, 100);
  });
}

/** Get the injected SatuChain provider object */
export function getSatuChainProvider(): any {
  if (typeof window === "undefined") return null;
  return (window as any).satuchain || null;
}

/** Extension download URL */
export const EXTENSION_URL = "https://chromewebstore.google.com/detail/satuchain-wallet";
export const WEBSITE_URL = "https://wallet.satuchain.com";

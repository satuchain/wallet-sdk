// ── Base provider with event emitter ──

import { EventType, EventCallback } from "./types";

export class BaseProvider {
  protected _listeners: Map<EventType, Set<EventCallback>> = new Map();
  protected _connected = false;
  protected _address: string | null = null;

  get isConnected(): boolean {
    return this._connected;
  }

  get address(): string | null {
    return this._address;
  }

  on(event: EventType, callback: EventCallback): this {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event)!.add(callback);
    return this;
  }

  off(event: EventType, callback: EventCallback): this {
    this._listeners.get(event)?.delete(callback);
    return this;
  }

  removeAllListeners(event?: EventType): this {
    if (event) {
      this._listeners.delete(event);
    } else {
      this._listeners.clear();
    }
    return this;
  }

  protected emit(event: EventType, ...args: any[]) {
    this._listeners.get(event)?.forEach((cb) => {
      try { cb(...args); } catch {}
    });
  }

  /**
   * Send a request to the SatuChain extension via `window.postMessage`.
   *
   * The extension's `content.js` (ISOLATED world) relays requests to the
   * background service worker and posts the response back with
   * `target: "satuchain-inpage"`. We accept both `satuchain-inpage` (current
   * extension) and `satuchain-sdk` (legacy pre-1.0.2 builds) for forward
   * compatibility, and we validate `event.source === window` to reject
   * postMessages injected from iframes.
   *
   * Request IDs use `crypto.randomUUID()` so other same-origin scripts
   * can't spoof responses with guessable identifiers.
   */
  protected sendMessage(method: string, params?: any, timeoutMs = 125_000): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = _genId();

      const handler = (event: MessageEvent) => {
        if (event.source !== window) return;
        const data: any = event.data;
        if (!data) return;
        const target = data.target;
        if (target !== "satuchain-inpage" && target !== "satuchain-sdk") return;
        if (data.id !== id) return;

        window.removeEventListener("message", handler);
        clearTimeout(timer);

        // Support both payload shapes:
        //   {id, response: {result, error}}  ← extension content.js relays this
        //   {id, result, error}               ← legacy SDK shape
        const resp = data.response ?? data;
        if (resp?.error) {
          reject(new Error(typeof resp.error === "string" ? resp.error : "Request failed"));
        } else {
          resolve(resp?.result);
        }
      };

      window.addEventListener("message", handler);

      window.postMessage({
        target: "satuchain-content",
        id,
        method,
        params: params ?? [],
      }, window.location.origin);

      const timer = setTimeout(() => {
        window.removeEventListener("message", handler);
        reject(new Error("Request timed out"));
      }, timeoutMs);
    });
  }
}

/**
 * Generate an unguessable request ID. Other scripts running in the same page
 * (ads, third-party SDKs, etc.) can see postMessages, so a predictable counter
 * would let them spoof responses. UUIDs (128-bit random) prevent that.
 */
function _genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `satu-${crypto.randomUUID()}`;
  }
  const bytes = new Uint8Array(16);
  (typeof crypto !== "undefined" ? crypto : (window as any).crypto).getRandomValues(bytes);
  return `satu-${Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("")}`;
}

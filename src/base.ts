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

  /** Send message to extension via window.postMessage */
  protected sendMessage(method: string, params?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = `satu_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const handler = (event: MessageEvent) => {
        if (event.data?.target !== "satuchain-sdk" || event.data?.id !== id) return;
        window.removeEventListener("message", handler);
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data.result);
        }
      };

      window.addEventListener("message", handler);

      window.postMessage({
        target: "satuchain-content",
        id,
        method,
        params,
      }, window.location.origin);

      // Timeout after 60s
      setTimeout(() => {
        window.removeEventListener("message", handler);
        reject(new Error("Request timed out"));
      }, 60000);
    });
  }
}

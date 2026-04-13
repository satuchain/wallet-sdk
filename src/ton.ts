// ── TON Provider (TON Connect compatible) ──
//
// Usage:
//   import { SatuChainTON } from "@satuchainwallet/sdk/ton";
//   const provider = new SatuChainTON();
//   const { address } = await provider.connect();

import { BaseProvider } from "./base";
import { SatuChainSDKConfig, SatuChainError, ERROR_CODES } from "./types";
import { isSatuChainInstalled, waitForSatuChain } from "./detect";

export interface TonConnectResult {
  address: string;
  /** Raw address (0:hex) */
  rawAddress?: string;
}

export class SatuChainTON extends BaseProvider {
  readonly isSatuChain = true;
  private _tonAddress: string | null = null;
  private _rawAddress: string | null = null;
  private _config: SatuChainSDKConfig;

  constructor(config: SatuChainSDKConfig = {}) {
    super();
    this._config = config;
    if (typeof window !== "undefined") {
      this._listenForEvents();
    }
  }

  get tonAddress(): string | null {
    return this._tonAddress;
  }

  get rawAddress(): string | null {
    return this._rawAddress;
  }

  /** Connect wallet */
  async connect(): Promise<TonConnectResult> {
    if (!isSatuChainInstalled()) {
      const found = await waitForSatuChain();
      if (!found) throw new SatuChainError(ERROR_CODES.NOT_INSTALLED, "SatuChain Wallet extension not installed");
    }

    const result = await this.sendMessage("ton_requestAccounts");

    if (result?.address) {
      this._tonAddress = result.address;
      this._rawAddress = result.rawAddress || null;
      this._address = result.address;
      this._connected = true;
      this.emit("connect", { address: this._tonAddress });
      return { address: this._tonAddress!, rawAddress: this._rawAddress || undefined };
    }

    if (Array.isArray(result) && result.length > 0) {
      this._tonAddress = result[0];
      this._address = result[0];
      this._connected = true;
      this.emit("connect", { address: this._tonAddress });
      return { address: this._tonAddress! };
    }

    throw new SatuChainError(ERROR_CODES.USER_REJECTED, "User rejected connection");
  }

  /** Disconnect */
  async disconnect(): Promise<void> {
    this._connected = false;
    this._tonAddress = null;
    this._rawAddress = null;
    this._address = null;
    this.emit("disconnect");
  }

  /** Sign message (returns base64 signature) */
  async signMessage(message: string): Promise<{ signature: string }> {
    if (!this._tonAddress) throw new SatuChainError(ERROR_CODES.UNAUTHORIZED, "Not connected");

    const result = await this.sendMessage("ton_signMessage", {
      message,
      address: this._tonAddress,
    });

    return { signature: result.signature };
  }

  /** Send transaction */
  async sendTransaction(params: {
    to: string;
    value: string; // in nanoTON
    payload?: string; // base64 BOC
    stateInit?: string;
  }): Promise<{ hash: string }> {
    if (!this._tonAddress) throw new SatuChainError(ERROR_CODES.UNAUTHORIZED, "Not connected");

    const result = await this.sendMessage("ton_sendTransaction", {
      from: this._tonAddress,
      ...params,
    });

    return { hash: result.hash || result };
  }

  /** Sign proof for TON Connect (domain binding) */
  async signProof(params: {
    domain: string;
    timestamp: number;
    payload: string;
  }): Promise<{ signature: string; timestamp: number }> {
    if (!this._tonAddress) throw new SatuChainError(ERROR_CODES.UNAUTHORIZED, "Not connected");

    const result = await this.sendMessage("ton_signProof", {
      address: this._tonAddress,
      ...params,
    });

    return { signature: result.signature, timestamp: result.timestamp };
  }

  /** Inject as window.ton (optional) */
  injectAsTon() {
    if (typeof window === "undefined") return;
    (window as any).ton = this;
    (window as any).satuchain_ton = this;
  }

  private _listenForEvents() {
    window.addEventListener("message", (event) => {
      if (event.data?.target !== "satuchain-sdk-event") return;
      const { eventType, data } = event.data;
      if (eventType === "ton_accountChanged") {
        this._tonAddress = data || null;
        this._address = data || null;
        this.emit("accountsChanged", data ? [data] : []);
      } else if (eventType === "disconnect") {
        this._connected = false;
        this._tonAddress = null;
        this.emit("disconnect");
      }
    });
  }
}

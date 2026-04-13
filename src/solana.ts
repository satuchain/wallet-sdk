// ── Solana Provider (Wallet Standard compatible) ──
//
// Usage:
//   import { SatuChainSolana } from "@satuchainwallet/sdk/solana";
//   const provider = new SatuChainSolana();
//   const { publicKey } = await provider.connect();

import { BaseProvider } from "./base";
import { SatuChainSDKConfig, SatuChainError, ERROR_CODES } from "./types";
import { isSatuChainInstalled, waitForSatuChain } from "./detect";

export interface SolanaConnectResult {
  publicKey: string;
}

export interface SolanaSignResult {
  signature: string;
}

export class SatuChainSolana extends BaseProvider {
  readonly isSatuChain = true;
  readonly isPhantom = false;
  private _publicKey: string | null = null;
  private _config: SatuChainSDKConfig;

  constructor(config: SatuChainSDKConfig = {}) {
    super();
    this._config = config;
    if (typeof window !== "undefined") {
      this._listenForEvents();
    }
  }

  get publicKey(): string | null {
    return this._publicKey;
  }

  /** Connect wallet */
  async connect(): Promise<SolanaConnectResult> {
    if (!isSatuChainInstalled()) {
      const found = await waitForSatuChain();
      if (!found) throw new SatuChainError(ERROR_CODES.NOT_INSTALLED, "SatuChain Wallet extension not installed");
    }

    const result = await this.sendMessage("sol_requestAccounts");

    if (Array.isArray(result) && result.length > 0) {
      this._publicKey = result[0];
      this._address = result[0];
      this._connected = true;
      this.emit("connect", { publicKey: this._publicKey });
      return { publicKey: this._publicKey! };
    }

    throw new SatuChainError(ERROR_CODES.USER_REJECTED, "User rejected connection");
  }

  /** Disconnect */
  async disconnect(): Promise<void> {
    this._connected = false;
    this._publicKey = null;
    this._address = null;
    this.emit("disconnect");
  }

  /** Sign message */
  async signMessage(message: Uint8Array | string): Promise<SolanaSignResult> {
    if (!this._publicKey) throw new SatuChainError(ERROR_CODES.UNAUTHORIZED, "Not connected");

    const msgStr = typeof message === "string"
      ? message
      : Array.from(message).map(b => String.fromCharCode(b)).join("");

    const result = await this.sendMessage("sol_signMessage", {
      message: msgStr,
      pubkey: this._publicKey,
    });

    return { signature: result.signature };
  }

  /** Sign and send transaction (base64 encoded) */
  async signAndSendTransaction(transaction: string | Uint8Array): Promise<{ signature: string }> {
    if (!this._publicKey) throw new SatuChainError(ERROR_CODES.UNAUTHORIZED, "Not connected");

    const txStr = typeof transaction === "string"
      ? transaction
      : btoa(String.fromCharCode(...transaction));

    const result = await this.sendMessage("sol_signAndSendTransaction", {
      transaction: txStr,
      pubkey: this._publicKey,
    });

    return { signature: result.signature };
  }

  /** Sign transaction without sending */
  async signTransaction(transaction: string | Uint8Array): Promise<{ signedTransaction: string }> {
    if (!this._publicKey) throw new SatuChainError(ERROR_CODES.UNAUTHORIZED, "Not connected");

    const txStr = typeof transaction === "string"
      ? transaction
      : btoa(String.fromCharCode(...transaction));

    const result = await this.sendMessage("sol_signTransaction", {
      transaction: txStr,
      pubkey: this._publicKey,
    });

    return { signedTransaction: result.signedTransaction };
  }

  /** Inject as window.solana (optional) */
  injectAsSolana() {
    if (typeof window === "undefined") return;
    (window as any).solana = this;
    (window as any).satuchain_solana = this;
  }

  private _listenForEvents() {
    window.addEventListener("message", (event) => {
      if (event.data?.target !== "satuchain-sdk-event") return;
      const { eventType, data } = event.data;
      if (eventType === "sol_accountChanged") {
        this._publicKey = data || null;
        this._address = data || null;
        this.emit("accountsChanged", data ? [data] : []);
      } else if (eventType === "disconnect") {
        this._connected = false;
        this._publicKey = null;
        this.emit("disconnect");
      }
    });
  }
}

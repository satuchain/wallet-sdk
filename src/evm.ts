// ── EVM Provider (EIP-1193 compatible) ──
//
// Usage:
//   import { SatuChainEVM } from "@satuchainwallet/sdk/evm";
//   const provider = new SatuChainEVM();
//   const accounts = await provider.request({ method: "eth_requestAccounts" });

import { BaseProvider } from "./base";
import { SatuChainSDKConfig, SatuChainError, ERROR_CODES } from "./types";
import { isSatuChainInstalled, waitForSatuChain } from "./detect";

export interface EIP1193RequestArgs {
  method: string;
  params?: any[] | Record<string, any>;
}

export class SatuChainEVM extends BaseProvider {
  readonly isSatuChain = true;
  readonly isMetaMask = false;
  private _chainId: string | null = null;
  private _config: SatuChainSDKConfig;

  constructor(config: SatuChainSDKConfig = {}) {
    super();
    this._config = config;
    if (typeof window !== "undefined") {
      this._listenForEvents();
    }
  }

  get chainId(): string | null {
    return this._chainId;
  }

  /** EIP-1193 request method */
  async request(args: EIP1193RequestArgs): Promise<any> {
    const { method, params } = args;

    // Check extension installed
    if (!isSatuChainInstalled()) {
      const found = await waitForSatuChain();
      if (!found) {
        throw new SatuChainError(ERROR_CODES.NOT_INSTALLED, "SatuChain Wallet extension not installed");
      }
    }

    const result = await this.sendMessage(method, params);

    // Handle connect
    if (method === "eth_requestAccounts" && Array.isArray(result) && result.length > 0) {
      this._address = result[0];
      this._connected = true;
      this.emit("connect", { chainId: this._chainId });
      this.emit("accountsChanged", result);
    }

    // Handle chain ID
    if (method === "eth_chainId" && result) {
      this._chainId = result;
    }

    return result;
  }

  /** Connect wallet — shorthand for eth_requestAccounts */
  async connect(): Promise<string[]> {
    return this.request({ method: "eth_requestAccounts" });
  }

  /** Get connected accounts */
  async getAccounts(): Promise<string[]> {
    return this.request({ method: "eth_accounts" });
  }

  /** Get current chain ID */
  async getChainId(): Promise<string> {
    return this.request({ method: "eth_chainId" });
  }

  /** Get balance */
  async getBalance(address?: string): Promise<string> {
    const addr = address || this._address;
    if (!addr) throw new SatuChainError(ERROR_CODES.UNAUTHORIZED, "Not connected");
    return this.request({ method: "eth_getBalance", params: [addr, "latest"] });
  }

  /** Send transaction */
  async sendTransaction(tx: {
    to: string;
    value?: string;
    data?: string;
    gas?: string;
    gasPrice?: string;
  }): Promise<string> {
    if (!this._address) throw new SatuChainError(ERROR_CODES.UNAUTHORIZED, "Not connected");
    return this.request({
      method: "eth_sendTransaction",
      params: [{ from: this._address, ...tx }],
    });
  }

  /** Personal sign */
  async signMessage(message: string): Promise<string> {
    if (!this._address) throw new SatuChainError(ERROR_CODES.UNAUTHORIZED, "Not connected");
    return this.request({
      method: "personal_sign",
      params: [message, this._address],
    });
  }

  /** Sign typed data (EIP-712) */
  async signTypedData(typedData: any): Promise<string> {
    if (!this._address) throw new SatuChainError(ERROR_CODES.UNAUTHORIZED, "Not connected");
    return this.request({
      method: "eth_signTypedData_v4",
      params: [this._address, typeof typedData === "string" ? typedData : JSON.stringify(typedData)],
    });
  }

  /** Switch chain */
  async switchChain(chainId: string | number): Promise<void> {
    const hex = typeof chainId === "number" ? "0x" + chainId.toString(16) : chainId;
    await this.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hex }],
    });
    this._chainId = hex;
    this.emit("chainChanged", hex);
  }

  /** Disconnect */
  disconnect() {
    this._connected = false;
    this._address = null;
    this._chainId = null;
    this.emit("disconnect");
  }

  /** Inject as window.ethereum (optional) */
  injectAsEthereum() {
    if (typeof window === "undefined") return;
    (window as any).ethereum = this;
    // Announce via EIP-6963
    this._announceProvider();
  }

  private _announceProvider() {
    if (typeof window === "undefined") return;
    const info = {
      uuid: "satuchain-wallet-evm",
      name: this._config.appName || "SatuChain Wallet",
      icon: this._config.appIcon || "https://wallet.satuchain.com/icon.png",
      rdns: "com.satuchain.wallet",
    };
    window.dispatchEvent(new CustomEvent("eip6963:announceProvider", {
      detail: Object.freeze({ info, provider: this }),
    }));
  }

  private _listenForEvents() {
    window.addEventListener("message", (event) => {
      if (event.data?.target !== "satuchain-sdk-event") return;
      const { eventType, data } = event.data;
      if (eventType === "accountsChanged") {
        this._address = data?.[0] || null;
        this.emit("accountsChanged", data);
      } else if (eventType === "chainChanged") {
        this._chainId = data;
        this.emit("chainChanged", data);
      } else if (eventType === "disconnect") {
        this._connected = false;
        this._address = null;
        this.emit("disconnect");
      }
    });
  }
}

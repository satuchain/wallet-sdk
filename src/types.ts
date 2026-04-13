// ── Shared types ──

export interface SatuChainSDKConfig {
  /** App name shown in wallet approval dialog */
  appName?: string;
  /** App icon URL */
  appIcon?: string;
  /** Auto-connect if previously approved */
  autoConnect?: boolean;
  /** Custom extension ID (default: auto-detect) */
  extensionId?: string;
}

export interface ConnectResult {
  /** Connected wallet address */
  address: string;
  /** Chain type */
  chain: "evm" | "solana" | "ton";
  /** Chain ID (EVM only) */
  chainId?: number;
}

export interface SendTransactionParams {
  to: string;
  value?: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
}

export interface SignMessageParams {
  message: string;
  /** Encoding: "utf8" (default) or "hex" */
  encoding?: "utf8" | "hex";
}

export type EventType =
  | "connect"
  | "disconnect"
  | "accountsChanged"
  | "chainChanged";

export type EventCallback = (...args: any[]) => void;

export class SatuChainError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = "SatuChainError";
  }
}

// Standard EIP-1193 error codes
export const ERROR_CODES = {
  USER_REJECTED: 4001,
  UNAUTHORIZED: 4100,
  UNSUPPORTED_METHOD: 4200,
  DISCONNECTED: 4900,
  CHAIN_DISCONNECTED: 4901,
  NOT_INSTALLED: -1,
} as const;

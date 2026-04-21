// ── @satuchain/wallet-sdk ──
// Multi-chain wallet SDK for EVM, Solana & TON DApps
//
// Usage:
//   import { SatuChainEVM, SatuChainSolana, SatuChainTON } from "@satuchain/wallet-sdk";
//
// Or import per chain:
//   import { SatuChainEVM } from "@satuchain/wallet-sdk/evm";
//   import { SatuChainSolana } from "@satuchain/wallet-sdk/solana";
//   import { SatuChainTON } from "@satuchain/wallet-sdk/ton";

// ── Providers ──
export { SatuChainEVM } from "./evm";
export { SatuChainSolana } from "./solana";
export { SatuChainTON } from "./ton";

// ── Detection ──
export {
  isSatuChainInstalled,
  waitForSatuChain,
  getSatuChainProvider,
  getExtensionVersion,
  isExtensionOutdated,
  MIN_EXTENSION_VERSION,
  EXTENSION_URL,
  WEBSITE_URL,
} from "./detect";

// ── Types ──
export type { SatuChainSDKConfig, ConnectResult, SendTransactionParams, SignMessageParams, EventType, EventCallback } from "./types";
export { SatuChainError, ERROR_CODES } from "./types";
export type { EIP1193RequestArgs } from "./evm";
export type { SolanaConnectResult, SolanaSignResult } from "./solana";
export type { TonConnectResult } from "./ton";

// ── Version ──
export const VERSION = "1.0.2";

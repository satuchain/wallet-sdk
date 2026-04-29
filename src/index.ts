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
  getSatuChainSolanaProvider,
  getSatuChainTonProvider,
  getExtensionVersion,
  isExtensionOutdated,
  isExtensionBelowRecommended,
  MIN_EXTENSION_VERSION,
  RECOMMENDED_EXTENSION_VERSION,
  SATUCHAIN_RDNS,
  EXTENSION_URL,
  WEBSITE_URL,
} from "./detect";

// ── Types ──
export type { SatuChainSDKConfig, ConnectResult, SendTransactionParams, SignMessageParams, EventType, EventCallback } from "./types";
export { SatuChainError, ERROR_CODES } from "./types";
export type { EIP1193RequestArgs } from "./evm";
export type { SolanaConnectResult, SolanaSignResult } from "./solana";
export type { TonConnectResult } from "./ton";

// ── Chain registry — canonical source of truth for chainId / hex / RPC ──
// Import these instead of hand-writing chain configs. dApps that hardcode
// hex chainIds risk arithmetic typos that silently break switchChain
// (we hit this twice in 2026-04 — see SDK 1.0.5 changelog).
export type { SatuChain } from "./chains";
export {
  SATU_CHAINS,
  bscMainnet,
  ethMainnet,
  satuMainnet,
  satuTestnet,
  getChainById,
  getChainByHex,
} from "./chains";

// ── Version ──
export const VERSION = "1.0.5";

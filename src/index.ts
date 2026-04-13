// ── @satuchainwallet/sdk ──
// Multi-chain wallet SDK for EVM, Solana & TON DApps
//
// Usage:
//   import { SatuChainEVM, SatuChainSolana, SatuChainTON } from "@satuchainwallet/sdk";
//
// Or import per chain:
//   import { SatuChainEVM } from "@satuchainwallet/sdk/evm";
//   import { SatuChainSolana } from "@satuchainwallet/sdk/solana";
//   import { SatuChainTON } from "@satuchainwallet/sdk/ton";

// ── Providers ──
export { SatuChainEVM } from "./evm";
export { SatuChainSolana } from "./solana";
export { SatuChainTON } from "./ton";

// ── Detection ──
export { isSatuChainInstalled, waitForSatuChain, getSatuChainProvider, EXTENSION_URL, WEBSITE_URL } from "./detect";

// ── Types ──
export type { SatuChainSDKConfig, ConnectResult, SendTransactionParams, SignMessageParams, EventType, EventCallback } from "./types";
export { SatuChainError, ERROR_CODES } from "./types";
export type { EIP1193RequestArgs } from "./evm";
export type { SolanaConnectResult, SolanaSignResult } from "./solana";
export type { TonConnectResult } from "./ton";

// ── Version ──
export const VERSION = "1.0.0";

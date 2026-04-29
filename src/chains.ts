// Canonical SatuChain ecosystem chain registry. Single source of truth for
// chainId, RPC, explorer, native currency. dApps that import from here
// avoid the class of typo bugs we hit pre-1.0.5 (one team had 0x9a4309
// hardcoded for SatuChain Mainnet, another had 0x9a4e49, neither was
// `(10111945).toString(16) === "0x9a4bc9"` — so wallet_switchEthereumChain
// silently rejected because the maps didn't agree).
//
// Decimal chainId is the only authoritative form — `chainIdHex` is derived,
// so consumers should never hand-write hex.

export interface SatuChain {
  /** Decimal EIP-155 chainId — the authoritative form. */
  id: number;
  /** Display name, matches wallet/extension UI. */
  name: string;
  /** Network namespace classification. */
  network: "satuchain" | "bsc" | "ethereum";
  /** Hex form of `id`, derived — provided as a convenience for switchChain. */
  chainIdHex: `0x${string}`;
  nativeCurrency: { name: string; symbol: string; decimals: 18 };
  rpcUrls: { default: { http: readonly string[] } };
  blockExplorers: { default: { name: string; url: string } };
  testnet: boolean;
}

function defineChain(c: Omit<SatuChain, "chainIdHex">): SatuChain {
  return { ...c, chainIdHex: `0x${c.id.toString(16)}` as `0x${string}` };
}

export const bscMainnet = defineChain({
  id: 56,
  name: "BNB Chain",
  network: "bsc",
  nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
  rpcUrls: { default: { http: ["https://bsc-dataseed.bnbchain.org"] as const } },
  blockExplorers: { default: { name: "BscScan", url: "https://bscscan.com" } },
  testnet: false,
});

export const ethMainnet = defineChain({
  id: 1,
  name: "Ethereum",
  network: "ethereum",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://ethereum.publicnode.com"] as const } },
  blockExplorers: { default: { name: "Etherscan", url: "https://etherscan.io" } },
  testnet: false,
});

export const satuMainnet = defineChain({
  id: 10111945,
  name: "Satuchain Mainnet",
  network: "satuchain",
  nativeCurrency: { name: "Satu", symbol: "STU", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc-mainnet.satuchain.com"] as const } },
  blockExplorers: { default: { name: "StuScan", url: "https://stuscan.com" } },
  testnet: false,
});

export const satuTestnet = defineChain({
  id: 17081945,
  name: "Satuchain Testnet",
  network: "satuchain",
  nativeCurrency: { name: "Satu Testnet", symbol: "tSTU", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc-testnet.satuchain.com"] as const } },
  blockExplorers: { default: { name: "StuScan Testnet", url: "https://testnet.satuchain.com" } },
  testnet: true,
});

/// Full registry of EVM chains the SatuChain Wallet supports. Keep in sync
/// with extension's `src/core/networks.ts` and `CHAIN_ID_HEX` map.
export const SATU_CHAINS: readonly SatuChain[] = [
  bscMainnet,
  ethMainnet,
  satuMainnet,
  satuTestnet,
] as const;

/// Lookup by decimal chainId. Returns undefined for unsupported chains.
export function getChainById(id: number): SatuChain | undefined {
  return SATU_CHAINS.find((c) => c.id === id);
}

/// Lookup by hex chainId (`0x...`). Case-insensitive. Returns undefined for
/// unsupported chains. Use this when you've received a hex chainId from a
/// provider event (e.g. `chainChanged`) and need to resolve it back to a
/// `SatuChain`.
export function getChainByHex(hex: string): SatuChain | undefined {
  const norm = hex.toLowerCase();
  return SATU_CHAINS.find((c) => c.chainIdHex === norm);
}

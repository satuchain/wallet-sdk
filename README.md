<p align="center">
  <img src="https://raw.githubusercontent.com/satuchain/wallet-sdk/main/logo.png" width="80" alt="SatuChain Wallet" />
</p>

<h1 align="center">@satuchain/wallet-sdk</h1>

<p align="center">
  Multi-chain wallet SDK for <strong>EVM</strong>, <strong>Solana</strong> &amp; <strong>TON</strong> DApps.<br/>
  Connect your DApp to SatuChain Wallet with just a few lines of code.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@satuchain/wallet-sdk"><img src="https://img.shields.io/npm/v/@satuchain/wallet-sdk?color=0B3DFF&label=npm" alt="npm" /></a>
  <a href="https://github.com/satuchain/wallet-sdk/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="license" /></a>
  <img src="https://img.shields.io/badge/chains-EVM%20%7C%20Solana%20%7C%20TON-blueviolet" alt="chains" />
</p>

---

## Prerequisites

> **Users need SatuChain Wallet installed to use this SDK.**
>
> - **Mobile App (Android/iOS):** [https://wallet.satuchain.com](https://wallet.satuchain.com)
> - **Browser Extension (Chrome):** Paired via mobile app
>
> The mobile app manages private keys securely. The browser extension connects via encrypted QR pairing. DApp developers integrate this SDK — end users install the wallet.

---

## Install

```bash
npm install @satuchain/wallet-sdk
```

```bash
# or
yarn add @satuchain/wallet-sdk
pnpm add @satuchain/wallet-sdk
```

## Quick Start

### EVM (Ethereum, BNB Chain, Satuchain)

```typescript
import { SatuChainEVM } from "@satuchain/wallet-sdk/evm";

const provider = new SatuChainEVM({ appName: "My DEX" });

// Connect — opens wallet approval popup
const accounts = await provider.connect();
console.log("Connected:", accounts[0]);

// Send transaction — opens tx approval popup
const txHash = await provider.sendTransaction({
  to: "0x...",
  value: "0x38D7EA4C68000", // 0.001 ETH in wei (hex)
});

// Sign message — opens sign approval popup
const signature = await provider.signMessage("Hello SatuChain!");

// Sign typed data (EIP-712)
const sig = await provider.signTypedData(typedData);

// Listen for events
provider.on("accountsChanged", (accounts) => console.log(accounts));
provider.on("chainChanged", (chainId) => console.log(chainId));
```

### Solana

```typescript
import { SatuChainSolana } from "@satuchain/wallet-sdk/solana";

const provider = new SatuChainSolana({ appName: "My DEX" });

// Connect
const { publicKey } = await provider.connect();
console.log("Connected:", publicKey);

// Sign message
const { signature } = await provider.signMessage("Hello SatuChain!");

// Sign and send transaction
const { signature: txSig } = await provider.signAndSendTransaction(base64Tx);
```

### TON

```typescript
import { SatuChainTON } from "@satuchain/wallet-sdk/ton";

const provider = new SatuChainTON({ appName: "My DEX" });

// Connect
const { address } = await provider.connect();
console.log("Connected:", address);

// Send transaction
const { hash } = await provider.sendTransaction({
  to: "EQ...",
  value: "1000000000", // 1 TON in nanoTON
});

// Sign proof (TON Connect)
const proof = await provider.signProof({ domain: "myapp.com", timestamp: Date.now(), payload: "..." });
```

### All chains at once

```typescript
import { SatuChainEVM, SatuChainSolana, SatuChainTON } from "@satuchain/wallet-sdk";

const evm = new SatuChainEVM();
const sol = new SatuChainSolana();
const ton = new SatuChainTON();
```

## Detection

```typescript
import { isSatuChainInstalled, waitForSatuChain, EXTENSION_URL } from "@satuchain/wallet-sdk";

if (!isSatuChainInstalled()) {
  // Show install prompt — redirect to wallet download
  window.open("https://wallet.satuchain.com");
} else {
  // Connect
}

// Or wait for injection (max 3s)
const installed = await waitForSatuChain();
```

## EVM — EIP-1193 Compatible

The EVM provider implements the [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193) standard, so it works with:

- **ethers.js**: `new ethers.BrowserProvider(provider)`
- **viem**: `createWalletClient({ transport: custom(provider) })`
- **web3.js**: `new Web3(provider)`

```typescript
import { ethers } from "ethers";
import { SatuChainEVM } from "@satuchain/wallet-sdk/evm";

const satuProvider = new SatuChainEVM();
await satuProvider.connect();

const provider = new ethers.BrowserProvider(satuProvider);
const signer = await provider.getSigner();
const balance = await provider.getBalance(signer.address);
```

## Transaction Approval

All sensitive operations require user approval via the extension popup:

| Action | Popup Type | Color |
|--------|-----------|-------|
| `eth_requestAccounts` | Connection Request | Blue |
| `sol_requestAccounts` | Connection Request (Solana) | Purple |
| `ton_requestAccounts` | Connection Request (TON) | Cyan |
| `eth_sendTransaction` | Transaction Approval | Orange |
| `personal_sign` | Signature Request | Blue |
| `eth_signTypedData_v4` | Signature Request | Blue |

Contract interactions are auto-detected:

| Method | Detected As |
|--------|------------|
| `0xa9059cbb` | Transfer |
| `0x095ea7b3` | Approve |
| `0x38ed1739` | Swap Exact Tokens |
| `0x7ff36ab5` | Swap Exact ETH |
| `0xe8e33700` | Add Liquidity |
| `0xa694fc3a` | Stake |
| `0x1249c58b` | Mint |

## Supported Chains

| Chain | Chain ID | Provider |
|-------|----------|----------|
| BNB Chain | 56 | `SatuChainEVM` |
| Ethereum | 1 | `SatuChainEVM` |
| Satuchain Mainnet | 10111945 | `SatuChainEVM` |
| Satuchain Testnet | 17081945 | `SatuChainEVM` |
| Solana | - | `SatuChainSolana` |
| TON | - | `SatuChainTON` |

## API Reference

### SatuChainEVM

| Method | Returns | Description |
|--------|---------|-------------|
| `connect()` | `string[]` | Request wallet connection |
| `getAccounts()` | `string[]` | Get connected accounts |
| `getChainId()` | `string` | Get current chain ID (hex) |
| `getBalance(addr?)` | `string` | Get balance (hex wei) |
| `sendTransaction(tx)` | `string` | Send transaction, returns tx hash |
| `signMessage(msg)` | `string` | Personal sign |
| `signTypedData(data)` | `string` | EIP-712 typed data sign |
| `switchChain(chainId)` | `void` | Switch network |
| `request(args)` | `any` | Raw EIP-1193 request |
| `disconnect()` | `void` | Disconnect |
| `on(event, cb)` | `this` | Subscribe to events |

### SatuChainSolana

| Method | Returns | Description |
|--------|---------|-------------|
| `connect()` | `{ publicKey }` | Connect wallet |
| `signMessage(msg)` | `{ signature }` | Sign message |
| `signAndSendTransaction(tx)` | `{ signature }` | Sign and send |
| `signTransaction(tx)` | `{ signedTransaction }` | Sign without sending |
| `disconnect()` | `void` | Disconnect |

### SatuChainTON

| Method | Returns | Description |
|--------|---------|-------------|
| `connect()` | `{ address }` | Connect wallet |
| `signMessage(msg)` | `{ signature }` | Sign message |
| `sendTransaction(params)` | `{ hash }` | Send transaction |
| `signProof(params)` | `{ signature, timestamp }` | TON Connect proof |
| `disconnect()` | `void` | Disconnect |

## Links

- **Wallet Download:** [https://wallet.satuchain.com](https://wallet.satuchain.com)
- **npm:** [https://www.npmjs.com/package/@satuchain/wallet-sdk](https://www.npmjs.com/package/@satuchain/wallet-sdk)
- **GitHub:** [https://github.com/satuchain/wallet-sdk](https://github.com/satuchain/wallet-sdk)

## License

MIT — [SatuChain](https://satuchain.com)

<p align="center">
  <img src="logo.png" width="80" alt="SatuChain Wallet" />
</p>

<h1 align="center">@satuchain/wallet-sdk</h1>

<p align="center">
  Multi-chain wallet SDK for <strong>EVM</strong>, <strong>Solana</strong> &amp; <strong>TON</strong> DApps.<br/>
  Connect your DApp to SatuChain Wallet with just a few lines of code.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@satuchain/wallet-sdk"><img src="https://img.shields.io/npm/v/@satuchain/wallet-sdk?color=0B3DFF&label=npm" alt="npm" /></a>
  <a href="https://github.com/satuchainwallet/wallet-sdk/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="license" /></a>
  <img src="https://img.shields.io/badge/chains-EVM%20%7C%20Solana%20%7C%20TON-blueviolet" alt="chains" />
</p>

## Install

```bash
npm install @satuchain/wallet-sdk
```

## Quick Start

### EVM (Ethereum, BNB Chain, Satuchain)

```typescript
import { SatuChainEVM } from "@satuchain/wallet-sdk/evm";

const provider = new SatuChainEVM({ appName: "My DEX" });

// Connect
const accounts = await provider.connect();
console.log("Connected:", accounts[0]);

// Send transaction
const txHash = await provider.sendTransaction({
  to: "0x...",
  value: "0x38D7EA4C68000", // 0.001 ETH in wei (hex)
});

// Sign message
const signature = await provider.signMessage("Hello SatuChain!");

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
  // Show install prompt
  window.open(EXTENSION_URL);
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

## License

MIT

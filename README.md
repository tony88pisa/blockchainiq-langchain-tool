# blockchainiq-langchain-tool

A [LangChain](https://js.langchain.com) tool that lets any agent buy [Blockchain IQ](https://www.blockchainiq.co) crypto data **per call** over the [x402](https://x402.org) payment standard — USDC on Base, no account, no API key.

## What it does

`blockchain_iq` is a `tool()` you can hand to any LangChain/LangGraph agent. It wraps `@x402/fetch` so the 402 → pay → retry flow is invisible to the agent:

| `resource`    | Price  | Returns |
| ------------- | ------ | ------- |
| `brief`       | $0.01  | Prices and recent moves for BTC, ETH, SOL, XRP, scheduled events in the next 48h, short risk flags |
| `event-risk`  | $0.05  | Dated US macro releases and crypto/regulatory milestones, 7 days ahead, each with its official source |

Every call returns `{ data, paid: { transaction, network } }` — the settlement transaction hash is the proof of payment, decoded from the `PAYMENT-RESPONSE` header.

## Install

```bash
npm install
```

## Configure

```bash
cp .env.example .env
# put a 0x-prefixed private key with a few cents of USDC on Base in WALLET_PRIVATE_KEY
```

## Run the demo (one paid call, $0.01)

```bash
npm run demo
```

Prints the brief JSON and the on-chain settlement transaction hash.

## Use inside an agent

```js
import { blockchainIqTool } from './index.mjs';

const tools = [blockchainIqTool(process.env.WALLET_PRIVATE_KEY)];
// pass `tools` to your LangChain agent / LangGraph node as usual;
// the model calls blockchain_iq({ resource: 'brief' | 'event-risk' })
```

## Notes

- Costs are real but tiny: `brief` is one cent, `event-risk` five. Errors and 404s are never charged.
- The paying wallet only needs USDC on Base; the x402 facilitator pays gas.
- Built for the Blockchain IQ agent-framework integration bounty (announced 2026-10-23, claims close 2026-12-31).

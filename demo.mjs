import 'dotenv/config';
import { blockchainIqTool } from './index.mjs';

// Minimal runnable proof: one paid call to `brief` ($0.01) through the tool.
// Requires WALLET_PRIVATE_KEY (0x-prefixed) with a few cents of USDC on Base.
const key = process.env.WALLET_PRIVATE_KEY;
if (!key) {
  console.error('Set WALLET_PRIVATE_KEY (0x...) with USDC on Base — see .env.example');
  process.exit(1);
}

const t = blockchainIqTool(key);
const out = await t.invoke({ resource: 'brief' });
const parsed = JSON.parse(out);

console.log('--- Blockchain IQ brief ---');
console.log(JSON.stringify(parsed.data, null, 2).slice(0, 2000));
console.log('--- settlement ---');
console.log('tx:', parsed.paid?.transaction ?? '(none)', '| network:', parsed.paid?.network ?? '(none)');

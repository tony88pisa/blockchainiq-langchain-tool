import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { x402Client, wrapFetchWithPayment, decodePaymentResponseHeader } from '@x402/fetch';
import { registerExactEvmScheme } from '@x402/evm/exact/client';
import { privateKeyToAccount } from 'viem/accounts';

/**
 * LangChain tool for the Blockchain IQ x402 API.
 *
 * Blockchain IQ sells crypto data to agents per call: an unpaid request gets
 * HTTP 402, the client pays in USDC on Base via the x402 standard, and the
 * retry returns JSON. No account, no API key.
 *
 * Resources (see https://www.blockchainiq.co/api/x402/v1):
 *   - brief       ($0.01) prices/moves for BTC, ETH, SOL, XRP + 48h events
 *   - event-risk  ($0.05) dated US macro + crypto events, 7 days ahead
 */

const BASE_URL = 'https://www.blockchainiq.co/api/x402/v1';

/**
 * Build a fetch function that pays x402 invoices from the given key.
 * @param {string} privateKey 0x-prefixed EVM private key with USDC on Base.
 */
export function createPaidFetch(privateKey) {
  const account = privateKeyToAccount(privateKey);
  const client = new x402Client();
  registerExactEvmScheme(client, { signer: account });
  return wrapFetchWithPayment(fetch, client);
}

/**
 * Create the LangChain tool bound to a paying wallet.
 * @param {string} privateKey 0x-prefixed EVM private key with USDC on Base.
 */
export function blockchainIqTool(privateKey) {
  const fetchPaid = createPaidFetch(privateKey);

  return tool(
    async ({ resource }) => {
      const res = await fetchPaid(`${BASE_URL}/${resource}`);
      const paymentHeader = res.headers.get('payment-response');
      const payment = paymentHeader ? decodePaymentResponseHeader(paymentHeader) : null;
      const body = await res.json();
      return JSON.stringify({
        data: body,
        paid: payment ? { transaction: payment.transaction, network: payment.network } : null,
      });
    },
    {
      name: 'blockchain_iq',
      description:
        'Buy crypto market data from Blockchain IQ, paid per call in USDC on Base via x402. ' +
        'Use "brief" ($0.01) for BTC/ETH/SOL/XRP prices, 48h events and risk flags; ' +
        'use "event-risk" ($0.05) for dated US macro and crypto events over 7 days.',
      schema: z.object({
        resource: z.enum(['brief', 'event-risk']).describe('Blockchain IQ resource to buy'),
      }),
    }
  );
}

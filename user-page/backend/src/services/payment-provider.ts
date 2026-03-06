import { createHash } from 'crypto';
import { config } from '../config.js';

// ============================================================
// Unified Crypto Payment Provider (Heleket + Cryptomus)
// Both APIs share identical authentication and similar endpoints
// ============================================================

// Common types
export interface CreateInvoiceParams {
  amount: string;
  currency: string;        // e.g. "USDT", "USD"
  orderId: string;         // unique order id in our system
  network?: string;        // e.g. "tron", "eth", "bsc"
  toCurrency?: string;     // target crypto if currency is fiat
  urlCallback?: string;    // webhook URL
  urlReturn?: string;      // user return URL
  urlSuccess?: string;     // user success redirect
  lifetime?: number;       // seconds (300-43200)
  additionalData?: string; // internal notes
}

export interface CreatePayoutParams {
  amount: string;
  currency: string;        // crypto code (USDT, BTC, etc)
  orderId: string;
  address: string;         // recipient wallet
  network: string;         // blockchain network
  isSubtract: boolean;     // fee from balance (true) or from amount (false)
  urlCallback?: string;
}

export interface InvoiceResult {
  uuid: string;
  orderId: string;
  amount: string;
  payerAmount: string | null;
  payerCurrency: string | null;
  address: string | null;
  network: string | null;
  paymentUrl: string;
  status: string;
  expiredAt: number | null;
  isFinal: boolean;
}

export interface PayoutResult {
  uuid: string;
  amount: string;
  currency: string;
  network: string;
  address: string;
  txid: string | null;
  status: string;
  isFinal: boolean;
  balance: number | null;
}

// Network name mapping: our enum -> provider's network code
const NETWORK_TO_PROVIDER: Record<string, string> = {
  'TRC20': 'tron',
  'ERC20': 'eth',
  'BEP20': 'bsc',
  'BTC': 'btc',
};

const PROVIDER_TO_NETWORK: Record<string, string> = {
  'tron': 'TRC20',
  'eth': 'ERC20',
  'bsc': 'BEP20',
  'btc': 'BTC',
  'TRON': 'TRC20',
  'ETH': 'ERC20',
  'BSC': 'BEP20',
  'BTC': 'BTC',
};

export function mapNetworkToProvider(network: string): string {
  return NETWORK_TO_PROVIDER[network] || network.toLowerCase();
}

export function mapProviderToNetwork(providerNetwork: string): string {
  return PROVIDER_TO_NETWORK[providerNetwork] || providerNetwork;
}

// ============================================================
// Sign generation: md5(base64(json_body) + apiKey)
// Both Heleket and Cryptomus use the same algorithm
// ============================================================
function generateSign(body: Record<string, unknown>, apiKey: string): string {
  const jsonStr = JSON.stringify(body);
  const base64 = Buffer.from(jsonStr).toString('base64');
  return createHash('md5').update(base64 + apiKey).digest('hex');
}

function generateSignEmpty(apiKey: string): string {
  const base64 = Buffer.from('').toString('base64');
  return createHash('md5').update(base64 + apiKey).digest('hex');
}

// ============================================================
// Verify webhook signature
// ============================================================
export function verifyWebhookSign(
  body: Record<string, unknown>,
  receivedSign: string,
  apiKey: string,
): boolean {
  const data = { ...body };
  delete data.sign;
  const expectedSign = generateSign(data, apiKey);
  return expectedSign === receivedSign;
}

// ============================================================
// Base API caller
// ============================================================
async function callApi(
  baseUrl: string,
  path: string,
  merchantId: string,
  apiKey: string,
  body: Record<string, unknown>,
): Promise<any> {
  const sign = Object.keys(body).length > 0
    ? generateSign(body, apiKey)
    : generateSignEmpty(apiKey);

  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'merchant': merchantId,
      'sign': sign,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let result: any;
  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(`Payment API returned non-JSON: ${text.substring(0, 200)}`);
  }

  if (!response.ok || result.state !== 0) {
    const errMsg = result.message || result.errors
      ? JSON.stringify(result.errors || result.message)
      : `HTTP ${response.status}`;
    throw new Error(`Payment API error: ${errMsg}`);
  }

  return result.result;
}

// ============================================================
// Provider-specific implementations
// ============================================================

class HelketProvider {
  private baseUrl = config.payment.heleket.baseUrl;
  private merchantId = config.payment.heleket.merchantId;
  private apiKey = config.payment.heleket.apiKey;

  get name() { return 'heleket' as const; }

  async createInvoice(params: CreateInvoiceParams): Promise<InvoiceResult> {
    const body: Record<string, unknown> = {
      amount: params.amount,
      currency: params.currency,
      order_id: params.orderId,
    };
    if (params.network) body.network = params.network;
    if (params.toCurrency) body.to_currency = params.toCurrency;
    if (params.urlCallback) body.url_callback = params.urlCallback;
    if (params.urlReturn) body.url_return = params.urlReturn;
    if (params.urlSuccess) body.url_success = params.urlSuccess;
    if (params.lifetime) body.lifetime = params.lifetime;
    if (params.additionalData) body.additional_data = params.additionalData;

    const r = await callApi(this.baseUrl, '/payment', this.merchantId, this.apiKey, body);
    return {
      uuid: r.uuid,
      orderId: r.order_id,
      amount: r.amount,
      payerAmount: r.payer_amount,
      payerCurrency: r.payer_currency,
      address: r.address,
      network: r.network,
      paymentUrl: r.url,
      status: r.payment_status || r.status,
      expiredAt: r.expired_at,
      isFinal: r.is_final,
    };
  }

  async createPayout(params: CreatePayoutParams): Promise<PayoutResult> {
    const body: Record<string, unknown> = {
      amount: params.amount,
      currency: params.currency,
      order_id: params.orderId,
      address: params.address,
      network: params.network,
      is_subtract: params.isSubtract ? '1' : '0',
    };
    if (params.urlCallback) body.url_callback = params.urlCallback;

    const r = await callApi(this.baseUrl, '/payout', this.merchantId, this.apiKey, body);
    return {
      uuid: r.uuid,
      amount: r.amount,
      currency: r.currency,
      network: r.network,
      address: r.address,
      txid: r.txid,
      status: r.status,
      isFinal: r.is_final,
      balance: r.balance,
    };
  }

  verifyWebhook(body: Record<string, unknown>, sign: string): boolean {
    return verifyWebhookSign(body, sign, this.apiKey);
  }
}

class CryptomusProvider {
  private baseUrl = config.payment.cryptomus.baseUrl;
  private merchantId = config.payment.cryptomus.merchantId;
  private paymentKey = config.payment.cryptomus.paymentKey;
  private payoutKey = config.payment.cryptomus.payoutKey;

  get name() { return 'cryptomus' as const; }

  async createInvoice(params: CreateInvoiceParams): Promise<InvoiceResult> {
    const body: Record<string, unknown> = {
      amount: params.amount,
      currency: params.currency,
      order_id: params.orderId,
    };
    if (params.network) body.network = params.network;
    if (params.toCurrency) body.to_currency = params.toCurrency;
    if (params.urlCallback) body.url_callback = params.urlCallback;
    if (params.urlReturn) body.url_return = params.urlReturn;
    if (params.urlSuccess) body.url_success = params.urlSuccess;
    if (params.lifetime) body.lifetime = params.lifetime;
    if (params.additionalData) body.additional_data = params.additionalData;

    const r = await callApi(this.baseUrl, '/payment', this.merchantId, this.paymentKey, body);
    return {
      uuid: r.uuid,
      orderId: r.order_id,
      amount: r.amount,
      payerAmount: r.payer_amount,
      payerCurrency: r.payer_currency,
      address: r.address,
      network: r.network,
      paymentUrl: r.url,
      status: r.payment_status || r.status,
      expiredAt: r.expired_at,
      isFinal: r.is_final,
    };
  }

  async createPayout(params: CreatePayoutParams): Promise<PayoutResult> {
    const body: Record<string, unknown> = {
      amount: params.amount,
      currency: params.currency,
      order_id: params.orderId,
      address: params.address,
      network: params.network,
      is_subtract: params.isSubtract ? '1' : '0',
    };
    if (params.urlCallback) body.url_callback = params.urlCallback;

    // Payout uses payout key
    const r = await callApi(this.baseUrl, '/payout', this.merchantId, this.payoutKey, body);
    return {
      uuid: r.uuid,
      amount: r.amount,
      currency: r.currency,
      network: r.network,
      address: r.address,
      txid: r.txid,
      status: r.status,
      isFinal: r.is_final,
      balance: r.balance,
    };
  }

  verifyPaymentWebhook(body: Record<string, unknown>, sign: string): boolean {
    return verifyWebhookSign(body, sign, this.paymentKey);
  }

  verifyPayoutWebhook(body: Record<string, unknown>, sign: string): boolean {
    return verifyWebhookSign(body, sign, this.payoutKey);
  }
}

// ============================================================
// Factory: get active provider
// ============================================================

export type PaymentProvider = HelketProvider | CryptomusProvider;

let _heleket: HelketProvider | null = null;
let _cryptomus: CryptomusProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  const name = config.payment.provider;
  if (name === 'heleket') {
    if (!_heleket) _heleket = new HelketProvider();
    return _heleket;
  }
  if (!_cryptomus) _cryptomus = new CryptomusProvider();
  return _cryptomus;
}

export function getHeleket(): HelketProvider {
  if (!_heleket) _heleket = new HelketProvider();
  return _heleket;
}

export function getCryptomus(): CryptomusProvider {
  if (!_cryptomus) _cryptomus = new CryptomusProvider();
  return _cryptomus;
}

// Payment status normalization
// Both providers use similar statuses
const PAID_STATUSES = ['paid', 'paid_over'];
const FAILED_STATUSES = ['fail', 'cancel', 'system_fail', 'wrong_amount'];
const PENDING_STATUSES = ['check', 'process', 'confirm_check', 'locked'];

export function normalizePaymentStatus(providerStatus: string): 'PENDING' | 'APPROVED' | 'REJECTED' {
  const s = providerStatus.toLowerCase();
  if (PAID_STATUSES.includes(s)) return 'APPROVED';
  if (FAILED_STATUSES.includes(s)) return 'REJECTED';
  return 'PENDING';
}

export function normalizePayoutStatus(providerStatus: string): 'PENDING' | 'APPROVED' | 'REJECTED' {
  const s = providerStatus.toLowerCase();
  if (s === 'paid' || s === 'completed' || s === 'paid_over') return 'APPROVED';
  if (s === 'fail' || s === 'cancel' || s === 'system_fail') return 'REJECTED';
  return 'PENDING';
}

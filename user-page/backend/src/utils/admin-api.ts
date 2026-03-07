import { config } from '../config.js';

const MAX_RETRIES = 3;
const TIMEOUT_MS = 5000;
const INITIAL_BACKOFF_MS = 300;

interface AdminApiOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
}

export class AdminApiClient {
  private readonly baseUrl: string;
  private readonly serviceToken: string;

  constructor() {
    this.baseUrl = config.admin.apiUrl;
    this.serviceToken = config.admin.serviceToken;
  }

  private async request<T>(path: string, options: AdminApiOptions = {}): Promise<T> {
    const { method = 'GET', body, params } = options;

    let url = `${this.baseUrl}${path}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'X-Service-Token': this.serviceToken,
            'X-Service-Name': 'user-page-backend',
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Admin API error: ${response.status} ${response.statusText}`);
        }

        return (await response.json()) as T;
      } catch (err) {
        lastError = err as Error;

        if (attempt < MAX_RETRIES - 1) {
          const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, backoff));
        }
      }
    }

    throw lastError || new Error('Admin API request failed');
  }

  // Sports-related proxy methods
  async getLiveEvents(status = 'LIVE') {
    return this.request<{ data: unknown[] }>('/api/v1/user-proxy/sports/events', {
      params: { status },
    });
  }

  async getEventOdds(eventId: number) {
    return this.request<{ data: unknown[] }>(`/api/v1/user-proxy/sports/odds/${eventId}`);
  }

  async getSportsLive(sport: string) {
    return this.request<{ data: unknown[] }>(`/api/v1/user-proxy/sports/live/${sport}`);
  }

  async getEnrichedEvents(sport: string) {
    return this.request<{ data: unknown[] }>(`/api/v1/user-proxy/sports/enriched/${sport}`);
  }

  async getEsportsLive() {
    return this.request<{ data: unknown[] }>('/api/v1/user-proxy/esports/live');
  }

  async getEsportsCategories() {
    return this.request<{ data: unknown[] }>('/api/v1/user-proxy/esports/categories');
  }

  // Notification methods
  async notifyNewUser(user: { id: number; username: string; nickname: string; referrerCode: string }) {
    try {
      await this.request('/api/v1/webhooks/user/new', {
        method: 'POST',
        body: user,
      });
    } catch {
      // Fire-and-forget: don't throw on notification failure
    }
  }

  async notifyDeposit(deposit: { userId: number; amount: number; coinType: string; network: string }) {
    try {
      await this.request('/api/v1/webhooks/deposit/new', {
        method: 'POST',
        body: deposit,
      });
    } catch {
      // Fire-and-forget
    }
  }

  async notifyWithdrawal(withdrawal: { userId: number; amount: number; coinType: string; address: string }) {
    try {
      await this.request('/api/v1/webhooks/withdrawal/new', {
        method: 'POST',
        body: withdrawal,
      });
    } catch {
      // Fire-and-forget
    }
  }
}

export interface LemonSqueezySubscription {
  id: string;
  type: string;
  attributes: {
    store_id: number;
    customer_id: number;
    order_id: number;
    order_item_id: number;
    product_id: number;
    variant_id: number;
    product_name: string;
    variant_name: string;
    user_name: string;
    user_email: string;
    status: string;
    status_formatted: string;
    card_brand: string;
    card_last_four: string;
    pause: any;
    cancelled: boolean;
    trial_ends_at: string | null;
    billing_anchor: number;
    created_at: string;
    updated_at: string;
    ends_at: string | null;
    renews_at: string | null;
    urls: {
      update_payment_method: string;
      customer_portal: string;
    };
  };
  relationships: {
    store: { links: { related: string; self: string } };
    customer: { links: { related: string; self: string } };
    order: { links: { related: string; self: string } };
    order_item: { links: { related: string; self: string } };
    product: { links: { related: string; self: string } };
    variant: { links: { related: string; self: string } };
  };
  links: { self: string };
}

export interface LemonSqueezyOrder {
  id: string;
  type: string;
  attributes: {
    store_id: number;
    customer_id: number;
    identifier: string;
    order_number: number;
    user_name: string;
    user_email: string;
    currency: string;
    currency_rate: string;
    subtotal: number;
    discount_total: number;
    tax: number;
    total: number;
    subtotal_usd: number;
    discount_total_usd: number;
    tax_usd: number;
    total_usd: number;
    tax_name: string;
    tax_rate: string;
    status: string;
    status_formatted: string;
    refunded: boolean;
    refunded_at: string | null;
    subtotal_formatted: string;
    discount_total_formatted: string;
    tax_formatted: string;
    total_formatted: string;
    urls: {
      receipt: string;
    };
    created_at: string;
    updated_at: string;
  };
}

export class LemonSqueezyService {
  private apiKey: string;
  private baseUrl = 'https://api.lemonsqueezy.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Lemon Squeezy API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  async getSubscription(subscriptionId: string): Promise<LemonSqueezySubscription> {
    const response = await this.makeRequest(`/subscriptions/${subscriptionId}`);
    return response.data;
  }

  async getOrder(orderId: string): Promise<LemonSqueezyOrder> {
    const response = await this.makeRequest(`/orders/${orderId}`);
    return response.data;
  }

  async cancelSubscription(subscriptionId: string) {
    return this.makeRequest(`/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
    });
  }

  async updateSubscription(subscriptionId: string, data: any) {
    return this.makeRequest(`/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        data: {
          type: 'subscriptions',
          id: subscriptionId,
          attributes: data,
        },
      }),
    });
  }
}
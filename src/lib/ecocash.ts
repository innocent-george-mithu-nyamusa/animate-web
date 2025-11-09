/**
 * Ecocash Payment Service
 * Integration with Ecocash API for mobile money payments
 * API Documentation: https://developers.ecocash.co.zw/api/payments
 */

export interface EcocashPaymentRequest {
  customerMsisdn: string; // Customer phone number (e.g., "263774222475")
  amount: number; // Payment amount
  reason: string; // Payment description/reason
  currency: "USD" | "ZWG"; // Currency code
  sourceReference: string; // Unique transaction reference (UUID recommended)
}

export interface EcocashPaymentResponse {
  success: boolean;
  transactionId?: string;
  status?: string;
  message?: string;
  error?: string;
}

export interface EcocashWebhookPayload {
  transactionId: string;
  sourceReference: string;
  amount: number;
  currency: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  customerMsisdn: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export class EcocashService {
  private apiKey: string;
  private baseUrl: string;
  private environment: "sandbox" | "live";

  constructor(apiKey: string, environment: "sandbox" | "live" = "sandbox") {
    this.apiKey = apiKey;
    this.environment = environment;
    this.baseUrl =
      environment === "sandbox"
        ? "https://developers.ecocash.co.zw/api/ecocash_pay/api/v2/payment/instant/c2b/sandbox"
        : "https://developers.ecocash.co.zw/api/ecocash_pay/api/v2/payment/instant/c2b/live";
  }

  /**
   * Initiate a payment request to Ecocash
   */
  async initiatePayment(
    request: EcocashPaymentRequest
  ): Promise<EcocashPaymentResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "X-API-KEY": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `Ecocash API error: ${response.status}`,
        };
      }

      return {
        success: true,
        transactionId: data.transactionId,
        status: data.status,
        message: data.message,
      };
    } catch (error) {
      console.error("Ecocash payment error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Generate a unique source reference for transactions
   */
  generateSourceReference(): string {
    return crypto.randomUUID();
  }

  /**
   * Validate Ecocash webhook payload
   */
  validateWebhook(payload: EcocashWebhookPayload): boolean {
    // Add webhook signature validation if Ecocash provides it
    // For now, basic validation
    return !!(
      payload.transactionId &&
      payload.sourceReference &&
      payload.amount &&
      payload.currency &&
      payload.status
    );
  }

  /**
   * Format phone number to Ecocash format (263...)
   */
  formatPhoneNumber(phone: string): string {
    // Remove any spaces, dashes, or special characters
    phone = phone.replace(/[\s\-\(\)]/g, "");

    // If starts with 0, replace with 263
    if (phone.startsWith("0")) {
      return "263" + phone.substring(1);
    }

    // If starts with +263, remove +
    if (phone.startsWith("+263")) {
      return phone.substring(1);
    }

    // If already starts with 263, return as is
    if (phone.startsWith("263")) {
      return phone;
    }

    // Otherwise, assume it's missing country code
    return "263" + phone;
  }
}

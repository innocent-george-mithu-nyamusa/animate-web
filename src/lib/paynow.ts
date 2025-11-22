/**
 * Paynow Payment Service
 * Integration with Paynow Zimbabwe payment gateway
 * API Documentation: https://developers.paynow.co.zw/
 */

import { Paynow } from "paynow";

export interface PaynowPaymentRequest {
  invoiceId: string; // Unique invoice/order identifier
  items: Array<{
    name: string;
    amount: number;
  }>;
  customerEmail: string;
  customerPhone?: string;
  metadata?: Record<string, any>;
}

export interface PaynowPaymentResponse {
  success: boolean;
  redirectUrl?: string;
  pollUrl?: string;
  error?: string;
  reference?: string;
}

export interface PaynowMobilePaymentResponse {
  success: boolean;
  instructions?: string;
  pollUrl?: string;
  error?: string;
  reference?: string;
}

export interface PaynowWebhookPayload {
  reference: string;
  paynowreference: string;
  amount: string;
  status: string;
  pollurl: string;
  hash: string;
}

export type PaynowMobileMethod = "ecocash" | "onemoney";

export class PaynowService {
  private paynow: Paynow;
  private integrationId: string;
  private integrationKey: string;
  private resultUrl: string;
  private returnUrl: string;

  constructor(
    integrationId: string,
    integrationKey: string,
    resultUrl: string,
    returnUrl: string
  ) {
    this.paynow = new Paynow(integrationId, integrationKey, returnUrl, resultUrl);
    this.integrationId = integrationId;
    this.integrationKey = integrationKey;
    this.resultUrl = resultUrl;
    this.returnUrl = returnUrl;

    // // Set URLs for callbacks
    // this.paynow.resultUrl = resultUrl;
    // this.paynow.returnUrl = returnUrl;
  }

  /**
   * Initiate a standard web payment (redirects user to Paynow)
   */
  async initiateWebPayment(
    request: PaynowPaymentRequest
  ): Promise<PaynowPaymentResponse> {
    try {
      // Create payment
      const payment = this.paynow.createPayment(
        request.invoiceId,
        request.customerEmail
      );

      // Add items to payment
      for (const item of request.items) {
        payment.add(item.name, item.amount);
      }

      // Send payment request
      const response = await this.paynow.send(payment);

      if (response.success) {
        return {
          success: true,
          redirectUrl: response.redirectUrl,
          pollUrl: response.pollUrl,
          reference: request.invoiceId,
        };
      } else {
        return {
          success: false,
          error: "Failed to initiate payment",
        };
      }
    } catch (error) {
      console.error("Paynow web payment error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Initiate a mobile money payment (Ecocash, OneMoney)
   */
  async initiateMobilePayment(
    request: PaynowPaymentRequest,
    phoneNumber: string,
    method: PaynowMobileMethod
  ): Promise<PaynowMobilePaymentResponse> {
    try {
      // Create payment
      const payment = this.paynow.createPayment(
        request.invoiceId,
        request.customerEmail
      );

      // Add items to payment
      for (const item of request.items) {
        payment.add(item.name, item.amount);
      }

      // Send mobile payment request
      const response = await this.paynow.sendMobile(
        payment,
        phoneNumber,
        method
      );

      if (response.success) {
        return {
          success: true,
          instructions: response.instructions,
          pollUrl: response.pollUrl,
          reference: request.invoiceId,
        };
      } else {
        return {
          success: false,
          error: "Failed to initiate mobile payment",
        };
      }
    } catch (error) {
      console.error("Paynow mobile payment error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check payment status by polling
   */
  async checkPaymentStatus(pollUrl: string): Promise<{
    paid: boolean;
    status: string;
    amount?: string;
    reference?: string;
  }> {
    try {
      const status = await this.paynow.pollTransaction(pollUrl);

      return {
        paid: status.paid(),
        status: status.status,
        amount: status.amount,
        reference: status.reference,
      };
    } catch (error) {
      console.error("Paynow status check error:", error);
      return {
        paid: false,
        status: "ERROR",
      };
    }
  }

  /**
   * Validate Paynow webhook payload
   * Verifies the hash to ensure the request is authentic
   * CRITICAL SECURITY: Prevents fake payment notifications
   * Hash formula: SHA512(id + reference + amount + status + integration_key)
   */
  validateWebhook(payload: PaynowWebhookPayload): boolean {
    try {
      // First check if all required fields exist
      if (!payload.reference || !payload.paynowreference || !payload.status || !payload.hash || !payload.amount) {
        console.error("[WEBHOOK_SECURITY] Missing required fields in webhook payload");
        return false;
      }

      // Build the hash string according to Paynow specification
      // Format: integrationId + reference + amount + status(lowercase) + integrationKey
      const hashString = `${this.integrationId}${payload.reference}${payload.amount}${payload.status.toLowerCase()}${this.integrationKey}`;

      // Calculate SHA512 hash
      const crypto = require('crypto');
      const calculatedHash = crypto
        .createHash('sha512')
        .update(hashString)
        .digest('hex')
        .toUpperCase();

      // Compare with provided hash (case-insensitive)
      const providedHash = payload.hash.toUpperCase();
      const isValid = calculatedHash === providedHash;

      if (!isValid) {
        console.error("[WEBHOOK_SECURITY] Hash validation FAILED - Potential payment tampering detected!");
        console.error(`[WEBHOOK_SECURITY] Reference: ${payload.reference}`);
        console.error(`[WEBHOOK_SECURITY] Expected hash: ${calculatedHash.substring(0, 20)}...`);
        console.error(`[WEBHOOK_SECURITY] Received hash: ${providedHash.substring(0, 20)}...`);
      } else {
        console.log("[WEBHOOK_SECURITY] Hash validation PASSED for reference:", payload.reference);
      }

      return isValid;
    } catch (error) {
      console.error("[WEBHOOK_SECURITY] Error during webhook validation:", error);
      return false;
    }
  }

  /**
   * Format phone number for mobile payments (remove spaces, dashes)
   */
  formatPhoneNumber(phone: string): string {
    return phone.replace(/[\s\-\(\)]/g, "");
  }

  /**
   * Parse webhook status to subscription state
   * Based on Paynow documentation: https://developers.paynow.co.zw/docs/test_mode.html
   */
  parsePaymentStatus(status: string): "SUCCESS" | "FAILED" | "PENDING" {
    const upperStatus = status.toUpperCase();

    // Success statuses
    if (
      upperStatus === "PAID" ||
      upperStatus === "DELIVERED" ||
      upperStatus === "SUCCESS" ||
      upperStatus === "SUCCESSFUL"
    ) {
      return "SUCCESS";
    }

    // Failed statuses
    if (
      upperStatus === "CANCELLED" ||
      upperStatus === "FAILED" ||
      upperStatus === "DISPUTED" ||
      upperStatus === "REFUNDED" ||
      upperStatus.includes("INSUFFICIENT")
    ) {
      return "FAILED";
    }

    // Pending statuses (awaiting, sent, created, etc.)
    return "PENDING";
  }

  /**
   * Get user-friendly error message based on payment status
   */
  getFailureReason(status: string): string {
    const upperStatus = status.toUpperCase();

    if (upperStatus === "CANCELLED") {
      return "Payment was cancelled by user";
    }

    if (upperStatus.includes("INSUFFICIENT")) {
      return "Insufficient balance in account";
    }

    if (upperStatus === "DISPUTED") {
      return "Payment is under dispute";
    }

    if (upperStatus === "REFUNDED") {
      return "Payment was refunded";
    }

    if (upperStatus === "FAILED") {
      return "Payment failed";
    }

    return "Payment could not be completed";
  }
}

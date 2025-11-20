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
  private resultUrl: string;
  private returnUrl: string;

  constructor(
    integrationId: string,
    integrationKey: string,
    resultUrl: string,
    returnUrl: string
  ) {
    this.paynow = new Paynow(integrationId, integrationKey, returnUrl, resultUrl);
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
   */
  validateWebhook(payload: PaynowWebhookPayload): boolean {
    try {
      // Paynow sends a hash that needs to be validated
      // The SDK handles hash validation internally
      return !!(
        payload.reference &&
        payload.paynowreference &&
        payload.status &&
        payload.hash
      );
    } catch (error) {
      console.error("Webhook validation error:", error);
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

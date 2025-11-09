/**
 * Type definitions for paynow package
 * Since @types/paynow doesn't exist, we define our own types
 */

declare module 'paynow' {
  export class Paynow {
    constructor(integrationId: string, integrationKey: string, returnUrl: string, resultUrl: string);

    
    createPayment(reference: string, email: string): Payment;
    send(payment: Payment): Promise<PaymentResponse>;
    sendMobile(payment: Payment, phone: string, method: string): Promise<PaymentResponse>;
    pollTransaction(pollUrl: string): Promise<PaymentStatus>;
    processStatusUpdate(data: Record<string, string>): StatusUpdate;
  }

  export class Payment {
    add(title: string, amount: number): void;
    info: Record<string, string>;
  }

  export interface PaymentResponse {
    success: boolean;
    hasRedirect: boolean;
    redirectUrl?: string;
    pollUrl?: string;
    error?: string;
    instructions?: string;
  }

  export interface PaymentStatus {
    paid(): boolean;
    status: string;
    amount?: string;
    reference?: string;
  }

  export interface StatusUpdate {
    reference: string;
    paynowReference: string;
    amount: string;
    status: string;
    hash: string;
  }
}

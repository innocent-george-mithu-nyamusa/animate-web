# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the web backend and landing page for **Animate** - an AI-powered image stylization mobile app. The project handles subscription payments via Paynow (supporting Ecocash, OneMoney, and card payments), manages user authentication with Firebase Auth, and stores user data in Firestore.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Firebase Auth & Firestore, Tailwind CSS v4, Paynow SDK

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

Development server runs on http://localhost:3000

## Architecture

### Application Structure

- **Next.js App Router** - All routes in `/src/app/`
- **API Routes** - Located in `/src/app/api/` using Route Handlers
- **Service Classes** - Reusable business logic in `/src/lib/`
- **Path Alias** - `@/*` maps to `./src/*`

### Key Service Classes

**FirebaseSubscriptionService** ([src/lib/firebase-admin.ts](src/lib/firebase-admin.ts))
- Manages all Firebase/Firestore subscription operations
- Handles user subscription status and generation credits
- Supports subscription lifecycle management
- Key methods:
  - `updateUserSubscription()` - Update user subscription with new tier
  - `setGenerationCredits()` - Set credits based on subscription tier
  - `createSubscriptionRecord()` - Create subscription document in Firestore
  - `updateSubscriptionStatus()` - Update subscription lifecycle state
  - `processExpiredSubscriptions()` - Cron job to expire old subscriptions
  - `renewSubscription()` - Handle monthly subscription renewals
  - `logTransaction()` - Log payment transactions

**FirebaseAuthService** ([src/lib/firebase-auth.ts](src/lib/firebase-auth.ts))
- Handles user authentication with Firebase Auth
- Key methods:
  - `createUserWithEmail()` - Email/password signup
  - `handleGoogleSignIn()` - Google OAuth authentication
  - `verifyIdToken()` - Verify Firebase ID tokens
  - `deleteUser()` - Delete user account and data

**PaynowService** ([src/lib/paynow.ts](src/lib/paynow.ts))
- Interface with Paynow payment gateway (uses official Paynow SDK)
- Handles ALL payment methods: Ecocash mobile, OneMoney mobile, and card payments
- Methods: `initiateWebPayment()`, `initiateMobilePayment()`, `checkPaymentStatus()`, `validateWebhook()`
- Mobile payments: Ecocash and OneMoney via mobile money integration
- Card payments: Web redirect to Paynow payment page for Visa/Mastercard

**Gemini Image Editing Service** ([src/app/api/process-image/route.ts](src/app/api/process-image/route.ts))
- Uses Google Gemini 2.5 Flash Image (nicknamed "Nano Banana") for AI-powered image editing
- Transforms images based on natural language style prompts
- Model: `gemini-2.5-flash-image`
- Returns edited images as base64-encoded PNG data
- Supports 10 predefined artistic styles (figurines, plush toys, anime, etc.)
- Requires `GEMINI_API_KEY` environment variable

### Firebase Collections

- `users` - User profiles with subscription status, credits, auth provider, and metadata
  - Fields: `uid`, `email`, `displayName`, `photoURL`, `provider`, `subscription`, `credits`, `createdAt`, `updatedAt`
- `subscriptions` - Subscription records with tier, status, and payment info
  - Fields: `userId`, `subscriptionId`, `tier`, `status`, `amount`, `currency`, `paymentMethod`, `transactionReference`, `startDate`, `renewalDate`, `metadata`
- `transactions` - Payment transaction audit logs
  - Fields: `userId`, `transactionId`, `type`, `status`, `amount`, `currency`, `paymentMethod`, `subscriptionId`, `timestamp`, `metadata`

### Subscription System

**Subscription Tiers:**
- **Free:** USD 0 / ZWG 0 - 3 generations/month
- **Standard:** USD 9.99 / ZWG 297 - 120 generations/month
- **Premium:** USD 19.99 / ZWG 620 - 280 generations/month

**Subscription States:**
- `active` - Subscription is active and valid
- `paused` - Payment collection paused, subscription still active
- `past_due` - Renewal payment failed, system will retry
- `unpaid` - All renewal retries failed
- `cancelled` - Future payments cancelled, valid until end date
- `expired` - Subscription has ended

**Supported Currencies:** USD, ZWG

**Supported Payment Methods (all via Paynow):**
- **Ecocash** - Mobile money payment (Zimbabwe)
- **OneMoney** - Mobile money payment (Zimbabwe)
- **Visa/Mastercard** - Card payment via Paynow web redirect

### Authentication Flow

1. User signs up via email/password or Google OAuth
2. Client app sends ID token to backend
3. Backend verifies token with Firebase Admin SDK
4. New users automatically get free tier subscription (3 generations/month)
5. User data stored in Firestore `users` collection

**API Endpoints:**
- `POST /api/auth/signup` - Email/password signup
- `POST /api/auth/google` - Google OAuth sign-in
- `POST /api/auth/verify-token` - Verify Firebase ID token
- `POST /api/auth/delete-account` - Delete user account

### Payment Flow

**Initiation:**
1. User selects subscription tier and payment method (ecocash, onemoney, or card)
2. App calls `POST /api/payments/initiate` with:
   - `idToken` (Firebase auth token)
   - `paymentMethod` (ecocash, onemoney, or card)
   - `amount` and `currency`
   - `phoneNumber` (required for mobile payments)
   - `email` (required for all payments)
3. Backend selects appropriate Paynow credentials based on currency (USD or ZWG)
4. Backend routes all payments through Paynow:
   - **Mobile money** (ecocash/onemoney): Initiates mobile payment via Paynow
   - **Card**: Returns redirect URL to Paynow payment page
5. Returns payment reference/instructions or redirect URL

**Webhook Processing:**
- Paynow: `POST /api/webhooks/paynow` - Receives payment notifications for all payment methods

**Webhook Flow:**
1. Paynow sends webhook with transaction details
2. Webhook validates payload and extracts user/payment info
3. Determines subscription tier based on amount and currency
4. Creates subscription record in Firestore
5. Updates user document with new subscription and credits
6. Logs transaction for audit trail

**Status Checking:**
- `POST /api/payments/status` - Poll Paynow payment status

### Subscription Lifecycle Management

**Cron Job:** `GET/POST /api/cron/process-subscriptions`
- Runs daily at midnight (configured in [vercel.json](vercel.json))
- Checks for expired subscriptions
- Updates subscription status to `expired`
- Resets users to free tier when subscription expires
- Secured with `CRON_SECRET` environment variable

**Vercel Cron Configuration:** See [vercel.json](vercel.json)

## Important Configuration

### Environment Variables

Required in `.env`:

**Firebase:**
- `FIREBASE_PROJECT_ID` - Firebase project identifier
- `FIREBASE_CLIENT_EMAIL` - Service account email
- `FIREBASE_PRIVATE_KEY` - Service account private key
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Client SDK API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Client SDK auth domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Client SDK project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Client SDK storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Client SDK messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID` - Client SDK app ID

**Paynow (handles all payments):**
- `PAYNOW_INTEGRATION_ID` - Paynow integration ID for USD payments
- `PAYNOW_INTEGRATION_KEY` - Paynow integration key for USD payments
- `PAYNOW_ZWG_INTEGRATION_ID` - Paynow integration ID for ZWG payments
- `PAYNOW_ZWG_INTEGRATION_KEY` - Paynow integration key for ZWG payments
- `PAYNOW_RESULT_URL` - Webhook URL for payment results
- `PAYNOW_RETURN_URL` - Return URL after payment

**Other:**
- `GEMINI_API_KEY` - Google Gemini AI API key for image editing (Gemini 2.5 Flash Image / Nano Banana)
- `RESEND_API_KEY` - Resend email service API key (optional)
- `CRON_SECRET` - Secret token for cron job authentication
- `NEXT_PUBLIC_APP_URL` - Public app URL for callbacks

### CORS Configuration

All `/api/*` routes have CORS enabled in [next.config.ts](next.config.ts) to support cross-origin requests from the mobile app.

### TypeScript Configuration

- Strict mode enabled
- Path alias `@/*` maps to `./src/*`
- Target: ES2017

## Key Files

**Services:**
- [src/lib/firebase-admin.ts](src/lib/firebase-admin.ts) - Firebase subscription & database service
- [src/lib/firebase-auth.ts](src/lib/firebase-auth.ts) - Firebase authentication service (server-side)
- [src/lib/firebase-client.ts](src/lib/firebase-client.ts) - Firebase authentication client (browser-side)
- [src/lib/paynow.ts](src/lib/paynow.ts) - Paynow payment gateway client (handles all payment methods)
- [src/lib/ecocash.ts](src/lib/ecocash.ts) - Legacy Ecocash service (kept for reference, not actively used)

**API Routes:**
- [src/app/api/auth/signup/route.ts](src/app/api/auth/signup/route.ts) - Email/password signup
- [src/app/api/auth/google/route.ts](src/app/api/auth/google/route.ts) - Google OAuth handler
- [src/app/api/payments/initiate/route.ts](src/app/api/payments/initiate/route.ts) - Payment initiation (all methods via Paynow)
- [src/app/api/payments/status/route.ts](src/app/api/payments/status/route.ts) - Payment status check
- [src/app/api/webhooks/paynow/route.ts](src/app/api/webhooks/paynow/route.ts) - Paynow webhook (handles all payment methods)
- [src/app/api/cron/process-subscriptions/route.ts](src/app/api/cron/process-subscriptions/route.ts) - Subscription lifecycle cron
- [src/app/api/process-image/route.ts](src/app/api/process-image/route.ts) - Gemini AI image processing

**Configuration:**
- [next.config.ts](next.config.ts) - Next.js configuration with CORS
- [vercel.json](vercel.json) - Vercel deployment & cron configuration

**Pages:**
- [src/app/page.tsx](src/app/page.tsx) - Landing page with AI styling, auth, and checkout
- [src/app/success/page.tsx](src/app/success/page.tsx) - Payment success page
- [src/app/privacy-policy/page.tsx](src/app/privacy-policy/page.tsx) - Privacy policy
- [src/app/data-deletion-policy/page.tsx](src/app/data-deletion-policy/page.tsx) - Data deletion policy

## Testing

No testing framework is currently configured. If adding tests, consider Jest or Vitest with React Testing Library.

## Application Metadata

- **App Name:** Animate
- **Description:** AI Image Style Editor
- **Company:** Pixelspulse Private Limited
- **Deep Link Scheme:** `animate://`
- **Success Redirect:** `animate://success` after payment
- **Supported Currencies:** USD, ZWG
- **Payment Provider:** Paynow Zimbabwe (supporting Ecocash, OneMoney, and Visa/Mastercard)
- **AI Service:** Google Gemini 2.5 Flash Image (Nano Banana) for AI-powered image editing and transformation

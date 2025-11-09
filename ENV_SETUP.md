# Environment Variables Setup Guide

This guide will help you set up all the necessary environment variables for the Animate app.

## Quick Start

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in the values following the instructions below

## 1. Firebase Setup

### Firebase Admin SDK (Server-side)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to **Project Settings** (gear icon) > **Service Accounts**
4. Click **Generate New Private Key**
5. A JSON file will be downloaded
6. Extract these values from the JSON:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the quotes and \n characters)

### Firebase Client SDK (Browser-side)

1. In Firebase Console, go to **Project Settings** > **General**
2. Scroll down to **Your apps** section
3. Click the **Web** icon (</>) to create a web app if you haven't
4. Copy the config values to your `.env.local`:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
   ```

### Enable Authentication Methods

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable:
   - **Email/Password**
   - **Google** (add your OAuth 2.0 Client ID)

### Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** (we'll set rules later)
4. Select a location close to your users

### Firestore Security Rules (Optional but Recommended)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Users can read their own subscriptions
    match /subscriptions/{subscriptionId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if false; // Only backend can write
    }

    // Users can read their own transactions
    match /transactions/{transactionId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if false; // Only backend can write
    }
  }
}
```

## 2. Google Gemini AI Setup (Image Editing)

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Get API Key** or **Create API Key**
4. Copy the API key
5. Add to `.env.local`:
   ```
   GEMINI_API_KEY=your-gemini-api-key
   ```

**Features:**
- Uses **Gemini 2.5 Flash Image** (nicknamed "Nano Banana") for AI-powered image editing
- Transforms images based on natural language prompts
- Supports style transfer (Classic Figure, Plush Toy, Anime, Funko Pop, etc.)
- Returns actual edited images, not just descriptions
- Model automatically handles image-to-image transformation

## 3. Ecocash Payment Setup

1. Go to [Ecocash Developer Portal](https://developers.ecocash.co.zw)
2. Sign up for a developer account
3. Create a new application
4. Get your API credentials:
   - API Key
   - Environment (sandbox for testing, live for production)
5. Add to `.env.local`:
   ```
   ECOCASH_API_KEY=your-ecocash-api-key
   ECOCASH_ENV=sandbox  # Change to 'live' for production
   ```

### Configure Webhook URL

In the Ecocash developer dashboard, set your webhook URL to:
```
https://your-domain.com/api/webhooks/ecocash
```

## 4. Paynow Payment Setup

1. Go to [Paynow Dashboard](https://www.paynow.co.zw)
2. Sign in or create an account
3. Go to **Receive Payment Links** > **3rd Party Site or Link Integration**
4. Click **Edit** on your integration
5. Get your credentials:
   - Integration ID
   - Integration Key
6. Configure URLs:
   - **Result URL**: `https://your-domain.com/api/webhooks/paynow`
   - **Return URL**: `https://your-domain.com/success`
7. Add to `.env.local`:
   ```
   PAYNOW_INTEGRATION_ID=your-integration-id
   PAYNOW_INTEGRATION_KEY=your-integration-key
   PAYNOW_RESULT_URL=https://your-domain.com/api/webhooks/paynow
   PAYNOW_RETURN_URL=https://your-domain.com/success
   ```

## 5. Resend Email Service (Optional)

Only needed if you want to send email receipts.

1. Go to [Resend](https://resend.com)
2. Sign up and verify your email
3. Create an API key
4. Add to `.env.local`:
   ```
   RESEND_API_KEY=re_your_api_key
   ```

## 6. Application Configuration

### Public App URL

Set this to your application's public URL:
- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.com`

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Cron Job Security

Generate a random secret to secure your cron endpoints:

```bash
# On macOS/Linux
openssl rand -base64 32

# Or use any random string generator
```

Add to `.env.local`:
```
CRON_SECRET=your-random-secret-here
```

## Testing Your Setup

### 1. Test Firebase Connection

```bash
npm run dev
```

Try signing up with email/password or Google.

### 2. Test Image Processing (Gemini 2.5 Flash Image)

1. Upload an image on the landing page
2. Select one of the 10 available styles (Classic Figure, Plush Toy, Anime, etc.)
3. Click "Apply Style" to process the image
4. The edited image will appear in the "After" panel
5. Check browser console for Gemini API responses and any errors

### 3. Test Payments (Sandbox)

1. Make sure `ECOCASH_ENV=sandbox`
2. Go to Pricing page
3. Try initiating a payment with test credentials
4. Check webhook logs in terminal

### 4. Test Paynow Integration

1. Use Paynow's test credentials (check their documentation)
2. Initiate a payment
3. Check if webhook is called successfully

## Deployment Checklist

When deploying to production:

- [ ] Update `ECOCASH_ENV` to `live`
- [ ] Update `NEXT_PUBLIC_APP_URL` to production URL
- [ ] Update `PAYNOW_RESULT_URL` to production webhook URL
- [ ] Update `PAYNOW_RETURN_URL` to production success URL
- [ ] Set up Vercel cron jobs for subscription management
- [ ] Add `CRON_SECRET` to Vercel environment variables
- [ ] Test all payment flows in production
- [ ] Monitor Firebase usage and set budgets

## Security Best Practices

1. **Never commit `.env.local` to git** - It's already in `.gitignore`
2. **Rotate API keys regularly** - Especially if exposed
3. **Use environment-specific keys** - Different keys for dev/staging/prod
4. **Enable Firebase App Check** - Protect against unauthorized access
5. **Set up Firebase budget alerts** - Monitor usage
6. **Use Vercel Environment Variables** - For production secrets

## Troubleshooting

### Firebase "Permission Denied"
- Check Firestore security rules
- Verify user is authenticated
- Ensure Firebase Admin SDK is initialized correctly

### Gemini API Errors
- Verify API key is correct
- Check quota limits in Google AI Studio
- Ensure proper error handling in code

### Payment Webhook Not Receiving
- Verify webhook URLs are publicly accessible
- Check webhook logs in payment provider dashboards
- Use ngrok for local testing: `ngrok http 3000`

### CORS Errors
- Verify `next.config.ts` has correct CORS headers
- Check Firebase Auth domain is whitelisted
- Ensure API endpoints return proper headers

## Support

For issues:
- Firebase: [Firebase Support](https://firebase.google.com/support)
- Gemini: [Google AI Support](https://ai.google.dev/support)
- Ecocash: [Ecocash Developer Portal](https://developers.ecocash.co.zw)
- Paynow: [Paynow Support](https://www.paynow.co.zw/Support)

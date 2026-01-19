# Rebranding Email Campaign Guide

This guide explains how to send rebranding announcement emails to your users about the Animate → IconicMe name change.

## 📋 What's Included

1. **Professional Email Template** - Beautiful HTML email announcing the rebrand
2. **Email Service** - Resend integration for reliable email delivery
3. **API Endpoint** - Secure endpoint to trigger email sends
4. **Admin Interface** - User-friendly dashboard to manage the campaign

## 🚀 Setup Instructions

### Step 1: Install Resend Package

```bash
npm install resend react-dom
```

### Step 2: Configure Environment Variables

Add these to your `.env` file:

```env
# Resend API Key (get from https://resend.com/api-keys)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx

# Admin secret for secure email sending
ADMIN_SECRET=your-super-secret-admin-key-here

# Your app URL (already configured)
NEXT_PUBLIC_APP_URL=https://iconicme.shop
```

### Step 3: Verify Resend Domain

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Add your domain: `iconicme.shop`
3. Add the DNS records they provide to your domain settings
4. Wait for verification (usually takes a few minutes)

Resend will verify:
- **SPF Record** - Prevents spoofing
- **DKIM Record** - Email authentication
- **DMARC Record** - Email policy

### Step 4: Test the Email

1. Navigate to: `https://iconicme.shop/admin/rebranding-emails`
2. Enter your `ADMIN_SECRET`
3. Select **Test Mode**
4. Enter your test email
5. Click "Send Test Email"

## 📧 Email Features

The rebranding email includes:

✅ **Professional Design**
- Purple gradient header matching IconicMe brand
- Responsive layout for all devices
- Clear "What's Changed" and "What Stays the Same" sections

✅ **Key Information**
- New name: Animate → IconicMe
- New domain: animate.pixels.co.zw → iconicme.shop
- New email: enquiry@iconicme.shop
- Reassurance that accounts/subscriptions remain unchanged

✅ **Call to Action**
- Prominent button to visit iconicme.shop
- Request to update bookmarks

✅ **Dual Format**
- HTML version for modern email clients
- Plain text fallback for older clients

## 🎯 Sending Options

### Option 1: Test Mode
**Use for:** Testing the email before sending to users

```bash
# Via Admin Interface
1. Go to /admin/rebranding-emails
2. Select "Test Mode"
3. Enter test email
4. Send
```

### Option 2: Single User Mode
**Use for:** Sending to specific users manually

```bash
# Via Admin Interface
1. Go to /admin/rebranding-emails
2. Select "Single User Mode"
3. Enter user email and name
4. Send
```

### Option 3: All Users Mode
**Use for:** Bulk sending to entire user base

⚠️ **WARNING:** This sends to ALL users in your database!

```bash
# Via Admin Interface
1. Go to /admin/rebranding-emails
2. Select "All Users Mode"
3. Review warning message
4. Click "Send to All Users"
```

## 🔒 Security

The email system is protected with:

1. **Admin Secret** - Required to send emails
2. **Authorization Header** - Bearer token authentication
3. **CORS Protection** - API only accepts authorized requests
4. **Rate Limiting** - 150ms delay between emails (prevents overwhelming Resend)

## 📊 Resend Free Tier Limits

- **100 emails/day** - Upgrade to paid plan for more
- **10 emails/second** - Built-in rate limiting included
- **Unlimited team members**
- **Email analytics** - Track opens and clicks

For bulk sending to many users, consider upgrading to Resend's paid plan.

## 🧪 Testing Checklist

Before sending to all users:

- [ ] Install `resend` and `react-dom` packages
- [ ] Add `RESEND_API_KEY` to environment variables
- [ ] Add `ADMIN_SECRET` to environment variables
- [ ] Verify `iconicme.shop` domain in Resend
- [ ] Send test email to yourself
- [ ] Check email in multiple clients (Gmail, Outlook, Apple Mail)
- [ ] Verify all links work correctly
- [ ] Test on mobile device
- [ ] Send to a small group of beta users
- [ ] Review analytics in Resend dashboard

## 📝 Manual API Usage

You can also send emails via API:

### Test Email
```bash
curl -X POST https://iconicme.shop/api/admin/send-rebranding-emails \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  -d '{
    "mode": "test",
    "testEmail": "test@example.com"
  }'
```

### Single User
```bash
curl -X POST https://iconicme.shop/api/admin/send-rebranding-emails \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  -d '{
    "mode": "single",
    "email": "user@example.com",
    "displayName": "John Doe"
  }'
```

### All Users
```bash
curl -X POST https://iconicme.shop/api/admin/send-rebranding-emails \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  -d '{
    "mode": "all"
  }'
```

## 📈 Monitoring Results

After sending emails:

1. **Resend Dashboard**
   - Go to [Resend Logs](https://resend.com/emails)
   - View delivery status, opens, clicks
   - Check bounce and spam reports

2. **Admin Response**
   - Shows successful/failed counts
   - Lists any errors encountered
   - Provides detailed failure reasons

## 🎨 Customizing the Email

To customize the email template:

1. Edit: `src/lib/email-templates/rebranding-email.tsx`
2. Modify colors, text, or layout
3. Test changes with Test Mode
4. Deploy updates

### Brand Colors Used
- Primary Purple: `#7c3aed`
- Light Purple: `#a855f7`
- Success Green: `#10b981`
- Background: `#f4f4f4`

## 🆘 Troubleshooting

### "Unauthorized" Error
- Verify `ADMIN_SECRET` matches in `.env` and admin interface
- Check Authorization header is included

### Emails Not Sending
- Verify `RESEND_API_KEY` is correct
- Check domain is verified in Resend
- Review Resend dashboard for errors
- Check rate limits (100/day on free plan)

### Emails Going to Spam
- Ensure DNS records (SPF, DKIM) are verified
- Use verified domain (`enquiry@iconicme.shop`)
- Avoid spam trigger words
- Maintain good sender reputation

### Rate Limit Exceeded
- Built-in 150ms delay between emails
- Upgrade Resend plan for higher limits
- Send in smaller batches

## 📞 Support

- **Resend Docs:** https://resend.com/docs
- **Resend Support:** support@resend.com
- **IconicMe Support:** consult@pixels.co.zw

## ✅ Post-Send Checklist

After sending to all users:

- [ ] Monitor Resend dashboard for delivery issues
- [ ] Check bounce rate (should be <2%)
- [ ] Respond to user questions/concerns
- [ ] Update any remaining "Animate" branding
- [ ] Set up domain redirect (animate.pixels.co.zw → iconicme.shop)
- [ ] Update social media profiles
- [ ] Update app store listings
- [ ] Update payment gateway branding

---

**Ready to send?** Start with Test Mode, then proceed carefully! 🚀

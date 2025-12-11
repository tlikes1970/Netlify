# Flicklet Pro Pricing Plan

**Last Updated:** 2025-12-10

---

## Regular Pricing

### Monthly Subscription
- **Price:** $2.99/month
- **Product ID:** `pro_subscription_monthly`
- **Billing Period:** Monthly
- **Auto-renewing:** Yes

### Yearly Subscription
- **Price:** $19.99/year
- **Product ID:** `pro_subscription_yearly`
- **Billing Period:** Yearly
- **Auto-renewing:** Yes
- **Savings:** ~44% compared to monthly ($35.88/year vs $19.99/year)

---

## Founders Launch Pricing (Limited-Time Offer)

**Availability:** Founders pricing will be available for **90 days after launch**.

**Note:** This is a limited-time promotional pricing for early adopters.

### Monthly Founders Subscription
- **Price:** $1.99/month
- **Product ID:** `pro_subscription_monthly_founders`
- **Billing Period:** Monthly
- **Auto-renewing:** Yes
- **Savings:** 33% off regular monthly pricing

### Yearly Founders Subscription
- **Price:** $14.99/year
- **Product ID:** `pro_subscription_yearly_founders`
- **Billing Period:** Yearly
- **Auto-renewing:** Yes
- **Savings:** ~37% compared to monthly founders ($23.88/year vs $14.99/year)
- **Savings vs Regular:** 25% off regular yearly pricing

---

## Implementation Notes

### Product IDs
- Regular products: `pro_subscription_monthly`, `pro_subscription_yearly`
- Founders products: `pro_subscription_monthly_founders`, `pro_subscription_yearly_founders`

### Google Play Console Setup
1. Create all products in Play Console → **Monetize** → **Products** → **In-app products**
2. Set exact prices as listed above
3. Activate all products before app submission

### Code Updates Required
- ✅ Backend products function updated (`netlify/functions/billing/products.cjs`)
- ✅ Play Console listing docs updated (`GOOGLE_PLAY_CONSOLE_LISTING.md`)
- ⚠️ If implementing founders pricing, update `proUpgrade.ts` to include founders product IDs

### Founders Pricing Strategy
- **When to offer:** **90 days after launch** (limited-time promotional period)
- **Duration:** Available for 90 days from launch date
- **How to implement:** 
  - Option 1: Create separate products in Play Console (recommended)
  - Option 2: Use promotional pricing/offers in Play Console
- **Migration:** Founders pricing will be grandfathered for existing subscribers (they keep the lower price as long as subscription remains active)
- **After 90 days:** Remove founders products from Play Console or set them to inactive (existing subscribers keep their pricing)

---

## Pricing Comparison

| Plan | Monthly | Yearly | Monthly Cost (Yearly) |
|------|---------|--------|----------------------|
| Regular | $2.99 | $19.99 | $1.67/month |
| Founders | $1.99 | $14.99 | $1.25/month |

**Yearly savings:**
- Regular: $15.89/year (44% savings)
- Founders: $8.89/year (37% savings)
- Founders vs Regular: $5.00/year (25% savings)

---

## Pro Features Included

All Pro subscriptions (regular and founders) include:

- ✅ Advanced Notifications (customizable timing, email, per-show settings)
- ✅ Unlimited Custom Lists (Free: 3 lists)
- ✅ Bloopers & Behind-the-Scenes Content
- ✅ Episode Tracking in Condensed View
- ✅ Extended Trivia (30 questions/day vs 10 free)
- ✅ More FlickWord Games (3/day vs 1 free)
- ✅ Enhanced Community Features (100 posts/500 comments vs 3/10 free)

---

**Status:** Pricing plan finalized and documented ✅


# Razorpay & Supabase Configuration Guide

## Step 1: Get Your Credentials from Razorpay

1.  Log in to the [Razorpay Dashboard](https://dashboard.razorpay.com/).
2.  **Select Mode**:
    *   For testing, ensure the toggle at the top right is set to **Test Mode**.
    *   For real payments, switch to **Live Mode**.
3.  Navigate to **Settings** (⚙️ icon in the sidebar) → **API Keys**.
4.  Click **Generate Key**.
5.  **Copy** the `Key ID` and `Key Secret`. (Save the secret somewhere safe; you won't see it again).

---

## Step 2: Add to Supabase Secrets

You need to store these keys so your Edge Functions can access them securely.

### Option A: Using the Supabase Website (Recommended)
1.  Go to your Supabase Project Dashboard.
2.  Click on **Settings** (⚙️ icon) in the sidebar.
3.  Click on **Edge Functions**.
4.  Adding the secrets:
    *   Click **Add Secret**.
    *   Name: `RAZORPAY_KEY_ID`
    *   Value: `rzp_test_...` (your copied ID)
    *   Click **Save**.
5.  Repeat for the secret:
    *   Name: `RAZORPAY_KEY_SECRET`
    *   Value: `...` (your copied secret)

### Option B: Using the Terminal
If you have the Supabase CLI linked, run this command in your terminal:

```bash
npx supabase secrets set RAZORPAY_KEY_ID=your_key_id RAZORPAY_KEY_SECRET=your_key_secret
```

---

## Step 3: Verify

Once set, try the "Upgrade" flow on the Subscription page again.
- If in **Test Mode**, use the UPI ID `success@razorpay` to simulate a successful payment.

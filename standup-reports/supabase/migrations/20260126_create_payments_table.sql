-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id),
    company_id UUID NOT NULL REFERENCES public.companies(id),
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their company payments" ON public.payments
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Only service role can insert/update payments (via Edge Functions)
-- We strictly control payment creation/updates via server-side logic

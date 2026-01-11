-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    price_monthly DECIMAL(10, 2) NOT NULL,
    max_users INT, -- NULL means unlimited
    features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    status TEXT NOT NULL DEFAULT 'active', -- active, cancelled, past_due
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for subscription_plans (Public read-only)
CREATE POLICY "Allow public read access to plans" ON public.subscription_plans
    FOR SELECT USING (true);

-- Policies for subscriptions (View own company's subscription)
CREATE POLICY "Users can view their company subscription" ON public.subscriptions
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Insert Default Plans
INSERT INTO public.subscription_plans (name, price_monthly, max_users, features) VALUES
('Free', 0, 5, '["Up to 5 Users", "Basic Reporting", "1 Month History"]'),
('Pro', 29, 100, '["Up to 100 Users", "Advanced Analytics", "Unlimited History", "Priority Support"]'),
('Enterprise', 99, 1000, '["Up to 1000 Users", "Custom Integrations", "Dedicated Manager", "SLA"]');

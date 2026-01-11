-- Update Pro Plan
UPDATE public.subscription_plans 
SET max_users = 100, 
    features = '["Up to 100 Users", "Advanced Analytics", "Unlimited History", "Priority Support"]'::jsonb 
WHERE name = 'Pro';

-- Update Enterprise Plan
UPDATE public.subscription_plans 
SET max_users = 1000, 
    features = '["Up to 1000 Users", "Custom Integrations", "Dedicated Manager", "SLA"]'::jsonb 
WHERE name = 'Enterprise';

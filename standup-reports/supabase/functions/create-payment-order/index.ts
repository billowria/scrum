import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Razorpay from "npm:razorpay@2.9.2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        const {
            data: { user },
        } = await supabaseClient.auth.getUser();

        if (!user) {
            throw new Error('User not authenticated');
        }

        const { plan_id, billing_cycle, company_id } = await req.json();

        // Fetch Plan Details
        const { data: plan, error: planError } = await supabaseClient
            .from('subscription_plans')
            .select('*')
            .eq('id', plan_id)
            .single();

        if (planError || !plan) {
            throw new Error('Invalid Plan');
        }

        // Calculate Amount
        let amount = plan.price_monthly;
        if (billing_cycle === 'yearly') {
            amount = Math.round(plan.price_monthly * 0.8 * 12); // 20% discount for yearly
        }

        // Amount must be in paise (multiply by 100)
        const amountInPaise = amount * 100;

        // Initialize Razorpay
        const razorpay = new Razorpay({
            key_id: Deno.env.get('RAZORPAY_KEY_ID') || 'rzp_test_placeholder', // Fallback for dev
            key_secret: Deno.env.get('RAZORPAY_KEY_SECRET') || 'secret_placeholder',
        });

        // Create Razorpay Order
        const options = {
            amount: amountInPaise,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                plan_id: plan_id,
                company_id: company_id,
                user_id: user.id
            }
        };

        const order = await razorpay.orders.create(options);

        // Log pending payment in DB
        const { error: dbError } = await supabaseClient
            .from('payments')
            .insert({
                user_id: user.id,
                company_id: company_id,
                plan_id: plan_id,
                amount: amount,
                currency: 'INR',
                razorpay_order_id: order.id,
                status: 'pending',
                billing_cycle: billing_cycle || 'monthly'
            });

        if (dbError) throw dbError;

        return new Response(
            JSON.stringify({
                order_id: order.id,
                amount: amount,
                currency: 'INR',
                key_id: Deno.env.get('RAZORPAY_KEY_ID')
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        );
    }
});

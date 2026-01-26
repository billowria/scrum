import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use Service Role for DB updates
        );

        const { order_id, payment_id, signature, company_id, plan_id } = await req.json();
        const secret = Deno.env.get('RAZORPAY_KEY_SECRET') || 'secret_placeholder';

        // Verify Signature
        const text = `${order_id}|${payment_id}`;
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);
        const key = await crypto.subtle.importKey(
            "raw",
            keyData,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );
        const signatureBuffer = await crypto.subtle.sign(
            "HMAC",
            key,
            encoder.encode(text)
        );

        // Convert buffer to hex string
        const generated_signature = Array.from(new Uint8Array(signatureBuffer))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

        if (generated_signature !== signature) {
            throw new Error('Invalid Signature');
        }

        // Update Payment Status
        const { error: paymentError } = await supabaseClient
            .from('payments')
            .update({
                status: 'success',
                razorpay_payment_id: payment_id,
                razorpay_signature: signature
            })
            .eq('razorpay_order_id', order_id);

        if (paymentError) throw paymentError;

        // Update Subscription
        // Calculate new period end (e.g., +1 month or +1 year) - simplified to 1 month for now.
        // In production, check billing_cycle from payment or pass it in.
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1); // Default to monthly for this example

        const { error: subError } = await supabaseClient
            .from('subscriptions')
            .upsert({
                company_id: company_id,
                plan_id: plan_id,
                status: 'active',
                current_period_start: startDate.toISOString(),
                current_period_end: endDate.toISOString()
            }, { onConflict: 'company_id' });

        if (subError) throw subError;

        return new Response(
            JSON.stringify({ success: true }),
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

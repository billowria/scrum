import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        const url = new URL(req.url);
        const paymentId = url.searchParams.get('payment_id');
        if (!paymentId) throw new Error('Payment ID required');

        // Fetch payment with plan details
        const { data: payment, error: paymentError } = await supabaseClient
            .from('payments')
            .select('*, plan:subscription_plans(name)')
            .eq('id', paymentId)
            .single();

        if (paymentError || !payment) throw new Error('Payment not found');

        // Verify user has access to this payment
        const { data: userData } = await supabaseClient
            .from('users')
            .select('company_id')
            .eq('id', user.id)
            .single();

        if (userData?.company_id !== payment.company_id) {
            throw new Error('Access denied');
        }

        // Fetch company details for invoice
        const { data: company } = await supabaseClient
            .from('companies')
            .select('name, billing_details')
            .eq('id', payment.company_id)
            .single();

        // Generate PDF
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFontSize(24);
        doc.setTextColor(59, 130, 246); // Blue
        doc.text('SYNC', 20, 25);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('Invoice', pageWidth - 20, 25, { align: 'right' });

        // Invoice Details
        doc.setFontSize(12);
        doc.setTextColor(0);
        const invoiceNumber = `INV-${String(payment.invoice_number || 1).padStart(6, '0')}`;
        doc.text(`Invoice #: ${invoiceNumber}`, 20, 45);
        doc.text(`Date: ${new Date(payment.created_at).toLocaleDateString('en-IN')}`, 20, 52);
        doc.text(`Status: ${payment.status.toUpperCase()}`, 20, 59);

        // Bill To
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('BILL TO:', 20, 75);
        doc.setTextColor(0);
        doc.setFontSize(11);
        doc.text(company?.name || 'Customer', 20, 82);
        if (company?.billing_details?.address) {
            doc.setFontSize(9);
            doc.text(company.billing_details.address, 20, 89);
        }
        if (company?.billing_details?.taxId) {
            doc.text(`GSTIN: ${company.billing_details.taxId}`, 20, 96);
        }

        // Line Items Table
        const tableY = 115;
        doc.setFillColor(248, 250, 252);
        doc.rect(20, tableY, pageWidth - 40, 10, 'F');
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('Description', 25, tableY + 7);
        doc.text('Qty', 120, tableY + 7);
        doc.text('Amount', pageWidth - 25, tableY + 7, { align: 'right' });

        doc.setTextColor(0);
        doc.setFontSize(11);
        const planName = payment.plan?.name || 'Subscription';
        const billingCycle = payment.billing_cycle || 'monthly';
        doc.text(`${planName} Plan (${billingCycle})`, 25, tableY + 20);
        doc.text('1', 120, tableY + 20);
        doc.text(`₹${Number(payment.amount).toFixed(2)}`, pageWidth - 25, tableY + 20, { align: 'right' });

        // Total
        doc.setDrawColor(200);
        doc.line(20, tableY + 30, pageWidth - 20, tableY + 30);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Total', 25, tableY + 40);
        doc.text(`₹${Number(payment.amount).toFixed(2)} ${payment.currency}`, pageWidth - 25, tableY + 40, { align: 'right' });

        // Payment Info
        if (payment.razorpay_payment_id) {
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(100);
            doc.text(`Payment ID: ${payment.razorpay_payment_id}`, 20, tableY + 60);
        }

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Thank you for your business!', pageWidth / 2, 270, { align: 'center' });
        doc.text('Questions? Contact support@sync.app', pageWidth / 2, 276, { align: 'center' });

        // Output
        const pdfOutput = doc.output('arraybuffer');

        return new Response(pdfOutput, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${invoiceNumber}.pdf"`,
            },
            status: 200,
        });

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

-- Add invoice_number column with auto-increment
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS invoice_number SERIAL;

-- Add billing_cycle column
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly';

-- Create index for faster invoice lookups
CREATE INDEX IF NOT EXISTS idx_payments_invoice_number ON public.payments(invoice_number);

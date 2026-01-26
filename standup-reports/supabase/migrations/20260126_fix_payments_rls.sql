-- Allow authenticated users to insert their own payment records
CREATE POLICY "Users can insert their own payments" ON public.payments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- Ensure the view policy covers what we need (view own company payments)
-- The existing "Users can view their company payments" policy should be sufficient for SELECT
-- But let's add a specific one for user_id just in case
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (
        auth.uid() = user_id
    );

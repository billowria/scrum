-- Allow users to insert a subscription for their specific company
CREATE POLICY "Users can insert their company subscription" ON public.subscriptions
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Allow users to update their specific company's subscription
CREATE POLICY "Users can update their company subscription" ON public.subscriptions
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM public.users WHERE id = auth.uid()
        )
    );

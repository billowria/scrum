import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useCompany } from '../contexts/CompanyContext';
import { motion } from 'framer-motion';
import { FiAlertTriangle } from 'react-icons/fi';

const SubscriptionGuard = ({ children }) => {
    const { currentCompany, userRole, loading: companyLoading } = useCompany();
    const [checking, setChecking] = useState(true);
    const [isBlocked, setIsBlocked] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        checkSubscriptionStatus();
    }, [currentCompany, location.pathname]);

    const checkSubscriptionStatus = async () => {
        // If company context is loading or no company, wait
        if (companyLoading || !currentCompany) {
            if (!companyLoading) setChecking(false);
            return;
        }

        try {
            // 1. Get Subscription
            const { data: subData } = await supabase
                .from('subscriptions')
                .select('*, plan:subscription_plans(*)')
                .eq('company_id', currentCompany.id)
                .eq('status', 'active')
                .single();

            // 2. Get User Count
            const { count } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', currentCompany.id);

            const planName = subData?.plan?.name || 'Free';
            const maxUsers = subData?.plan?.max_users || (subData ? 9999 : 5); // Default limit 5 for Free/No Plan

            // Check if Free plan AND over limit
            const isFree = planName === 'Free';
            const isOverLimit = count > maxUsers;

            if (isFree && isOverLimit) {
                setIsBlocked(true);
                // If not already on subscription page, redirect ONLY if admin
                if (location.pathname !== '/subscription' && userRole === 'admin') {
                    navigate('/subscription');
                }
            } else {
                setIsBlocked(false);
            }
        } catch (error) {
            console.error('Error checking subscription guard:', error);
        } finally {
            setChecking(false);
        }
    };

    if (companyLoading || checking) {
        // Optionally return a loading spinner here if you want strict blocking during load
        return <>{children}</>;
    }

    // If blocked, we allow rendering only if we are on the subscription page
    // The useEffect handles the redirect, but we hide content to prevent flashing
    if (isBlocked && location.pathname !== '/subscription') {
        return (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-2xl">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiAlertTriangle className="w-8 h-8 text-amber-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
                    <p className="text-gray-600 mb-6">
                        You have exceeded the user limit for the Free plan. Please upgrade your subscription to continue accessing the dashboard.
                    </p>
                    {userRole === 'admin' ? (
                        <button
                            onClick={() => navigate('/subscription')}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                        >
                            Go to Billing
                        </button>
                    ) : (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-amber-800 text-sm font-medium">
                            Please contact your workspace administrator to upgrade the subscription.
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default SubscriptionGuard;

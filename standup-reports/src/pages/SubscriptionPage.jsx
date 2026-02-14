import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiCreditCard, FiCheck, FiX, FiDownload, FiPlus, FiTrendingUp,
    FiCalendar, FiDollarSign, FiUsers, FiZap, FiShield, FiStar,
    FiArrowRight, FiGrid, FiFileText, FiActivity, FiBarChart2, FiClock, FiCheckCircle,
    FiInfo, FiLock, FiGlobe, FiCpu, FiAward
} from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import { useCompany } from '../contexts/CompanyContext';
import { useTheme } from '../context/ThemeContext';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import GlassmorphicToast from '../components/GlassmorphicToast';

/**
 * SubscriptionPage - A high-end, premium billing management experience.
 * Integrates multi-theme support (Space, Ocean, Forest, Dark/Light)
 * and features a liquid glass design system.
 */
export default function SubscriptionPage({ sidebarMode }) {
    const { currentCompany, userRole, loading: companyLoading } = useCompany();
    const { themeMode, theme, isAnimatedTheme } = useTheme();
    const isDark = theme === 'dark' || isAnimatedTheme;

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('plans'); // plans, billing, usage
    const [billingCycle, setBillingCycle] = useState('monthly'); // monthly, yearly
    const [plans, setPlans] = useState([]);
    const [currentPlan, setCurrentPlan] = useState(null);
    const [subscription, setSubscription] = useState(null); // Active subscription data
    const [userCount, setUserCount] = useState(0);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [toast, setToast] = useState({ show: false, type: '', message: '' });

    const [paymentMethods, setPaymentMethods] = useState([]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

    // Real Billing State
    const [billingDetails, setBillingDetails] = useState({ name: '', taxId: '', address: '' });
    const [billingHistory, setBillingHistory] = useState([]);

    // Real Usage Stats
    const [usageStats, setUsageStats] = useState({
        teamMembers: 0,
        reportsThisMonth: 0,
        totalReports: 0,
        activeDays: 0
    });
    const [usageTrend, setUsageTrend] = useState([]);

    const faqs = [
        { q: "Can I change plans at any time?", a: "Yes, you can upgrade or downgrade your plan instantly. Changes are prorated to your next billing cycle." },
        { q: "Do you offer a free trial?", a: "Every team starts on our Free plan which includes all essential features for up to 3 members." },
        { q: "What counts as a user?", a: "Any account joined to your company workspace is counted as a user, including admins and managers." },
        { q: "Is my payment information secure?", a: "We never store your full card details. All payments are processed through industry-leading secure providers." }
    ];

    // ... (rest of code) ...

    {/* Quick Info (Right) */ }
    <div className="hidden lg:flex items-center gap-6">
        <div className="text-right">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Plan</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{currentPlan?.name}</p>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div className="text-right">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Next Invoice</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
                {subscription?.current_period_end
                    ? new Date(subscription.current_period_end).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
                    : '---'}
            </p>
        </div>
    </div>

    useEffect(() => {
        if (currentCompany) fetchSubscriptionData();
    }, [currentCompany]);

    const saveBillingDetails = async () => {
        setProcessing(true);
        try {
            const { error } = await supabase
                .from('companies')
                .update({ billing_details: billingDetails })
                .eq('id', currentCompany.id);
            if (error) throw error;
            setToast({ show: true, type: 'success', message: 'Billing details updated' });
        } catch (err) {
            setToast({ show: true, type: 'error', message: err.message });
        } finally {
            setProcessing(false);
        }
    };

    const downloadInvoice = async (paymentId) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const projectUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zfyxudmjeytmdtigxmfc.supabase.co';

            const response = await fetch(`${projectUrl}/functions/v1/generate-invoice?payment_id=${paymentId}`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!response.ok) throw new Error('Failed to generate invoice');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${paymentId.slice(0, 8)}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setToast({ show: true, type: 'success', message: 'Invoice downloaded!' });
        } catch (err) {
            setToast({ show: true, type: 'error', message: err.message });
        }
    };

    const fetchSubscriptionData = async () => {
        setLoading(true);
        try {
            const { data: plansData } = await supabase
                .from('subscription_plans')
                .select('*')
                .order('price_monthly', { ascending: true });

            // Transform plans if needed to ensure features is an array
            const formattedPlans = (plansData || []).map(p => ({
                ...p,
                features: Array.isArray(p.features) ? p.features : []
            }));
            setPlans(formattedPlans);

            const { data: subData } = await supabase
                .from('subscriptions')
                .select('*, plan:subscription_plans(*)')
                .eq('company_id', currentCompany.id)
                .eq('status', 'active')
                .maybeSingle();

            if (subData) {
                setSubscription(subData); // Store full subscription data
                setCurrentPlan({
                    ...subData.plan,
                    features: Array.isArray(subData.plan.features) ? subData.plan.features : []
                });
            } else {
                setSubscription(null);
                const freePlan = formattedPlans.find(p => p.name === 'Free') || formattedPlans[0];
                setCurrentPlan(freePlan);
            }

            const { count } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', currentCompany.id);
            setUserCount(count || 0);

            // Fetch Billing History
            const { data: payments } = await supabase
                .from('payments')
                .select('*')
                .eq('company_id', currentCompany.id)
                .order('created_at', { ascending: false });
            setBillingHistory(payments || []);

            // Fetch Company Billing Details
            const { data: companyData } = await supabase
                .from('companies')
                .select('billing_details')
                .eq('id', currentCompany.id)
                .single();
            if (companyData?.billing_details) {
                setBillingDetails(companyData.billing_details);
            }

            // Fetch Usage Stats
            const now = new Date();
            const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            // Total reports this month
            const { count: reportsThisMonth } = await supabase
                .from('daily_reports')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', currentCompany.id)
                .gte('created_at', firstOfMonth);

            // Total reports all time
            const { count: totalReports } = await supabase
                .from('daily_reports')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', currentCompany.id);

            // Active days (unique days with reports this month)
            const { data: reportsData } = await supabase
                .from('daily_reports')
                .select('created_at')
                .eq('company_id', currentCompany.id)
                .gte('created_at', firstOfMonth);

            const uniqueDays = new Set(
                (reportsData || []).map(r => new Date(r.created_at).toDateString())
            ).size;

            setUsageStats({
                teamMembers: count || 0,
                reportsThisMonth: reportsThisMonth || 0,
                totalReports: totalReports || 0,
                activeDays: uniqueDays
            });

            // Calculate Usage Trend (Last 6 Months)
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
            sixMonthsAgo.setDate(1); // Start of that month

            const { data: trendData } = await supabase
                .from('daily_reports')
                .select('created_at')
                .eq('company_id', currentCompany.id)
                .gte('created_at', sixMonthsAgo.toISOString());

            const monthlyCounts = {};
            // Initialize last 6 months with 0
            for (let i = 0; i < 6; i++) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const key = d.toLocaleString('default', { month: 'short' });
                monthlyCounts[key] = 0;
            }

            (trendData || []).forEach(r => {
                const month = new Date(r.created_at).toLocaleString('default', { month: 'short' });
                if (monthlyCounts.hasOwnProperty(month)) {
                    monthlyCounts[month]++;
                }
            });

            const trendChartData = Object.entries(monthlyCounts)
                .map(([month, activity]) => ({ month, activity }))
                .reverse(); // Oldest first

            setUsageTrend(trendChartData);

        } catch (error) {
            console.error('Biling fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const [razorpayLoaded, setRazorpayLoaded] = useState(false);

    useEffect(() => {
        const loadRazorpay = () => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => setRazorpayLoaded(true);
            script.onerror = () => setToast({ show: true, type: 'error', message: 'Razorpay SDK failed to load' });
            document.body.appendChild(script);
        };
        loadRazorpay();
    }, []);

    const handleUpgrade = async () => {
        if (!selectedPlan) return;
        if (!razorpayLoaded) {
            setToast({ show: true, type: 'error', message: 'Payment gateway is initializing...' });
            return;
        }

        setProcessing(true);
        try {
            // 1. Create Order via Edge Function
            const { data: { session } } = await supabase.auth.getSession();

            // Use env var or fallback
            const projectUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zfyxudmjeytmdtigxmfc.supabase.co';
            const endpoint = `${projectUrl}/functions/v1/create-payment-order`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    plan_id: selectedPlan.id,
                    company_id: currentCompany.id,
                    billing_cycle: billingCycle
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create order');
            }

            const activeOrder = await response.json();

            // Handle Free Plan or 100% discount immediately
            if (activeOrder.amount === 0) {
                await verifyPayment({
                    order_id: activeOrder.order_id,
                    payment_id: 'free_plan',
                    signature: 'free_plan', // specific signature for free plan
                    plan_id: selectedPlan.id,
                    company_id: currentCompany.id,
                    billing_cycle: billingCycle
                });
                return;
            }

            // 2. Open Razorpay Checkout
            const options = {
                key: activeOrder.key_id,
                amount: activeOrder.amount * 100, // already in paise from backend? check backed logic. 
                // Ah backend returns native amount, and `amount` in options should be paise if previously converted? 
                // Let's re-read backend: returned `{ amount: amount }` where `amount` was raw (e.g. 29). 
                // Wait, backend response: `amount` is raw. `amountInPaise` was used for order creation.
                // Checkout options expects amount in subunits (paise). 
                // Let's ensure consistency.
                currency: activeOrder.currency,
                name: "SYNC",
                description: `Upgrade to ${selectedPlan.name} Plan`,
                order_id: activeOrder.order_id,
                handler: async function (response) {
                    await verifyPayment({
                        order_id: response.razorpay_order_id,
                        payment_id: response.razorpay_payment_id,
                        signature: response.razorpay_signature,
                        plan_id: selectedPlan.id,
                        company_id: currentCompany.id,
                        billing_cycle: billingCycle
                    });
                },
                prefill: {
                    name: userRole?.name || 'User', // User name if available
                    email: session.user.email,
                },
                theme: {
                    color: isDark ? '#3b82f6' : '#2563eb'
                },
                modal: {
                    ondismiss: function () {
                        setProcessing(false);
                        setToast({ show: true, type: 'info', message: 'Payment cancelled' });
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                setToast({ show: true, type: 'error', message: response.error.description });
                setProcessing(false);
            });
            rzp.open();

        } catch (err) {
            console.error('Payment error:', err);
            setToast({ show: true, type: 'error', message: err.message });
            setProcessing(false);
        }
    };

    const verifyPayment = async (paymentData) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const verifyRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify(paymentData)
            });

            if (!verifyRes.ok) throw new Error('Payment verification failed');

            setToast({ show: true, type: 'success', message: `Successfully upgraded to ${selectedPlan.name}!` });
            setShowUpgradeModal(false);
            fetchSubscriptionData(); // Refresh UI
        } catch (error) {
            setToast({ show: true, type: 'error', message: error.message });
        } finally {
            setProcessing(false);
        }
    };

    // Theme-based accent colors
    const accentColor = useMemo(() => {
        if (themeMode === 'ocean') return 'from-cyan-400 to-blue-600';
        if (themeMode === 'forest') return 'from-emerald-400 to-teal-600';
        if (themeMode === 'space') return 'from-indigo-400 to-purple-600';
        return 'from-blue-500 to-indigo-600';
    }, [themeMode]);

    const maxUsers = currentPlan?.max_users || 5;
    const progressPercent = Math.min((userCount / maxUsers) * 100, 100);

    const renewalDate = useMemo(() => {
        const lastSuccess = (billingHistory || []).find(p => p.status === 'success');
        if (lastSuccess) {
            const d = new Date(lastSuccess.created_at);
            d.setMonth(d.getMonth() + 1);
            return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        return subscription?.current_period_end
            ? new Date(subscription.current_period_end).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
            : '---';
    }, [billingHistory, subscription]);

    if (loading || companyLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="relative">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className={`w-16 h-16 border-4 border-t-transparent rounded-full ${accentColor.split(' ')[1].replace('to-', 'border-')}`}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <FiZap className="w-6 h-6 animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col relative overflow-x-hidden pt-20 pb-12 transition-all duration-700">
            {/* Background Texture/Grain */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            {/* Dynamic Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className={`absolute top-[-10%] left-[-5%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-20 bg-gradient-to-br ${accentColor}`} />
                <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-10 bg-gradient-to-tr from-purple-500 to-pink-500" />
            </div>

            {/* Premium Header Container */}
            <div
                className="fixed top-16 right-0 z-40 px-6 py-4 transition-all duration-300 pointer-events-none"
                style={{
                    left: sidebarMode === 'expanded' ? '272px' : sidebarMode === 'collapsed' ? '100px' : '0px',
                    width: sidebarMode === 'expanded' ? 'calc(100% - 272px)' : sidebarMode === 'collapsed' ? 'calc(100% - 100px)' : '100%'
                }}
            >
                <div className="pointer-events-auto relative px-6 py-3 rounded-3xl bg-white/40 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/20 dark:border-white/5 shadow-2xl flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-2xl bg-gradient-to-br ${accentColor} text-white shadow-lg shadow-blue-500/20`}>
                            <FiAward className="w-5 h-5" />
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Billing & Plans</h1>
                            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <FiCheckCircle className="w-3 h-3 text-emerald-500" /> Subscription Overview
                            </p>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex bg-slate-200/50 dark:bg-white/5 p-1 rounded-2xl border border-white/10 shadow-inner">
                        {[
                            { id: 'plans', label: 'Plans', icon: <FiGrid className="w-4 h-4" /> },
                            { id: 'billing', label: 'Billing', icon: <FiCreditCard className="w-4 h-4" /> },
                            { id: 'usage', label: 'Usage', icon: <FiActivity className="w-4 h-4" /> }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-300 ${activeTab === tab.id ? 'text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTabGlow"
                                        className={`absolute inset-0 rounded-xl bg-gradient-to-r ${accentColor} shadow-lg`}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center gap-2">
                                    {tab.icon}
                                    <span className="hidden md:inline">{tab.label}</span>
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Quick Info (Right) */}
                    <div className="hidden lg:flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Plan</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{currentPlan?.name}</p>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="text-right">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Next Invoice</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">Feb 01</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT Area */}
            <main className="px-6 w-full relative z-10">

                <GlassmorphicToast
                    isVisible={toast.show}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(prev => ({ ...prev, show: false }))}
                />

                {/* TAB: PLANS & PRICING */}
                {activeTab === 'plans' && (
                    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Premium Subscription Dashboard - Split Panel Design */}
                        {(() => {
                            // Theme-aware styling
                            const getThemeStyles = () => {
                                switch (themeMode) {
                                    case 'ocean':
                                        return {
                                            bg: isDark ? 'from-slate-950 via-cyan-950/50 to-slate-950' : 'from-cyan-50 via-blue-50 to-slate-50',
                                            orb1: 'rgba(6,182,212,0.4)', // cyan
                                            orb2: 'rgba(59,130,246,0.3)', // blue
                                            accent: 'from-cyan-400 via-blue-400 to-indigo-400',
                                            border: isDark ? 'border-cyan-500/20' : 'border-cyan-300/50',
                                            textPrimary: isDark ? 'text-white' : 'text-slate-900',
                                            textSecondary: isDark ? 'text-slate-400' : 'text-slate-600',
                                            textMuted: isDark ? 'text-slate-500' : 'text-slate-400',
                                            panelBg: isDark ? 'from-white/[0.02] to-transparent' : 'from-white/60 to-white/30',
                                            statBg: isDark ? 'bg-slate-900/50' : 'bg-white/70',
                                            bottomLine: 'from-cyan-500 via-blue-500 to-indigo-500'
                                        };
                                    case 'forest':
                                        return {
                                            bg: isDark ? 'from-slate-950 via-emerald-950/50 to-slate-950' : 'from-emerald-50 via-green-50 to-slate-50',
                                            orb1: 'rgba(16,185,129,0.4)', // emerald
                                            orb2: 'rgba(20,184,166,0.3)', // teal
                                            accent: 'from-emerald-400 via-green-400 to-teal-400',
                                            border: isDark ? 'border-emerald-500/20' : 'border-emerald-300/50',
                                            textPrimary: isDark ? 'text-white' : 'text-slate-900',
                                            textSecondary: isDark ? 'text-slate-400' : 'text-slate-600',
                                            textMuted: isDark ? 'text-slate-500' : 'text-slate-400',
                                            panelBg: isDark ? 'from-white/[0.02] to-transparent' : 'from-white/60 to-white/30',
                                            statBg: isDark ? 'bg-slate-900/50' : 'bg-white/70',
                                            bottomLine: 'from-emerald-500 via-green-500 to-teal-500'
                                        };
                                    case 'space':
                                        return {
                                            bg: 'from-slate-950 via-indigo-950/60 to-slate-950',
                                            orb1: 'rgba(139,92,246,0.4)', // violet
                                            orb2: 'rgba(236,72,153,0.3)', // pink
                                            accent: 'from-violet-400 via-purple-400 to-pink-400',
                                            border: 'border-violet-500/20',
                                            textPrimary: 'text-white',
                                            textSecondary: 'text-slate-400',
                                            textMuted: 'text-slate-500',
                                            panelBg: 'from-white/[0.02] to-transparent',
                                            statBg: 'bg-slate-900/50',
                                            bottomLine: 'from-violet-500 via-purple-500 to-pink-500'
                                        };
                                    default: // light or dark
                                        return {
                                            bg: isDark ? 'from-slate-950 via-slate-900 to-slate-950' : 'from-slate-100 via-white to-slate-100',
                                            orb1: isDark ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.2)', // indigo
                                            orb2: isDark ? 'rgba(236,72,153,0.3)' : 'rgba(236,72,153,0.15)', // pink
                                            accent: 'from-indigo-400 via-purple-400 to-pink-400',
                                            border: isDark ? 'border-white/10' : 'border-slate-200',
                                            textPrimary: isDark ? 'text-white' : 'text-slate-900',
                                            textSecondary: isDark ? 'text-slate-400' : 'text-slate-600',
                                            textMuted: isDark ? 'text-slate-500' : 'text-slate-400',
                                            panelBg: isDark ? 'from-white/[0.02] to-transparent' : 'from-slate-50/80 to-white/50',
                                            statBg: isDark ? 'bg-slate-900/50' : 'bg-white/80',
                                            bottomLine: 'from-blue-500 via-purple-500 to-pink-500'
                                        };
                                }
                            };
                            const styles = getThemeStyles();

                            return (
                                <motion.section
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`relative rounded-[2rem] overflow-hidden border ${styles.border} shadow-2xl`}
                                >
                                    {/* Theme-aware Background */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${styles.bg}`} />

                                    {/* Animated mesh gradient orbs */}
                                    <div className="absolute inset-0 overflow-hidden">
                                        <motion.div
                                            className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full opacity-30"
                                            style={{ background: `radial-gradient(circle, ${styles.orb1} 0%, transparent 70%)` }}
                                            animate={{
                                                scale: [1, 1.2, 1],
                                                x: [0, 50, 0],
                                                y: [0, -30, 0]
                                            }}
                                            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                                        />
                                        <motion.div
                                            className="absolute -bottom-1/2 -left-1/4 w-[600px] h-[600px] rounded-full opacity-20"
                                            style={{ background: `radial-gradient(circle, ${styles.orb2} 0%, transparent 70%)` }}
                                            animate={{
                                                scale: [1, 1.3, 1],
                                                x: [0, -30, 0],
                                                y: [0, 40, 0]
                                            }}
                                            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                                        />
                                        {/* Third subtle orb for depth */}
                                        <motion.div
                                            className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full opacity-10"
                                            style={{ background: `radial-gradient(circle, ${styles.orb1} 0%, transparent 60%)` }}
                                            animate={{
                                                scale: [1, 1.1, 1],
                                                rotate: [0, 180, 360]
                                            }}
                                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                        />
                                    </div>

                                    {/* Glassmorphic overlay for light mode */}
                                    {!isDark && (
                                        <div className="absolute inset-0 backdrop-blur-[2px] bg-white/30" />
                                    )}

                                    {/* Noise texture overlay */}
                                    <div className={`absolute inset-0 ${isDark ? 'opacity-[0.015]' : 'opacity-[0.03]'}`} style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />

                                    <div className="relative">
                                        {/* Main Content Grid */}
                                        <div className="grid lg:grid-cols-12 gap-0">

                                            {/* LEFT PANEL - Plan Identity */}
                                            <div className={`lg:col-span-5 p-8 lg:p-12 flex flex-col justify-between border-r ${isDark ? 'border-white/5' : 'border-slate-200/50'}`}>
                                                {/* Plan Badge */}
                                                <div>
                                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-100 border border-emerald-200'}`}>
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                        </span>
                                                        <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Active Subscription</span>
                                                    </div>

                                                    {/* Plan Name - Large Typography */}
                                                    <h1 className={`text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.9] mb-4 ${styles.textPrimary}`}>
                                                        {currentPlan?.name || 'Free'}
                                                        <span className={`block text-transparent bg-clip-text bg-gradient-to-r ${styles.accent}`}>
                                                            Plan
                                                        </span>
                                                    </h1>

                                                    {/* Price Display */}
                                                    <div className="flex items-baseline gap-2 mb-8">
                                                        {currentPlan?.discount_price && Number(currentPlan.discount_price) > Number(currentPlan.price_monthly) && (
                                                            <span className={`text-xl line-through font-medium ${styles.textMuted}`}>₹{currentPlan.discount_price}</span>
                                                        )}
                                                        <span className={`text-5xl font-black ${styles.textPrimary}`}>₹{currentPlan?.price_monthly || 0}</span>
                                                        <span className={`text-lg font-medium ${styles.textSecondary}`}>/month</span>
                                                    </div>
                                                </div>

                                                {/* Next Billing Info */}
                                                <div className="space-y-4">
                                                    <div className={`flex items-center gap-3 ${styles.textSecondary}`}>
                                                        <FiCalendar className="w-5 h-5" />
                                                        <span className="text-sm font-medium">Next billing on</span>
                                                    </div>
                                                    <p className={`text-2xl font-bold ${styles.textPrimary}`}>{renewalDate}</p>
                                                </div>
                                            </div>

                                            {/* RIGHT PANEL - Premium Live Metrics */}
                                            <div className={`lg:col-span-7 p-8 lg:p-12 bg-gradient-to-br ${styles.panelBg}`}>

                                                {/* Premium Circular Gauges */}
                                                <div className="flex flex-wrap gap-6 lg:gap-8 mb-10">

                                                    {/* Team Capacity Gauge - Premium Card */}
                                                    <motion.div
                                                        className="flex-1 min-w-[160px]"
                                                        whileHover={{ scale: 1.02, y: -4 }}
                                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                                    >
                                                        <div className={`relative p-6 rounded-3xl backdrop-blur-xl border transition-all duration-500 group
                                                            ${isDark
                                                                ? 'bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/10 hover:border-cyan-500/30 hover:shadow-[0_0_40px_-10px_rgba(6,182,212,0.3)]'
                                                                : 'bg-gradient-to-br from-white/80 to-white/40 border-slate-200/50 hover:border-cyan-400/50 hover:shadow-[0_20px_50px_-15px_rgba(6,182,212,0.25)]'
                                                            }`}
                                                        >
                                                            {/* Animated glow pulse */}
                                                            <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500
                                                                ${isDark ? 'bg-gradient-to-br from-cyan-500/5 to-blue-500/5' : 'bg-gradient-to-br from-cyan-100/50 to-blue-100/30'}`}
                                                            />

                                                            <div className="relative">
                                                                <div className="relative w-24 h-24 mx-auto mb-4">
                                                                    {/* Outer glow ring */}
                                                                    <div className="absolute inset-[-4px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-md bg-gradient-to-r from-cyan-500 to-blue-500" />

                                                                    <svg className="w-full h-full -rotate-90 relative" viewBox="0 0 100 100">
                                                                        <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className={isDark ? 'text-slate-800/50' : 'text-slate-200'} />
                                                                        <motion.circle
                                                                            cx="50" cy="50" r="42" fill="none"
                                                                            stroke="url(#teamGradient)"
                                                                            strokeWidth="6"
                                                                            strokeLinecap="round"
                                                                            strokeDasharray={`${2 * Math.PI * 42}`}
                                                                            initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                                                                            animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - (userCount / (maxUsers || 100))) }}
                                                                            transition={{ duration: 1.5, ease: "circOut", delay: 0.2 }}
                                                                            style={{ filter: 'drop-shadow(0 0 6px rgba(6,182,212,0.4))' }}
                                                                        />
                                                                        <defs>
                                                                            <linearGradient id="teamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                                                <stop offset="0%" stopColor="#3b82f6" />
                                                                                <stop offset="100%" stopColor="#06b6d4" />
                                                                            </linearGradient>
                                                                        </defs>
                                                                    </svg>

                                                                    {/* Center content with glass effect */}
                                                                    <div className={`absolute inset-3 rounded-full flex flex-col items-center justify-center
                                                                        ${isDark ? 'bg-slate-900/60 backdrop-blur-sm' : 'bg-white/70 backdrop-blur-sm'}`}
                                                                    >
                                                                        <span className={`text-xl font-black ${styles.textPrimary}`}>{(maxUsers || 100) - userCount}</span>
                                                                    </div>
                                                                </div>

                                                                <div className="text-center space-y-1">
                                                                    <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Team Seats</p>
                                                                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                                                                        ${isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-100 text-cyan-700'}`}
                                                                    >
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                                                        {userCount}/{maxUsers || 100}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>

                                                    {/* Days Remaining Gauge - Premium Card */}
                                                    {(() => {
                                                        const today = new Date();
                                                        const nextBilling = billingHistory[0]?.created_at
                                                            ? new Date(new Date(billingHistory[0].created_at).setMonth(new Date(billingHistory[0].created_at).getMonth() + 1))
                                                            : new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
                                                        const daysRemaining = Math.max(0, Math.ceil((nextBilling - today) / (1000 * 60 * 60 * 24)));
                                                        const progress = daysRemaining / 30;

                                                        return (
                                                            <motion.div
                                                                className="flex-1 min-w-[160px]"
                                                                whileHover={{ scale: 1.02, y: -4 }}
                                                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                                            >
                                                                <div className={`relative p-6 rounded-3xl backdrop-blur-xl border transition-all duration-500 group
                                                                    ${isDark
                                                                        ? 'bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/10 hover:border-purple-500/30 hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.3)]'
                                                                        : 'bg-gradient-to-br from-white/80 to-white/40 border-slate-200/50 hover:border-purple-400/50 hover:shadow-[0_20px_50px_-15px_rgba(168,85,247,0.25)]'
                                                                    }`}
                                                                >
                                                                    <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500
                                                                        ${isDark ? 'bg-gradient-to-br from-purple-500/5 to-pink-500/5' : 'bg-gradient-to-br from-purple-100/50 to-pink-100/30'}`}
                                                                    />

                                                                    <div className="relative">
                                                                        <div className="relative w-24 h-24 mx-auto mb-4">
                                                                            <div className="absolute inset-[-4px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-md bg-gradient-to-r from-purple-500 to-pink-500" />

                                                                            <svg className="w-full h-full -rotate-90 relative" viewBox="0 0 100 100">
                                                                                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className={isDark ? 'text-slate-800/50' : 'text-slate-200'} />
                                                                                <motion.circle
                                                                                    cx="50" cy="50" r="42" fill="none"
                                                                                    stroke="url(#daysGradient)"
                                                                                    strokeWidth="6"
                                                                                    strokeLinecap="round"
                                                                                    strokeDasharray={`${2 * Math.PI * 42}`}
                                                                                    initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                                                                                    animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - progress) }}
                                                                                    transition={{ duration: 1.5, ease: "circOut", delay: 0.4 }}
                                                                                    style={{ filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.4))' }}
                                                                                />
                                                                                <defs>
                                                                                    <linearGradient id="daysGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                                                        <stop offset="0%" stopColor="#a855f7" />
                                                                                        <stop offset="100%" stopColor="#ec4899" />
                                                                                    </linearGradient>
                                                                                </defs>
                                                                            </svg>

                                                                            <div className={`absolute inset-3 rounded-full flex flex-col items-center justify-center
                                                                                ${isDark ? 'bg-slate-900/60 backdrop-blur-sm' : 'bg-white/70 backdrop-blur-sm'}`}
                                                                            >
                                                                                <span className={`text-xl font-black ${styles.textPrimary}`}>{daysRemaining}</span>
                                                                            </div>
                                                                        </div>

                                                                        <div className="text-center space-y-1">
                                                                            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Days Left</p>
                                                                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                                                                                ${isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-100 text-purple-700'}`}
                                                                            >
                                                                                <FiClock className="w-3 h-3" />
                                                                                Cycle
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })()}

                                                    {/* Reports Quota Gauge - Premium Card */}
                                                    {(() => {
                                                        const maxReports = currentPlan?.name === 'Free' ? 50 : 500;
                                                        const used = usageStats.reportsThisMonth;
                                                        const remaining = Math.max(0, maxReports - used);
                                                        const progress = used / maxReports;

                                                        return (
                                                            <motion.div
                                                                className="flex-1 min-w-[160px]"
                                                                whileHover={{ scale: 1.02, y: -4 }}
                                                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                                            >
                                                                <div className={`relative p-6 rounded-3xl backdrop-blur-xl border transition-all duration-500 group
                                                                    ${isDark
                                                                        ? 'bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/10 hover:border-emerald-500/30 hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]'
                                                                        : 'bg-gradient-to-br from-white/80 to-white/40 border-slate-200/50 hover:border-emerald-400/50 hover:shadow-[0_20px_50px_-15px_rgba(16,185,129,0.25)]'
                                                                    }`}
                                                                >
                                                                    <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500
                                                                        ${isDark ? 'bg-gradient-to-br from-emerald-500/5 to-teal-500/5' : 'bg-gradient-to-br from-emerald-100/50 to-teal-100/30'}`}
                                                                    />

                                                                    <div className="relative">
                                                                        <div className="relative w-24 h-24 mx-auto mb-4">
                                                                            <div className="absolute inset-[-4px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-md bg-gradient-to-r from-emerald-500 to-teal-500" />

                                                                            <svg className="w-full h-full -rotate-90 relative" viewBox="0 0 100 100">
                                                                                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className={isDark ? 'text-slate-800/50' : 'text-slate-200'} />
                                                                                <motion.circle
                                                                                    cx="50" cy="50" r="42" fill="none"
                                                                                    stroke="url(#reportsGradient)"
                                                                                    strokeWidth="6"
                                                                                    strokeLinecap="round"
                                                                                    strokeDasharray={`${2 * Math.PI * 42}`}
                                                                                    initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                                                                                    animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - progress) }}
                                                                                    transition={{ duration: 1.5, ease: "circOut", delay: 0.6 }}
                                                                                    style={{ filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.4))' }}
                                                                                />
                                                                                <defs>
                                                                                    <linearGradient id="reportsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                                                        <stop offset="0%" stopColor="#10b981" />
                                                                                        <stop offset="100%" stopColor="#14b8a6" />
                                                                                    </linearGradient>
                                                                                </defs>
                                                                            </svg>

                                                                            <div className={`absolute inset-3 rounded-full flex flex-col items-center justify-center
                                                                                ${isDark ? 'bg-slate-900/60 backdrop-blur-sm' : 'bg-white/70 backdrop-blur-sm'}`}
                                                                            >
                                                                                <span className={`text-xl font-black ${styles.textPrimary}`}>{remaining}</span>
                                                                            </div>
                                                                        </div>

                                                                        <div className="text-center space-y-1">
                                                                            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Reports Left</p>
                                                                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                                                                                ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}
                                                                            >
                                                                                <FiFileText className="w-3 h-3" />
                                                                                {used}/{maxReports}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })()}
                                                </div>

                                                {/* Premium Quick Stats Strip */}
                                                <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4`}>
                                                    {[
                                                        { label: 'Active Days', value: usageStats.activeDays, suffix: '/30', icon: <FiActivity className="w-4 h-4" />, color: 'blue' },
                                                        { label: 'Total Reports', value: usageStats.totalReports, suffix: '', icon: <FiBarChart2 className="w-4 h-4" />, color: 'purple' },
                                                        { label: 'Last Payment', value: billingHistory[0] ? new Date(billingHistory[0].created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A', suffix: '', icon: <FiCreditCard className="w-4 h-4" />, color: 'amber' },
                                                        { label: 'Plan Status', value: 'Active', suffix: '', icon: <FiShield className="w-4 h-4" />, color: 'emerald', isStatus: true }
                                                    ].map((item, i) => (
                                                        <motion.div
                                                            key={i}
                                                            className={`relative p-4 lg:p-5 rounded-2xl backdrop-blur-xl border transition-all duration-300 group overflow-hidden
                                                                ${isDark
                                                                    ? 'bg-gradient-to-br from-white/[0.06] to-white/[0.02] border-white/10 hover:border-white/20'
                                                                    : 'bg-gradient-to-br from-white/90 to-white/60 border-slate-200/50 hover:border-slate-300 hover:shadow-lg'
                                                                }`}
                                                            whileHover={{ scale: 1.02 }}
                                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                                        >
                                                            {/* Subtle gradient accent on hover */}
                                                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
                                                                ${item.color === 'blue' ? 'bg-gradient-to-br from-blue-500/5 to-cyan-500/5' : ''}
                                                                ${item.color === 'purple' ? 'bg-gradient-to-br from-purple-500/5 to-pink-500/5' : ''}
                                                                ${item.color === 'amber' ? 'bg-gradient-to-br from-amber-500/5 to-orange-500/5' : ''}
                                                                ${item.color === 'emerald' ? 'bg-gradient-to-br from-emerald-500/5 to-teal-500/5' : ''}
                                                            `} />

                                                            <div className="relative">
                                                                <div className={`flex items-center gap-2 mb-3 ${styles.textMuted}`}>
                                                                    <div className={`p-1.5 rounded-lg
                                                                        ${isDark ? 'bg-white/5' : 'bg-slate-100'}
                                                                        ${item.color === 'blue' ? 'text-blue-500' : ''}
                                                                        ${item.color === 'purple' ? 'text-purple-500' : ''}
                                                                        ${item.color === 'amber' ? 'text-amber-500' : ''}
                                                                        ${item.color === 'emerald' ? 'text-emerald-500' : ''}
                                                                    `}>
                                                                        {item.icon}
                                                                    </div>
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                                                                </div>
                                                                <p className={`text-2xl font-black ${item.isStatus ? 'text-emerald-500' : styles.textPrimary}`}>
                                                                    {item.value}{item.suffix && <span className={`text-sm font-bold ml-0.5 ${styles.textMuted}`}>{item.suffix}</span>}
                                                                </p>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>

                                            </div>
                                        </div>

                                        {/* Bottom Accent Line with gradient */}
                                        <div className={`h-1 bg-gradient-to-r ${styles.bottomLine}`} />
                                    </div>
                                </motion.section>
                            );
                        })()}

                        {/* Pricing Strip - Horizontal Scrollable */}
                        <section className="space-y-6">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Choose Your Plan</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
                                        Swipe to explore • Hover for details
                                    </p>
                                </div>

                                {/* Cycle Toggle - Compact */}
                                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-white/5">
                                    <span className={`text-xs font-bold transition-colors ${billingCycle === 'monthly' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>Monthly</span>
                                    <button
                                        onClick={() => setBillingCycle(c => c === 'monthly' ? 'yearly' : 'monthly')}
                                        className="w-10 h-5 bg-slate-300 dark:bg-slate-700 rounded-full p-0.5 relative transition-colors"
                                    >
                                        <motion.div
                                            animate={{ x: billingCycle === 'monthly' ? 0 : 20 }}
                                            className={`w-4 h-4 rounded-full bg-gradient-to-br ${accentColor} shadow-md`}
                                        />
                                    </button>
                                    <span className={`text-xs font-bold transition-colors flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                                        Yearly
                                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[9px] font-black">-20%</span>
                                    </span>
                                </div>
                            </div>

                            {/* Full-width Plan Cards Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {plans.map((plan) => (
                                    <CompactPlanCard
                                        key={plan.id}
                                        plan={plan}
                                        currentPlanId={currentPlan?.id}
                                        billingCycle={billingCycle}
                                        accentColor={accentColor}
                                        onSelect={() => {
                                            setSelectedPlan(plan);
                                            setShowUpgradeModal(true);
                                        }}
                                    />
                                ))}
                            </div>
                        </section>

                        {/* Feature Comparison Mini-Table */}
                        <section className="pt-8">
                            <div className="rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 overflow-hidden shadow-xl">
                                <div className="p-8 border-b border-slate-200 dark:border-white/5">
                                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">Plan Comparison</h4>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-white/5">
                                                <th className="px-8 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">Capabilities</th>
                                                <th className="px-8 py-5 text-sm font-bold text-slate-900 dark:text-white text-center">Free</th>
                                                <th className="px-8 py-5 text-sm font-bold text-slate-900 dark:text-white text-center bg-blue-500/5">Pro</th>
                                                <th className="px-8 py-5 text-sm font-bold text-slate-900 dark:text-white text-center">Enterprise</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                            {[
                                                { label: "AI Report Summaries", free: false, pro: true, ent: true },
                                                { label: "Advanced Analytics Dashboards", free: false, pro: "Partial", ent: true },
                                                { label: "SSO & SAML Integration", free: false, pro: false, ent: true },
                                                { label: "Priority Support Response", free: "Standard", pro: "Priority", ent: "Dedicated" },
                                                { label: "Custom Export Layouts", free: false, pro: true, ent: true },
                                                { label: "Workspace Backup & Restore", free: "Weekly", pro: "Daily", ent: "Hourly" },
                                            ].map((row, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                    <td className="px-8 py-5 text-sm font-medium text-slate-700 dark:text-slate-300">{row.label}</td>
                                                    <td className="px-8 py-5 text-center">{typeof row.free === 'boolean' ? (row.free ? <FiCheck className="mx-auto text-emerald-500" /> : <FiX className="mx-auto text-slate-300" />) : <span className="text-xs font-bold text-slate-400">{row.free}</span>}</td>
                                                    <td className="px-8 py-5 text-center bg-blue-500/5">{typeof row.pro === 'boolean' ? (row.pro ? <FiCheck className="mx-auto text-blue-500" /> : <FiX className="mx-auto text-slate-300" />) : <span className="text-xs font-bold text-blue-500">{row.pro}</span>}</td>
                                                    <td className="px-8 py-5 text-center">{typeof row.ent === 'boolean' ? (row.ent ? <FiCheck className="mx-auto text-indigo-500" /> : <FiX className="mx-auto text-slate-300" />) : <span className="text-xs font-bold text-indigo-500">{row.ent}</span>}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>

                        {/* FAQs */}
                        <section className="max-w-4xl mx-auto space-y-12">
                            <div className="text-center">
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white">Got Questions?</h3>
                                <p className="text-slate-500 mt-2">Everything you need to know about our billing process.</p>
                            </div>
                            <div className="grid gap-4">
                                {faqs.map((faq, idx) => (
                                    <details key={idx} className="group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 overflow-hidden transition-all shadow-sm">
                                        <summary className="flex items-center justify-between p-6 cursor-pointer list-none list-inside font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                            {faq.q}
                                            <FiPlus className="w-5 h-5 transition-transform group-open:rotate-45" />
                                        </summary>
                                        <div className="px-6 pb-6 text-slate-500 dark:text-slate-400 font-medium leading-relaxed animate-in fade-in slide-in-from-top-2">
                                            {faq.a}
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </section>
                    </div>
                )
                }

                {/* TAB: BILLING & PAYMENTS */}
                {
                    activeTab === 'billing' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Billing Overview Header */}
                            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 border border-white/5 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-3xl" />
                                <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Current Subscription</p>
                                        <h2 className="text-3xl font-black text-white">{currentPlan?.name || 'Free'} Plan</h2>
                                        <p className="text-slate-400 mt-1">
                                            {subscription?.current_period_end
                                                ? `Renews ${new Date(subscription.current_period_end).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`
                                                : 'No active billing cycle'}
                                        </p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="text-center px-6 py-4 rounded-2xl bg-white/5 border border-white/10">
                                            <p className="text-3xl font-black text-white">₹{currentPlan?.price_monthly || 0}</p>
                                            <p className="text-xs text-slate-400 font-bold uppercase">/month</p>
                                        </div>
                                        <div className="text-center px-6 py-4 rounded-2xl bg-white/5 border border-white/10">
                                            <p className="text-3xl font-black text-emerald-400">{billingHistory.filter(p => p.status === 'success').length}</p>
                                            <p className="text-xs text-slate-400 font-bold uppercase">Invoices</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Billing Details Form */}
                                <section className="lg:col-span-1 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Billing Details</h3>
                                    </div>
                                    <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-xl space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-slate-500">Company Name</label>
                                            <input
                                                value={billingDetails.name || ''}
                                                onChange={e => setBillingDetails({ ...billingDetails, name: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Acme Corp"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-slate-500">Tax ID / GSTIN</label>
                                            <input
                                                value={billingDetails.taxId || ''}
                                                onChange={e => setBillingDetails({ ...billingDetails, taxId: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="GSTIN12345"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-slate-500">Billing Address</label>
                                            <textarea
                                                value={billingDetails.address || ''}
                                                onChange={e => setBillingDetails({ ...billingDetails, address: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none"
                                                placeholder="123 Business Park, Mumbai"
                                            />
                                        </div>
                                        <button
                                            onClick={saveBillingDetails}
                                            disabled={processing}
                                            className={`w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r ${accentColor} shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50`}
                                        >
                                            {processing ? 'Saving...' : 'Save Details'}
                                        </button>
                                    </div>

                                    {/* Security Badge */}
                                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-3">
                                        <FiShield className="w-5 h-5 text-emerald-500" />
                                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Payments secured by Razorpay</p>
                                    </div>
                                </section>

                                {/* Invoice History */}
                                <section className="lg:col-span-2 space-y-6">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Invoice History</h3>
                                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-white/5 overflow-hidden shadow-xl">
                                        {billingHistory.length === 0 ? (
                                            <div className="p-12 text-center">
                                                <FiFileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                                <p className="text-slate-500 font-medium">No invoices yet</p>
                                                <p className="text-xs text-slate-400 mt-1">Your payment history will appear here</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-100 dark:divide-white/5">
                                                {billingHistory.map(invoice => (
                                                    <div key={invoice.id} className="p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center justify-between group">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${invoice.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                                {invoice.status === 'success' ? <FiCheckCircle className="w-5 h-5" /> : <FiClock className="w-5 h-5" />}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 dark:text-white">
                                                                    INV-{String(invoice.invoice_number || 1).padStart(6, '0')}
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    {new Date(invoice.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                    {invoice.billing_cycle && ` • ${invoice.billing_cycle}`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-right">
                                                                <p className="font-bold text-slate-900 dark:text-white">₹{Number(invoice.amount).toFixed(2)}</p>
                                                                <span className={`text-xs font-bold uppercase ${invoice.status === 'success' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                                    {invoice.status}
                                                                </span>
                                                            </div>
                                                            {invoice.status === 'success' && (
                                                                <motion.button
                                                                    whileHover={{ scale: 1.1 }}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    onClick={() => downloadInvoice(invoice.id)}
                                                                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                                                                    title="Download Invoice"
                                                                >
                                                                    <FiDownload className="w-4 h-4" />
                                                                </motion.button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>
                    )
                }

                {/* TAB: USAGE MONITORING */}
                {
                    activeTab === 'usage' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Stats Summary Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {[
                                    { label: "Team Members", val: usageStats.teamMembers.toString(), icon: <FiUsers />, color: "blue" },
                                    { label: "Reports This Month", val: usageStats.reportsThisMonth.toString(), icon: <FiFileText />, color: "purple" },
                                    { label: "Total Reports", val: usageStats.totalReports.toString(), icon: <FiZap />, color: "emerald" },
                                    { label: "Active Days", val: usageStats.activeDays.toString(), icon: <FiCalendar />, color: "cyan" },
                                ].map((stat, i) => (
                                    <motion.div
                                        key={i}
                                        whileHover={{ y: -5 }}
                                        className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-xl relative overflow-hidden"
                                    >
                                        <div className={`p-2 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-500 w-fit mb-4`}>
                                            {stat.icon}
                                        </div>
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                                        <div className="flex items-baseline justify-between mt-1">
                                            <p className="text-2xl font-black text-slate-900 dark:text-white">{stat.val}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Usage Chart Container */}
                            <div className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-2xl">
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Usage Analytics</h3>
                                        <p className="text-slate-500 font-medium">Monitoring team growth and platform engagement.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-xs font-bold text-slate-900 dark:text-white border border-white/5">Daily</button>
                                        <button className="px-4 py-2 rounded-xl bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20">Monthly</button>
                                    </div>
                                </div>

                                <div className="h-[400px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={usageTrend}>
                                            <defs>
                                                <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.05)"} />
                                            <XAxis
                                                dataKey="month"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 12, fontWeight: 700 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 12, fontWeight: 700 }}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                                                    borderRadius: '16px',
                                                    border: 'none',
                                                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                                                    fontWeight: 800
                                                }}
                                                itemStyle={{ color: '#3b82f6' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="activity"
                                                stroke="#3b82f6"
                                                strokeWidth={4}
                                                fillOpacity={1}
                                                fill="url(#usageGradient)"
                                                animationDuration={2000}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )
                }
            </main >

            {/* UPGRADE MODAL */}
            < AnimatePresence >
                {showUpgradeModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/10"
                        >
                            <div className="relative p-8 md:p-12">
                                <button onClick={() => setShowUpgradeModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                    <FiX className="w-8 h-8" />
                                </button>

                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <p className="text-blue-500 font-black uppercase tracking-widest text-sm">Review Order</p>
                                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Upgrade to {selectedPlan?.name}</h3>
                                    </div>

                                    <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500 font-bold">New Plan</span>
                                            <span className="font-black text-slate-900 dark:text-white">{selectedPlan?.name}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500 font-bold">Billing Frequency</span>
                                            <span className="font-black text-slate-900 dark:text-white capitalize">{billingCycle}</span>
                                        </div>
                                        <div className="h-px bg-slate-200 dark:bg-white/10" />
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-500 font-bold">Total Amount</span>
                                            <span className="text-3xl font-black text-blue-500">
                                                ${billingCycle === 'monthly' ? selectedPlan?.price_monthly : Math.round(selectedPlan?.price_monthly * 0.8 * 12)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Select Payment Method</p>
                                        <div className="space-y-2">
                                            {paymentMethods.map(method => (
                                                <button
                                                    key={method.id}
                                                    onClick={() => setSelectedPaymentMethod(method)}
                                                    className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all border-2 ${selectedPaymentMethod?.id === method.id
                                                        ? 'border-blue-500 bg-blue-500/5'
                                                        : 'border-slate-100 dark:border-white/5 bg-transparent opacity-60'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <FiCreditCard className="w-5 h-5 text-blue-500" />
                                                        <span className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">•••• {method.last4}</span>
                                                    </div>
                                                    {selectedPaymentMethod?.id === method.id && <FiCheckCircle className="text-blue-500" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleUpgrade}
                                        disabled={processing}
                                        className={`w-full py-5 rounded-[2rem] font-black text-white text-lg shadow-xl shadow-blue-500/20 flex items-center justify-center bg-gradient-to-r ${accentColor} ${processing ? 'opacity-50' : ''}`}
                                    >
                                        {processing ? (
                                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><FiZap /></motion.div>
                                        ) : `Confirm & Upgrade to ${selectedPlan?.name}`}
                                    </motion.button>

                                    <p className="text-[10px] text-center text-slate-500 font-bold uppercase leading-relaxed tracking-wider px-8">
                                        By clicking upgrade, you authorize an immediate charge for the prorated amount. You can revert this action in the command center within 24 hours.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence >
        </div >
    );
}

/**
 * Compact Pricing Ticket Card - Refined with theme-aware design
 * Features always visible, consistent backgrounds, flexible width
 */
function CompactPlanCard({ plan, currentPlanId, billingCycle, accentColor, onSelect }) {
    const { themeMode } = useTheme();
    const isCurrent = plan.id === currentPlanId;
    const isPremium = plan.name === 'Pro' || plan.name === 'Super-Pro';

    // price_monthly is the discounted buy price, discount_price is the original price
    const discountedPrice = billingCycle === 'monthly'
        ? Number(plan.price_monthly)
        : Math.round(Number(plan.price_monthly) * 0.8 * 12);
    const originalPrice = billingCycle === 'monthly'
        ? Number(plan.discount_price) || Number(plan.price_monthly)
        : Math.round((Number(plan.discount_price) || Number(plan.price_monthly)) * 12);

    // Calculate savings percentage
    const savingsPercent = originalPrice > 0 && discountedPrice < originalPrice
        ? Math.round(100 - (discountedPrice / originalPrice) * 100)
        : 0;

    // Theme-aware colors
    const getThemeAccent = () => {
        switch (themeMode) {
            case 'ocean': return { bg: 'from-cyan-500/10 to-blue-500/10', border: 'border-cyan-500/20', icon: 'text-cyan-400' };
            case 'forest': return { bg: 'from-emerald-500/10 to-teal-500/10', border: 'border-emerald-500/20', icon: 'text-emerald-400' };
            case 'space': return { bg: 'from-indigo-500/10 to-purple-500/10', border: 'border-indigo-500/20', icon: 'text-indigo-400' };
            default: return { bg: 'from-blue-500/10 to-indigo-500/10', border: 'border-blue-500/20', icon: 'text-blue-400' };
        }
    };
    const themeAccent = getThemeAccent();

    const getPlanIcon = (name) => {
        switch (name) {
            case 'Free': return <FiZap className="w-5 h-5" />;
            case 'Intermediate': return <FiTrendingUp className="w-5 h-5" />;
            case 'Pro': return <FiStar className="w-5 h-5" />;
            case 'Super-Pro': return <FiAward className="w-5 h-5" />;
            case 'Enterprise': return <FiGlobe className="w-5 h-5" />;
            default: return <FiGrid className="w-5 h-5" />;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className={`relative w-full rounded-2xl overflow-hidden transition-all duration-300 
                bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-xl
                border ${isCurrent ? 'border-emerald-500/50 ring-2 ring-emerald-500/20' : themeAccent.border}
                shadow-lg hover:shadow-xl`}
        >
            {/* Theme-aware gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${themeAccent.bg} opacity-50`} />

            {/* Premium shimmer effect */}
            {isPremium && (
                <motion.div
                    className="absolute inset-0 opacity-20"
                    style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                        backgroundSize: '200% 100%'
                    }}
                    animate={{ backgroundPosition: ['-100% 0%', '200% 0%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
            )}

            {/* Current plan indicator */}
            {isCurrent && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
            )}

            {/* Content */}
            <div className="relative p-4 space-y-3">
                {/* Header with icon and name */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl bg-white/80 dark:bg-white/10 ${themeAccent.icon} shadow-sm`}>
                            {getPlanIcon(plan.name)}
                        </div>
                        <div>
                            <h4 className="font-black text-base tracking-tight text-slate-900 dark:text-white">
                                {plan.name}
                            </h4>
                            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                {plan.max_users} users
                            </p>
                        </div>
                    </div>

                    {/* Savings badge */}
                    {savingsPercent > 0 && (
                        <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">
                                -{savingsPercent}%
                            </span>
                        </div>
                    )}
                </div>

                {/* Price section */}
                <div className="py-2 border-t border-dashed border-slate-200/50 dark:border-white/10">
                    <div className="flex items-end gap-1.5">
                        {originalPrice > discountedPrice && (
                            <span className="text-xs line-through text-slate-400 dark:text-slate-500">
                                ₹{billingCycle === 'monthly' ? originalPrice : Math.round(originalPrice / 12)}
                            </span>
                        )}
                        <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">
                            ₹{billingCycle === 'monthly' ? discountedPrice : Math.round(discountedPrice / 12)}
                        </span>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                            /mo
                        </span>
                    </div>
                </div>

                {/* Features - Always visible */}
                <div className="space-y-1.5">
                    {plan.features?.slice(0, 3).map((f, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <FiCheck className={`w-3 h-3 flex-shrink-0 ${themeAccent.icon}`} />
                            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate">
                                {f}
                            </span>
                        </div>
                    ))}
                </div>

                {/* CTA Button */}
                <button
                    disabled={isCurrent}
                    onClick={onSelect}
                    className={`w-full py-2 rounded-lg font-bold text-xs transition-all duration-300 flex items-center justify-center gap-1.5
                        ${isCurrent
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-default'
                            : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-md hover:shadow-lg'
                        }`}
                >
                    {isCurrent ? (
                        <>
                            <FiCheckCircle className="w-3.5 h-3.5" />
                            Current Plan
                        </>
                    ) : (
                        <>
                            Upgrade
                            <FiArrowRight className="w-3.5 h-3.5" />
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
}

/**
 * Holographic Payment Card
 */
function HolographicCard({ method, accentColor }) {
    const Icon = method.type === 'visa' ? FaCcVisa : FaCcMastercard;

    return (
        <motion.div
            whileHover={{ y: -8, rotateX: 5, rotateY: -5 }}
            className={`relative h-64 rounded-[2.5rem] bg-slate-900 dark:bg-black p-8 text-white overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] cursor-pointer group`}
        >
            <div className={`absolute inset-0 opacity-40 bg-gradient-to-br ${accentColor} mix-blend-overlay`} />
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 animate-pulse" />

            {/* Holographic Chip */}
            <div className="absolute top-12 left-8 w-14 h-10 rounded-lg bg-gradient-to-tr from-yellow-500 via-white to-yellow-600 opacity-80 backdrop-blur-3xl border border-white/20">
                <div className="absolute inset-0 grid grid-cols-3 divide-x divide-white/20">
                    <div /><div /><div />
                </div>
            </div>

            <div className="relative h-full flex flex-col justify-end space-y-8">
                <div className="flex justify-between items-center mb-auto">
                    <Icon className="w-16 h-12 text-white/50 group-hover:text-white transition-colors duration-500" />
                    {method.isDefault && (
                        <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest">Default Payment</span>
                    )}
                </div>

                <div className="space-y-1">
                    <p className="text-2xl font-black tracking-[0.2em] font-mono text-white/90">•••• •••• •••• {method.last4}</p>
                </div>

                <div className="flex justify-between items-end">
                    <div className="space-y-0.5">
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Card Holder</p>
                        <p className="text-sm font-black tracking-tight">{method.holder}</p>
                    </div>
                    <div className="text-right space-y-0.5">
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Expiry</p>
                        <p className="text-sm font-black tracking-tight">{method.expiry}</p>
                    </div>
                </div>
            </div>

            {/* Reflection Shine */}
            <motion.div
                animate={{ x: ['100%', '-100%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
            />
        </motion.div>
    );
}

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiCreditCard, FiCheck, FiX, FiDownload, FiPlus, FiTrendingUp,
    FiCalendar, FiDollarSign, FiUsers, FiZap, FiShield, FiStar,
    FiArrowRight, FiGrid, FiFileText, FiActivity, FiBarChart2, FiClock, FiCheckCircle,
    FiInfo, FiLock, FiGlobe, FiCpu, FiAward
} from 'react-icons/fi';
import { FaCcVisa, FaCcMastercard, FaCcAmex } from 'react-icons/fa';
import { supabase } from '../supabaseClient';
import { useCompany } from '../contexts/CompanyContext';
import { useTheme } from '../context/ThemeContext';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

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
    const [userCount, setUserCount] = useState(0);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [toast, setToast] = useState({ show: false, type: '', message: '' });

    const [paymentMethods, setPaymentMethods] = useState([
        { id: 1, type: 'visa', last4: '4242', expiry: '12/26', isDefault: true, holder: 'Akhil Billowria' },
    ]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(paymentMethods[0]);

    // Data mocks
    const billingHistory = [
        { id: 1, date: '2026-01-01', amount: 29.00, status: 'paid', invoice: 'INV-2026-001', method: '•••• 4242' },
        { id: 2, date: '2025-12-01', amount: 29.00, status: 'paid', invoice: 'INV-2025-012', method: '•••• 4242' },
        { id: 3, date: '2025-11-01', amount: 0.00, status: 'paid', invoice: 'INV-2025-011', method: 'Free' },
    ];

    const usageTrend = [
        { month: 'Sep', users: 3, activity: 45 },
        { month: 'Oct', users: 4, activity: 52 },
        { month: 'Nov', users: 5, activity: 48 },
        { month: 'Dec', users: 5, activity: 65 },
        { month: 'Jan', users: 8, activity: 89 },
    ];

    const faqs = [
        { q: "Can I change plans at any time?", a: "Yes, you can upgrade or downgrade your plan instantly. Changes are prorated to your next billing cycle." },
        { q: "Do you offer a free trial?", a: "Every team starts on our Free plan which includes all essential features for up to 5 members." },
        { q: "What counts as a user?", a: "Any account joined to your company workspace is counted as a user, including admins and managers." },
        { q: "Is my payment information secure?", a: "We never store your full card details. All payments are processed through industry-leading secure providers." }
    ];

    useEffect(() => {
        if (currentCompany) fetchSubscriptionData();
    }, [currentCompany]);

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
                setCurrentPlan({
                    ...subData.plan,
                    features: Array.isArray(subData.plan.features) ? subData.plan.features : []
                });
            } else {
                const freePlan = formattedPlans.find(p => p.name === 'Free') || formattedPlans[0];
                setCurrentPlan(freePlan);
            }

            const { count } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', currentCompany.id);
            setUserCount(count || 0);
        } catch (error) {
            console.error('Biling fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async () => {
        if (!selectedPlan) return;
        setProcessing(true);
        // Simulate payment provider delay
        await new Promise(r => setTimeout(r, 2000));

        try {
            const { error } = await supabase
                .from('subscriptions')
                .upsert({
                    company_id: currentCompany.id,
                    plan_id: selectedPlan.id,
                    status: 'active',
                    current_period_start: new Date().toISOString(),
                    current_period_end: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
                }, { onConflict: 'company_id' });

            if (error) throw error;

            setToast({ show: true, type: 'success', message: `Welcome to the ${selectedPlan.name} tier!` });
            setShowUpgradeModal(false);
            fetchSubscriptionData();
        } catch (err) {
            setToast({ show: true, type: 'error', message: err.message });
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

    const maxUsers = currentPlan?.max_users || 5;
    const progressPercent = Math.min((userCount / maxUsers) * 100, 100);

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
            <main className="max-w-7xl mx-auto px-6 w-full relative z-10">

                {/* TOAST Notification */}
                <AnimatePresence>
                    {toast.show && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 20 }}
                            className="fixed bottom-8 right-8 z-[100]"
                        >
                            <div className={`px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border ${toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400' : 'bg-rose-500/90 border-rose-400'
                                } text-white flex items-center gap-3`}>
                                {toast.type === 'success' ? <FiCheckCircle className="w-5 h-5" /> : <FiInfo className="w-5 h-5" />}
                                <p className="font-bold">{toast.message}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* TAB: PLANS & PRICING */}
                {activeTab === 'plans' && (
                    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Current Plan Billboard */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative group rounded-[2.5rem] overflow-hidden bg-slate-900 border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)]"
                        >
                            <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${accentColor}`} />
                            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

                            <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-12">
                                <div className="flex-1 space-y-6">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                        Your Active Plan
                                    </div>
                                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
                                        Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{currentPlan?.name}</span> Plan
                                    </h2>
                                    <p className="text-slate-400 text-lg max-w-xl font-medium leading-relaxed">
                                        Empowering your workspace with advanced resource management, real-time sync, and premium security protocols.
                                    </p>

                                    {/* Resource Progress */}
                                    <div className="max-w-md bg-white/5 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-slate-400 text-sm font-bold uppercase">Team Capacity</span>
                                            <span className="text-white font-black">{userCount} <span className="text-slate-500">/ {maxUsers || '∞'}</span></span>
                                        </div>
                                        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progressPercent}%` }}
                                                transition={{ duration: 1.5, ease: "circOut" }}
                                                className={`h-full bg-gradient-to-r ${accentColor} rounded-full`}
                                            />
                                        </div>
                                        <p className="mt-3 text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1.5">
                                            <FiInfo className="w-3 h-3" /> {maxUsers - userCount} Slots remaining in current cycle
                                        </p>
                                    </div>
                                </div>

                                <div className="shrink-0 flex flex-col items-center md:items-end gap-2">
                                    <div className="relative">
                                        <div className={`absolute inset-0 blur-3xl opacity-30 bg-gradient-to-br ${accentColor}`} />
                                        <div className="relative px-8 py-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md text-center md:text-right">
                                            <p className="text-slate-500 text-xs font-bold uppercase">Plan Price</p>
                                            <div className="flex items-baseline gap-1 justify-center md:justify-end">
                                                <span className="text-5xl font-black text-white">${currentPlan?.price_monthly || 0}</span>
                                                <span className="text-slate-500 font-bold">/mo</span>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-center md:justify-end gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-300">
                                                    <FiDollarSign className="w-5 h-5" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-[10px] text-slate-500 font-bold">Auto-Renewal</p>
                                                    <p className="text-sm font-bold text-white">Mar 01, 2026</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.section>

                        {/* Tier Selector Section */}
                        <section className="space-y-12">
                            <div className="text-center space-y-4">
                                <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Elevate Your Workflow</h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
                                    Select the power level that fits your team's ambitions. Scale instantly as your project grows.
                                </p>

                                {/* Cycle Toggle */}
                                <div className="flex items-center justify-center gap-4 pt-4">
                                    <span className={`text-sm font-bold transition-colors ${billingCycle === 'monthly' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>Monthly</span>
                                    <button
                                        onClick={() => setBillingCycle(c => c === 'monthly' ? 'yearly' : 'monthly')}
                                        className="w-14 h-7 bg-slate-200 dark:bg-slate-800 rounded-full p-1 relative transition-colors group border border-white/10"
                                    >
                                        <motion.div
                                            animate={{ x: billingCycle === 'monthly' ? 0 : 28 }}
                                            className={`w-5 h-5 rounded-full bg-gradient-to-br ${accentColor} shadow-md`}
                                        />
                                    </button>
                                    <span className={`text-sm font-bold transition-colors ${billingCycle === 'yearly' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                                        Yearly <span className="ml-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] border border-emerald-500/20">Save 20%</span>
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {plans.map((plan, i) => (
                                    <ModernPlanCard
                                        key={plan.id}
                                        plan={plan}
                                        index={i}
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
                )}

                {/* TAB: BILLING & PAYMENTS */}
                {activeTab === 'billing' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            {/* Card Display Container */}
                            <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Payment Methods</h3>
                                        <p className="text-slate-500 font-medium">Manage your saved credit cards.</p>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setShowPaymentModal(true)}
                                        className={`p-3 rounded-2xl bg-gradient-to-br ${accentColor} text-white shadow-lg`}
                                    >
                                        <FiPlus className="w-6 h-6" />
                                    </motion.button>
                                </div>

                                <div className="grid gap-6">
                                    {paymentMethods.map(method => (
                                        <HolographicCard key={method.id} method={method} accentColor={accentColor} />
                                    ))}
                                </div>

                                {/* Security Banner */}
                                <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                        <FiLock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-emerald-900 dark:text-emerald-400">Military-Grade Security</p>
                                        <p className="text-sm text-emerald-800/60 dark:text-emerald-400/60 font-medium">Your data is encrypted using AES-256 standards. We never store CVV or full PAN details.</p>
                                    </div>
                                </div>
                            </section>

                            {/* Billing History Section */}
                            <section className="space-y-6">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Billing History</h3>
                                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 overflow-hidden shadow-xl">
                                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                                        {billingHistory.map(invoice => (
                                            <div key={invoice.id} className="p-6 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400">
                                                        <FiFileText className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 dark:text-white">{invoice.invoice}</p>
                                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{invoice.date} • {invoice.method}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <p className="font-black text-slate-900 dark:text-white">${invoice.amount.toFixed(2)}</p>
                                                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase border border-emerald-500/20">{invoice.status}</span>
                                                    </div>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <FiDownload className="w-5 h-5" />
                                                    </motion.button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="w-full py-4 bg-slate-50 dark:bg-white/5 text-slate-500 font-bold text-sm uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors">
                                        Download All Invoices
                                    </button>
                                </div>
                            </section>
                        </div>
                    </div>
                )}

                {/* TAB: USAGE MONITORING */}
                {activeTab === 'usage' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Stats Summary Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[
                                { label: "Total Sessions", val: "1,204", delta: "+12%", icon: <FiGlobe />, color: "blue" },
                                { label: "Compute Usage", val: "4.2 TB", delta: "+5.1%", icon: <FiCpu />, color: "purple" },
                                { label: "Reports Sync", val: "892", delta: "-2%", icon: <FiZap />, color: "emerald" },
                                { label: "Uptime SLA", val: "99.98%", delta: "Live", icon: <FiShield />, color: "cyan" },
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
                                        <span className={`text-xs font-bold ${stat.delta.startsWith('+') ? 'text-emerald-500' : 'text-slate-400'}`}>{stat.delta}</span>
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
                )}
            </main>

            {/* UPGRADE MODAL */}
            <AnimatePresence>
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
            </AnimatePresence>
        </div>
    );
}

/**
 * Modern Pricing Tier Card
 */
function ModernPlanCard({ plan, index, currentPlanId, billingCycle, accentColor, onSelect }) {
    const isCurrent = plan.id === currentPlanId;
    const isPremium = plan.name === 'Pro';
    const price = billingCycle === 'monthly' ? plan.price_monthly : Math.round(plan.price_monthly * 0.8);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index, duration: 0.7 }}
            className={`relative p-8 rounded-[3rem] transition-all duration-500 border ${isPremium
                ? 'bg-slate-900 border-white/20 shadow-[0_32px_64px_-12px_rgba(59,130,246,0.3)] scale-105 z-10'
                : 'bg-white dark:bg-slate-900/40 backdrop-blur-xl border-slate-200 dark:border-white/5 shadow-2xl hover:scale-[1.02]'
                }`}
        >
            {isPremium && (
                <div className={`absolute inset-0 rounded-[3rem] opacity-20 bg-gradient-to-br ${accentColor}`} />
            )}

            {isPremium && (
                <div className="absolute top-0 right-12 -translate-y-1/2">
                    <span className={`px-4 py-1.5 rounded-full bg-gradient-to-r ${accentColor} text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg`}>
                        Highest Demand
                    </span>
                </div>
            )}

            <div className="relative space-y-8">
                <div className="space-y-2">
                    <h4 className={`text-xl font-black tracking-tight ${isPremium ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{plan.name}</h4>
                    <p className={`text-sm font-medium ${isPremium ? 'text-slate-400 font-medium' : 'text-slate-500'}`}>Perfect for {plan.name === 'Free' ? 'exploring' : plan.name === 'Pro' ? 'performing teams' : 'mission-critical ops'}.</p>
                </div>

                <div className="flex items-baseline gap-1">
                    <span className={`text-5xl font-black ${isPremium ? 'text-white' : 'text-slate-900 dark:text-white'} tracking-tighter`}>${price}</span>
                    <span className="text-slate-500 font-bold">/mo</span>
                </div>

                <div className="h-px bg-slate-100 dark:bg-white/10" />

                <ul className="space-y-4">
                    {plan.features?.map((f, i) => (
                        <li key={i} className="flex items-start gap-3">
                            <div className={`mt-1 p-0.5 rounded-full ${isPremium ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>
                                <FiCheckCircle className="w-3.5 h-3.5" />
                            </div>
                            <span className={`text-sm font-bold tracking-tight ${isPremium ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'}`}>{f}</span>
                        </li>
                    ))}
                </ul>

                <button
                    disabled={isCurrent}
                    onClick={onSelect}
                    className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 ${isCurrent
                        ? 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-600 cursor-default'
                        : isPremium
                            ? 'bg-white text-slate-900 hover:bg-slate-100 shadow-xl'
                            : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 shadow-lg'
                        }`}
                >
                    {isCurrent ? 'Current Plan' : `Upgrade to ${plan.name}`}
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

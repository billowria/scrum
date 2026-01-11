import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiCreditCard, FiCheck, FiX, FiDownload, FiPlus, FiTrendingUp,
    FiCalendar, FiDollarSign, FiUsers, FiZap, FiShield, FiStar,
    FiArrowRight, FiActivity, FiBarChart2, FiClock, FiCheckCircle
} from 'react-icons/fi';
import { FaCcVisa, FaCcMastercard, FaCcAmex } from 'react-icons/fa';
import { supabase } from '../supabaseClient';
import { useCompany } from '../contexts/CompanyContext';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function SubscriptionPage({ sidebarMode }) {
    const { currentCompany, userRole, loading: companyLoading } = useCompany();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [plans, setPlans] = useState([]);
    const [currentPlan, setCurrentPlan] = useState(null);


    const [userCount, setUserCount] = useState(0);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [paymentMethods, setPaymentMethods] = useState([
        { id: 1, type: 'visa', last4: '4242', expiry: '12/25', isDefault: true },
    ]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [toast, setToast] = useState({ show: false, type: '', message: '' });


    // Mock billing data
    const [billingHistory] = useState([
        { id: 1, date: '2026-01-01', amount: 29.00, status: 'paid', invoice: 'INV-2026-001' },
        { id: 2, date: '2025-12-01', amount: 29.00, status: 'paid', invoice: 'INV-2025-012' },
        { id: 3, date: '2025-11-01', amount: 0.00, status: 'paid', invoice: 'INV-2025-011' },
    ]);

    // Mock usage data for charts
    const [usageData] = useState([
        { month: 'Jul', users: 3, cost: 0 },
        { month: 'Aug', users: 4, cost: 0 },
        { month: 'Sep', users: 5, cost: 0 },
        { month: 'Oct', users: 5, cost: 0 },
        { month: 'Nov', users: 5, cost: 0 },
        { month: 'Dec', users: 5, cost: 29 },
        { month: 'Jan', users: 7, cost: 29 },
    ]);

    const [spendingData] = useState([
        { name: 'Subscription', value: 29, color: '#6366f1' },
        { name: 'Add-ons', value: 0, color: '#8b5cf6' },
        { name: 'Overages', value: 0, color: '#ec4899' },
    ]);

    useEffect(() => {
        if (currentCompany) {
            fetchSubscriptionData();
        }
    }, [currentCompany]);

    const fetchSubscriptionData = async () => {
        setLoading(true);
        try {
            // Fetch plans
            const { data: plansData } = await supabase
                .from('subscription_plans')
                .select('*')
                .order('price_monthly', { ascending: true });
            setPlans(plansData || []);

            // Fetch current subscription
            const { data: subData } = await supabase
                .from('subscriptions')
                .select('*, plan:subscription_plans(*)')
                .eq('company_id', currentCompany.id)
                .eq('status', 'active')
                .single();

            if (subData) {
                setCurrentPlan(subData.plan);
            } else {
                const freePlan = plansData?.find(p => p.name === 'Free');
                setCurrentPlan(freePlan);
            }

            // Fetch user count
            const { count } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', currentCompany.id);
            setUserCount(count || 0);
        } catch (error) {
            console.error('Error fetching subscription data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async () => {
        if (!selectedPlan || !selectedPaymentMethod) return;
        setProcessing(true);

        await new Promise(r => setTimeout(r, 2500));

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

            setToast({ show: true, type: 'success', message: `Successfully upgraded to ${selectedPlan.name}!` });
            setShowUpgradeModal(false);
            setShowPaymentModal(false);
            fetchSubscriptionData();
        } catch (err) {
            setToast({ show: true, type: 'error', message: err.message });
        } finally {
            setProcessing(false);
        }
    };

    const addPaymentMethod = (newCard) => {
        const newMethod = {
            id: paymentMethods.length + 1,
            ...newCard,
            isDefault: paymentMethods.length === 0
        };
        setPaymentMethods([...paymentMethods, newMethod]);
        setToast({ show: true, type: 'success', message: 'Payment method added successfully!' });
    };

    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => setToast({ show: false, type: '', message: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast.show]);

    if (loading || companyLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    // Access Control Check


    const maxUsers = currentPlan?.max_users || 5;
    const usagePercent = (userCount / maxUsers) * 100;
    const daysUntilRenewal = 23;

    return (
        <div className="w-full h-[calc(100vh-4rem)] flex flex-col -mt-6 relative overflow-hidden bg-gradient-to-br from-slate-50/40 via-indigo-50/40 to-purple-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
            {/* Toast Notification */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="fixed top-20 right-4 z-50"
                    >
                        <div className={`px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border ${toast.type === 'success'
                            ? 'bg-emerald-500/90 border-emerald-400 text-white'
                            : 'bg-red-500/90 border-red-400 text-white'
                            }`}>
                            <div className="flex items-center gap-3">
                                {toast.type === 'success' ? <FiCheck className="w-5 h-5" /> : <FiX className="w-5 h-5" />}
                                <span className="font-medium">{toast.message}</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Ambient Background Orbs */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-300/20 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-300/20 dark:bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Liquid Glass Header - Fixed Position */}
            <motion.div
                className="fixed top-16 right-0 z-40 px-6 py-4 pointer-events-none"
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 25 }}
                style={{
                    left: sidebarMode === 'expanded' ? '272px' : sidebarMode === 'collapsed' ? '100px' : '0px',
                    width: sidebarMode === 'expanded' ? 'calc(100% - 272px)' : sidebarMode === 'collapsed' ? 'calc(100% - 100px)' : '100%',
                    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
            >
                <div
                    className="pointer-events-auto relative overflow-hidden bg-white/10 dark:bg-slate-900/60 backdrop-blur-[20px] backdrop-saturate-[180%] rounded-[2rem] p-2 border border-white/20 dark:border-slate-700/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] group"
                    style={{
                        boxShadow: `
              0 8px 32px 0 rgba(31, 38, 135, 0.15),
              inset 0 0 0 1px rgba(255, 255, 255, 0.2),
              inset 0 0 20px rgba(255, 255, 255, 0.05)
            `
                    }}
                >
                    {/* Liquid Sheen Effect */}
                    <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{
                            background: `radial-gradient(
                800px circle at var(--mouse-x) var(--mouse-y), 
                rgba(255, 255, 255, 0.15), 
                transparent 40%
              )`
                        }}
                    />

                    {/* Chromatic Edge Simulation */}
                    <div className="absolute inset-0 rounded-[2rem] pointer-events-none opacity-50 mix-blend-overlay bg-gradient-to-br from-indigo-500/10 via-transparent to-pink-500/10" />

                    <div className="flex items-center justify-between">
                        {/* Left: Title & Context */}
                        <div className="flex items-center gap-2 sm:gap-4 px-2 sm:px-4 relative z-10">
                            <div className="relative group/icon cursor-pointer">
                                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-2xl blur-lg opacity-40 group-hover/icon:opacity-60 transition-opacity" />
                                <div className="relative p-2 sm:p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-2xl text-white shadow-lg shadow-emerald-500/30 ring-1 ring-white/20 group-hover/icon:scale-105 transition-transform duration-300">
                                    <FiCreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight drop-shadow-sm">
                                    Billing & Subscription
                                </h1>
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                    <FiZap className="w-3 h-3" />
                                    Manage your plan & payments
                                </p>
                            </div>
                        </div>

                        {/* Center: Futuristic Toggle */}
                        <div className="flex bg-gray-100/30 backdrop-blur-xl p-1 sm:p-1.5 rounded-xl sm:rounded-2xl relative z-10 border border-white/40 shadow-inner overflow-hidden">
                            {[
                                { id: 'overview', icon: FiBarChart2, label: 'Overview' },
                                userRole === 'admin' ? { id: 'billing', icon: FiCreditCard, label: 'Billing' } : null,
                                userRole === 'admin' ? { id: 'usage', icon: FiActivity, label: 'Usage' } : null
                            ].filter(Boolean).map((tab) => (
                                <motion.button
                                    key={tab.id}
                                    className={`relative px-2 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-1 sm:gap-2 z-10 ${activeTab === tab.id
                                        ? 'text-white shadow-lg'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-700/50'
                                        }`}
                                    onClick={() => setActiveTab(tab.id)}
                                    whileHover={{
                                        scale: 1.05,
                                        rotateY: activeTab === tab.id ? 0 : 2,
                                        z: 10
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {/* Active Indicator Background */}
                                    {activeTab === tab.id && (
                                        <>
                                            <motion.div
                                                className="absolute inset-0 rounded-xl shadow-lg border border-white/20 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"
                                                layoutId="activeTabBilling"
                                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                            />
                                            <motion.div
                                                className="absolute inset-0.5 rounded-xl opacity-50 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400"
                                                animate={{ opacity: [0.3, 0.6, 0.3] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent rounded-xl"
                                                animate={{ x: ['-100%', '200%'] }}
                                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                            />
                                        </>
                                    )}
                                    <span className="relative z-10 flex items-center gap-1 sm:gap-2 drop-shadow-sm">
                                        <tab.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === tab.id ? 'text-white' : ''}`} />
                                        <span className="text-[10px] sm:text-xs md:text-sm">{tab.label}</span>
                                    </span>
                                </motion.button>
                            ))}
                        </div>

                        {/* Right: Stats */}
                        <div className="flex items-center gap-3 px-2 relative z-10">
                            {/* Current Plan Badge */}
                            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-xl border border-white/40 dark:border-slate-700/50">
                                <FiStar className="w-4 h-4 text-yellow-500" />
                                <div className="text-left">
                                    <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Plan</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{currentPlan?.name || 'Free'}</p>
                                </div>
                            </div>

                            {/* Users Badge */}
                            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-xl border border-white/40 dark:border-slate-700/50">
                                <FiUsers className="w-4 h-4 text-indigo-500" />
                                <div className="text-left">
                                    <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Users</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{userCount}/{maxUsers === null ? '∞' : maxUsers}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto pb-20 custom-scrollbar scroll-smooth">
                <div className="w-full space-y-8 pt-32 px-4">

                    {/* Overview Tab - Merged with Plans */}
                    {activeTab === 'overview' && (
                        <div className="space-y-12">
                            {/* Premium Current Plan Card - Redesigned */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative overflow-hidden rounded-[2.5rem] bg-[#0A0A0B] border border-white/10 shadow-2xl"
                            >
                                {/* Background Effects */}
                                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-b from-indigo-500/20 to-purple-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-t from-emerald-500/10 to-teal-500/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3" />
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />

                                <div className="relative z-10 p-8 md:p-12">
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-12">
                                        <div>
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/60 mb-4 backdrop-blur-md">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                Active Subscription
                                            </div>
                                            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-2">
                                                {currentPlan?.name || 'Free Plan'}
                                            </h2>
                                            <p className="text-lg text-white/50 max-w-md">
                                                Powering your team's productivity with advanced analytics and seamless collaboration.
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="text-right">
                                                <span className="text-5xl font-bold text-white tracking-tighter">${currentPlan?.price_monthly || 0}</span>
                                                <span className="text-xl text-white/40 font-light">/mo</span>
                                            </div>
                                            <p className="text-sm text-white/40">Next billing date: Aug 24, 2026</p>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* User Limit Status */}
                                        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm relative overflow-hidden group hover:bg-white/10 transition-colors">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                                    <FiUsers className="w-5 h-5" />
                                                </div>
                                                <span className="text-xs font-bold px-2 py-1 rounded-lg bg-white/10 text-white/80">
                                                    {Math.round((userCount / (maxUsers || 1)) * 100)}% Used
                                                </span>
                                            </div>
                                            <p className="text-sm text-white/50 mb-1">Team Members</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl font-bold text-white">{userCount}</span>
                                                <span className="text-lg text-white/40">/ {maxUsers || '∞'}</span>
                                            </div>
                                            {/* Progress Bar */}
                                            <div className="w-full h-1.5 bg-white/10 rounded-full mt-4 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min((userCount / (maxUsers || 1)) * 100, 100)}%` }}
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                                />
                                            </div>
                                        </div>

                                        {/* Plan Features Preview */}
                                        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm relative overflow-hidden group hover:bg-white/10 transition-colors md:col-span-2">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                                    <FiCheckCircle className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-white/50">Included Features</p>
                                                    <p className="text-white font-medium">Everything you need to scale</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                {currentPlan?.features?.slice(0, 6).map((feature, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-sm text-white/70">
                                                        <FiCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                                                        <span className="truncate">{feature}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Available Plans Section - Premium Cards */}
                            <div>
                                <div className="text-center mb-12">
                                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Choose Your Power</h3>
                                    <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
                                        Unlock the full potential of your team with plans designed for scale, security, and speed.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Available Plans - Admin Only */}
                    {activeTab === 'overview' && userRole === 'admin' && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
                                <div>
                                    <h3 className="text-3xl font-bold text-slate-800 dark:text-white">Available Plans</h3>
                                    <p className="text-slate-500 dark:text-slate-400 mt-2">Choose the perfect plan for your team's needs.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                                {plans.map((plan, idx) => (
                                    <PlanCard
                                        key={plan.id}
                                        plan={plan}
                                        currentPlan={currentPlan}
                                        delay={idx * 0.1}
                                        onUpgrade={() => {
                                            setSelectedPlan(plan);
                                            setShowUpgradeModal(true);
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Billing Tab */}
                    {activeTab === 'billing' && (
                        <div className="space-y-6">
                            {/* Payment Methods */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-xl"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Payment Methods</h3>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setShowPaymentModal(true)}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium flex items-center gap-2"
                                    >
                                        <FiPlus className="w-4 h-4" />
                                        Add New
                                    </motion.button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {paymentMethods.map((method) => (
                                        <PaymentCard key={method.id} method={method} />
                                    ))}
                                </div>
                            </motion.div>

                            {/* Invoice History */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-xl"
                            >
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Invoice History</h3>
                                <div className="space-y-3">
                                    {billingHistory.map((invoice) => (
                                        <InvoiceRow key={invoice.id} invoice={invoice} />
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* Usage Tab */}
                    {activeTab === 'usage' && (
                        <div className="space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-xl"
                            >
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Usage Analytics</h3>
                                <ResponsiveContainer width="100%" height={400}>
                                    <LineChart data={usageData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="month" stroke="#94a3b8" />
                                        <YAxis stroke="#94a3b8" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                border: 'none',
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                        <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 6 }} />
                                        <Line type="monotone" dataKey="cost" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </motion.div>
                        </div>
                    )}

                    {/* Upgrade Modal */}
                    <AnimatePresence>
                        {showUpgradeModal && (
                            <UpgradeModal
                                plan={selectedPlan}
                                paymentMethods={paymentMethods}
                                selectedPaymentMethod={selectedPaymentMethod}
                                setSelectedPaymentMethod={setSelectedPaymentMethod}
                                processing={processing}
                                onConfirm={handleUpgrade}
                                onClose={() => setShowUpgradeModal(false)}
                            />
                        )}
                    </AnimatePresence>

                    {/* Add Payment Modal */}
                    <AnimatePresence>
                        {showPaymentModal && (
                            <AddPaymentModal
                                onAdd={addPaymentMethod}
                                onClose={() => setShowPaymentModal(false)}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

// Stats Card Component
const StatsCard = ({ icon, title, value, subtitle, gradient }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -5 }}
        className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-xl relative overflow-hidden group"
    >
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
        <div className="relative">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-4`}>
                {icon}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{title}</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-500">{subtitle}</p>
        </div>
    </motion.div>
);

// Plan Card Component
// PlanCard Component - Premium Redesign
const PlanCard = ({ plan, currentPlan, delay, onUpgrade }) => {
    const isCurrent = currentPlan?.id === plan.id;
    const isPopular = plan.name === 'Pro';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            whileHover={{ y: -8 }}
            className={`relative flex flex-col items-center p-8 rounded-[2.5rem] transition-all duration-300 isolate ${isPopular
                ? 'bg-slate-900 text-white shadow-2xl shadow-purple-500/20 ring-1 ring-purple-500/50'
                : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-xl'
                }`}
        >
            {/* Popular Glow Effect */}
            {isPopular && (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-pink-500/20 rounded-[2.5rem] pointer-events-none -z-10" />
            )}

            {isPopular && (
                <span className="absolute -top-4 px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg shadow-purple-500/40">
                    Most Popular
                </span>
            )}

            {isCurrent && (
                <span className="absolute top-6 right-6 inline-flex items-center justify-center w-8 h-8 bg-emerald-500 rounded-full text-white shadow-lg shadow-emerald-500/30">
                    <FiCheck className="w-5 h-5" />
                </span>
            )}

            <div className="mb-8 text-center relative z-10">
                <h3 className={`text-xl font-bold mb-2 ${isPopular ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold tracking-tight">${plan.price_monthly}</span>
                    <span className={`text-sm ${isPopular ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>/month</span>
                </div>
                <p className={`mt-4 text-sm ${isPopular ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                    Perfect for growing teams
                </p>
            </div>

            <div className="w-full space-y-4 mb-8 flex-1">
                {plan.features?.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isPopular ? 'bg-purple-500/20 text-purple-400' : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                            }`}>
                            <FiCheck className="w-3 h-3" />
                        </div>
                        <span className={`text-sm ${isPopular ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}`}>
                            {feature}
                        </span>
                    </div>
                ))}
            </div>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={isCurrent ? undefined : onUpgrade}
                disabled={isCurrent}
                className={`w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition-all ${isCurrent
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-default'
                    : isPopular
                        ? 'bg-white text-slate-900 hover:bg-slate-50 shadow-lg shadow-white/10'
                        : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 shadow-lg'
                    }`}
            >
                {isCurrent ? 'Current Plan' : `Get ${plan.name}`}
            </motion.button>
        </motion.div>
    );
};

// Payment Card Component
const PaymentCard = ({ method }) => {
    const CardIcon = method.type === 'visa' ? FaCcVisa : method.type === 'mastercard' ? FaCcMastercard : FaCcAmex;

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
                <div className="flex items-center justify-between mb-8">
                    <CardIcon className="w-12 h-12 text-white/80" />
                    {method.isDefault && (
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-xl rounded-full text-xs font-bold">
                            Default
                        </span>
                    )}
                </div>
                <p className="text-2xl font-mono mb-4">•••• •••• •••• {method.last4}</p>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Expires</span>
                    <span className="font-mono">{method.expiry}</span>
                </div>
            </div>
        </motion.div>
    );
};

// Invoice Row Component
const InvoiceRow = ({ invoice }) => (
    <motion.div
        whileHover={{ x: 5 }}
        className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-700"
    >
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <FiClock className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
                <p className="font-semibold text-slate-800 dark:text-white">{invoice.invoice}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{invoice.date}</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right">
                <p className="font-bold text-slate-800 dark:text-white">${invoice.amount.toFixed(2)}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${invoice.status === 'paid'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                    {invoice.status}
                </span>
            </div>
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
                <FiDownload className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </motion.button>
        </div>
    </motion.div>
);

// Upgrade Modal Component
const UpgradeModal = ({ plan, paymentMethods, selectedPaymentMethod, setSelectedPaymentMethod, processing, onConfirm, onClose }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
    >
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl"
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Confirm Upgrade</h3>
                <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center"
                >
                    <FiX className="w-5 h-5" />
                </motion.button>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-600 dark:text-slate-400">Plan</span>
                    <span className="text-2xl font-bold text-slate-800 dark:text-white">{plan?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Amount</span>
                    <span className="text-3xl font-bold text-indigo-600">${plan?.price_monthly}</span>
                </div>
            </div>

            <div className="mb-6">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Select Payment Method</p>
                <div className="space-y-2">
                    {paymentMethods.map((method) => (
                        <motion.div
                            key={method.id}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => setSelectedPaymentMethod(method)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedPaymentMethod?.id === method.id
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/30'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FiCreditCard className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                    <span className="font-medium text-slate-800 dark:text-white">•••• {method.last4}</span>
                                </div>
                                {selectedPaymentMethod?.id === method.id && (
                                    <FiCheck className="w-5 h-5 text-indigo-600" />
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onConfirm}
                disabled={!selectedPaymentMethod || processing}
                className={`w-full py-4 rounded-2xl font-bold text-white transition-all ${!selectedPaymentMethod || processing
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/50'
                    }`}
            >
                {processing ? (
                    <div className="flex items-center justify-center gap-2">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                        Processing...
                    </div>
                ) : (
                    `Pay $${plan?.price_monthly}`
                )}
            </motion.button>
        </motion.div>
    </motion.div>
);

// Add Payment Modal Component
const AddPaymentModal = ({ onAdd, onClose }) => {
    const [cardData, setCardData] = useState({
        type: 'mastercard',
        last4: '',
        expiry: '',
    });

    const handleSubmit = () => {
        if (cardData.last4.length === 4 && cardData.expiry) {
            onAdd(cardData);
            onClose();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Add Payment Method</h3>
                    <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center"
                    >
                        <FiX className="w-5 h-5" />
                    </motion.button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Card Type</label>
                        <select
                            value={cardData.type}
                            onChange={(e) => setCardData({ ...cardData, type: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                        >
                            <option value="visa">Visa</option>
                            <option value="mastercard">Mastercard</option>
                            <option value="amex">American Express</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Last 4 Digits</label>
                        <input
                            type="text"
                            maxLength={4}
                            value={cardData.last4}
                            onChange={(e) => setCardData({ ...cardData, last4: e.target.value.replace(/\D/g, '') })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                            placeholder="4242"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Expiry Date</label>
                        <input
                            type="text"
                            maxLength={5}
                            value={cardData.expiry}
                            onChange={(e) => {
                                let val = e.target.value.replace(/\D/g, '');
                                if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2, 4);
                                setCardData({ ...cardData, expiry: val });
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                            placeholder="12/25"
                        />
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    className="w-full mt-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold"
                >
                    Add Card
                </motion.button>
            </motion.div>
        </motion.div>
    );
};



import React from 'react';
import { motion } from 'framer-motion';
import { FiActivity, FiSettings, FiLayout, FiMaximize2 } from 'react-icons/fi';
import VelocityEngine from '../components/analytics/widgets/VelocityEngine';
import TeamEngagementRadar from '../components/analytics/widgets/TeamEngagementRadar';
import CapacityForecast from '../components/analytics/widgets/CapacityForecast';
import BlockerRadar from '../components/analytics/widgets/BlockerRadar';
import SentinelAnalysis from '../components/analytics/widgets/SentinelAnalysis';
import { useTheme } from '../context/ThemeContext';

const AnalyticsDashboard = () => {
  const { theme, themeMode, isAnimatedTheme } = useTheme();

  return (
    <div className={`min-h-screen p-6 md:p-12 relative ${isAnimatedTheme ? 'bg-transparent' : 'bg-transparent'}`}>
      {/* Contextual Background Elements for Non-Animated themes */}
      {!isAnimatedTheme && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full" />
        </div>
      )}

      {/* Header Section */}
      <header className="max-w-7xl mx-auto mb-12 relative z-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em]"
            >
              <FiActivity className="animate-pulse" /> Live_Intelligence_Feed
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-black text-white tracking-tighter"
            >
              Organization <span className="text-white/40 italic">Metrics.</span>
            </motion.h1>
          </div>

          <div className="flex gap-3">
            <button className="p-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md">
              <FiLayout size={20} />
            </button>
            <button className="p-4 rounded-2xl bg-indigo-600 border border-indigo-500 text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all">
              <FiSettings size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Content Grid */}
      <main className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Velocity Engine: Primary Widget */}
          <div className="lg:col-span-8">
            <VelocityEngine />
          </div>

          {/* Team Engagement Radar: Secondary Widget */}
          <div className="lg:col-span-4">
            <TeamEngagementRadar />
          </div>
        </div>

        {/* Bottom Row - Integrated Intelligence Suite */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 pb-12">
          <div className="md:col-span-1">
            <CapacityForecast />
          </div>

          <div className="md:col-span-1">
            <BlockerRadar />
          </div>

          <div className="md:col-span-1">
            <SentinelAnalysis />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AnalyticsDashboard;
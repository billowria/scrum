import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiBarChart2, FiFilter, FiRefreshCw, FiSettings } from 'react-icons/fi';
import { motion } from 'framer-motion';
import UserPerformanceMetrics from '../components/analytics/UserPerformanceMetrics';
import VelocityBurndownCharts from '../components/analytics/VelocityBurndownCharts';
import PredictiveInsights from '../components/analytics/PredictiveInsights';
import EnhancedAnalyticsFilters from '../components/analytics/EnhancedAnalyticsFilters';
import ExportControls from '../components/analytics/ExportControls';
import ResponsiveGrid from '../components/analytics/shared/ResponsiveGrid';
import FlowMetricsWidget from '../components/analytics/widgets/FlowMetricsWidget';
import WIPAnalysisWidget from '../components/analytics/widgets/WIPAnalysisWidget';
import BlockerAnalysisWidget from '../components/analytics/widgets/BlockerAnalysisWidget';
import ProductivityPatternsWidget from '../components/analytics/widgets/ProductivityPatternsWidget';
import QualityMetricsWidget from '../components/analytics/widgets/QualityMetricsWidget';
import LeaveAnalysisWidget from '../components/analytics/widgets/LeaveAnalysisWidget';
import { getLeaveAnalysis } from '../services/analyticsService';
import { supabase } from '../supabaseClient';
import { colors } from '../config/designSystem';
import { useCompany } from '../contexts/CompanyContext';

const AnalyticsDashboard = () => {
  const { currentCompany } = useCompany();
  const [userPerformanceData, setUserPerformanceData] = useState(null);
  const [velocityData, setVelocityData] = useState(null);
  const [predictiveData, setPredictiveData] = useState(null);
  const [leaveAnalysisData, setLeaveAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: { start: null, end: null },
    userIds: [],
    teamIds: [],
    metrics: [],
    customCriteria: {}
  });
  const [savedFilters, setSavedFilters] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [availableTeams, setAvailableTeams] = useState([]);

  // Refs for export functionality
  const userPerformanceRef = useRef();
  const velocityBurndownRef = useRef();
  const predictiveInsightsRef = useRef();
  const leaveAnalysisRef = useRef();

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Fetch real data from database using filters
      // Note: getUserPerformanceMetrics, getVelocityData, getPredictiveInsights are not implemented yet
      // Using mock data fallbacks for now
      const userPerformance = { data: [] };
      const velocity = { velocity: [], currentVelocity: 0, burndown: [] };
      const predictive = { historical: [], predictions: [] };
      const leaveAnalysis = await getLeaveAnalysis(filters);

      setUserPerformanceData(userPerformance);
      setVelocityData(velocity);
      setPredictiveData(predictive);
      setLeaveAnalysisData(leaveAnalysis);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      // Fallback to empty data on error
      setUserPerformanceData({ data: [] });
      setVelocityData({ velocity: [], currentVelocity: 0, burndown: [] });
      setPredictiveData({ historical: [], predictions: [] });
      setLeaveAnalysisData({ leavePatterns: [], utilization: {}, productivityImpact: {} });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  // Load available users and teams on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, name')
          .eq('company_id', currentCompany?.id)
          .order('name');

        if (!usersError && users) {
          setAvailableUsers(users.map(u => ({ id: u.id, name: u.name })));
        }

        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select('id, name')
          .eq('company_id', currentCompany?.id)
          .order('name');

        if (!teamsError && teams) {
          setAvailableTeams(teams.map(t => ({ id: t.id, name: t.name })));
        }
      } catch (error) {
        console.error('Error loading filter options:', error);
      }
    };

    loadFilterOptions();
  }, [currentCompany]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh effect
  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchData(true);
      }, 30000); // Refresh every 30 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const handleRefresh = () => {
    fetchData(true);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSaveFilter = (name, config) => {
    const newFilter = {
      id: Date.now().toString(),
      name,
      config,
    };
    setSavedFilters(prev => [...prev, newFilter]);
    localStorage.setItem('analytics-saved-filters', JSON.stringify([...savedFilters, newFilter]));
  };

  const handleLoadFilter = (config) => {
    setFilters(config);
  };

  // Load saved filters on mount
  useEffect(() => {
    const saved = localStorage.getItem('analytics-saved-filters');
    if (saved) {
      setSavedFilters(JSON.parse(saved));
    }
  }, []);

  const analyticsWidgets = [
    {
      id: 'user-performance',
      component: (
        <UserPerformanceMetrics
          ref={userPerformanceRef}
          data={userPerformanceData?.data}
          userId={userPerformanceData?.userId}
          teamComparison={true}
        />
      ),
      show: !loading && userPerformanceData
    },
    {
      id: 'velocity-burndown',
      component: (
        <VelocityBurndownCharts
          ref={velocityBurndownRef}
          data={velocityData}
          sprintData={{
            burndown: [
              { day: 1, remaining: 50, ideal: 50, completed: 0 },
              { day: 2, remaining: 45, ideal: 45, completed: 5 },
              { day: 3, remaining: 38, ideal: 40, completed: 12 },
              { day: 4, remaining: 32, ideal: 35, completed: 18 },
              { day: 5, remaining: 25, ideal: 30, completed: 25 },
            ],
            remainingWork: 25,
            daysRemaining: 7
          }}
        />
      ),
      show: !loading && velocityData
    },
    {
      id: 'predictive-insights',
      component: <PredictiveInsights ref={predictiveInsightsRef} data={predictiveData} />,
      show: !loading && predictiveData
    },
    {
      id: 'leave-analysis',
      component: <LeaveAnalysisWidget ref={leaveAnalysisRef} data={leaveAnalysisData} loading={loading} />,
      show: !loading && leaveAnalysisData
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.secondary[50] }}>
      <div className="p-4 sm:p-6 lg:p-8">
        <header className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                <FiBarChart2 className="mr-3" style={{ color: colors.primary[600] }} />
                Analytics Dashboard
              </h1>
              <p className="mt-1 text-md text-slate-600">
                Deep insights into your team's performance and workflow.
              </p>
            </motion.div>

            <div className="flex items-center space-x-3">
              {/* Export Controls */}
              <ExportControls
                data={{ userPerformanceData, velocityData, predictiveData, leaveAnalysisData }}
                chartRefs={[
                  userPerformanceRef,
                  velocityBurndownRef,
                  predictiveInsightsRef,
                  leaveAnalysisRef
                ].filter(ref => ref.current)}
              />

              {/* Auto-refresh Toggle */}
              <motion.button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${autoRefresh
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiRefreshCw className={`mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto
              </motion.button>

              {/* Manual Refresh */}
              <motion.button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                whileHover={!refreshing ? { scale: 1.05 } : {}}
                whileTap={!refreshing ? { scale: 0.95 } : {}}
              >
                <FiRefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </motion.button>

              {/* Filters */}
              <EnhancedAnalyticsFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                availableUsers={availableUsers}
                availableTeams={availableTeams}
                availableMetrics={[
                  { id: 'throughput', name: 'Throughput' },
                  { id: 'cycle-time', name: 'Cycle Time' },
                  { id: 'velocity', name: 'Velocity' },
                  { id: 'flow-metrics', name: 'Flow Metrics' },
                  { id: 'wip-analysis', name: 'WIP Analysis' },
                  { id: 'blocker-analysis', name: 'Blocker Analysis' },
                  { id: 'productivity', name: 'Productivity Patterns' },
                  { id: 'quality', name: 'Quality Metrics' },
                  { id: 'leave-analysis', name: 'Leave Analysis' }
                ]}
                savedFilters={savedFilters}
                onSaveFilter={handleSaveFilter}
                onLoadFilter={handleLoadFilter}
              />
            </div>
          </div>
        </header>

        <ResponsiveGrid columns={{ default: 1, lg: 2, xl: 3 }}>
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.primary[600] }}></div>
                <p className="text-slate-600">Loading analytics...</p>
              </div>
            </div>
          ) : (
            <>
              {/* New Analytics Widgets */}
              <FlowMetricsWidget data={null} loading={loading} />
              <WIPAnalysisWidget data={null} loading={loading} />
              <BlockerAnalysisWidget data={null} loading={loading} />
              <ProductivityPatternsWidget data={null} loading={loading} />
              <QualityMetricsWidget data={null} loading={loading} />

              {/* Existing Widgets */}
              {analyticsWidgets.map((widget) => (
                widget.show && (
                  <motion.div
                    key={widget.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    transition={{ type: 'spring', stiffness: 100 }}
                  >
                    {widget.component}
                  </motion.div>
                )
              ))}

              {/* Show message when no data is available */}
              {!userPerformanceData?.data?.length && !velocityData?.velocity?.length && !predictiveData?.historical?.length && (
                <div className="col-span-full flex items-center justify-center py-12">
                  <div className="text-center">
                    <FiBarChart2 className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-sm font-medium text-slate-900">No analytics data</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      No data available for the selected filters. Try adjusting your date range or filters.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </ResponsiveGrid>

        {/* Loading overlay for refresh */}
        {refreshing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 right-4 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2"
            style={{ backgroundColor: colors.primary[600] }}
          >
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Refreshing data...</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
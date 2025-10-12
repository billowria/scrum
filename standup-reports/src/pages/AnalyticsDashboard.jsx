import React, { useState, useEffect } from 'react';
import { FiBarChart2, FiFilter } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { getFlowMetrics, getWipAnalysis, getBlockerAnalysis } from '../services/analyticsService';
import FlowMetricsOverview from '../components/analytics/FlowMetricsOverview';
import WIPAnalysis from '../components/analytics/WIPAnalysis';
import BlockerAnalysis from '../components/analytics/BlockerAnalysis';

const AnalyticsDashboard = () => {
  const [flowMetricsData, setFlowMetricsData] = useState(null);
  const [wipAnalysisData, setWipAnalysisData] = useState(null);
  const [blockerAnalysisData, setBlockerAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));
      const today = new Date();
      
      const [flowMetrics, wipAnalysis, blockerAnalysis] = await Promise.all([
        getFlowMetrics(thirtyDaysAgo, today),
        getWipAnalysis(),
        getBlockerAnalysis(thirtyDaysAgo, today),
      ]);

      setFlowMetricsData(flowMetrics);
      setWipAnalysisData(wipAnalysis);
      setBlockerAnalysisData(blockerAnalysis);
      
      setLoading(false);
    };

    fetchData();
  }, []);

  const analyticsWidgets = [
    { 
      id: 'flow-metrics', 
      component: <FlowMetricsOverview data={flowMetricsData} />,
      show: !loading && flowMetricsData
    },
    { 
      id: 'wip-analysis', 
      component: <WIPAnalysis data={wipAnalysisData} />,
      show: !loading && wipAnalysisData
    },
    { 
      id: 'blocker-analysis', 
      component: <BlockerAnalysis data={blockerAnalysisData} />,
      show: !loading && blockerAnalysisData
    },
    // Other widgets will be added here
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FiBarChart2 className="mr-3 text-indigo-600" />
              Analytics Dashboard
            </h1>
            <p className="mt-1 text-md text-gray-600">
              Deep insights into your team's performance and workflow.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <button className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
              <FiFilter className="mr-2" />
              Filters
            </button>
          </motion.div>
        </div>
      </header>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
      >
        {loading ? (
          <p>Loading analytics...</p>
        ) : (
          analyticsWidgets.map((widget) => (
            widget.show && (
              <div key={widget.id}>
                {widget.component}
              </div>
            )
          ))
        )}
      </motion.div>
    </div>
  );
};

export default AnalyticsDashboard;
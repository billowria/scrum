import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiTrendingUp, FiTrendingDown, FiClock, FiUsers, FiTarget,
  FiActivity, FiBarChart, FiPieChart, FiCalendar, FiEye
} from 'react-icons/fi';
import notificationService from '../../services/notificationService';

const MetricCard = ({ title, value, change, trend, icon: Icon, color = 'indigo' }) => {
  const colorClasses = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    rose: 'bg-rose-50 text-rose-600 border-rose-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200'
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend === 'up' ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {trend === 'up' ? <FiTrendingUp className="w-4 h-4" /> : <FiTrendingDown className="w-4 h-4" />}
            {change}
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm text-gray-600">{title}</p>
      </div>
    </motion.div>
  );
};

const ChartContainer = ({ title, children, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white rounded-2xl p-6 border border-gray-200 shadow-sm ${className}`}
  >
    <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
    {children}
  </motion.div>
);

const TimeSeriesChart = ({ data, height = 200 }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: ((maxValue - d.value) / maxValue) * height
  }));
  
  const pathData = points.reduce((path, point, i) => {
    return i === 0 ? `M ${point.x} ${point.y}` : `${path} L ${point.x} ${point.y}`;
  }, '');
  
  return (
    <div className="relative">
      <svg viewBox={`0 0 100 ${height}`} className="w-full" style={{ height: `${height}px` }}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0"/>
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(y => (
          <line
            key={y}
            x1="0"
            y1={y * height / 100}
            x2="100"
            y2={y * height / 100}
            stroke="#f3f4f6"
            strokeWidth="0.5"
          />
        ))}
        
        {/* Area fill */}
        <path
          d={`${pathData} L 100 ${height} L 0 ${height} Z`}
          fill="url(#areaGradient)"
        />
        
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke="rgb(99, 102, 241)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="3"
            fill="rgb(99, 102, 241)"
            className="hover:r-4 transition-all cursor-pointer"
          />
        ))}
      </svg>
      
      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        {data.map((d, i) => (
          <span key={i}>{d.label}</span>
        ))}
      </div>
    </div>
  );
};

const CategoryChart = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;
  
  return (
    <div className="space-y-4">
      {data.map((item, index) => {
        const percentage = (item.value / total) * 100;
        const startPercentage = cumulativePercentage;
        cumulativePercentage += percentage;
        
        return (
          <div key={item.category} className="flex items-center gap-4">
            <div className={`w-4 h-4 rounded ${item.color}`}></div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {item.category.replace('_', ' ')}
                </span>
                <span className="text-sm text-gray-600">{item.value}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${item.color}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function NotificationInsights() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  
  useEffect(() => {
    loadInsights();
  }, [timeRange]);
  
  const loadInsights = async () => {
    try {
      setLoading(true);
      
      // Get comprehensive analytics data
      const [stats, activityData, categoryData, performanceMetrics] = await Promise.all([
        notificationService.getNotificationStats(),
        notificationService.getActivityData(timeRange),
        notificationService.getCategoryBreakdown(),
        notificationService.getPerformanceMetrics()
      ]);
      
      setInsights({
        stats,
        activityData,
        categoryData,
        performanceMetrics
      });
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="p-8 space-y-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-200 animate-pulse rounded-2xl h-32"></div>
        ))}
      </div>
    );
  }
  
  const {
    stats = {},
    activityData = [],
    categoryData = [],
    performanceMetrics = {}
  } = insights || {};
  
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Insights</h1>
          <p className="text-gray-600 mt-1">Analyze your notification patterns and engagement</p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 3 months</option>
          </select>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Notifications"
          value={stats.total || 0}
          change="+12%"
          trend="up"
          icon={FiActivity}
          color="indigo"
        />
        <MetricCard
          title="Unread Count"
          value={stats.unread || 0}
          change="-5%"
          trend="down"
          icon={FiEye}
          color="amber"
        />
        <MetricCard
          title="Engagement Rate"
          value={`${stats.engagementRate || 0}%`}
          change="+3%"
          trend="up"
          icon={FiTarget}
          color="emerald"
        />
        <MetricCard
          title="Avg Response Time"
          value={`${stats.responseTime || 0}m`}
          change="-8%"
          trend="down"
          icon={FiClock}
          color="purple"
        />
      </div>
      
      {/* Activity Timeline */}
      <ChartContainer title="Activity Over Time" className="lg:col-span-2">
        <TimeSeriesChart data={activityData} />
      </ChartContainer>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <ChartContainer title="Notifications by Category">
          <CategoryChart data={categoryData} />
        </ChartContainer>
        
        {/* Performance Insights */}
        <ChartContainer title="Performance Insights">
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FiUsers className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Active Users</h4>
                  <p className="text-sm text-gray-600">Users receiving notifications</p>
                </div>
              </div>
              <span className="text-xl font-bold text-blue-600">{performanceMetrics.activeUsers || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FiBarChart className="w-5 h-5 text-emerald-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Delivery Rate</h4>
                  <p className="text-sm text-gray-600">Successfully delivered</p>
                </div>
              </div>
              <span className="text-xl font-bold text-emerald-600">{performanceMetrics.deliveryRate || 0}%</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FiClock className="w-5 h-5 text-amber-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Peak Hours</h4>
                  <p className="text-sm text-gray-600">Most active time</p>
                </div>
              </div>
              <span className="text-xl font-bold text-amber-600">{performanceMetrics.peakHours || '9-11 AM'}</span>
            </div>
          </div>
        </ChartContainer>
      </div>
      
      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Categories */}
        <ChartContainer title="Most Active Categories">
          <div className="space-y-3">
            {categoryData.slice(0, 5).map((category, index) => (
              <div key={category.category} className="flex items-center gap-3">
                <div className="text-lg font-bold text-gray-400 w-6">#{index + 1}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 capitalize">
                      {category.category.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-600">{category.value}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div
                      className={`h-1.5 rounded-full ${category.color}`}
                      style={{ width: `${(category.value / Math.max(...categoryData.map(c => c.value))) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ChartContainer>
        
        {/* Engagement Metrics */}
        <ChartContainer title="Engagement Metrics">
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-2">{stats.engagementRate || 0}%</div>
              <p className="text-sm text-gray-600">Overall engagement rate</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Read rate</span>
                <span className="font-medium">{stats.readRate || 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Click-through rate</span>
                <span className="font-medium">{stats.clickRate || 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Response rate</span>
                <span className="font-medium">{stats.responseRate || 0}%</span>
              </div>
            </div>
          </div>
        </ChartContainer>
        
        {/* Quick Actions */}
        <ChartContainer title="Quick Actions">
          <div className="space-y-3">
            <button className="w-full p-3 text-left bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors">
              <div className="flex items-center gap-3">
                <FiBarChart className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="font-medium text-indigo-900">Export Analytics</h4>
                  <p className="text-xs text-indigo-700">Download detailed report</p>
                </div>
              </div>
            </button>
            
            <button className="w-full p-3 text-left bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors">
              <div className="flex items-center gap-3">
                <FiCalendar className="w-5 h-5 text-emerald-600" />
                <div>
                  <h4 className="font-medium text-emerald-900">Schedule Report</h4>
                  <p className="text-xs text-emerald-700">Set up automated insights</p>
                </div>
              </div>
            </button>
            
            <button className="w-full p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors">
              <div className="flex items-center gap-3">
                <FiPieChart className="w-5 h-5 text-purple-600" />
                <div>
                  <h4 className="font-medium text-purple-900">Custom Dashboard</h4>
                  <p className="text-xs text-purple-700">Create personalized view</p>
                </div>
              </div>
            </button>
          </div>
        </ChartContainer>
      </div>
    </div>
  );
}
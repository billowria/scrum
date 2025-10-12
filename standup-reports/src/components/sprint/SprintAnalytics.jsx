import React from 'react';
import { motion } from 'framer-motion';
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiActivity,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiZap,
  FiTarget,
  FiBarChart2
} from 'react-icons/fi';
import {
  calculateBurndownData,
  calculateTaskDistribution,
  getSprintMetrics,
  getHealthColor
} from '../../utils/sprintUtils';

const SprintAnalytics = ({ sprint, tasks }) => {
  const metrics = getSprintMetrics(sprint, tasks);
  const burndownData = calculateBurndownData(sprint, tasks);
  const taskDistribution = calculateTaskDistribution(tasks);
  const healthColor = getHealthColor(metrics.health);

  // Get health color classes
  const getHealthClasses = (color) => {
    switch (color) {
      case 'green':
        return {
          bg: 'bg-green-100',
          text: 'text-green-700',
          border: 'border-green-500',
          gradient: 'from-green-400 to-emerald-600'
        };
      case 'amber':
        return {
          bg: 'bg-amber-100',
          text: 'text-amber-700',
          border: 'border-amber-500',
          gradient: 'from-amber-400 to-orange-600'
        };
      case 'red':
        return {
          bg: 'bg-red-100',
          text: 'text-red-700',
          border: 'border-red-500',
          gradient: 'from-red-400 to-rose-600'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          border: 'border-gray-500',
          gradient: 'from-gray-400 to-gray-600'
        };
    }
  };

  const healthClasses = getHealthClasses(healthColor);

  return (
    <div className="space-y-6">
      {/* Sprint Health Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-xl ${healthClasses.bg} border-2 ${healthClasses.border} p-6`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Sprint Health</h3>
            <p className="text-sm text-gray-600">Overall sprint performance indicator</p>
          </div>
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center">
              <div className="text-center">
                <div className={`text-3xl font-bold ${healthClasses.text}`}>
                  {Math.round(metrics.health)}
                </div>
                <div className="text-xs text-gray-500">Health</div>
              </div>
            </div>
            <div className={`absolute inset-0 rounded-full border-4 ${healthClasses.border} opacity-20 animate-ping`}></div>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={FiTarget}
          label="Completion Rate"
          value={`${Math.round(metrics.completionRate)}%`}
          color="blue"
          trend={metrics.completionRate > 50 ? 'up' : 'down'}
        />
        <MetricCard
          icon={FiZap}
          label="Velocity"
          value={metrics.velocity}
          color="purple"
          subtext="points"
        />
        <MetricCard
          icon={FiClock}
          label="Days Remaining"
          value={metrics.remainingDays}
          color="amber"
          subtext="days"
        />
        <MetricCard
          icon={FiActivity}
          label="Progress"
          value={`${Math.round(metrics.progress)}%`}
          color="green"
          trend={metrics.progress > 50 ? 'up' : 'neutral'}
        />
      </div>

      {/* Burndown Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Burndown Chart</h3>
            <p className="text-sm text-gray-500">Track your sprint progress over time</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-gradient-to-r from-blue-400 to-indigo-600 rounded"></div>
              <span className="text-gray-600">Ideal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-gradient-to-r from-purple-400 to-pink-600 rounded"></div>
              <span className="text-gray-600">Actual</span>
            </div>
          </div>
        </div>

        {burndownData.length > 0 ? (
          <div className="relative h-64">
            <svg className="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
              <defs>
                <linearGradient id="idealGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="actualGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#c084fc" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((percent) => (
                <line
                  key={percent}
                  x1="0"
                  y1={300 - (300 * percent) / 100}
                  x2="800"
                  y2={300 - (300 * percent) / 100}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              ))}

              {/* Ideal line path */}
              <path
                d={burndownData.map((point, i) => {
                  const x = (i / (burndownData.length - 1)) * 800;
                  const y = 300 - (point.ideal / metrics.capacity) * 300;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                fill="url(#idealGradient)"
                stroke="#60a5fa"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Actual line path */}
              <path
                d={burndownData.map((point, i) => {
                  const x = (i / (burndownData.length - 1)) * 800;
                  const y = 300 - (point.actual / metrics.capacity) * 300;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                fill="url(#actualGradient)"
                stroke="#c084fc"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="5,5"
              />
            </svg>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <FiBarChart2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No data available for burndown chart</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Task Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4">Task Distribution</h3>
        
        <div className="space-y-4">
          {Object.entries(taskDistribution).map(([status, data]) => (
            <TaskDistributionBar
              key={status}
              status={status}
              count={data.count}
              percentage={data.percentage}
            />
          ))}
        </div>
      </motion.div>

      {/* Sprint Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4">Sprint Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <SummaryItem label="Total Tasks" value={metrics.totalTasks} />
          <SummaryItem label="Completed" value={metrics.completedTasks} />
          <SummaryItem label="In Progress" value={tasks.filter(t => t.status === 'In Progress').length} />
          <SummaryItem label="Review" value={tasks.filter(t => t.status === 'Review').length} />
          <SummaryItem label="To Do" value={tasks.filter(t => t.status === 'To Do').length} />
          <SummaryItem label="Capacity" value={`${metrics.capacity} pts`} />
        </div>
      </motion.div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ icon: Icon, label, value, color, trend, subtext }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-indigo-600',
    purple: 'from-purple-500 to-pink-600',
    amber: 'from-amber-500 to-orange-600',
    green: 'from-green-500 to-emerald-600'
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[color]} bg-opacity-10`}>
          <Icon className={`w-5 h-5 text-${color}-600`} />
        </div>
        {trend && (
          <div className="flex items-center">
            {trend === 'up' ? (
              <FiTrendingUp className="w-4 h-4 text-green-500" />
            ) : trend === 'down' ? (
              <FiTrendingDown className="w-4 h-4 text-red-500" />
            ) : null}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-gray-600 mb-1">{label}</p>
        <div className="flex items-baseline gap-1">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtext && <span className="text-xs text-gray-500">{subtext}</span>}
        </div>
      </div>
    </motion.div>
  );
};

// Task Distribution Bar Component
const TaskDistributionBar = ({ status, count, percentage }) => {
  const statusConfig = {
    'To Do': { color: 'gray', icon: FiClock },
    'In Progress': { color: 'blue', icon: FiActivity },
    'Review': { color: 'amber', icon: FiAlertCircle },
    'Completed': { color: 'green', icon: FiCheckCircle }
  };

  const config = statusConfig[status] || statusConfig['To Do'];
  const Icon = config.icon;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 text-${config.color}-600`} />
          <span className="text-sm font-medium text-gray-700">{status}</span>
        </div>
        <span className="text-sm font-bold text-gray-900">{count} ({Math.round(percentage)}%)</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <motion.div
          className={`h-2 rounded-full bg-${config.color}-500`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

// Summary Item Component
const SummaryItem = ({ label, value }) => (
  <div className="text-center p-3 bg-white bg-opacity-60 rounded-lg">
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-xs text-gray-600">{label}</p>
  </div>
);

export default SprintAnalytics;

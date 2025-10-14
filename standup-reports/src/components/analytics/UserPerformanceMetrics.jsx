import React, { useMemo, forwardRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { FiUser, FiTrendingUp, FiClock, FiAlertTriangle, FiTarget } from 'react-icons/fi';
import { motion } from 'framer-motion';

const UserPerformanceMetrics = forwardRef(({ data, userId, teamComparison = false }, ref) => {

  const metrics = useMemo(() => {
    if (!data) return null;

    const userMetrics = data.find(user => user.userId === userId);
    const teamAverage = teamComparison ? data.reduce((acc, user) => ({
      tasksCompleted: acc.tasksCompleted + user.tasksCompleted,
      averageCycleTime: acc.averageCycleTime + user.averageCycleTime,
      blockerFrequency: acc.blockerFrequency + user.blockerFrequency,
      velocity: acc.velocity + user.velocity,
    }), { tasksCompleted: 0, averageCycleTime: 0, blockerFrequency: 0, velocity: 0 }) : null;

    if (teamAverage) {
      const teamCount = data.length;
      teamAverage.tasksCompleted /= teamCount;
      teamAverage.averageCycleTime /= teamCount;
      teamAverage.blockerFrequency /= teamCount;
      teamAverage.velocity /= teamCount;
    }

    return { userMetrics, teamAverage };
  }, [data, userId, teamComparison]);

  const radarData = useMemo(() => {
    if (!metrics?.userMetrics) return [];

    const { userMetrics, teamAverage } = metrics;
    const maxValues = {
      tasksCompleted: Math.max(...data.map(u => u.tasksCompleted)),
      averageCycleTime: Math.max(...data.map(u => u.averageCycleTime)),
      blockerFrequency: Math.max(...data.map(u => u.blockerFrequency)),
      velocity: Math.max(...data.map(u => u.velocity)),
    };

    const normalize = (value, max) => max > 0 ? (value / max) * 100 : 0;

    return [
      {
        metric: 'Tasks Completed',
        user: normalize(userMetrics.tasksCompleted, maxValues.tasksCompleted),
        team: teamAverage ? normalize(teamAverage.tasksCompleted, maxValues.tasksCompleted) : 0,
        fullMark: 100,
      },
      {
        metric: 'Cycle Time',
        user: 100 - normalize(userMetrics.averageCycleTime, maxValues.averageCycleTime), // Lower is better
        team: teamAverage ? 100 - normalize(teamAverage.averageCycleTime, maxValues.averageCycleTime) : 0,
        fullMark: 100,
      },
      {
        metric: 'Blocker Frequency',
        user: 100 - normalize(userMetrics.blockerFrequency, maxValues.blockerFrequency), // Lower is better
        team: teamAverage ? 100 - normalize(teamAverage.blockerFrequency, maxValues.blockerFrequency) : 0,
        fullMark: 100,
      },
      {
        metric: 'Velocity',
        user: normalize(userMetrics.velocity, maxValues.velocity),
        team: teamAverage ? normalize(teamAverage.velocity, maxValues.velocity) : 0,
        fullMark: 100,
      },
    ];
  }, [metrics, data]);

  const chartData = useMemo(() => {
    if (!metrics?.userMetrics) return [];

    const { userMetrics, teamAverage } = metrics;
    return [
      {
        metric: 'Tasks Completed',
        user: userMetrics.tasksCompleted,
        team: teamAverage?.tasksCompleted || 0,
      },
      {
        metric: 'Avg Cycle Time (days)',
        user: userMetrics.averageCycleTime,
        team: teamAverage?.averageCycleTime || 0,
      },
      {
        metric: 'Blocker Frequency',
        user: userMetrics.blockerFrequency,
        team: teamAverage?.blockerFrequency || 0,
      },
      {
        metric: 'Velocity',
        user: userMetrics.velocity,
        team: teamAverage?.velocity || 0,
      },
    ];
  }, [metrics]);

  if (!metrics?.userMetrics) {
    return (
      <motion.div
        className="bg-white rounded-xl shadow-md p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-gray-500">No user performance data available.</p>
      </motion.div>
    );
  }

  const { userMetrics } = metrics;

  return (
    <motion.div
      ref={ref}
      className="bg-white rounded-xl shadow-md p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100 }}
    >
      <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-6">
        <FiUser className="mr-2 text-blue-500" />
        User Performance Metrics
      </h3>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <motion.div
          className="p-4 bg-blue-50 rounded-lg"
          whileHover={{ scale: 1.05 }}
        >
          <FiTarget className="text-2xl text-blue-500 mb-1" />
          <p className="text-2xl font-bold text-gray-800">{userMetrics.tasksCompleted}</p>
          <p className="text-sm text-gray-600">Tasks Completed</p>
        </motion.div>
        <motion.div
          className="p-4 bg-green-50 rounded-lg"
          whileHover={{ scale: 1.05 }}
        >
          <FiClock className="text-2xl text-green-500 mb-1" />
          <p className="text-2xl font-bold text-gray-800">{userMetrics.averageCycleTime}d</p>
          <p className="text-sm text-gray-600">Avg Cycle Time</p>
        </motion.div>
        <motion.div
          className="p-4 bg-red-50 rounded-lg"
          whileHover={{ scale: 1.05 }}
        >
          <FiAlertTriangle className="text-2xl text-red-500 mb-1" />
          <p className="text-2xl font-bold text-gray-800">{userMetrics.blockerFrequency}</p>
          <p className="text-sm text-gray-600">Blockers</p>
        </motion.div>
        <motion.div
          className="p-4 bg-purple-50 rounded-lg"
          whileHover={{ scale: 1.05 }}
        >
          <FiTrendingUp className="text-2xl text-purple-500 mb-1" />
          <p className="text-2xl font-bold text-gray-800">{userMetrics.velocity}</p>
          <p className="text-sm text-gray-600">Velocity</p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="h-64">
          <h4 className="text-md font-medium text-gray-700 mb-2">Performance Comparison</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="metric"
                tick={{ fontSize: 12, fill: '#374151' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12, fill: '#374151' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="user" fill="#3b82f6" name="Your Performance" />
              {teamComparison && <Bar dataKey="team" fill="#10b981" name="Team Average" />}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart */}
        <div className="h-64">
          <h4 className="text-md font-medium text-gray-700 mb-2">Performance Radar</h4>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e0e0e0" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fontSize: 10, fill: '#374151' }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fontSize: 8, fill: '#374151' }}
              />
              <Radar
                name="Your Performance"
                dataKey="user"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              {teamComparison && (
                <Radar
                  name="Team Average"
                  dataKey="team"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
});

UserPerformanceMetrics.displayName = 'UserPerformanceMetrics';

export default UserPerformanceMetrics;
import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { FiTrendingUp, FiCalendar, FiTarget } from 'react-icons/fi';
import { motion } from 'framer-motion';

const VelocityBurndownCharts = ({ data, sprintData }) => {
  const [selectedChart, setSelectedChart] = useState('velocity');
  const isDarkMode = false; // TODO: Implement theme context

  const velocityData = useMemo(() => {
    if (!data?.velocity) return [];

    return data.velocity.map(item => ({
      date: item.date,
      velocity: item.value,
      ideal: item.ideal || null,
    }));
  }, [data]);

  const burndownData = useMemo(() => {
    if (!sprintData?.burndown) return [];

    return sprintData.burndown.map(item => ({
      day: item.day,
      remaining: item.remaining,
      ideal: item.ideal,
      completed: item.completed,
    }));
  }, [sprintData]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 border rounded-lg shadow-lg bg-white border-gray-200">
          <p className="font-semibold">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const chartVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-md p-6"
      initial="hidden"
      animate="visible"
      variants={chartVariants}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <FiTrendingUp className="mr-2 text-green-500" />
          Velocity & Burndown Charts
        </h3>

        {/* Chart Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setSelectedChart('velocity')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              selectedChart === 'velocity'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Velocity
          </button>
          <button
            onClick={() => setSelectedChart('burndown')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              selectedChart === 'burndown'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Burndown
          </button>
        </div>
      </div>

      {selectedChart === 'velocity' && (
        <motion.div
          key="velocity"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="h-80"
        >
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
            <FiTrendingUp className="mr-2" />
            Team Velocity Trend
          </h4>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={velocityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="idealGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6b7280" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e0e0e0'} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: isDarkMode ? '#d1d5db' : '#374151' }}
              />
              <YAxis tick={{ fontSize: 12, fill: isDarkMode ? '#d1d5db' : '#374151' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="velocity"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#velocityGradient)"
                name="Actual Velocity"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="ideal"
                stroke="#6b7280"
                fillOpacity={1}
                fill="url(#idealGradient)"
                name="Ideal Velocity"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {selectedChart === 'burndown' && (
        <motion.div
          key="burndown"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="h-80"
        >
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
            <FiTarget className="mr-2" />
            Sprint Burndown Chart
          </h4>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={burndownData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e0e0e0'} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12, fill: isDarkMode ? '#d1d5db' : '#374151' }}
              />
              <YAxis tick={{ fontSize: 12, fill: isDarkMode ? '#d1d5db' : '#374151' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="remaining"
                stroke="#ef4444"
                strokeWidth={3}
                name="Remaining Work"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="ideal"
                stroke="#6b7280"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Ideal Burndown"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#10b981"
                strokeWidth={2}
                name="Completed Work"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          className="p-4 bg-blue-50 rounded-lg"
          whileHover={{ scale: 1.02 }}
        >
          <FiTrendingUp className="text-2xl text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-gray-800">
            {data?.currentVelocity || 0}
          </p>
          <p className="text-sm text-gray-600">Current Velocity</p>
        </motion.div>
        <motion.div
          className="p-4 bg-green-50 rounded-lg"
          whileHover={{ scale: 1.02 }}
        >
          <FiTarget className="text-2xl text-green-500 mb-2" />
          <p className="text-2xl font-bold text-gray-800">
            {sprintData?.remainingWork || 0}
          </p>
          <p className="text-sm text-gray-600">Remaining Work</p>
        </motion.div>
        <motion.div
          className="p-4 bg-purple-50 rounded-lg"
          whileHover={{ scale: 1.02 }}
        >
          <FiCalendar className="text-2xl text-purple-500 mb-2" />
          <p className="text-2xl font-bold text-gray-800">
            {sprintData?.daysRemaining || 0}
          </p>
          <p className="text-sm text-gray-600">Days Remaining</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default VelocityBurndownCharts;
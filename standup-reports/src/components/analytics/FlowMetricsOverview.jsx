
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { FiTrendingUp, FiClock, FiZap } from 'react-icons/fi';
import { motion } from 'framer-motion';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-white border border-gray-200 rounded-lg shadow-lg">
        <p className="label text-sm font-bold text-gray-800">{`${label}`}</p>
        <p className="intro text-xs text-indigo-600">{`Tasks Completed : ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const FlowMetricsOverview = ({ data }) => {
  const { cycleTime, leadTime, throughput } = data;

  const chartVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-md p-6"
      variants={itemVariants}
    >
      <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
        <FiTrendingUp className="mr-2 text-indigo-500" />
        Flow Metrics Overview
      </h3>
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center"
        variants={chartVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="p-4 bg-gray-50 rounded-lg" variants={itemVariants}>
          <FiZap className="mx-auto text-2xl text-green-500 mb-1" />
          <p className="text-2xl font-bold text-gray-800">{throughput.reduce((acc, t) => acc + t.count, 0)}</p>
          <p className="text-sm text-gray-600">Throughput</p>
        </motion.div>
        <motion.div className="p-4 bg-gray-50 rounded-lg" variants={itemVariants}>
          <FiClock className="mx-auto text-2xl text-blue-500 mb-1" />
          <p className="text-2xl font-bold text-gray-800">{cycleTime.average}d</p>
          <p className="text-sm text-gray-600">Avg. Cycle Time</p>
        </motion.div>
        <motion.div className="p-4 bg-gray-50 rounded-lg" variants={itemVariants}>
          <FiClock className="mx-auto text-2xl text-purple-500 mb-1" />
          <p className="text-2xl font-bold text-gray-800">{leadTime.average}d</p>
          <p className="text-sm text-gray-600">Avg. Lead Time</p>
        </motion.div>
      </motion.div>

      <motion.div 
        className="h-64"
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={throughput} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "14px" }} />
            <Line type="monotone" dataKey="count" name="Tasks Completed" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  );
};

export default FlowMetricsOverview;

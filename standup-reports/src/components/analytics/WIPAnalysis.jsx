
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { FiActivity, FiAlertTriangle } from 'react-icons/fi';
import { motion } from 'framer-motion';

const WIPAnalysis = ({ data }) => {
  const { wipTrend, wipAging } = data;

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
  };

  const agingColor = (age) => {
    if (age > 10) return '#ef4444'; // red-500
    if (age > 5) return '#f97316'; // orange-500
    return '#3b82f6'; // blue-500
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-md p-6 h-full flex flex-col"
      variants={itemVariants}
    >
      <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
        <FiActivity className="mr-2 text-orange-500" />
        Work in Progress Analysis
      </h3>
      
      <div className="flex-grow h-64">
        <p className='text-sm text-gray-600 mb-2'>WIP Aging (days)</p>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={wipAging.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
            <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{backgroundColor: '#ffffff', border: '1px solid #e5e7eb'}}/>
            <Bar dataKey="age" name="Age (days)" barSize={15}>
              {wipAging.map((entry, index) => (
                <Bar key={`cell-${index}`} fill={agingColor(entry.age)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {wipAging.length > 0 && wipAging[0].age > 10 && (
        <motion.div 
          className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center"
          initial={{opacity: 0, y: 10}}
          animate={{opacity: 1, y: 0}}
          transition={{delay: 0.5}}
        >
          <FiAlertTriangle className="text-red-500 mr-3" />
          <p className="text-sm text-red-700">Stale task detected: '{wipAging[0].name}' has been in progress for {wipAging[0].age} days.</p>
        </motion.div>
      )}

    </motion.div>
  );
};

export default WIPAnalysis;


import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FiAlertOctagon } from 'react-icons/fi';
import { motion } from 'framer-motion';

// A simple component to render words with sizes based on frequency
const WordCloud = ({ words }) => {
  const maxFreq = Math.max(...words.map(w => w.value), 0);
  const minFreq = Math.min(...words.map(w => w.value), 0);

  const getColor = (value) => {
    if (value > maxFreq * 0.66) return 'text-red-600';
    if (value > maxFreq * 0.33) return 'text-orange-500';
    return 'text-gray-700';
  };

  const getFontSize = (value) => {
    if (maxFreq === minFreq) return '1rem';
    const size = 12 + ((value - minFreq) / (maxFreq - minFreq)) * 24; // Scale from 12px to 36px
    return `${size}px`;
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 p-4 bg-gray-50 rounded-lg">
      {words.map((word, i) => (
        <motion.span
          key={word.text}
          className={`font-bold ${getColor(word.value)}`}
          style={{ fontSize: getFontSize(word.value) }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05, type: 'spring', stiffness: 100 }}
        >
          {word.text}
        </motion.span>
      ))}
    </div>
  );
};

const BlockerAnalysis = ({ data }) => {
  const { blockerTrend, blockerKeywords } = data;

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-md p-6 h-full flex flex-col"
      variants={itemVariants}
    >
      <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
        <FiAlertOctagon className="mr-2 text-red-500" />
        Blocker Analysis
      </h3>
      
      <div className="flex-grow h-48 mb-4">
        <p className='text-sm text-gray-600 mb-2'>Blockers Reported per Day</p>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={blockerTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" name="Blockers" stroke="#ef4444" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className='text-sm text-gray-600 mb-2'>Common Blocker Themes</p>
        {blockerKeywords.length > 0 ? (
          <WordCloud words={blockerKeywords} />
        ) : (
          <div className="text-center text-gray-500 py-8">No blocker keywords found.</div>
        )}
      </div>
    </motion.div>
  );
};

export default BlockerAnalysis;

import React, { useMemo, forwardRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { FiTrendingUp, FiEye, FiAlertCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';

const PredictiveInsights = forwardRef(({ data }, ref) => {

  const predictions = useMemo(() => {
    if (!data?.historical || data.historical.length < 3) return null;

    const historical = data.historical;
    const values = historical.map(d => d.value);

    // Calculate moving averages
    const movingAverage = (arr, window) => {
      const result = [];
      for (let i = window - 1; i < arr.length; i++) {
        const sum = arr.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / window);
      }
      return result;
    };

    // Exponential smoothing
    const exponentialSmoothing = (arr, alpha = 0.3) => {
      const result = [arr[0]];
      for (let i = 1; i < arr.length; i++) {
        result.push(alpha * arr[i] + (1 - alpha) * result[i - 1]);
      }
      return result;
    };

    const ma7 = movingAverage(values, 7);
    const ma14 = movingAverage(values, 14);
    const expSmooth = exponentialSmoothing(values);

    // Simple linear regression for trend
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate predictions
    const predictions = [];
    const lastDate = new Date(historical[historical.length - 1].date);

    for (let i = 1; i <= 7; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + i);
      const predictedValue = slope * (n + i - 1) + intercept;

      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        predicted: Math.max(0, predictedValue),
        confidence: Math.max(0.1, 1 - (i * 0.1)), // Decreasing confidence
      });
    }

    return {
      historical: historical.map((d, i) => ({
        ...d,
        ma7: i >= 6 ? ma7[i - 6] : null,
        ma14: i >= 13 ? ma14[i - 13] : null,
        expSmooth: expSmooth[i],
      })),
      predictions,
      trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
      slope,
    };
  }, [data]);

  const chartData = useMemo(() => {
    if (!predictions) return [];

    const combined = [...predictions.historical];

    // Add predictions
    predictions.predictions.forEach(pred => {
      combined.push({
        date: pred.date,
        value: null,
        predicted: pred.predicted,
        confidence: pred.confidence,
      });
    });

    return combined;
  }, [predictions]);

  const insights = useMemo(() => {
    if (!predictions) return [];

    const insights = [];
    const { trend, slope } = predictions;
    const latestValue = predictions.historical[predictions.historical.length - 1]?.value || 0;
    const predictedValue = predictions.predictions[6]?.predicted || 0;

    if (trend === 'increasing') {
      insights.push({
        type: 'positive',
        icon: FiTrendingUp,
        title: 'Upward Trend',
        description: `Performance is trending upward with a slope of ${slope.toFixed(2)}`,
      });
    } else if (trend === 'decreasing') {
      insights.push({
        type: 'warning',
        icon: FiAlertCircle,
        title: 'Downward Trend',
        description: `Performance is declining with a slope of ${slope.toFixed(2)}`,
      });
    }

    const changePercent = ((predictedValue - latestValue) / latestValue) * 100;
    if (Math.abs(changePercent) > 10) {
      insights.push({
        type: changePercent > 0 ? 'positive' : 'warning',
        icon: FiEye,
        title: '7-Day Forecast',
        description: `Predicted ${changePercent > 0 ? 'increase' : 'decrease'} of ${Math.abs(changePercent).toFixed(1)}% in 7 days`,
      });
    }

    return insights;
  }, [predictions]);

  if (!predictions) {
    return (
      <motion.div
        className="bg-white rounded-xl shadow-md p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-gray-500">Insufficient data for predictive insights.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className="bg-white rounded-xl shadow-md p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100 }}
    >
      <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-6">
        <FiEye className="mr-2 text-purple-500" />
        Predictive Insights
      </h3>

      {/* Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {insights.map((insight, index) => (
          <motion.div
            key={index}
            className={`p-4 rounded-lg border ${
              insight.type === 'positive'
                ? 'bg-green-50 border-green-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center">
              <insight.icon className={`text-xl mr-3 ${
                insight.type === 'positive' ? 'text-green-500' : 'text-yellow-500'
              }`} />
              <div>
                <h4 className="font-semibold text-gray-800">{insight.title}</h4>
                <p className="text-sm text-gray-600">{insight.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Prediction Chart */}
      <div className="h-80">
        <h4 className="text-md font-medium text-gray-700 mb-4">Trend Analysis & Forecast</h4>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="historicalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="predictionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#374151' }}
            />
            <YAxis tick={{ fontSize: 12, fill: '#374151' }} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="p-3 border rounded-lg shadow-lg bg-white border-gray-200">
                      <p className="font-semibold">{label}</p>
                      {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }}>
                          {entry.name}: {entry.value?.toFixed(2) || 'N/A'}
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#historicalGradient)"
              name="Historical"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="predicted"
              stroke="#8b5cf6"
              fillOpacity={1}
              fill="url(#predictionGradient)"
              name="Predicted"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
            <Line
              type="monotone"
              dataKey="ma7"
              stroke="#10b981"
              strokeWidth={1}
              name="7-Day MA"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="expSmooth"
              stroke="#f59e0b"
              strokeWidth={1}
              name="Exp. Smoothing"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Forecast Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-2">7-Day Forecast</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Predicted Value:</span>
            <span className="ml-2 font-semibold text-gray-800">
              {predictions.predictions[6]?.predicted?.toFixed(2) || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Trend:</span>
            <span className={`ml-2 font-semibold ${
              predictions.trend === 'increasing' ? 'text-green-600' :
              predictions.trend === 'decreasing' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {predictions.trend}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Confidence:</span>
            <span className="ml-2 font-semibold text-gray-800">
              {((predictions.predictions[6]?.confidence || 0) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

PredictiveInsights.displayName = 'PredictiveInsights';

export default PredictiveInsights;
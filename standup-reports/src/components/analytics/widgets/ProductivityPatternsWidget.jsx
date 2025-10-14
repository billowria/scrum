import React, { useState } from 'react';
import { FiTrendingUp, FiClock, FiTarget, FiCalendar } from 'react-icons/fi';
import AnalyticsCard from '../shared/AnalyticsCard';
import InfoModal from '../modals/InfoModal';

const ProductivityPatternsWidget = ({ data, loading = false }) => {
  const [showInfo, setShowInfo] = useState(false);

  // Mock data - replace with real data
  const productivityData = data || {
    peakHours: '10 AM - 2 PM',
    peakDays: 'Tuesday, Wednesday',
    averageFocusTime: '3.2 hours',
    contextSwitches: 8,
    productivityScore: 78,
    patterns: [
      { day: 'Monday', productivity: 65, tasks: 4 },
      { day: 'Tuesday', productivity: 85, tasks: 7 },
      { day: 'Wednesday', productivity: 82, tasks: 6 },
      { day: 'Thursday', productivity: 75, tasks: 5 },
      { day: 'Friday', productivity: 60, tasks: 3 },
    ],
    recommendations: [
      'Schedule complex tasks during peak hours (10 AM - 2 PM)',
      'Reserve Tuesdays and Wednesdays for focused work',
      'Minimize meetings during peak productivity windows',
      'Consider 4-day work weeks focusing on high-productivity days',
    ],
  };

  const handleInfoClick = () => {
    setShowInfo(true);
  };

  const getProductivityColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getProductivityBg = (score) => {
    if (score >= 80) return 'bg-green-50';
    if (score >= 60) return 'bg-amber-50';
    return 'bg-red-50';
  };

  const metrics = [
    { label: 'Productivity Score', value: `${productivityData.productivityScore}%` },
    { label: 'Peak Hours', value: productivityData.peakHours },
    { label: 'Avg Focus Time', value: productivityData.averageFocusTime },
    { label: 'Context Switches', value: productivityData.contextSwitches },
  ];

  const insights = [
    `Peak productivity occurs during ${productivityData.peakHours}`,
    `Highest productivity on ${productivityData.peakDays}`,
    `Average focused work time is ${productivityData.averageFocusTime} per day`,
    `${productivityData.contextSwitches} context switches detected daily`,
  ];

  const recommendations = productivityData.recommendations;

  return (
    <>
      <AnalyticsCard
        title="Productivity Patterns"
        icon={FiTrendingUp}
        showInfo={true}
        onInfoClick={handleInfoClick}
        loading={loading}
      >
        <div className="space-y-4">
          {/* Overall Score */}
          <div className={`text-center p-4 rounded-lg ${getProductivityBg(productivityData.productivityScore)}`}>
            <div className={`text-3xl font-bold ${getProductivityColor(productivityData.productivityScore)} mb-1`}>
              {productivityData.productivityScore}%
            </div>
            <div className="text-sm text-slate-600">Productivity Score</div>
          </div>

          {/* Key Insights */}
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <FiClock className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Peak Hours</span>
              </div>
              <span className="text-sm font-medium text-slate-900">{productivityData.peakHours}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <FiCalendar className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Peak Days</span>
              </div>
              <span className="text-sm font-medium text-slate-900">{productivityData.peakDays}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <FiTarget className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Avg Focus Time</span>
              </div>
              <span className="text-sm font-medium text-slate-900">{productivityData.averageFocusTime}</span>
            </div>
          </div>

          {/* Weekly Pattern */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-900">Weekly Pattern</h4>
            {productivityData.patterns.map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-slate-600 w-16">{day.day.slice(0, 3)}</span>
                <div className="flex-1 mx-3">
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        day.productivity >= 80 ? 'bg-green-500' :
                        day.productivity >= 60 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${day.productivity}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${getProductivityColor(day.productivity)}`}>
                    {day.productivity}%
                  </span>
                  <span className="text-xs text-slate-500">({day.tasks})</span>
                </div>
              </div>
            ))}
          </div>

          {/* Context Switches Alert */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FiTrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Context Switches</span>
              </div>
              <span className="text-sm font-semibold text-blue-800">{productivityData.contextSwitches}/day</span>
            </div>
            <div className="text-xs text-blue-700 mt-1">
              High context switching may reduce productivity
            </div>
          </div>
        </div>
      </AnalyticsCard>

      <InfoModal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        title="Productivity Patterns"
        description="Productivity patterns analysis helps identify optimal working times and conditions. Understanding these patterns enables better task scheduling and resource allocation."
        metrics={metrics}
        insights={insights}
        recommendations={recommendations}
      />
    </>
  );
};

export default ProductivityPatternsWidget;
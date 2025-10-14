import React, { useState } from 'react';
import { FiLayers, FiAlertTriangle, FiTrendingUp } from 'react-icons/fi';
import AnalyticsCard from '../shared/AnalyticsCard';
import InfoModal from '../modals/InfoModal';

const WIPAnalysisWidget = ({ data, loading = false }) => {
  const [showInfo, setShowInfo] = useState(false);

  // Mock data - replace with real data
  const wipData = data || {
    currentWIP: 24,
    wipLimit: 20,
    wipByStage: [
      { stage: 'To Do', count: 5, limit: 10 },
      { stage: 'In Progress', count: 12, limit: 8 },
      { stage: 'Review', count: 4, limit: 5 },
      { stage: 'Done', count: 3, limit: null },
    ],
    bottlenecks: ['In Progress stage exceeded limit by 4 items'],
    recommendations: ['Reduce WIP in In Progress stage', 'Focus on completing review items'],
  };

  const handleInfoClick = () => {
    setShowInfo(true);
  };

  const isOverLimit = wipData.currentWIP > wipData.wipLimit;
  const wipPercentage = Math.min((wipData.currentWIP / wipData.wipLimit) * 100, 100);

  const metrics = [
    { label: 'Current WIP', value: wipData.currentWIP },
    { label: 'WIP Limit', value: wipData.wipLimit },
    { label: 'Utilization', value: `${Math.round(wipPercentage)}%` },
  ];

  const insights = [
    `Current WIP is ${isOverLimit ? 'above' : 'within'} the recommended limit`,
    'In Progress stage has the highest WIP concentration',
    'Review stage is approaching its limit',
    'To Do items are well within capacity',
  ];

  const recommendations = [
    'Implement WIP limits strictly to improve flow efficiency',
    'Focus on completing items in the In Progress stage',
    'Consider increasing team capacity or reducing scope',
    'Monitor WIP trends daily to prevent bottlenecks',
  ];

  return (
    <>
      <AnalyticsCard
        title="WIP Analysis"
        icon={FiLayers}
        showInfo={true}
        onInfoClick={handleInfoClick}
        loading={loading}
      >
        <div className="space-y-4">
          {/* Overall WIP Status */}
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {wipData.currentWIP}
            </div>
            <div className="text-sm text-slate-600 mb-2">Current Work in Progress</div>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-sm text-slate-500">Limit: {wipData.wipLimit}</span>
              {isOverLimit && (
                <FiAlertTriangle className="w-4 h-4 text-amber-500" />
              )}
            </div>
          </div>

          {/* WIP Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">WIP Utilization</span>
              <span className={`font-medium ${isOverLimit ? 'text-amber-600' : 'text-slate-600'}`}>
                {Math.round(wipPercentage)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  isOverLimit ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${wipPercentage}%` }}
              />
            </div>
          </div>

          {/* Stage Breakdown */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-900">By Stage</h4>
            {wipData.wipByStage.map((stage, index) => {
              const stagePercentage = stage.limit ? Math.min((stage.count / stage.limit) * 100, 100) : 0;
              const stageOverLimit = stage.limit && stage.count > stage.limit;

              return (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{stage.stage}</span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${stageOverLimit ? 'text-amber-600' : 'text-slate-900'}`}>
                      {stage.count}
                    </span>
                    {stage.limit && (
                      <span className="text-xs text-slate-500">/ {stage.limit}</span>
                    )}
                    {stageOverLimit && (
                      <FiAlertTriangle className="w-3 h-3 text-amber-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottlenecks Alert */}
          {wipData.bottlenecks && wipData.bottlenecks.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <FiAlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-amber-800">Bottlenecks Detected</div>
                  <div className="text-xs text-amber-700 mt-1">
                    {wipData.bottlenecks[0]}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AnalyticsCard>

      <InfoModal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        title="WIP Analysis"
        description="Work in Progress (WIP) analysis helps identify bottlenecks and ensures smooth workflow. Limiting WIP improves focus and reduces cycle time."
        metrics={metrics}
        insights={insights}
        recommendations={recommendations}
      />
    </>
  );
};

export default WIPAnalysisWidget;
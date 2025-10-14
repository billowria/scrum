import React, { useState } from 'react';
import { FiAlertTriangle, FiClock, FiUser, FiFlag } from 'react-icons/fi';
import AnalyticsCard from '../shared/AnalyticsCard';
import InfoModal from '../modals/InfoModal';

const BlockerAnalysisWidget = ({ data, loading = false }) => {
  const [showInfo, setShowInfo] = useState(false);

  // Mock data - replace with real data
  const blockerData = data || {
    totalBlockers: 7,
    criticalBlockers: 2,
    resolvedToday: 3,
    averageResolutionTime: '2.4 days',
    blockersByType: [
      { type: 'Technical', count: 3, percentage: 43 },
      { type: 'Dependency', count: 2, percentage: 29 },
      { type: 'Resource', count: 1, percentage: 14 },
      { type: 'External', count: 1, percentage: 14 },
    ],
    topBlockers: [
      { task: 'PROJ-123', description: 'API integration blocked', age: '5 days', priority: 'High' },
      { task: 'PROJ-145', description: 'Waiting for design approval', age: '3 days', priority: 'Medium' },
    ],
  };

  const handleInfoClick = () => {
    setShowInfo(true);
  };

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-amber-600 bg-amber-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  const metrics = [
    { label: 'Total Blockers', value: blockerData.totalBlockers },
    { label: 'Critical Blockers', value: blockerData.criticalBlockers },
    { label: 'Resolved Today', value: blockerData.resolvedToday },
    { label: 'Avg Resolution Time', value: blockerData.averageResolutionTime },
  ];

  const insights = [
    `${blockerData.criticalBlockers} critical blockers require immediate attention`,
    `Average resolution time is ${blockerData.averageResolutionTime}`,
    'Technical issues account for 43% of all blockers',
    `${blockerData.resolvedToday} blockers were resolved today`,
  ];

  const recommendations = [
    'Prioritize resolving critical blockers immediately',
    'Implement regular blocker review meetings',
    'Track blocker trends to identify recurring issues',
    'Consider preventive measures for common blocker types',
  ];

  return (
    <>
      <AnalyticsCard
        title="Blocker Analysis"
        icon={FiAlertTriangle}
        showInfo={true}
        onInfoClick={handleInfoClick}
        loading={loading}
      >
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-xl font-bold text-red-700">{blockerData.totalBlockers}</div>
              <div className="text-xs text-red-600">Total Blockers</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-xl font-bold text-orange-700">{blockerData.criticalBlockers}</div>
              <div className="text-xs text-orange-600">Critical</div>
            </div>
          </div>

          {/* Blocker Types */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-900">Blockers by Type</h4>
            {blockerData.blockersByType.map((type, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{type.type}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-slate-900">{type.count}</span>
                  <span className="text-xs text-slate-500">({type.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>

          {/* Top Blockers */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-900">Top Blockers</h4>
            {blockerData.topBlockers.map((blocker, index) => (
              <div key={index} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-medium text-slate-900">{blocker.task}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(blocker.priority)}`}>
                    {blocker.priority}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-2">{blocker.description}</p>
                <div className="flex items-center space-x-1">
                  <FiClock className="w-3 h-3 text-slate-400" />
                  <span className="text-xs text-slate-500">{blocker.age} old</span>
                </div>
              </div>
            ))}
          </div>

          {/* Resolution Status */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <FiFlag className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Resolved Today</span>
            </div>
            <span className="text-lg font-semibold text-green-800">{blockerData.resolvedToday}</span>
          </div>
        </div>
      </AnalyticsCard>

      <InfoModal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        title="Blocker Analysis"
        description="Blocker analysis helps identify and prioritize impediments that are slowing down development. Quick resolution of blockers improves team velocity and delivery predictability."
        metrics={metrics}
        insights={insights}
        recommendations={recommendations}
      />
    </>
  );
};

export default BlockerAnalysisWidget;
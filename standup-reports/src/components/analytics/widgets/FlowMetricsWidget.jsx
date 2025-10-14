import React, { useState } from 'react';
import { FiGitBranch, FiTrendingUp, FiClock, FiCheckCircle } from 'react-icons/fi';
import AnalyticsCard from '../shared/AnalyticsCard';
import InfoModal from '../modals/InfoModal';

const FlowMetricsWidget = ({ data, loading = false }) => {
  const [showInfo, setShowInfo] = useState(false);

  // Mock data - replace with real data
  const flowData = data || {
    leadTime: '4.2 days',
    cycleTime: '2.8 days',
    throughput: 12,
    wip: 8,
    flowEfficiency: '68%',
    changeLeadTime: '+0.3 days',
    changeCycleTime: '-0.1 days',
    changeThroughput: '+2',
  };

  const handleInfoClick = () => {
    setShowInfo(true);
  };

  const metrics = [
    { label: 'Lead Time', value: flowData.leadTime },
    { label: 'Cycle Time', value: flowData.cycleTime },
    { label: 'Throughput', value: `${flowData.throughput}/week` },
    { label: 'Flow Efficiency', value: flowData.flowEfficiency },
  ];

  const insights = [
    'Lead time has increased by 0.3 days this sprint',
    'Cycle time improved by 0.1 days, showing better efficiency',
    'Throughput increased by 2 items per week',
    'Flow efficiency indicates room for improvement in reducing wait times',
  ];

  const recommendations = [
    'Focus on reducing work in progress to improve flow efficiency',
    'Identify and eliminate bottlenecks in the development process',
    'Consider implementing pull-based workflow management',
    'Monitor lead time trends to predict delivery dates more accurately',
  ];

  return (
    <>
      <AnalyticsCard
        title="Flow Metrics"
        icon={FiGitBranch}
        showInfo={true}
        onInfoClick={handleInfoClick}
        loading={loading}
      >
        <div className="space-y-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-lg font-semibold text-slate-900">
                {flowData.leadTime}
              </div>
              <div className="text-xs text-slate-600">Lead Time</div>
              <div className="text-xs text-green-600 mt-1">
                {flowData.changeLeadTime}
              </div>
            </div>

            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-lg font-semibold text-slate-900">
                {flowData.cycleTime}
              </div>
              <div className="text-xs text-slate-600">Cycle Time</div>
              <div className="text-xs text-green-600 mt-1">
                {flowData.changeCycleTime}
              </div>
            </div>

            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-lg font-semibold text-slate-900">
                {flowData.throughput}
              </div>
              <div className="text-xs text-slate-600">Throughput</div>
              <div className="text-xs text-green-600 mt-1">
                {flowData.changeThroughput}
              </div>
            </div>

            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-lg font-semibold text-slate-900">
                {flowData.flowEfficiency}
              </div>
              <div className="text-xs text-slate-600">Efficiency</div>
            </div>
          </div>

          {/* WIP Indicator */}
          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <FiClock className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">Work in Progress</span>
            </div>
            <span className="text-lg font-semibold text-amber-800">{flowData.wip}</span>
          </div>
        </div>
      </AnalyticsCard>

      <InfoModal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        title="Flow Metrics"
        description="Flow metrics measure how efficiently work moves through your development process. These metrics help identify bottlenecks and predict delivery times."
        metrics={metrics}
        insights={insights}
        recommendations={recommendations}
      />
    </>
  );
};

export default FlowMetricsWidget;
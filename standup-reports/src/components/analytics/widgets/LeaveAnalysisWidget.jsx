import React, { useState } from 'react';
import { FiCalendar, FiTrendingUp, FiUsers, FiBarChart2, FiInfo } from 'react-icons/fi';
import AnalyticsCard from '../shared/AnalyticsCard';
import InfoModal from '../modals/InfoModal';

const LeaveAnalysisWidget = ({ data, loading = false }) => {
  const [showInfo, setShowInfo] = useState(false);

  // Mock data - replace with real data from getLeaveAnalysis
  const leaveData = data || {
    leavePatterns: {
      byType: { 'Annual Leave': 45, 'Sick Leave': 12, 'Personal Leave': 8 },
      byMonth: { '2024-01': 15, '2024-02': 22, '2024-03': 18 },
      averageDuration: 3.2,
      totalDays: 65
    },
    utilization: {
      totalUtilizationRate: 15.2,
      totalLeaveDays: 65,
      byUser: [
        { userId: '1', name: 'John Doe', leaveDays: 12, utilizationRate: 18.5 },
        { userId: '2', name: 'Jane Smith', leaveDays: 8, utilizationRate: 12.3 },
        { userId: '3', name: 'Bob Johnson', leaveDays: 15, utilizationRate: 22.1 }
      ]
    },
    productivityImpact: {
      averageTasksDuringLeave: 0.8,
      teamProductivityDrop: 12.5,
      recommendations: [
        'Consider redistributing workload during leave periods',
        'Monitor task completion during absences'
      ]
    }
  };

  const handleInfoClick = () => {
    setShowInfo(true);
  };

  const getUtilizationColor = (rate) => {
    if (rate > 20) return 'text-red-600';
    if (rate > 15) return 'text-amber-600';
    return 'text-green-600';
  };

  const getUtilizationBg = (rate) => {
    if (rate > 20) return 'bg-red-50';
    if (rate > 15) return 'bg-amber-50';
    return 'bg-green-50';
  };

  const metrics = [
    { label: 'Total Leave Days', value: leaveData.leavePatterns.totalDays },
    { label: 'Average Duration', value: `${leaveData.leavePatterns.averageDuration} days` },
    { label: 'Utilization Rate', value: `${leaveData.utilization.totalUtilizationRate}%` },
    { label: 'Productivity Impact', value: `${leaveData.productivityImpact.teamProductivityDrop}% drop` },
  ];

  const insights = [
    `Team utilization rate is ${leaveData.utilization?.totalUtilizationRate || 0}%, indicating ${(leaveData.utilization?.totalUtilizationRate || 0) > 20 ? 'high' : (leaveData.utilization?.totalUtilizationRate || 0) > 15 ? 'moderate' : 'low'} leave usage`,
    `Average leave duration is ${leaveData.leavePatterns?.averageDuration || 0} days per request`,
    `Team productivity drops by ${leaveData.productivityImpact?.teamProductivityDrop || 0}% during leave periods`,
    `Most common leave type is ${leaveData.leavePatterns?.byType && Object.keys(leaveData.leavePatterns.byType).length > 0 ? Object.keys(leaveData.leavePatterns.byType).reduce((a, b) => leaveData.leavePatterns.byType[a] > leaveData.leavePatterns.byType[b] ? a : b) : 'N/A'}`,
  ];

  const recommendations = [
    'Monitor leave patterns to ensure balanced team capacity',
    'Plan workload distribution during peak leave periods',
    'Encourage strategic leave scheduling to minimize productivity impact',
    'Consider flexible work arrangements during absences',
    ...(leaveData.productivityImpact?.recommendations || [])
  ];

  return (
    <>
      <AnalyticsCard
        title="Leave Analysis"
        icon={FiCalendar}
        showInfo={true}
        onInfoClick={handleInfoClick}
        loading={loading}
      >
        <div className="space-y-4">
          {/* Utilization Overview */}
          <div className={`text-center p-4 rounded-lg ${getUtilizationBg(leaveData.utilization.totalUtilizationRate)}`}>
            <div className={`text-3xl font-bold ${getUtilizationColor(leaveData.utilization.totalUtilizationRate)} mb-1`}>
              {leaveData.utilization.totalUtilizationRate}%
            </div>
            <div className="text-sm text-slate-600">Leave Utilization Rate</div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-lg font-semibold text-slate-900">{leaveData.leavePatterns.totalDays}</div>
              <div className="text-xs text-slate-600">Total Days</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-lg font-semibold text-slate-900">{leaveData.leavePatterns.averageDuration}d</div>
              <div className="text-xs text-slate-600">Avg Duration</div>
            </div>
          </div>

          {/* Leave Types Breakdown */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-900">Leave by Type</h4>
            {leaveData.leavePatterns.byType && Object.entries(leaveData.leavePatterns.byType).map(([type, days]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{type}</span>
                <span className="text-sm font-medium text-slate-900">{days} days</span>
              </div>
            ))}
          </div>

          {/* Productivity Impact */}
          <div className="p-3 bg-amber-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-amber-800">Productivity Impact</span>
              <span className="text-sm font-semibold text-amber-800">
                -{leaveData.productivityImpact.teamProductivityDrop}%
              </span>
            </div>
            <div className="text-xs text-amber-700">
              Estimated drop during leave periods
            </div>
          </div>

          {/* Top Users by Leave */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-900">Top Leave Users</h4>
            {(leaveData.utilization.byUser || []).slice(0, 3).map((user) => (
              <div key={user.userId} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{user.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-slate-900">{user.leaveDays}d</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUtilizationColor(user.utilizationRate)}`}>
                    {user.utilizationRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AnalyticsCard>

      <InfoModal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        title="Leave Analysis"
        description="Leave analysis provides insights into leave patterns, utilization rates, and their impact on team productivity. Understanding these metrics helps optimize workforce planning and capacity management."
        metrics={metrics}
        insights={insights}
        recommendations={recommendations}
      />
    </>
  );
};

export default LeaveAnalysisWidget;
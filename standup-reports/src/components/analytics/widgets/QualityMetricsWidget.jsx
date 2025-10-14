import React, { useState } from 'react';
import { FiShield, FiAlertTriangle, FiRotateCcw, FiCheckCircle } from 'react-icons/fi';
import AnalyticsCard from '../shared/AnalyticsCard';
import InfoModal from '../modals/InfoModal';

const QualityMetricsWidget = ({ data, loading = false }) => {
  const [showInfo, setShowInfo] = useState(false);

  // Mock data - replace with real data
  const qualityData = data || {
    defectDensity: '0.8 defects/100 LOC',
    bugFixTime: '1.2 days',
    testCoverage: '85%',
    codeReviewTime: '4.5 hours',
    reworkRate: '12%',
    qualityScore: 82,
    trends: {
      defects: { current: 8, previous: 12, change: '-33%' },
      coverage: { current: 85, previous: 78, change: '+7%' },
      rework: { current: 12, previous: 15, change: '-3%' },
    },
    topIssues: [
      { type: 'UI Bugs', count: 3, severity: 'Medium' },
      { type: 'Performance', count: 2, severity: 'High' },
      { type: 'Logic Errors', count: 2, severity: 'Medium' },
      { type: 'Integration Issues', count: 1, severity: 'Low' },
    ],
  };

  const handleInfoClick = () => {
    setShowInfo(true);
  };

  const getQualityColor = (score) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  const getQualityBg = (score) => {
    if (score >= 85) return 'bg-green-50';
    if (score >= 70) return 'bg-amber-50';
    return 'bg-red-50';
  };

  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-amber-600 bg-amber-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  const metrics = [
    { label: 'Quality Score', value: `${qualityData.qualityScore}%` },
    { label: 'Defect Density', value: qualityData.defectDensity },
    { label: 'Test Coverage', value: qualityData.testCoverage },
    { label: 'Rework Rate', value: qualityData.reworkRate },
  ];

  const insights = [
    `Quality score of ${qualityData.qualityScore}% indicates ${qualityData.qualityScore >= 80 ? 'good' : 'needs improvement'} code quality`,
    `Defects reduced by ${qualityData.trends.defects.change} compared to last period`,
    `Test coverage improved by ${qualityData.trends.coverage.change}`,
    `Average bug fix time is ${qualityData.bugFixTime}`,
  ];

  const recommendations = [
    'Maintain high test coverage through automated testing',
    'Implement code review checklists to reduce defects',
    'Focus on fixing high-severity issues first',
    'Consider pair programming for complex features',
    'Regular code quality audits and refactoring sessions',
  ];

  return (
    <>
      <AnalyticsCard
        title="Quality Metrics"
        icon={FiShield}
        showInfo={true}
        onInfoClick={handleInfoClick}
        loading={loading}
      >
        <div className="space-y-4">
          {/* Quality Score */}
          <div className={`text-center p-4 rounded-lg ${getQualityBg(qualityData.qualityScore)}`}>
            <div className={`text-3xl font-bold ${getQualityColor(qualityData.qualityScore)} mb-1`}>
              {qualityData.qualityScore}%
            </div>
            <div className="text-sm text-slate-600">Quality Score</div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-lg font-semibold text-slate-900">{qualityData.testCoverage}</div>
              <div className="text-xs text-slate-600">Test Coverage</div>
              <div className="text-xs text-green-600 mt-1">{qualityData.trends.coverage.change}</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-lg font-semibold text-slate-900">{qualityData.reworkRate}</div>
              <div className="text-xs text-slate-600">Rework Rate</div>
              <div className="text-xs text-green-600 mt-1">{qualityData.trends.rework.change}</div>
            </div>
          </div>

          {/* Issue Breakdown */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-900">Top Issues by Type</h4>
            {qualityData.topIssues.map((issue, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{issue.type}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-slate-900">{issue.count}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                    {issue.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Performance Indicators */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <FiAlertTriangle className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Bug Fix Time</span>
              </div>
              <span className="text-sm font-semibold text-blue-800">{qualityData.bugFixTime}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <FiRotateCcw className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Code Review Time</span>
              </div>
              <span className="text-sm font-semibold text-purple-800">{qualityData.codeReviewTime}</span>
            </div>
          </div>

          {/* Defect Trend */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-900">Defect Trend</span>
              <span className={`text-sm font-semibold ${qualityData.trends.defects.change.startsWith('-') ? 'text-green-600' : 'text-red-600'}`}>
                {qualityData.trends.defects.change}
              </span>
            </div>
            <div className="text-xs text-slate-600">
              {qualityData.trends.defects.current} defects this period vs {qualityData.trends.defects.previous} previously
            </div>
          </div>
        </div>
      </AnalyticsCard>

      <InfoModal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        title="Quality Metrics"
        description="Quality metrics track code quality, defect rates, and development practices. High-quality code reduces technical debt and improves maintainability."
        metrics={metrics}
        insights={insights}
        recommendations={recommendations}
      />
    </>
  );
};

export default QualityMetricsWidget;
import React from 'react';
import { motion } from 'framer-motion';
import { FiInfo, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { colors, shadows, animations } from '../../../config/designSystem';

const AnalyticsCard = ({
  title,
  value,
  change,
  changeType = 'neutral', // 'positive', 'negative', 'neutral'
  icon: Icon,
  children,
  className = '',
  showInfo = true,
  onInfoClick,
  loading = false,
  ...props
}) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return colors.success[600];
      case 'negative':
        return colors.danger[600];
      default:
        return colors.secondary[600];
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive':
        return FiTrendingUp;
      case 'negative':
        return FiTrendingDown;
      default:
        return null;
    }
  };

  const ChangeIcon = getChangeIcon();

  return (
    <motion.div
      className={`bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 100 }}
      {...props}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {Icon && (
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Icon className="w-5 h-5 text-emerald-600" />
            </div>
          )}
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        </div>

        {showInfo && onInfoClick && (
          <motion.button
            onClick={onInfoClick}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiInfo className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Value and Change */}
      {value !== undefined && (
        <div className="mb-4">
          <div className="text-3xl font-bold text-slate-900 mb-1">
            {loading ? (
              <div className="h-8 bg-slate-200 rounded animate-pulse w-24" />
            ) : (
              value
            )}
          </div>

          {change !== undefined && (
            <div className="flex items-center space-x-1">
              {ChangeIcon && (
                <ChangeIcon
                  className="w-4 h-4"
                  style={{ color: getChangeColor() }}
                />
              )}
              <span
                className="text-sm font-medium"
                style={{ color: getChangeColor() }}
              >
                {change}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="text-slate-600">
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded animate-pulse w-full" />
            <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
          </div>
        ) : (
          children
        )}
      </div>
    </motion.div>
  );
};

export default AnalyticsCard;
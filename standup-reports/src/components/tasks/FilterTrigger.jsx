import React from 'react';
import { motion } from 'framer-motion';
import { FiFilter, FiChevronDown, FiCheck, FiSettings } from 'react-icons/fi';

export const FilterTrigger = ({
  activeFiltersCount,
  resultsCount,
  onClick,
  isActive = false,
  hasPendingFilters = false,
  className = ''
}) => {
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.button
        onClick={onClick}
        className={`
          relative group flex items-center gap-4 px-6 py-3.5
          ${isActive
            ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 shadow-2xl border-emerald-400/50'
            : 'bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-600 shadow-lg hover:shadow-2xl border-indigo-400/50'
          }
          text-white rounded-2xl font-semibold transition-all duration-300
          border-l-4 ${hasPendingFilters ? 'animate-pulse' : ''} overflow-hidden
          ${className}
        `}
        whileHover={{
          scale: isActive ? 1.02 : 1.05,
          y: -2,
          boxShadow: isActive
            ? '0 25px 50px -12px rgba(16, 185, 129, 0.5)'
            : '0 10px 40px -8px rgba(59, 130, 246, 0.3)'
        }}
        whileTap={{ scale: 0.98 }}
        layout
      >
        {/* Enhanced animated background effects */}
        <div className="absolute inset-0">
          {/* Multi-layer shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 via-transparent/20 to-transparent"
            animate={{ x: ['-200%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />

          {/* Depth gradient */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: isActive
                ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.4) 0%, rgba(20, 184, 166, 0.2) 50%)'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(147, 51, 234, 0.2) 50%)'
            }}
          />

          {/* Dynamic glow effect */}
          <motion.div
            className="absolute inset-0 rounded-2xl"
            animate={{
              opacity: [0.6, 1, 0.6],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              background: isActive
                ? 'radial-gradient(circle at center, rgba(52, 211, 153, 0.3) 0%, transparent 70%)'
                : 'radial-gradient(circle at center, rgba(59, 130, 246, 0.3) 0%, transparent 70%)'
            }}
          />

          {/* Advanced floating particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/80 rounded-full blur-sm"
              animate={{
                y: [0, -20, -30, -20, 0],
                opacity: [0, 0.8, 1, 0.8, 0],
                x: [0, Math.random() * 40 - 20, Math.random() * 20 - 10],
                scale: [0.8, 1.1, 1.3, 1.1, 0.8],
                rotate: [0, 90, 180, 270, 360],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.4,
              }}
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`
              }}
            />
          ))}
        </div>

        {/* Glass reflection overlay */}
        <div
          className="absolute inset-0 rounded-2xl opacity-60"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 50%)',
            backdropFilter: 'blur(1px)'
          }}
        />

        {/* Professional content */}
        <div className="relative flex items-center gap-4 z-10">
          {/* Enhanced filter icon */}
          <motion.div
            className="relative"
            animate={{
              rotate: isActive ? [0, 10, -10, 0] : [0, 5, -5, 0],
              scale: [1, 1.1, 1, 1]
            }}
            transition={{
              duration: 2,
              repeat: isActive ? 1.5 : 3,
              repeatDelay: 2
            }}
          >
            <div className="absolute inset-0 rounded-lg bg-white/20 blur-sm scale-110"></div>
            <FiFilter className="w-5 h-5 text-white relative z-10" />
          </motion.div>

          {/* Enhanced text with icon */}
          <div className="flex items-center gap-3">
            <div className="text-left">
              <div className="font-bold text-white/95 tracking-wide">
                {hasPendingFilters ? 'Configure Filters' : 'Advanced Filters'}
              </div>
              <div className="text-xs text-white/80 font-medium mt-0.5">
                {hasPendingFilters
                  ? `${activeFiltersCount} filter${activeFiltersCount !== 1 ? 's' : ''} selected`
                  : activeFiltersCount > 0
                    ? `${activeFiltersCount} active • ${resultsCount} results`
                    : 'Click to configure'
                }
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2">
              {hasPendingFilters && (
                <motion.div
                  className="w-2 h-2 bg-yellow-300 rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.5 }}
                />
              )}
              {isActive && !hasPendingFilters && (
                <motion.div
                  className="w-2 h-2 bg-green-300 rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.5 }}
                />
              )}
            </div>
          </div>

          {/* Enhanced chevron with status */}
          <motion.div
            animate={{
              x: [0, 3, 0],
              rotate: isActive ? 180 : 0
            }}
            transition={{
              duration: 0.3,
              rotate: { type: "spring", stiffness: 300, damping: 30 }
            }}
            className={`flex items-center justify-center w-8 h-8 rounded-full ${isActive ? 'bg-white/20' : ''}`}
          >
            <FiChevronDown className="w-4 h-4 text-white" />
          </motion.div>
        </div>

        {/* Interactive hover effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)'
          }}
        />

        {/* Success checkmark when filters are applied */}
        {isActive && !hasPendingFilters && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -45 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
              delay: 0.2
            }}
            className="absolute -top-1 -left-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
          >
            <FiCheck className="w-4 h-4 text-white" />
          </motion.div>
        )}

        {/* Settings gear when pending */}
        {hasPendingFilters && (
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1 -left-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-lg"
          >
            <FiSettings className="w-4 h-4 text-white" />
          </motion.div>
        )}
      </motion.button>
    </motion.div>
  );
};

export default FilterTrigger;
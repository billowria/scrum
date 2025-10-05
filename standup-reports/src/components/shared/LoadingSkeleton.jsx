import React from 'react';
import { motion } from 'framer-motion';

/**
 * LoadingSkeleton - Animated skeleton for loading states
 */
const LoadingSkeleton = ({
  variant = 'text',
  count = 1,
  className = '',
  width,
  height,
}) => {
  const variants = {
    text: 'h-4 rounded',
    title: 'h-8 rounded',
    circle: 'rounded-full',
    rectangle: 'rounded-lg',
    card: 'h-32 rounded-xl',
    avatar: 'w-10 h-10 rounded-full',
  };

  const skeletonClass = variants[variant] || variants.text;

  const Skeleton = () => (
    <motion.div
      className={`
        bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200
        ${skeletonClass}
        ${className}
      `}
      style={{
        width: width || '100%',
        height: height || undefined,
        backgroundSize: '200% 100%',
      }}
      animate={{
        backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );

  if (count === 1) {
    return <Skeleton />;
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} />
      ))}
    </div>
  );
};

// Pre-built skeleton patterns
export const SkeletonCard = ({ className = '' }) => (
  <div className={`p-4 border border-gray-200 rounded-xl bg-white ${className}`}>
    <div className="flex items-start gap-3 mb-3">
      <LoadingSkeleton variant="avatar" />
      <div className="flex-1">
        <LoadingSkeleton variant="title" width="60%" className="mb-2" />
        <LoadingSkeleton variant="text" width="40%" />
      </div>
    </div>
    <LoadingSkeleton variant="text" count={2} />
  </div>
);

export const SkeletonList = ({ count = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
        <LoadingSkeleton variant="circle" width="40px" height="40px" />
        <div className="flex-1">
          <LoadingSkeleton variant="text" width="70%" className="mb-2" />
          <LoadingSkeleton variant="text" width="40%" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`border border-gray-200 rounded-xl overflow-hidden ${className}`}>
    {/* Header */}
    <div className="bg-gray-50 p-4 border-b border-gray-200">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <LoadingSkeleton key={index} variant="text" height="20px" />
        ))}
      </div>
    </div>
    {/* Rows */}
    <div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="p-4 border-b border-gray-100 last:border-b-0">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <LoadingSkeleton key={colIndex} variant="text" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default LoadingSkeleton;

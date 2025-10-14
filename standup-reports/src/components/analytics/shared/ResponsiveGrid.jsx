import React from 'react';
import { motion } from 'framer-motion';

const ResponsiveGrid = ({
  children,
  columns = { default: 1, sm: 2, lg: 3, xl: 4 },
  gap = 'gap-6',
  className = '',
  staggerChildren = true,
  ...props
}) => {
  const getGridClasses = () => {
    const classes = [];

    if (columns.default) classes.push(`grid-cols-${columns.default}`);
    if (columns.sm) classes.push(`sm:grid-cols-${columns.sm}`);
    if (columns.md) classes.push(`md:grid-cols-${columns.md}`);
    if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`);
    if (columns.xl) classes.push(`xl:grid-cols-${columns.xl}`);
    if (columns['2xl']) classes.push(`2xl:grid-cols-${columns['2xl']}`);

    return classes.join(' ');
  };

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerChildren ? 0.1 : 0,
      },
    },
  };

  return (
    <motion.div
      className={`grid ${getGridClasses()} ${gap} ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default ResponsiveGrid;
import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiChevronDown } from 'react-icons/fi';
import './design-tokens.css';

export const TeamSelector = forwardRef((
  {
    label,
    value,
    onChange,
    teams = [],
    placeholder = 'Select team',
    error = null,
    disabled = false,
    className = '',
    ...props
  },
  ref
) => {
  const baseClasses = `
    relative w-full
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `;

  const selectClasses = `
    w-full pl-10 pr-10 py-2.5 rounded-lg
    border appearance-none bg-white
    border-gray-200 text-gray-900
    font-medium text-sm
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
    disabled:cursor-not-allowed
    ${error
      ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500/20'
      : ''
    }
  `;

  return (
    <div className={baseClasses}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}

      <div className="relative">
        <FiUsers
          className={`
            absolute left-3 top-1/2 transform -translate-y-1/2
            pointer-events-none transition-colors z-10
            ${error ? 'text-red-400' : 'text-gray-400'}
          `}
          style={{ width: '16px', height: '16px' }}
        />

        <motion.select
          ref={ref}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          className={selectClasses}
          whileFocus={{
            scale: 1.01,
            boxShadow: error
              ? '0 0 0 3px rgba(239, 68, 68, 0.1)'
              : '0 0 0 3px rgba(59, 130, 246, 0.1)'
          }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          {...props}
        >
          <option value="all">{placeholder}</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </motion.select>

        <motion.div
          className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10"
          animate={{ rotate: disabled ? 0 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <FiChevronDown
            className={error ? 'text-red-400' : 'text-gray-400'}
            style={{ width: '16px', height: '16px' }}
          />
        </motion.div>
      </div>

      {error && (
        <motion.p
          className="mt-1 text-sm text-red-600 font-medium"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
});

TeamSelector.displayName = 'TeamSelector';

export default TeamSelector;
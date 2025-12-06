import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import {
    FiGrid, FiMessageSquare, FiCheckSquare, FiAlertCircle,
    FiStar, FiBriefcase, FiLayers
} from 'react-icons/fi';

const NotificationFilterBar = ({
    activeFilter,
    onFilterChange,
    counts = {}
}) => {
    const scrollRef = useRef(null);

    const filters = [
        { id: 'all', label: 'All', icon: FiGrid },
        { id: 'unread', label: 'Unread', icon: FiAlertCircle, count: counts.unread },
        { id: 'task', label: 'Tasks', icon: FiCheckSquare, count: counts.task },
        { id: 'project', label: 'Projects', icon: FiBriefcase, count: counts.project },
        { id: 'mention', label: 'Mentions', icon: FiMessageSquare, count: counts.mention },
        { id: 'system', label: 'System', icon: FiLayers, count: counts.system },
        { id: 'achievement', label: 'Achievements', icon: FiStar, count: counts.achievement },
    ];

    return (
        <div className="relative w-full group">
            {/* Gradient Masks for Scroll Indication */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none hidden sm:block" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none hidden sm:block" />

            <div
                ref={scrollRef}
                className="flex items-center gap-2 overflow-x-auto pb-4 pt-2 px-1 scrollbar-hide snap-x"
                style={{ scrollBehavior: 'smooth' }}
            >
                {filters.map((filter) => {
                    const isActive = activeFilter === filter.id;
                    const Icon = filter.icon;

                    return (
                        <motion.button
                            key={filter.id}
                            onClick={() => onFilterChange(filter.id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`
                relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap snap-start
                ${isActive
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200 ring-2 ring-blue-100'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                                }
              `}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                            {filter.label}

                            {filter.count > 0 && (
                                <span className={`
                  ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold
                  ${isActive
                                        ? 'bg-white/20 text-white'
                                        : 'bg-gray-100 text-gray-600'
                                    }
                `}>
                                    {filter.count}
                                </span>
                            )}

                            {isActive && (
                                <motion.div
                                    layoutId="activeFilter"
                                    className="absolute inset-0 rounded-full bg-blue-600 -z-10"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};

export default NotificationFilterBar;

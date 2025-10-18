import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Icons
import { FiX } from 'react-icons/fi';

const NoteTabs = ({ tabs, activeTabId, onTabSelect, onTabClose }) => {
  const tabsRef = useRef(null);
  const activeTabRef = useRef(null);

  // Scroll active tab into view
  useEffect(() => {
    if (activeTabRef.current && tabsRef.current) {
      const activeTabElement = activeTabRef.current;
      const tabsContainer = tabsRef.current;
      
      const containerRect = tabsContainer.getBoundingClientRect();
      const tabRect = activeTabElement.getBoundingClientRect();
      
      if (tabRect.left < containerRect.left || tabRect.right > containerRect.right) {
        activeTabElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [activeTabId]);

  const handleTabClose = (e, tabId) => {
    e.stopPropagation();
    onTabClose(tabId);
  };

  const handleTabClick = (tabId) => {
    onTabSelect(tabId);
  };

  const handleWheel = (e) => {
    if (tabsRef.current) {
      e.preventDefault();
      tabsRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <div className="border-b border-gray-200 bg-gray-50">
      <div
        ref={tabsRef}
        className="flex overflow-x-auto scrollbar-hide"
        onWheel={handleWheel}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <AnimatePresence>
          {tabs.map((tab, index) => (
            <motion.div
              key={tab.id}
              ref={tab.id === activeTabId ? activeTabRef : null}
              className={`group relative flex items-center min-w-0 max-w-xs border-r border-gray-200 cursor-pointer transition-colors ${
                tab.id === activeTabId
                  ? 'bg-white border-t-2 border-t-indigo-500'
                  : 'bg-gray-50 hover:bg-gray-100 border-t-2 border-t-transparent'
              }`}
              onClick={() => handleTabClick(tab.id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              {/* Tab Content */}
              <div className="flex items-center px-4 py-2 min-w-0 flex-1">
                {/* Pinned Indicator */}
                {tab.is_pinned && (
                  <div className="w-1 h-1 bg-indigo-500 rounded-full mr-2 flex-shrink-0"></div>
                )}
                
                {/* Tab Title */}
                <span
                  className={`text-sm truncate ${
                    tab.id === activeTabId
                      ? 'text-gray-900 font-medium'
                      : 'text-gray-600'
                  }`}
                  title={tab.title}
                >
                  {tab.title === 'Untitled Note' ? 'New Note' : tab.title}
                </span>
                
                {/* Close Button */}
                <motion.button
                  onClick={(e) => handleTabClose(e, tab.id)}
                  className={`ml-2 p-1 rounded-md transition-colors flex-shrink-0 ${
                    tab.id === activeTabId
                      ? 'hover:bg-gray-200 text-gray-600'
                      : 'hover:bg-gray-300 text-gray-500'
                  } group-hover:text-gray-600`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Close tab (Ctrl+W)"
                >
                  <FiX className="w-3 h-3" />
                </motion.button>
              </div>

              {/* Active tab indicator */}
              {tab.id === activeTabId && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                  layoutId="activeTab"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* New Tab Button Area */}
        <div className="flex items-center px-2 py-1 border-r border-gray-200">
          <div className="w-px h-6 bg-gray-300"></div>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default NoteTabs;

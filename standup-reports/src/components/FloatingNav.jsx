import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AnimatedMenuIcon = ({ isOpen }) => {
  const transition = { type: 'spring', stiffness: 260, damping: 20 };
  return (
    <div className="w-5 h-5 relative">
      <motion.div
        className="w-full h-0.5 bg-slate-800 absolute top-[4px] rounded-full"
        animate={{
          rotate: isOpen ? 45 : 0,
          y: isOpen ? 6 : 0,
        }}
        transition={transition}
      />
      <motion.div
        className="w-full h-0.5 bg-slate-800 absolute top-[10px] rounded-full"
        animate={{
          opacity: isOpen ? 0 : 1,
        }}
        transition={{ duration: 0.1 }}
      />
      <motion.div
        className="w-full h-0.5 bg-slate-800 absolute top-[16px] rounded-full"
        animate={{
          rotate: isOpen ? -45 : 0,
          y: isOpen ? -6 : 0,
        }}
        transition={transition}
      />
    </div>
  );
};

const FloatingNav = ({ tabs, activeTab, setActiveTab }) => {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4">
      <AnimatePresence>
        {isVisible && (
          <motion.nav
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div
              className="flex items-center p-2 bg-gray-400/10 backdrop-blur-xl rounded-full shadow-2xl border-white/10"
              style={{ filter: 'url(#gooey)' }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative flex flex-col items-center justify-center w-24 h-24 text-sm font-medium rounded-full z-10"
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="bubble"
                      className="absolute inset-0 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full"
                      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    />
                  )}
                  <span className={`relative transition-colors duration-300 text-3xl ${activeTab === tab.id ? 'text-white' : 'text-slate-800'}`}>
                    {tab.icon}
                  </span>
                  <span className={`relative transition-colors duration-300 text-xs mt-1 ${activeTab === tab.id ? 'text-white' : 'text-slate-700'}`}>
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsVisible(!isVisible)}
        className="w-14 h-14 rounded-full bg-white/80 backdrop-blur-lg shadow-lg flex items-center justify-center border border-white/20"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <AnimatedMenuIcon isOpen={isVisible} />
      </motion.button>

      <svg width="0" height="0" className="absolute">
        <defs>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>
    </div>
  );
};

export default FloatingNav;

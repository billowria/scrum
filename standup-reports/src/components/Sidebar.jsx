import React from 'react';
import { FiHome, FiCalendar, FiList, FiAward, FiUser, FiChevronLeft, FiChevronRight, FiBriefcase, FiUsers, FiClipboard, FiClock, FiBell, FiMenu, FiSidebar, FiArrowLeftCircle, FiArrowRightCircle,FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';

const navLinks = [
  { to: '/dashboard', icon: <FiHome />, label: 'Dashboard', color: 'from-blue-500 to-blue-400' },
  { to: '/leave-calendar', icon: <FiCalendar />, label: 'Leave Calendar', color: 'from-teal-500 to-teal-400' },
  { to: '/tasks', icon: <FiList />, label: 'Tasks', color: 'from-pink-500 to-pink-400' },
  { to: '/achievements', icon: <FiAward />, label: 'Achievements', color: 'from-purple-500 to-purple-400' },
];

const managerPortalSubtasks = [
  { label: 'Team Management', icon: <FiUsers />, to: '/manager-dashboard?tab=team-management' },
  { label: 'Leave Requests', icon: <FiClipboard />, to: '/manager-dashboard?tab=leave-requests' },
  { label: 'Leave History', icon: <FiClock />, to: '/manager-dashboard?tab=leave-history' },
  { label: 'Announcements', icon: <FiBell />, to: '/manager-dashboard?tab=announcements' },
  { label: 'Report History', icon: <FiList />, to: '/manager-dashboard?tab=report-history' },
];

const glueyTransition = {
  type: 'spring',
  stiffness: 500,
  damping: 30,
};

export default function Sidebar({ open, setOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [managerDropdown, setManagerDropdown] = React.useState(false);
  const [showBurst, setShowBurst] = React.useState(false);
  const [toggleHover, setToggleHover] = React.useState(false);
  const [hoveredLink, setHoveredLink] = React.useState(null);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isManagerDashboard = location.pathname.startsWith('/manager-dashboard');

  return (
    <motion.aside
      animate={{ width: open ? 256 : 80 }}
      className={`fixed top-0 left-0 h-screen bg-gradient-to-b from-indigo-900 to-indigo-700 flex flex-col justify-between shadow-xl z-40 transition-all duration-300 pt-16`}
      style={{ width: open ? 256 : 80 }}
    >
      {/* Toggle Button */}
      <div className="flex items-center justify-end p-2">
        <motion.button
          onClick={() => setOpen(o => !o)}
          className="relative w-12 h-12 flex items-center justify-center rounded-full focus:outline-none"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.97 }}
          animate={{ rotate: open ? 0 : 0, transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] } }}
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
          tabIndex={0}
          onMouseEnter={() => setToggleHover(true)}
          onMouseLeave={() => setToggleHover(false)}
        >
          {/* Animated Toggle Icon */}
          <motion.div
            className="relative z-10 flex items-center justify-center"
            animate={{
              scale: toggleHover ? 1.15 : 1,
              color: toggleHover ? '#ffffff' : '#e0e7ff',
              filter: toggleHover ? 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' : 'none'
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <motion.div
              className="absolute"
              animate={{
                rotate: open ? 0 : 0
              }}
            >
              {/* Hamburger to X animation */}
              <motion.span
                className="block bg-current rounded-full"
                style={{ width: '18px', height: '2px', position: 'absolute', transformOrigin: 'center' }}
                animate={{
                  rotate: open ? 45 : 0,
                  y: open ? 0 : -6,
                  width: open ? '18px' : '18px'
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              />
              <motion.span
                className="block bg-current rounded-full"
                style={{ width: '18px', height: '2px', position: 'absolute', transformOrigin: 'center' }}
                animate={{
                  opacity: open ? 0 : 1,
                  width: open ? 0 : '18px'
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              />
              <motion.span
                className="block bg-current rounded-full"
                style={{ width: '18px', height: '2px', position: 'absolute', transformOrigin: 'center' }}
                animate={{
                  rotate: open ? -45 : 0,
                  y: open ? 0 : 6,
                  width: open ? '18px' : '18px'
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>
          {/* Tooltip on hover */}
          <AnimatePresence>
            {toggleHover && (
              <motion.span
                className="absolute left-1/2 top-full mt-2 -translate-x-1/2 text-xs font-medium text-indigo-100 select-none bg-indigo-900/90 px-3 py-1 rounded shadow"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
              >
                {open ? 'Collapse' : 'Expand'}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
      {/* Navigation */}
      <nav className={`flex-1 flex flex-col items-center gap-4 mt-8 ${open ? 'px-2' : ''}`}>
        {navLinks.map((link, idx) => {
          const active = isActive(link.to);
          return (
            <motion.div
              key={link.to}
              layout
              transition={glueyTransition}
              className="w-full flex justify-center"
              onMouseEnter={() => setHoveredLink(link.label)}
              onMouseLeave={() => setHoveredLink(null)}
            >
              <motion.button
                type="button"
                onClick={() => navigate(link.to)}
                className={`group relative flex items-center w-full ${open ? 'justify-start' : 'justify-center'} my-1 focus:outline-none`}
                whileHover={{ scale: 1.06, y: -2, boxShadow: '0 4px 16px rgba(80,80,255,0.08)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                style={{ minHeight: 48, borderRadius: 16, position: 'relative' }}
              >
                {/* Active gluey indicator */}
                <AnimatePresence>
                  {active && (
                    <motion.div
                      layoutId="sidebar-active-indicator"
                      className={`absolute left-0 top-0 h-full w-full z-0 rounded-2xl bg-gradient-to-r ${link.color} shadow-lg`}
                      style={{ filter: 'blur(0.5px)', opacity: 0.18 }}
                      transition={glueyTransition}
                    />
                  )}
                </AnimatePresence>
                <span
                  className={`relative z-10 flex items-center justify-center w-10 h-10 text-xl transition-colors duration-200 ${
                    active
                      ? 'text-white drop-shadow-lg'
                      : 'text-indigo-200 group-hover:text-white'
                  }`}
                >
                  {link.icon}
                </span>
                {/* Only show text if open */}
                {open && (
                  <motion.span
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.18 }}
                    className={`ml-3 text-base font-semibold tracking-tight relative z-10 ${active ? 'text-white' : 'text-indigo-100 group-hover:text-white'}`}
                  >
                    {link.label}
                  </motion.span>
                )}
                {/* Tooltip for closed sidebar, only on hover */}
                {!open && hoveredLink === link.label && (
                  <motion.div
                    initial={{ opacity: 0, x: 10, scale: 0.9 }}
                    animate={{ opacity: 1, x: 20, scale: 1 }}
                    exit={{ opacity: 0, x: 10, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-full ml-2 px-3 py-2 bg-white rounded-lg shadow-lg z-50 pointer-events-none"
                  >
                    <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white transform rotate-45"></div>
                    <div className="text-sm font-medium text-gray-800 whitespace-nowrap">{link.label}</div>
                  </motion.div>
                )}
              </motion.button>
            </motion.div>
          );
        })}
        {/* Manager Portal Tab with Dropdown */}
        <motion.div 
          layout 
          transition={glueyTransition} 
          className="w-full flex justify-center relative"
          onMouseEnter={() => !open && setHoveredLink('Manager Portal')}
          onMouseLeave={() => setHoveredLink(null)}
        >
          <motion.button
            type="button"
            onClick={() => setManagerDropdown((d) => !d)}
            className={`group relative flex items-center w-full ${open ? 'justify-start' : 'justify-center'} my-1 focus:outline-none border-2 border-indigo-500 shadow-lg bg-gradient-to-r from-indigo-800 via-indigo-700 to-blue-700 ${managerDropdown ? 'ring-2 ring-blue-400' : ''}`}
            whileHover={{ scale: 1.07, y: -2, boxShadow: '0 6px 24px rgba(80,80,255,0.18)' }}
            transition={{ type: 'spring', stiffness: 400, damping: 24 }}
            style={{ minHeight: 52, borderRadius: 18, position: 'relative' }}
            aria-haspopup="true"
            aria-expanded={managerDropdown}
          >
            {/* Active gluey indicator */}
            <AnimatePresence>
              {isManagerDashboard && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className={`absolute left-0 top-0 h-full w-full z-0 rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-700 shadow-xl`}
                  style={{ filter: 'blur(0.5px)', opacity: 0.22 }}
                  transition={glueyTransition}
                />
              )}
            </AnimatePresence>
            <span
              className={`relative z-10 flex items-center justify-center w-10 h-10 text-xl transition-colors duration-200 ${
                isManagerDashboard
                  ? 'text-white drop-shadow-lg'
                  : 'text-indigo-100 group-hover:text-white'
              }`}
            >
              <FiBriefcase />
            </span>
            {open && (
              <motion.span
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
                className={`ml-3 text-base font-bold tracking-tight relative z-10 ${isManagerDashboard ? 'text-white' : 'text-indigo-100 group-hover:text-white'}`}
              >
                Manager Portal
              </motion.span>
            )}
            {/* Dropdown arrow */}
            {open && (
              <motion.span
                initial={{ rotate: 0 }}
                animate={{ rotate: managerDropdown ? 90 : 0 }}
                className="ml-auto mr-4 text-indigo-200 group-hover:text-white"
                style={{ display: 'inline-flex', alignItems: 'center' }}
              >
                <FiChevronRight />
              </motion.span>
            )}
            {/* Tooltip for closed sidebar */}
            {!open && hoveredLink === 'Manager Portal' && (
              <motion.div
                initial={{ opacity: 0, x: 10, scale: 0.9 }}
                animate={{ opacity: 1, x: 20, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="absolute left-full ml-2 px-3 py-2 bg-white rounded-lg shadow-lg z-50 pointer-events-none"
              >
                <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white transform rotate-45"></div>
                <div className="text-sm font-medium text-gray-800 whitespace-nowrap">Manager Portal</div>
              </motion.div>
            )}
          </motion.button>
          {/* Dropdown menu */}
          <AnimatePresence>
            {managerDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className={`absolute ${open ? 'left-0 right-0 top-14' : 'left-20 top-0'} bg-indigo-900 rounded-xl shadow-2xl z-50 flex flex-col py-2 border-2 border-indigo-700 ${open ? '' : 'w-56'}`}
                style={{ minWidth: open ? '100%' : 224 }}
              >
                <button
                  onClick={() => setManagerDropdown(false)}
                  className="absolute top-2 right-2 text-indigo-300 hover:text-blue-400 text-lg p-1 rounded-full focus:outline-none"
                  aria-label="Close Manager Portal menu"
                  tabIndex={0}
                >
                  ×
                </button>
                <div className="pt-2" />
                {managerPortalSubtasks.map((sub, i) => (
                  <button
                    key={sub.to}
                    onClick={() => navigate(sub.to)}
                    className={`flex items-center gap-3 px-4 py-2 text-sm font-semibold text-indigo-100 hover:bg-indigo-800 transition-colors ${location.search.includes(sub.to.split('=')[1]) ? 'bg-indigo-700 text-white' : ''}`}
                  >
                    <span className="text-lg">{sub.icon}</span>
                    <span>{sub.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </nav>
      {/* User Profile (optional, can be removed if in navbar) */}
      <div 
        className="flex flex-col items-center mb-6"
        onMouseEnter={() => !open && setHoveredLink('User Profile')}
        onMouseLeave={() => setHoveredLink(null)}
      >
        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-lg shadow relative">
          <FiUser />
          {/* Tooltip for user profile when sidebar is collapsed */}
          {!open && hoveredLink === 'User Profile' && (
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 20, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="absolute left-full ml-2 px-3 py-2 bg-white rounded-lg shadow-lg z-50 pointer-events-none"
            >
              <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white transform rotate-45"></div>
              <div className="text-sm font-medium text-gray-800 whitespace-nowrap">User Profile</div>
            </motion.div>
          )}
        </div>
        <motion.span
          initial={false}
          animate={{ opacity: open ? 1 : 0, x: open ? 0 : -16 }}
          transition={{ duration: 0.2 }}
          className={`text-xs text-indigo-100 mt-2 ${open ? 'block' : 'hidden'}`}
          style={{ display: open ? 'block' : 'none' }}
        >
          User
        </motion.span>
      </div>
    </motion.aside>
  );
}
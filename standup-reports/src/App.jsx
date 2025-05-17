import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from './supabaseClient';
import { FiTwitter, FiGithub, FiLinkedin, FiYoutube } from 'react-icons/fi';

// Components
import Navbar from './components/Navbar';

// Pages
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ReportEntry from './pages/ReportEntry';
import History from './pages/History';
import LeaveCalendar from './pages/LeaveCalendar';
import ManagerDashboard from './pages/ManagerDashboard';
import TeamManagement from './pages/TeamManagement';
import AchievementsPage from './pages/AchievementsPage';
import LandingPage from './pages/LandingPage';
import ManageAnnouncements from './components/ManageAnnouncements';

// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeInOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Check for active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) {
          fetchUserRole(session.user.id);
        } else {
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);
  
  // Fetch user role from database
  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setUserRole(data?.role || 'member');
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('member'); // Default to member role if error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="relative">
          {/* Animated loading spinner */}
          <div className="h-16 w-16 relative">
            <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-primary-200"></div>
            <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-transparent border-t-primary-600 animate-spin"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center shadow-lg">
              <span className="text-white text-xs font-bold">AP</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AppContent session={session} userRole={userRole} />
    </Router>
  );
}

// Separate component to handle dynamic content based on routes
function AppContent({ session, userRole }) {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <div className={isLandingPage ? '' : "min-h-screen bg-gradient-to-br from-primary-50/30 via-white to-secondary-50/30"}>
      {/* Only show Navbar on internal app pages, not on landing page */}
      {!isLandingPage && <Navbar session={session} />}
      
      {/* Main content with padding for fixed navbar */}
      <div className={isLandingPage ? '' : "pt-0"}>
        <AnimatePresence mode="sync" initial={false}>
          <Routes>
            {/* Landing page - always accessible */}
            <Route path="/" element={<LandingPage />} />
            
            {!session ? (
              // Unauthenticated routes
              <>
                <Route path="/login" element={<AuthPage mode="login" />} />
                <Route path="/signup" element={<AuthPage mode="signup" />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            ) : (
              // Authenticated routes
              <>
                <Route path="/dashboard" element={
                <PageTransition>
                  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20">
                    <Dashboard />
                  </div>
                </PageTransition>
              } />
              
              {/* Manager-specific routes */}
              {userRole === 'manager' && (
                <>
                  <Route path="/team-management" element={
                    <PageTransition>
                      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20">
                        <TeamManagement />
                      </div>
                    </PageTransition>
                  } />
                  <Route path="/leave-requests" element={
                    <PageTransition>
                      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20">
                        <ManagerDashboard activeTabDefault="leave-requests" />
                      </div>
                    </PageTransition>
                  } />
                  <Route path="/manager-dashboard" element={
                    <PageTransition>
                      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20">
                        <ManagerDashboard />
                      </div>
                    </PageTransition>
                  } />
                  <Route path="/history" element={
                    <PageTransition>
                      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20">
                        <History />
                      </div>
                    </PageTransition>
                  } />
                </>
              )}
                <Route path="/report" element={
                  <PageTransition>
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20">
                      <ReportEntry />
                    </div>
                  </PageTransition>
                } />
                <Route path="/leave-calendar" element={
                  <PageTransition>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20">
                      <LeaveCalendar />
                    </div>
                  </PageTransition>
                } />
                <Route path="/announcements" element={
                  <PageTransition>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20">
                      <ManageAnnouncements />
                    </div>
                  </PageTransition>
                } />
                <Route path="/achievements" element={
                  <PageTransition>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20">
                      <AchievementsPage />
                    </div>
                  </PageTransition>
                } />
                <Route path="/login" element={<Navigate to="/dashboard" replace />} />
                <Route path="/signup" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </>
            )}
          </Routes>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Page transition wrapper component
function PageTransition({ children }) {
  const location = useLocation();
  
  return (
    <motion.div
      key={location.pathname}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="w-full"
      transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

// Footer Link Group with animation
function FooterLinkGroup({ title, links, delay }) {
  return (
    <motion.div 
      className="flex flex-col space-y-3"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay }}
    >
      <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
      {links.map((link, index) => (
        <FooterLinkEnhanced 
          key={index} 
          href={link.href}
          delay={0.1 * index}
        >
          {link.label}
        </FooterLinkEnhanced>
      ))}
    </motion.div>
  );
}

// Enhanced Footer Link with animated hover effect
function FooterLinkEnhanced({ href, children, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: delay }}
    >
      <motion.a 
        href={href} 
        className="text-gray-500 hover:text-primary-600 text-sm transition-colors relative inline-block group"
        whileHover={{ scale: 1.02, x: 3 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <span>{children}</span>
        <motion.span 
          className="absolute bottom-0 left-0 h-0.5 bg-primary-500"
          initial={{ width: 0 }}
          whileHover={{ width: '100%' }}
          transition={{ duration: 0.3 }}
        />
        <motion.span
          className="absolute left-0 w-1 h-1 rounded-full bg-primary-500 -translate-x-2"
          initial={{ opacity: 0, scale: 0 }}
          whileHover={{ 
            opacity: 1, 
            scale: 1,
            transition: { duration: 0.2, delay: 0.1 }
          }}
        />
      </motion.a>
    </motion.div>
  );
}

// Enhanced Social Button with branded color and animations
function SocialButtonEnhanced({ icon, label, color }) {
  return (
    <motion.a
      href="#"
      aria-label={label}
      className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 border border-gray-200 relative overflow-hidden group"
      whileHover={{ 
        scale: 1.15,
        boxShadow: `0 0 0 2px rgba(${color === '#1DA1F2' ? '29, 161, 242' : color === '#FF0000' ? '255, 0, 0' : color === '#0077B5' ? '0, 119, 181' : '51, 51, 51'}, 0.3)`,
        transition: { type: "spring", stiffness: 400, damping: 10 }
      }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        style={{ backgroundColor: color }}
        transition={{ duration: 0.3 }}
        variants={{
          hover: {
            scale: [1, 1.1, 1],
            opacity: 1,
          }
        }}
      />
      <motion.div 
        className="relative z-10 flex items-center justify-center w-full h-full"
        initial={{ color: "#6B7280" }}
        whileHover={{ 
          color: "#FFFFFF",
          rotate: [0, 5, -5, 0],
          transition: { rotate: { duration: 0.5 } }
        }}
        transition={{ duration: 0.3 }}
      >
        {icon}
      </motion.div>
      <motion.span
        className="absolute inset-0 z-0 rounded-full"
        initial={{ boxShadow: "0 0 0 0 rgba(0,0,0,0)" }}
        whileHover={{ boxShadow: `0 0 20px 3px ${color}33` }}
        transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
      />
    </motion.a>
  );
}

export default App;

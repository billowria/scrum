import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from './supabaseClient';

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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="relative">
          {/* Animated loading spinner */}
          <div className="h-16 w-16 relative">
            <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-primary-200"></div>
            <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-transparent border-t-primary-600 animate-spin"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center shadow-lg">
              <span className="text-white text-xs font-bold">SR</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-primary-50/30 via-white to-secondary-50/30">
        <Navbar session={session} />
        
        {/* Main content with padding for fixed navbar */}
        <div className="pt-16 pb-8">
          <AnimatePresence mode="wait">
            <Routes>
              {!session ? (
                // Unauthenticated routes
                <>
                  <Route path="/login" element={<AuthPage mode="login" />} />
                  <Route path="/signup" element={<AuthPage mode="signup" />} />
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </>
              ) : (
                // Authenticated routes
                <>
                  <Route path="/dashboard" element={
                  <PageTransition>
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                      <Dashboard />
                    </div>
                  </PageTransition>
                } />
                
                {/* Manager-specific routes */}
                {userRole === 'manager' && (
                  <>
                    <Route path="/team-management" element={
                      <PageTransition>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                          <TeamManagement />
                        </div>
                      </PageTransition>
                    } />
                    <Route path="/leave-requests" element={
                      <PageTransition>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                          <ManagerDashboard activeTabDefault="leave-requests" />
                        </div>
                      </PageTransition>
                    } />
                  </>
                )}
                  <Route path="/report" element={
                    <PageTransition>
                      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <ReportEntry />
                      </div>
                    </PageTransition>
                  } />
                  <Route path="/history" element={
                    <PageTransition>
                      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <History />
                      </div>
                    </PageTransition>
                  } />
                  <Route path="/leave-calendar" element={
                    <PageTransition>
                      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <LeaveCalendar />
                      </div>
                    </PageTransition>
                  } />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </>
              )}
            </Routes>
          </AnimatePresence>
        </div>
      </div>
    </Router>
  );
}

// Page transition wrapper component
function PageTransition({ children }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      {children}
    </motion.div>
  );
}

export default App;

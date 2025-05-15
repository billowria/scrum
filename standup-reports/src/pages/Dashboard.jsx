import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format, isToday, parseISO, subDays } from 'date-fns';
import { supabase } from '../supabaseClient';

// Icons
import { FiFilter, FiClock, FiUser, FiUsers, FiCheckCircle, FiAlertCircle, FiCalendar, FiRefreshCw, FiChevronLeft, FiChevronRight, FiPlus, FiList, FiGrid, FiMaximize, FiMinimize } from 'react-icons/fi';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

const filterVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { delay: 0.2 } }
};

export default function Dashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentReportIndex, setCurrentReportIndex] = useState(0);
  const [viewMode, setViewMode] = useState('carousel'); 
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  
  // Animation controls
  const cardControls = useAnimation();
  const navigate = useNavigate();
  
  // Ref for scroll animations
  const reportRefs = useRef([]);
  const carouselRef = useRef(null);

  useEffect(() => {
    fetchReports(date);
    fetchTeams();
    
    // Initialize animation controls
    cardControls.start({
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { duration: 0.5 }
    });
    
    // Add keyboard listener for ESC key to exit fullscreen modal
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showFullscreenModal) {
        setShowFullscreenModal(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
    
    // Set up intersection observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-slide-up');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    // Observe report elements when they're added to the DOM
    reportRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });
    
    return () => {
      if (reportRefs.current) {
        reportRefs.current.forEach((ref) => {
          if (ref) observer.unobserve(ref);
        });
      }
    };
  }, [date, cardControls]);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name');

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error.message);
    }
  };

  const fetchReports = async (date) => {
    setLoading(true);
    setError(null);

    try {
      // Query to get reports with user and team information
      let query = supabase
        .from('daily_reports')
        .select(`
          id, date, yesterday, today, blockers, created_at,
          users:user_id (id, name, team_id, teams:team_id (id, name))
        `)
        .eq('date', date)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      setReports(data || []);
      // Reset refs array to match new reports length
      reportRefs.current = Array(data?.length || 0).fill().map((_, i) => reportRefs.current[i] || null);
    } catch (error) {
      setError('Error fetching reports: ' + error.message);
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReports(date);
    setTimeout(() => setRefreshing(false), 600); // Add a small delay for animation
    setCurrentReportIndex(0); // Reset to first report after refresh
  };
  
  // Direction state for animations
  const [slideDirection, setSlideDirection] = useState('right');

  const nextReport = () => {
    if (currentReportIndex < filteredReports.length - 1) {
      setSlideDirection('right');
      setCurrentReportIndex(prev => prev + 1);
    }
  };
  
  const prevReport = () => {
    if (currentReportIndex > 0) {
      setSlideDirection('left');
      setCurrentReportIndex(prev => prev - 1);
    }
  };
  
  // Toggle fullscreen modal
  const openFullscreenModal = () => {
    setShowFullscreenModal(true);
  };
  
  // Close fullscreen modal
  const closeFullscreenModal = () => {
    setShowFullscreenModal(false);
  };
  
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'carousel' ? 'list' : 'carousel');
  };
  
  const handleNewReport = () => {
    navigate('/report');
  };

  // Filter reports by team
  const filteredReports = selectedTeam === 'all'
    ? reports
    : reports.filter(report => report.users?.teams?.id === selectedTeam);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Check if date is today
  const isToday = (dateString) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  return (
    <div className="dashboard-container">
      <motion.div 
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent">
            {isToday(date) ? "Today's Standup Reports" : "Standup Reports"}
          </h1>
          <p className="text-gray-500 flex items-center mt-1">
            <FiCalendar className="mr-1" /> {formatDate(date)}
          </p>
        </motion.div>
        
        <div className="flex items-center gap-2">
          <motion.div
            className="relative"
            variants={itemVariants}
          >
            <motion.button
              onClick={handleNewReport}
              className="group p-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-all duration-500 flex items-center gap-2"
              whileHover={{ 
                width: 'auto', 
                paddingRight: '1rem',
                transition: { 
                  duration: 0.5,
                  ease: 'easeOut'
                }
              }}
              initial={{ width: '2.5rem' }}
              whileTap={{ scale: 0.95 }}
            >
              <FiPlus className="h-5 w-5 flex-shrink-0" />
              <motion.span 
                className="overflow-hidden whitespace-nowrap flex-shrink-0"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 0, opacity: 0 }}
                whileHover={{ 
                  width: 'auto', 
                  opacity: 1,
                  transition: { 
                    width: { duration: 0.5, ease: 'easeOut' },
                    opacity: { duration: 0.3, delay: 0.2 }
                  }
                }}
              >
                Submit Report
              </motion.span>
            </motion.button>
          </motion.div>
          
          <motion.button
            variants={itemVariants}
            onClick={toggleViewMode}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 ${viewMode === 'carousel' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={viewMode === 'carousel' ? 'Switch to list view' : 'Switch to carousel view'}
          >
            {viewMode === 'carousel' ? (
              <>
                <FiGrid className="h-4 w-4" />
                <span className="text-sm font-medium">Carousel View</span>
              </>
            ) : (
              <>
                <FiList className="h-4 w-4" />
                <span className="text-sm font-medium">List View</span>
              </>
            )}
          </motion.button>
          
          <motion.button
            variants={itemVariants}
            onClick={handleRefresh}
            className="p-2 rounded-full text-primary-600 hover:bg-primary-50 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={refreshing}
          >
            <FiRefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </motion.button>
          
          <motion.button
            variants={itemVariants}
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-full transition-colors ${
              showFilters 
                ? 'bg-primary-100 text-primary-700' 
                : 'text-primary-600 hover:bg-primary-50'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiFilter className="h-5 w-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            className="bg-white/80 backdrop-blur-sm rounded-lg shadow-card p-4 mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex-1">
                <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiCalendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="date-filter"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm text-sm"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              
              <div className="flex-1">
                <label htmlFor="team-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Team
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUsers className="h-4 w-4 text-gray-400" />
                  </div>
                  <select
                    id="team-filter"
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm text-sm"
                  >
                    <option value="all">All Teams</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reports */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin"></div>
            <div className="mt-4 text-center text-primary-700 font-medium">Loading reports...</div>
          </div>
        </div>
      ) : error ? (
        <motion.div 
          className="bg-red-50 text-red-600 p-6 rounded-lg shadow-sm border border-red-100 mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex-1">
            <FiAlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>{error}</div>
          </div>
        </motion.div>
      ) : filteredReports.length === 0 ? (
        <motion.div 
          className="bg-gradient-to-br from-yellow-50 to-amber-50 p-8 rounded-xl shadow-sm border border-yellow-100 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 text-yellow-600 mb-4">
            <FiClock className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-yellow-800 mb-2">No reports submitted yet</h3>
          <p className="text-yellow-700 max-w-md mx-auto">
            {isToday(date) 
              ? 'Be the first to submit your daily standup report for today!' 
              : 'No standup reports were submitted for this date.'}
          </p>
        </motion.div>
      ) : viewMode === 'carousel' && filteredReports.length > 0 ? (
        <div className="relative max-w-5xl mx-auto py-6">
          {/* Report counter and fullscreen button */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-4">
            <div className="text-sm font-medium bg-gray-100 px-4 py-2 rounded-full shadow-sm">
              Report {currentReportIndex + 1} of {filteredReports.length}
            </div>
            <motion.button
              onClick={openFullscreenModal}
              className="p-2 rounded-full bg-primary-100 shadow-md text-primary-700 hover:bg-primary-200 flex items-center gap-2 px-3 py-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiMaximize className="h-4 w-4" />
              <span className="text-sm font-medium">Fullscreen</span>
            </motion.button>
          </div>
          
          {/* Left navigation button */}
          <motion.button
            onClick={prevReport}
            className={`absolute left-2 top-1/2 transform -translate-y-1/2 z-10 p-4 rounded-full shadow-lg ${
              currentReportIndex > 0 ? 'bg-white text-primary-700 opacity-80 hover:opacity-100' : 'bg-gray-200 text-gray-400 opacity-50'
            }`}
            whileHover={currentReportIndex > 0 ? { scale: 1.1, opacity: 1 } : {}}
            whileTap={currentReportIndex > 0 ? { scale: 0.9 } : {}}
            disabled={currentReportIndex === 0}
            style={{ display: filteredReports.length <= 1 ? 'none' : 'flex' }}
          >
            <FiChevronLeft className="h-6 w-6" />
          </motion.button>
          
          {/* Right navigation button */}
          <motion.button
            onClick={nextReport}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 z-10 p-4 rounded-full shadow-lg ${
              currentReportIndex < filteredReports.length - 1 ? 'bg-white text-primary-700 opacity-80 hover:opacity-100' : 'bg-gray-200 text-gray-400 opacity-50'
            }`}
            whileHover={currentReportIndex < filteredReports.length - 1 ? { scale: 1.1, opacity: 1 } : {}}
            whileTap={currentReportIndex < filteredReports.length - 1 ? { scale: 0.9 } : {}}
            disabled={currentReportIndex === filteredReports.length - 1}
            style={{ display: filteredReports.length <= 1 ? 'none' : 'flex' }}
          >
            <FiChevronRight className="h-6 w-6" />
          </motion.button>
          
          {/* Carousel container with overflow hidden */}
          <div className="overflow-hidden relative h-full" style={{ padding: showFullscreenModal ? '1rem' : '0' }}>
            {/* Animated carousel wrapper */}
            <AnimatePresence initial={false} custom={slideDirection} mode="wait">
              <motion.div
                key={currentReportIndex}
                custom={slideDirection}
                initial={(direction) => ({
                  x: direction === 'right' ? 300 : -300,
                  opacity: 0,
                  scale: 0.9
                })}
                animate={{
                  x: 0,
                  opacity: 1,
                  scale: 1
                }}
                exit={(direction) => ({
                  x: direction === 'right' ? -300 : 300,
                  opacity: 0,
                  scale: 0.9
                })}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                  mass: 1
                }}
                className={`bg-white rounded-xl shadow-xl border border-gray-200 mb-6 transform-gpu ${showFullscreenModal ? 'w-full' : ''}`}
                style={{ maxHeight: showFullscreenModal ? 'calc(100vh - 12rem)' : 'auto', overflow: 'auto' }}
              >
                {filteredReports[currentReportIndex] && (
                  <>
                    {/* Report header */}
                    <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-8 py-6 flex justify-between items-start">
                      <div className="flex items-center">
                        <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 mr-4 shadow-sm">
                          <FiUser className="h-8 w-8" />
                        </div>
                        <div>
                          <h3 className="font-bold text-2xl text-gray-900 mb-1">{filteredReports[currentReportIndex].users?.name || 'Unknown User'}</h3>
                          <div className="flex items-center text-sm text-gray-500">
                            <FiUsers className="h-4 w-4 mr-1.5" />
                            <span className="font-medium">{filteredReports[currentReportIndex].users?.teams?.name || 'Unassigned'}</span>
                            <span className="mx-2">&bull;</span>
                            <FiClock className="h-4 w-4 mr-1.5" />
                            <span>{new Date(filteredReports[currentReportIndex].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                      
                      {filteredReports[currentReportIndex].blockers ? (
                        <div className="flex items-center text-sm font-medium text-red-600 bg-red-50 px-4 py-2 rounded-full shadow-sm">
                          <FiAlertCircle className="h-4 w-4 mr-2" />
                          Has blockers
                        </div>
                      ) : (
                        <div className="flex items-center text-sm font-medium text-green-600 bg-green-50 px-4 py-2 rounded-full shadow-sm">
                          <FiCheckCircle className="h-4 w-4 mr-2" />
                          No blockers
                        </div>
                      )}
                    </div>
                    
                    {/* Report content */}
                    <div className="p-8">
                      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
                        <motion.div 
                          className="p-6 bg-gray-50 rounded-xl shadow-sm"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1, duration: 0.4 }}
                        >
                          <h4 className="font-semibold text-lg text-gray-900 flex items-center mb-4">
                            <span className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 mr-3 text-xs font-bold shadow-sm">1</span>
                            Yesterday
                          </h4>
                          <div className="text-gray-700 text-sm whitespace-pre-line min-h-[150px]">
                            {filteredReports[currentReportIndex].yesterday || 'No update provided'}
                          </div>
                        </motion.div>
                        
                        <motion.div 
                          className="p-6 bg-gray-50 rounded-xl shadow-sm"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2, duration: 0.4 }}
                        >
                          <h4 className="font-semibold text-lg text-gray-900 flex items-center mb-4">
                            <span className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 mr-3 text-xs font-bold shadow-sm">2</span>
                            Today
                          </h4>
                          <div className="text-gray-700 text-sm whitespace-pre-line min-h-[150px]">
                            {filteredReports[currentReportIndex].today || 'No update provided'}
                          </div>
                        </motion.div>
                        
                        <motion.div 
                          className={filteredReports[currentReportIndex].blockers ? 
                            "p-6 bg-red-50 rounded-xl shadow-sm border border-red-100" : 
                            "p-6 bg-green-50 rounded-xl shadow-sm border border-green-100"}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3, duration: 0.4 }}
                        >
                          <h4 className="font-semibold text-lg text-gray-900 flex items-center mb-4">
                            <span className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 mr-3 text-xs font-bold shadow-sm">3</span>
                            Blockers
                          </h4>
                          <div className={filteredReports[currentReportIndex].blockers ? "text-red-700 text-sm whitespace-pre-line min-h-[150px]" : "text-green-700 text-sm whitespace-pre-line min-h-[150px]"}>
                            {filteredReports[currentReportIndex].blockers || 'No blockers reported'}
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Pagination dots */}
          {!showFullscreenModal && (
            <div className="flex justify-center gap-2 mt-8">
              {filteredReports.map((_, index) => (
                <motion.button 
                  key={index} 
                  className={`h-3 rounded-full transition-all ${index === currentReportIndex ? 'w-10 bg-primary-500' : 'w-3 bg-gray-300'}`}
                  onClick={() => {
                    setSlideDirection(index > currentReportIndex ? 'right' : 'left');
                    setCurrentReportIndex(index);
                  }}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={`Go to report ${index + 1}`}
                />
              ))}
            </div>
          )}
          

        </div>
      ) : viewMode === 'carousel' ? (
        <motion.div 
          className="bg-gradient-to-br from-yellow-50 to-amber-50 p-8 rounded-xl shadow-sm border border-yellow-100 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 text-yellow-600 mb-4">
            <FiClock className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-yellow-800 mb-2">No reports to display</h3>
          <p className="text-yellow-700 max-w-md mx-auto">
            {isToday(date) 
              ? 'Be the first to submit your daily standup report for today!' 
              : 'No standup reports were submitted for this date.'}
          </p>
        </motion.div>
      ) : (
        <motion.div 
          className="grid gap-6"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {filteredReports.map((report, index) => (
            <motion.div 
              key={report.id} 
              className="bg-white/90 backdrop-blur-sm rounded-xl shadow-card hover:shadow-card-hover border border-gray-100 overflow-hidden transition-all duration-300 opacity-0"
              variants={itemVariants}
              ref={el => reportRefs.current[index] = el}
            >
              <React.Fragment>
                <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-6 py-4 flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 mr-3">
                      <FiUser className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{report.users?.name || 'Unknown User'}</h3>
                      <div className="text-xs text-gray-500 flex items-center">
                        <FiClock className="h-3 w-3 mr-1" />
                        <span>{new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {report.blockers ? (
                  <div className="flex items-center text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                    <FiAlertCircle className="h-3 w-3 mr-1" />
                    Has blockers
                  </div>
                ) : (
                  <div className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <FiCheckCircle className="h-3 w-3 mr-1" />
                    No blockers
                  </div>
                )}
                
                <div className="p-6">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900 flex items-center">
                        <span className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 mr-2 text-xs">1</span>
                        Yesterday
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-3 text-gray-700 text-sm whitespace-pre-line min-h-[80px]">
                        {report.yesterday || 'No update provided'}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900 flex items-center">
                        <span className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 mr-2 text-xs">2</span>
                        Today
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-3 text-gray-700 text-sm whitespace-pre-line min-h-[80px]">
                        {report.today || 'No update provided'}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900 flex items-center">
                        <span className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 mr-2 text-xs">3</span>
                        Blockers
                      </h4>
                      {report.blockers ? (
                        <div className="bg-red-50 rounded-lg p-3 text-red-700 text-sm whitespace-pre-line min-h-[80px] border border-red-100">
                          {report.blockers}
                        </div>
                      ) : (
                        <div className="bg-green-50 rounded-lg p-3 text-green-700 text-sm whitespace-pre-line min-h-[80px] border border-green-100">
                          No blockers reported
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            </motion.div>
          ))}
        </motion.div>
      )}
      
      {/* Fullscreen Modal */}
      {showFullscreenModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center overflow-auto" onClick={closeFullscreenModal}>
        <div className="absolute top-4 right-4 z-10 flex items-center gap-4">
          <div className="text-sm font-medium bg-white/20 text-white px-4 py-2 rounded-full shadow-sm">
            Report {currentReportIndex + 1} of {filteredReports.length}
          </div>
          <motion.button
            onClick={closeFullscreenModal}
            className="p-2 rounded-full bg-white shadow-md text-gray-700 hover:bg-gray-100 flex items-center gap-2 px-3 py-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiMinimize className="h-4 w-4" />
            <span className="text-sm font-medium">Exit Fullscreen</span>
          </motion.button>
        </div>
        
        {/* Modal Content - Prevent click propagation to avoid closing when clicking inside */}
        <div className="w-[95%] max-w-7xl mx-auto" onClick={(e) => e.stopPropagation()}>
          {/* Left navigation button */}
          <motion.button
            onClick={() => {
              if (currentReportIndex > 0) {
                setSlideDirection('left');
                setCurrentReportIndex(prev => prev - 1);
              }
            }}
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-5 rounded-full shadow-lg ${
              currentReportIndex > 0 ? 'bg-white text-primary-700 opacity-90 hover:opacity-100' : 'bg-gray-200 text-gray-400 opacity-50'
            }`}
            whileHover={currentReportIndex > 0 ? { scale: 1.1, opacity: 1 } : {}}
            whileTap={currentReportIndex > 0 ? { scale: 0.9 } : {}}
            disabled={currentReportIndex === 0}
            style={{ display: filteredReports.length <= 1 ? 'none' : 'flex' }}
          >
            <FiChevronLeft className="h-8 w-8" />
          </motion.button>
          
          {/* Right navigation button */}
          <motion.button
            onClick={() => {
              if (currentReportIndex < filteredReports.length - 1) {
                setSlideDirection('right');
                setCurrentReportIndex(prev => prev + 1);
              }
            }}
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-5 rounded-full shadow-lg ${
              currentReportIndex < filteredReports.length - 1 ? 'bg-white text-primary-700 opacity-90 hover:opacity-100' : 'bg-gray-200 text-gray-400 opacity-50'
            }`}
            whileHover={currentReportIndex < filteredReports.length - 1 ? { scale: 1.1, opacity: 1 } : {}}
            whileTap={currentReportIndex < filteredReports.length - 1 ? { scale: 0.9 } : {}}
            disabled={currentReportIndex === filteredReports.length - 1}
            style={{ display: filteredReports.length <= 1 ? 'none' : 'flex' }}
          >
            <FiChevronRight className="h-8 w-8" />
          </motion.button>
          
          {/* Animated carousel wrapper */}
          <AnimatePresence initial={false} custom={slideDirection} mode="wait">
            <motion.div
              key={currentReportIndex}
              custom={slideDirection}
              initial={(direction) => ({
                x: direction === 'right' ? 300 : -300,
                opacity: 0,
                scale: 0.9
              })}
              animate={{
                x: 0,
                opacity: 1,
                scale: 1
              }}
              exit={(direction) => ({
                x: direction === 'right' ? -300 : 300,
                opacity: 0,
                scale: 0.9
              })}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
                mass: 1
              }}
              className="bg-white rounded-xl shadow-xl border border-gray-200 transform-gpu"
            >
              {filteredReports[currentReportIndex] && (
                <>
                  {/* Report header */}
                  <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-10 py-8 flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 mr-6 shadow-sm">
                        <FiUser className="h-10 w-10" />
                      </div>
                      <div>
                        <h3 className="font-bold text-3xl text-gray-900 mb-2">{filteredReports[currentReportIndex].users?.name || 'Unknown User'}</h3>
                        <div className="flex items-center text-base text-gray-500">
                          <FiUsers className="h-5 w-5 mr-2" />
                          <span className="font-medium">{filteredReports[currentReportIndex].users?.teams?.name || 'Unassigned'}</span>
                          <span className="mx-3">&bull;</span>
                          <FiClock className="h-5 w-5 mr-2" />
                          <span>{new Date(filteredReports[currentReportIndex].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    
                    {filteredReports[currentReportIndex].blockers ? (
                      <div className="flex items-center text-base font-medium text-red-600 bg-red-50 px-5 py-3 rounded-full shadow-sm">
                        <FiAlertCircle className="h-5 w-5 mr-2" />
                        Has blockers
                      </div>
                    ) : (
                      <div className="flex items-center text-base font-medium text-green-600 bg-green-50 px-5 py-3 rounded-full shadow-sm">
                        <FiCheckCircle className="h-5 w-5 mr-2" />
                        No blockers
                      </div>
                    )}
                  </div>
                  
                  {/* Report content */}
                  <div className="p-10">
                    <div className="grid gap-10 grid-cols-3">
                      <motion.div 
                        className="p-8 bg-gray-50 rounded-xl shadow-sm"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                      >
                        <h4 className="font-semibold text-xl text-gray-900 flex items-center mb-6">
                          <span className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 mr-4 text-sm font-bold shadow-sm">1</span>
                          Yesterday
                        </h4>
                        <div className="text-gray-700 text-lg whitespace-pre-line min-h-[200px]">
                          {filteredReports[currentReportIndex].yesterday || 'No update provided'}
                        </div>
                      </motion.div>
                      
                      <motion.div 
                        className="p-8 bg-gray-50 rounded-xl shadow-sm"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                      >
                        <h4 className="font-semibold text-xl text-gray-900 flex items-center mb-6">
                          <span className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 mr-4 text-sm font-bold shadow-sm">2</span>
                          Today
                        </h4>
                        <div className="text-gray-700 text-lg whitespace-pre-line min-h-[200px]">
                          {filteredReports[currentReportIndex].today || 'No update provided'}
                        </div>
                      </motion.div>
                      
                      <motion.div 
                        className={filteredReports[currentReportIndex].blockers ? 
                          "p-8 bg-red-50 rounded-xl shadow-sm border border-red-100" : 
                          "p-8 bg-green-50 rounded-xl shadow-sm border border-green-100"}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                      >
                        <h4 className="font-semibold text-xl text-gray-900 flex items-center mb-6">
                          <span className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 mr-4 text-sm font-bold shadow-sm">3</span>
                          Blockers
                        </h4>
                        <div className={filteredReports[currentReportIndex].blockers ? "text-red-700 text-lg whitespace-pre-line min-h-[200px]" : "text-green-700 text-lg whitespace-pre-line min-h-[200px]"}>
                          {filteredReports[currentReportIndex].blockers || 'No blockers reported'}
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
          
          {/* Pagination dots */}
          <div className="flex justify-center gap-2 mt-8">
            {filteredReports.map((_, index) => (
              <motion.button 
                key={index} 
                className={`h-3 rounded-full transition-all ${index === currentReportIndex ? 'w-12 bg-white' : 'w-3 bg-gray-500'}`}
                onClick={() => {
                  setSlideDirection(index > currentReportIndex ? 'right' : 'left');
                  setCurrentReportIndex(index);
                }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                aria-label={`Go to report ${index + 1}`}
              />
            ))}
          </div>
        </div>
        
        {/* ESC key hint */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/30 px-4 py-2 rounded-full">
          Press ESC to exit fullscreen
        </div>
      </div>
    )}
    </div>
  );
}
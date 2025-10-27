import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useCompany } from '../contexts/CompanyContext';
import { FiChevronDown, FiChevronUp, FiFilter, FiCalendar, FiUsers, FiCheckCircle, FiAlertCircle, FiClock } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const statusColors = {
  submitted: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-100',
    icon: <FiCheckCircle className="mr-1.5" />
  },
  pending: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-100',
    icon: <FiClock className="mr-1.5" />
  },
  missing: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-100',
    icon: <FiAlertCircle className="mr-1.5" />
  }
};

export default function History() {
  const { currentCompany } = useCompany();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedDates, setExpandedDates] = useState({});

  useEffect(() => {
    // Set default date range to last 7 days
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
    
    fetchTeams();
  }, [currentCompany]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchReports();
    }
  }, [startDate, endDate, selectedTeam, currentCompany]);

  const fetchTeams = async () => {
    try {
      if (!currentCompany?.id) return;

      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .eq('company_id', currentCompany.id);

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error.message);
    }
  };

  const fetchReports = async () => {
    if (!startDate || !endDate || !currentCompany?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Query to get reports within date range with user and team information
      // Filter by company_id and also join with users to ensure user belongs to same company
      let query = supabase
        .from('daily_reports')
        .select(`
          id, date, yesterday, today, blockers, created_at,
          users:user_id (id, name, team_id, company_id, teams:team_id (id, name, company_id))
        `)
        .eq('company_id', currentCompany.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        // If company_id column doesn't exist yet, fallback to filtering by user company
        if (error.message?.includes('column "company_id" does not exist') || error.code === 'PGRST204') {
          const fallbackQuery = supabase
            .from('daily_reports')
            .select(`
              id, date, yesterday, today, blockers, created_at,
              users:user_id (id, name, team_id, company_id, teams:team_id (id, name, company_id))
            `)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: false });

          const { data: fallbackData, error: fallbackError } = await fallbackQuery;
          if (fallbackError) throw fallbackError;

          // Filter client-side by user company_id
          const filteredData = fallbackData?.filter(report =>
            report.users?.company_id === currentCompany.id
          ) || [];

          setReports(filteredData);
        } else {
          throw error;
        }
      } else {
        setReports(data || []);
      }
    } catch (error) {
      setError('Error fetching reports: ' + error.message);
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter reports by team
  const filteredReports = selectedTeam === 'all'
    ? reports
    : reports.filter(report => report.users?.teams?.id === selectedTeam);

  // Group reports by date
  const reportsByDate = filteredReports.reduce((acc, report) => {
    const date = report.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(report);
    return acc;
  }, {});

  // Toggle expansion for a date
  const toggleDate = (date) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  // Toggle all date groups
  const toggleAllDates = (expand) => {
    const newState = {};
    Object.keys(reportsByDate).forEach(date => {
      newState[date] = expand;
    });
    setExpandedDates(newState);
  };

  // Check if any date group is expanded
  const anyExpanded = Object.values(expandedDates).some(isExpanded => isExpanded);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full px-4 py-6"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <motion.h1 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-3 md:mb-0"
        >
          Report History
        </motion.h1>
        <motion.div 
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center space-x-2 text-sm text-gray-500"
        >
          <FiCalendar className="h-4 w-4" />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </motion.div>
      </div>
      
      {/* Filters */}
      <motion.div 
        className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center mb-4">
          <FiFilter className="text-indigo-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <div className="relative">
              <input
                id="start-date"
                type="date"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <div className="relative">
              <input
                id="end-date"
                type="date"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label htmlFor="team-filter" className="block text-sm font-medium text-gray-700 mb-1">Team</label>
            <div className="relative">
              <select
                id="team-filter"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white transition-all"
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
              >
                <option value="all">All Teams</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <FiUsers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div 
        className="flex justify-between items-center mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold text-gray-800">
          {Object.keys(reportsByDate).length} {Object.keys(reportsByDate).length === 1 ? 'Day' : 'Days'} of Reports
        </h2>
        <div className="flex space-x-2">
          <motion.button
            onClick={() => toggleAllDates(true)}
            className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Show All
          </motion.button>
          <motion.button
            onClick={() => toggleAllDates(false)}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Hide All
          </motion.button>
        </div>
      </motion.div>

      {/* Date Groupings */}
      {loading ? (
        <motion.div 
          className="flex justify-center items-center h-[calc(100vh-300px)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div 
            className="h-12 w-12 border-4 border-indigo-100 rounded-full"
            animate={{ 
              rotate: 360,
              borderTopColor: '#4f46e5',
              borderRightColor: '#4f46e5',
              borderBottomColor: '#e0e7ff',
              borderLeftColor: '#e0e7ff'
            }}
            transition={{ 
              duration: 1, 
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        </motion.div>
      ) : Object.keys(reportsByDate).length === 0 ? (
        <motion.div 
          className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm h-[calc(100vh-300px)] flex flex-col items-center justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
            <FiAlertCircle className="h-8 w-8 text-indigo-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No reports found</h3>
          <p className="text-gray-500 max-w-md mx-auto">Try adjusting your filters or check back later for new reports.</p>
        </motion.div>
      ) : (
        <motion.div 
          className="space-y-4 h-[calc(100vh-300px)] overflow-y-auto pr-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {Object.entries(reportsByDate).map(([date, dateReports]) => {
            const isExpanded = expandedDates[date] ?? false; // Default to collapsed
            const dateObj = new Date(date);
            const isToday = new Date().toDateString() === dateObj.toDateString();
            
            return (
              <motion.div 
                key={date} 
                className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md"
                variants={itemVariants}
              >
                <motion.div 
                  className={`px-4 py-3 cursor-pointer flex justify-between items-center ${isToday ? 'bg-gradient-to-r from-indigo-50 to-blue-50' : 'bg-white'}`}
                  onClick={() => toggleDate(date)}
                  whileHover={{ backgroundColor: isToday ? 'rgba(238, 242, 255, 0.8)' : 'rgba(249, 250, 251, 0.8)' }}
                >
                  <div className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg mr-3 ${isToday ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>
                      {dateObj.getDate().toString().padStart(2, '0')}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        {dateObj.toLocaleDateString('en-US', { weekday: 'long' })}
                        {isToday && <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">Today</span>}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className={`p-1.5 rounded-full ${isToday ? 'text-indigo-600' : 'text-gray-400'} hover:bg-gray-100`}
                  >
                    <FiChevronUp className="h-5 w-5" />
                  </motion.div>
                </motion.div>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ 
                        opacity: 1, 
                        height: 'auto',
                        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
                      }}
                      exit={{ 
                        opacity: 0, 
                        height: 0,
                        transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
                      }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0">
                        <div className="grid grid-cols-1 gap-4">
                          {dateReports.map((report) => {
                            const status = report.status === 'submitted' ? 'submitted' : 'pending';
                            const colors = statusColors[status] || statusColors.pending;
                            
                            return (
                              <motion.div 
                                key={report.id} 
                                className={`border ${colors.border} ${colors.bg} rounded-lg p-3 transition-all duration-200 hover:shadow-sm`}
                                whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium mr-3">
                                      {report.users?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                      <h3 className="font-medium text-gray-900">{report.users?.name || 'Unknown User'}</h3>
                                      <p className="text-sm text-gray-500 flex items-center">
                                        {report.users?.teams?.name || 'Unassigned'}
                                      </p>
                                    </div>
                                  </div>
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors.text} ${colors.bg} border ${colors.border} flex items-center`}>
                                    {colors.icon}
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </span>
                                </div>
                                
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="bg-white p-3 rounded-lg border border-gray-100">
                                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Yesterday</h4>
                                    <p className="text-sm text-gray-700">{report.yesterday || <span className="text-gray-400 italic">No update</span>}</p>
                                  </div>
                                  <div className="bg-white p-3 rounded-lg border border-gray-100">
                                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Today</h4>
                                    <p className="text-sm text-gray-700">{report.today || <span className="text-gray-400 italic">No update</span>}</p>
                                  </div>
                                  <div className={`p-3 rounded-lg border ${report.blockers ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 flex items-center">
                                      {report.blockers ? (
                                        <FiAlertCircle className="mr-1 text-amber-500" />
                                      ) : (
                                        <FiCheckCircle className="mr-1 text-emerald-500" />
                                      )}
                                      Blockers
                                    </h4>
                                    <p className={`text-sm ${report.blockers ? 'text-amber-700' : 'text-emerald-700'}`}>
                                      {report.blockers || 'No blockers reported'}
                                    </p>
                                  </div>
                                </div>
                                
                                {report.notes && (
                                  <div className="mt-3 pt-3 border-t border-gray-100">
                                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Notes</h4>
                                    <p className="text-sm text-gray-700">{report.notes}</p>
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Export button */}
      {filteredReports.length > 0 && (
        <motion.div 
          className="mt-6 flex justify-end"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.button
            onClick={() => {
              // Simple CSV export
              const headers = ['Date', 'Name', 'Team', 'Yesterday', 'Today', 'Blockers'];
              const csvRows = [
                headers.join(','),
                ...filteredReports.map(report => [
                  report.date,
                  `"${report.users?.name || 'Unknown'}"`,
                  `"${report.users?.teams?.name || 'Unassigned'}"`,
                  `"${(report.yesterday || '').replace(/"/g, '""')}"`,
                  `"${(report.today || '').replace(/"/g, '""')}"`,
                  `"${(report.blockers || '').replace(/"/g, '""')}"`
                ].join(','))
              ];
              
              const csvString = csvRows.join('\n');
              const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              
              const link = document.createElement('a');
              link.setAttribute('href', url);
              link.setAttribute('download', `standup-reports-${startDate}-to-${endDate}.csv`);
              link.style.visibility = 'hidden';
              
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>Export to CSV</span>
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}

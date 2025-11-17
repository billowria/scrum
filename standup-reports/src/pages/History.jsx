import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useCompany } from '../contexts/CompanyContext';
import {
  FiFileText, FiCalendar, FiDownload, FiGrid, FiList, FiRefreshCw,
  FiUsers, FiCheckCircle, FiAlertCircle, FiClock, FiSearch, FiX,
  FiChevronDown, FiChevronUp, FiMaximize2, FiMinimize2
} from 'react-icons/fi';

// Import our new atomic components
import FilterPanel from '../components/history/FilterPanel';
import DateGroup from '../components/history/DateGroup';
import StatusBadge from '../components/history/StatusBadge';
import UserAvatar from '../components/history/UserAvatar';
import '../components/history/design-tokens.css';

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

// Loading spinner component
const LoadingSpinner = () => (
  <motion.div
    className="flex flex-col items-center justify-center h-64"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <div className="relative">
      <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
      <motion.div
        className="absolute top-0 left-0 w-12 h-12 border-4 border-primary-500 rounded-full border-t-transparent border-r-transparent"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
    <p className="mt-4 text-gray-600 font-medium">Loading reports...</p>
  </motion.div>
);

// Empty state component
const EmptyState = ({ onClearFilters, hasFilters }) => (
  <motion.div
    className="flex flex-col items-center justify-center h-64 text-center"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
  >
    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <FiFileText className="w-10 h-10 text-gray-400" />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">No reports found</h3>
    <p className="text-gray-500 max-w-md mb-6">
      {hasFilters
        ? "Try adjusting your filters to see more reports."
        : "No standup reports have been submitted for the selected period."
      }
    </p>
    {hasFilters && (
      <motion.button
        onClick={onClearFilters}
        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <FiX className="w-4 h-4" />
        Clear Filters
      </motion.button>
    )}
  </motion.div>
);

// Export options component
const ExportOptions = ({ reports, startDate, endDate }) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const handleCSVExport = useCallback(() => {
    const headers = ['Date', 'Name', 'Team', 'Yesterday', 'Today', 'Blockers'];
    const csvRows = [
      headers.join(','),
      ...reports.map(report => [
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
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
  }, [reports, startDate, endDate]);

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-lg"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <FiDownload className="w-4 h-4" />
        <span>Export</span>
        <FiChevronDown className={`w-3.5 h-3.5 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isExportMenuOpen && (
          <motion.div
            className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-xl z-50 overflow-hidden"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <motion.button
              onClick={handleCSVExport}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
              whileHover={{ backgroundColor: 'var(--gray-50)' }}
            >
              <FiDownload className="w-4 h-4" />
              Export as CSV
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function History() {
  const { currentCompany } = useCompany();
  const navigate = useNavigate();

  // State management
  const [reports, setReports] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedDates, setExpandedDates] = useState({});
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);

  // Set default date range to last 7 days
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);

    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  // Fetch teams
  useEffect(() => {
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

    fetchTeams();
  }, [currentCompany]);

  // Fetch reports
  useEffect(() => {
    const fetchReports = async () => {
      if (!startDate || !endDate || !currentCompany?.id) return;

      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('daily_reports')
          .select(`
            id, date, yesterday, today, blockers, created_at,
            users:user_id (id, name, team_id, company_id, avatar_url, teams:team_id (id, name, company_id))
          `)
          .eq('company_id', currentCompany.id)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: false });

        const { data, error } = await query;

        if (error) {
          if (error.message?.includes('column "company_id" does not exist') || error.code === 'PGRST204') {
            const fallbackQuery = supabase
              .from('daily_reports')
              .select(`
                id, date, yesterday, today, blockers, created_at,
                users:user_id (id, name, team_id, company_id, avatar_url, teams:team_id (id, name, company_id))
              `)
              .gte('date', startDate)
              .lte('date', endDate)
              .order('date', { ascending: false });

            const { data: fallbackData, error: fallbackError } = await fallbackQuery;
            if (fallbackError) throw fallbackError;

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

    fetchReports();
  }, [startDate, endDate, currentCompany]);

  // Filter reports
  const filteredReports = useMemo(() => {
    let filtered = reports;

    // Filter by team
    if (selectedTeam !== 'all') {
      filtered = filtered.filter(report => report.users?.teams?.id === selectedTeam);
    }

    // Filter by selected users
    if (selectedUsers && selectedUsers.length > 0) {
      filtered = filtered.filter(report => report.users && selectedUsers.includes(report.users.id));
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(report =>
        report.users?.name?.toLowerCase().includes(term) ||
        report.users?.teams?.name?.toLowerCase().includes(term) ||
        report.yesterday?.toLowerCase().includes(term) ||
        report.today?.toLowerCase().includes(term) ||
        report.blockers?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [reports, selectedTeam, selectedUsers, searchTerm]);

  // Group reports by date
  const reportsByDate = useMemo(() => {
    return filteredReports.reduce((acc, report) => {
      const date = report.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(report);
      return acc;
    }, {});
  }, [filteredReports]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedTeam('all');
    setSelectedUsers([]);
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, []);

  // Toggle date expansion
  const toggleDate = useCallback((date) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  }, []);

  // Toggle all dates
  const toggleAllDates = useCallback((expand) => {
    const newState = {};
    Object.keys(reportsByDate).forEach(date => {
      newState[date] = expand;
    });
    setExpandedDates(newState);
  }, [reportsByDate]);

  // Check if any date group is expanded
  const anyExpanded = Object.values(expandedDates).some(isExpanded => isExpanded);

  // Handle user click
  const handleUserClick = useCallback((user) => {
    navigate(`/profile/${user.id}`);
  }, [navigate]);

  // Handle report details
  const handleViewReport = useCallback((report) => {
    // Future: Open report details modal
    console.log('View report details:', report);
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalReports = filteredReports.length;
    const completedReports = filteredReports.filter(r => r.yesterday || r.today).length;
    const uniqueUsers = new Set(filteredReports.map(r => r.users?.id).filter(Boolean)).size;
    const completionRate = totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 0;

    return {
      totalReports,
      completedReports,
      uniqueUsers,
      completionRate,
      daysWithData: Object.keys(reportsByDate).length
    };
  }, [filteredReports, reportsByDate]);

  return (
    <div className="min-h-screen bg-gray-50">

      <motion.div
        className="w-full h-full px-6 py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 w-full">
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent mb-2">
                Report History
              </h1>
              <div className="flex items-center gap-2 text-gray-600">
                <FiCalendar className="w-4 h-4" />
                <span className="text-sm">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                <motion.button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiList className="w-4 h-4" />
                  List
                </motion.button>
                <motion.button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiGrid className="w-4 h-4" />
                  Grid
                </motion.button>
              </div>

              {/* Export Button */}
              {filteredReports.length > 0 && (
                <ExportOptions
                  reports={filteredReports}
                  startDate={startDate}
                  endDate={endDate}
                />
              )}
            </div>
          </div>
        </motion.div>

        {/* Filter Panel */}
        <FilterPanel
          startDate={startDate}
          endDate={endDate}
          selectedTeam={selectedTeam}
          teams={teams}
          selectedUsers={selectedUsers}
          reports={reports}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onTeamChange={setSelectedTeam}
          onUserChange={setSelectedUsers}
          onSearchChange={setSearchTerm}
          searchTerm={searchTerm}
          onClearFilters={clearFilters}
          isCollapsed={isFilterCollapsed}
          onToggleCollapse={() => setIsFilterCollapsed(!isFilterCollapsed)}
          className="mb-6 w-full"
        />

        {/* Statistics Cards */}
        {!loading && filteredReports.length > 0 && (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <FiFileText className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalReports}</p>
                  <p className="text-xs text-gray-500">Total Reports</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <FiCheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedReports}</p>
                  <p className="text-xs text-gray-500">Completed</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <FiUsers className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.uniqueUsers}</p>
                  <p className="text-xs text-gray-500">Team Members</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FiCalendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.daysWithData}</p>
                  <p className="text-xs text-gray-500">Days</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <span className="text-lg font-bold text-indigo-600">{stats.completionRate}%</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
                  <p className="text-xs text-gray-500">Completion</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Controls */}
        {!loading && filteredReports.length > 0 && (
          <motion.div
            className="flex justify-between items-center mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-lg font-semibold text-gray-900">
              {stats.daysWithData} {stats.daysWithData === 1 ? 'Day' : 'Days'} of Reports
            </h2>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => toggleAllDates(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={anyExpanded}
              >
                <FiMaximize2 className="w-3.5 h-3.5" />
                Expand All
              </motion.button>
              <motion.button
                onClick={() => toggleAllDates(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!anyExpanded}
              >
                <FiMinimize2 className="w-3.5 h-3.5" />
                Collapse All
              </motion.button>
              <motion.button
                onClick={() => window.location.reload()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiRefreshCw className="w-3.5 h-3.5" />
                Refresh
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <motion.div
            className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-red-600 mb-2">
              <FiAlertCircle className="w-12 h-12 mx-auto mb-4" />
            </div>
            <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Reports</h3>
            <p className="text-red-700">{error}</p>
          </motion.div>
        ) : filteredReports.length === 0 ? (
          <EmptyState
            onClearFilters={clearFilters}
            hasFilters={searchTerm || selectedTeam !== 'all' || (selectedUsers && selectedUsers.length > 0)}
          />
        ) : (
          <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {Object.entries(reportsByDate).map(([date, dateReports]) => (
              <DateGroup
                key={date}
                date={date}
                reports={dateReports}
                isExpanded={expandedDates[date] ?? false}
                onToggle={() => toggleDate(date)}
                onUserClick={handleUserClick}
                onViewReport={handleViewReport}
                variant={viewMode}
              />
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
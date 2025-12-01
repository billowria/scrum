import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { format, parseISO, getYear, getMonth } from 'date-fns';
import {
  FiAward, FiChevronLeft, FiFilter, FiCalendar,
  FiDownload, FiSearch, FiUser, FiInfo, FiClock,
  FiActivity, FiStar, FiTarget, FiThumbsUp, FiCheck,
  FiTrendingUp, FiRocket, FiFileText, FiClipboard,
  FiLinkedin, FiLayout
} from 'react-icons/fi';

// Components
import AchievementCard from '../components/AchievementCard';
import AchievementDetailModal from '../components/AchievementDetailModal';

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

const timelineVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const timelineItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

// Award type icons
const awardIcons = {
  promotion: <FiTrendingUp />,
  certificate: <FiClipboard />,
  recognition: <FiStar />,
  performance: <FiTarget />,
  milestone: <FiActivity />,
  teamwork: <FiUser />,
  achievement: <FiCheck />,
  special: <FiRocket />,
  technical: <FiFileText />,
  other: <FiThumbsUp />
};

// Award type colors
const awardColors = {
  promotion: 'primary',
  certificate: 'green',
  recognition: 'amber',
  performance: 'red',
  milestone: 'purple',
  teamwork: 'blue',
  achievement: 'primary',
  special: 'pink',
  technical: 'gray',
  other: 'blue'
};

const UserAchievements = () => {
  const { userId } = useParams();
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'timeline'
  const [defaultModalTab, setDefaultModalTab] = useState('details');
  const [stats, setStats] = useState({
    total: 0,
    byType: {}
  });

  // Fetch current user and user achievements on component mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };

    fetchCurrentUser();
    fetchUserDetails();
    fetchUserAchievements();
  }, [userId]);

  // Fetch user details
  const fetchUserDetails = async () => {
    try {
      const targetId = userId || currentUserId;
      if (!targetId) return;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', targetId)
        .single();

      if (error) throw error;
      setUserDetails(data);
    } catch (error) {
      console.error('Error fetching user details:', error.message);
    }
  };

  // Fetch user achievements
  const fetchUserAchievements = async () => {
    try {
      setLoading(true);

      const targetId = userId || currentUserId;
      if (!targetId) {
        setLoading(false);
        return;
      }

      // Fetch all achievements for this user
      const { data, error } = await supabase
        .from('achievements')
        .select(`
          id, 
          title, 
          description, 
          award_type, 
          awarded_at, 
          image_url,
          user_id,
          created_by
        `)
        .eq('user_id', targetId)
        .order('awarded_at', { ascending: false });

      if (error) throw error;

      // Fetch all users involved in these achievements
      if (data && data.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(data.map(item => item.user_id).filter(Boolean))];
        const creatorIds = [...new Set(data.map(item => item.created_by).filter(Boolean))];
        const allIds = [...new Set([...userIds, ...creatorIds])];

        // Fetch all users in one query
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, email, image_url')
          .in('id', allIds);

        if (userError) throw userError;

        // Create a map of user data for quick lookup
        const userMap = {};
        if (userData) {
          userData.forEach(user => {
            userMap[user.id] = user;
          });
        }

        // Attach user data to achievements
        const enhancedData = data.map(achievement => ({
          ...achievement,
          users: userMap[achievement.user_id] || null,
          creator: userMap[achievement.created_by] || null
        }));

        setAchievements(enhancedData);

        // Calculate statistics
        const typeStats = {};
        data.forEach(achievement => {
          if (!typeStats[achievement.award_type]) {
            typeStats[achievement.award_type] = 0;
          }
          typeStats[achievement.award_type]++;
        });

        setStats({
          total: data.length,
          byType: typeStats
        });
      } else {
        setAchievements([]);
        setStats({ total: 0, byType: {} });
      }
    } catch (error) {
      console.error('Error fetching achievements:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter achievements based on filter and search term
  const filteredAchievements = achievements.filter(achievement => {
    // Apply award type filter
    const typeMatch = filter === 'all' || achievement.award_type === filter;

    // Apply search term
    const searchMatch = !searchTerm ||
      achievement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (achievement.description && achievement.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return typeMatch && searchMatch;
  });

  // Sort achievements based on sort option
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.awarded_at) - new Date(a.awarded_at);
    } else if (sortBy === 'oldest') {
      return new Date(a.awarded_at) - new Date(b.awarded_at);
    }
    return 0;
  });

  // Group achievements by year and month for timeline view
  const groupedAchievements = sortedAchievements.reduce((acc, achievement) => {
    if (!achievement.awarded_at) return acc;

    const date = new Date(achievement.awarded_at);
    const year = getYear(date);
    const month = getMonth(date);

    if (!acc[year]) {
      acc[year] = {};
    }

    if (!acc[year][month]) {
      acc[year][month] = [];
    }

    acc[year][month].push(achievement);
    return acc;
  }, {});

  // Handle achievement click to show detail modal
  const handleViewAchievement = (achievement) => {
    setSelectedAchievement(achievement);
    setDefaultModalTab('details');
    setShowDetailModal(true);
  };

  // Handle certificate download button click
  const handleDownloadCertificates = () => {
    if (sortedAchievements.length > 0) {
      setSelectedAchievement(sortedAchievements[0]);
      setDefaultModalTab('certificate');
      setShowDetailModal(true);
    }
  };

  // Award type options for filtering (same as in AchievementsPage)
  const awardTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'promotion', label: 'Promotion' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'recognition', label: 'Recognition' },
    { value: 'performance', label: 'Performance' },
    { value: 'milestone', label: 'Milestone' },
    { value: 'teamwork', label: 'Teamwork' },
    { value: 'achievement', label: 'Achievement' },
    { value: 'special', label: 'Special Award' },
    { value: 'technical', label: 'Technical Excellence' },
    { value: 'other', label: 'Other' }
  ];

  // Format month name
  const getMonthName = (month) => {
    return new Date(0, month).toLocaleString('default', { month: 'long' });
  };

  // Get color class for award type
  const getColorClass = (type) => {
    const color = awardColors[type] || 'blue';
    return {
      bg: `bg-${color}-100`,
      text: `text-${color}-700`,
      border: `border-${color}-200`,
      icon: `text-${color}-500`
    };
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <Link
            to="/achievements"
            className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors mb-2"
          >
            <FiChevronLeft className="mr-1" />
            Back to all achievements
          </Link>
          <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent flex items-center gap-2">
            <FiAward className="text-primary-500" />
            My Achievements & Recognitions
          </h1>
          {userDetails && (
            <p className="text-gray-500 mt-1">
              Viewing achievements for {userDetails.name}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          {stats.total > 0 && (
            <div className="bg-primary-50 px-4 py-3 rounded-lg border border-primary-100 flex flex-col items-center shadow-sm">
              <span className="text-2xl font-bold text-primary-600">{stats.total}</span>
              <span className="text-sm text-gray-600">Total Achievements</span>
            </div>
          )}

          {stats.total > 0 && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-colors"
              onClick={handleDownloadCertificates}
            >
              <FiDownload className="mr-2" />
              Download Certificates
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Stats and filtering */}
      <motion.div
        className="bg-white rounded-xl shadow-sm overflow-hidden mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="p-4 flex flex-wrap gap-3 justify-between items-center">
            <div className="flex flex-wrap gap-2">
              {/* View mode switcher */}
              <div className="inline-flex rounded-md shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm font-medium rounded-l-md ${viewMode === 'grid'
                      ? 'bg-primary-50 text-primary-700 border-primary-200'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    } border`}
                >
                  <FiLayout className="inline-block mr-1" />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`px-3 py-2 text-sm font-medium rounded-r-md ${viewMode === 'timeline'
                      ? 'bg-primary-50 text-primary-700 border-primary-200'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    } border border-l-0`}
                >
                  <FiActivity className="inline-block mr-1" />
                  Timeline
                </button>
              </div>

              {/* Search bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search achievements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Filter dropdown */}
              <div className="relative">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-10 pr-8 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  {awardTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>

              {/* Sort dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-10 pr-8 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
                <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>

              {/* Share to LinkedIn button */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors"
                onClick={() => window.open(`https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=Sync Achievements&organizationName=Sync`, '_blank')}
              >
                <FiLinkedin className="mr-2" />
                Add to LinkedIn
              </motion.button>
            </div>
          </div>

          {/* Type stats */}
          {stats.total > 0 && (
            <div className="px-4 pb-4 flex flex-wrap gap-2">
              {Object.entries(stats.byType).map(([type, count]) => {
                const colorClass = getColorClass(type);
                return (
                  <div
                    key={type}
                    onClick={() => setFilter(type === filter ? 'all' : type)}
                    className={`inline-flex items-center px-3 py-1 rounded-full ${colorClass.bg} ${colorClass.text} ${colorClass.border} border cursor-pointer transition-all ${filter === type ? 'ring-2 ring-offset-1 ring-primary-400' : ''
                      }`}
                  >
                    <span className={`mr-1 ${colorClass.icon}`}>
                      {awardIcons[type] || <FiAward />}
                    </span>
                    <span className="font-medium capitalize">{type}</span>
                    <span className="ml-1 bg-white px-1.5 py-0.5 rounded-full text-xs">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : sortedAchievements.length === 0 ? (
            <div className="py-12 text-center">
              <div className="bg-gray-50 rounded-xl p-8 max-w-md mx-auto">
                <FiInfo className="text-gray-400 h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No achievements found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || filter !== 'all' ?
                    'Try adjusting your search or filter settings.' :
                    'No achievements have been recorded yet for this user.'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Grid View */}
              {viewMode === 'grid' && (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {sortedAchievements.map(achievement => (
                    <motion.div
                      key={achievement.id}
                      variants={itemVariants}
                    >
                      <AchievementCard
                        achievement={achievement}
                        onViewDetails={handleViewAchievement}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Timeline View */}
              {viewMode === 'timeline' && (
                <motion.div
                  className="relative pl-8 max-w-3xl mx-auto"
                  variants={timelineVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {/* Vertical line */}
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                  {Object.entries(groupedAchievements)
                    .sort(([yearA], [yearB]) => sortBy === 'newest' ? yearB - yearA : yearA - yearB)
                    .map(([year, months]) => (
                      <div key={year} className="mb-8">
                        <motion.h3
                          className="text-xl font-bold text-gray-700 mb-4 -ml-8"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {year}
                        </motion.h3>

                        {Object.entries(months)
                          .sort(([monthA], [monthB]) => sortBy === 'newest' ? monthB - monthA : monthA - monthB)
                          .map(([month, monthAchievements]) => (
                            <div key={`${year}-${month}`} className="mb-6">
                              <motion.h4
                                className="text-md font-medium text-gray-600 mb-3 flex items-center"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <FiCalendar className="mr-2 text-primary-500" />
                                {getMonthName(month)} {year}
                              </motion.h4>

                              {monthAchievements.map(achievement => {
                                const colorClass = getColorClass(achievement.award_type);
                                return (
                                  <motion.div
                                    key={achievement.id}
                                    className="relative mb-4"
                                    variants={timelineItemVariants}
                                  >
                                    {/* Circle marker */}
                                    <div className="absolute -left-8 mt-1">
                                      <div className={`${colorClass.bg} ${colorClass.icon} w-6 h-6 rounded-full flex items-center justify-center border ${colorClass.border}`}>
                                        {awardIcons[achievement.award_type] || <FiAward />}
                                      </div>
                                    </div>

                                    {/* Card */}
                                    <div
                                      className={`p-4 rounded-lg border ${colorClass.border} ${colorClass.bg} bg-opacity-50 cursor-pointer hover:shadow-md transition-shadow`}
                                      onClick={() => handleViewAchievement(achievement)}
                                    >
                                      <div className="flex justify-between items-start mb-2">
                                        <h5 className={`font-medium ${colorClass.text}`}>{achievement.title}</h5>
                                        <span className="text-xs text-gray-500">
                                          {format(new Date(achievement.awarded_at), 'MMM d, yyyy')}
                                        </span>
                                      </div>

                                      {achievement.description && (
                                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                          {achievement.description}
                                        </p>
                                      )}

                                      <div className="flex justify-between items-center">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClass.text} bg-white`}>
                                          {achievement.award_type}
                                        </span>
                                        <motion.button
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          className="text-xs text-gray-600 hover:text-primary-600"
                                        >
                                          View details
                                        </motion.button>
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          ))}
                      </div>
                    ))}
                </motion.div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Achievement Detail Modal */}
      <AchievementDetailModal
        isOpen={showDetailModal}
        achievement={selectedAchievement}
        defaultTab={defaultModalTab}
        onClose={() => setShowDetailModal(false)}
      />
    </div>
  );
};

export default UserAchievements; 
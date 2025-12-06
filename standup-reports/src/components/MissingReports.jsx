import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertCircle, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { supabase } from '../supabaseClient';

const MissingReports = ({ date, teamId, companyId, onAvatarClick }) => {
  const [missingReports, setMissingReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [hoveredUserId, setHoveredUserId] = useState(null);

  // Limit to show initially
  const MAX_VISIBLE = 6;

  useEffect(() => {
    if (!teamId || !companyId) return;

    fetchMissingReports();
  }, [date, teamId, companyId]);

  const fetchMissingReports = async () => {
    if (!teamId || !companyId) return;

    setLoading(true);
    try {
      // Get team members
      const { data: teamMembers, error: membersError } = await supabase
        .from('users')
        .select('id, name, avatar_url, team_id')
        .eq('team_id', teamId)
        .eq('company_id', companyId);

      if (membersError) throw membersError;

      // Get submitted reports for the day
      const { data: reports, error: reportsError } = await supabase
        .from('daily_reports')
        .select('user_id')
        .eq('date', date)
        .eq('company_id', companyId);

      if (reportsError) throw reportsError;

      // Get on-leave members for the day
      const today = new Date().toISOString().split('T')[0];
      const { data: leaveData, error: leaveError } = await supabase
        .from('leave_plans')
        .select('user_id')
        .eq('status', 'approved')
        .lte('start_date', today)
        .gte('end_date', today);

      if (leaveError) throw leaveError;

      const submittedIds = reports.map(r => r.user_id);
      const onLeaveIds = (leaveData || []).map(l => l.user_id);

      const missing = (teamMembers || []).filter(member =>
        !submittedIds.includes(member.id) && !onLeaveIds.includes(member.id)
      );

      setMissingReports(missing);
    } catch (error) {
      console.error('Error fetching missing reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || missingReports.length === 0) {
    return null;
  }

  // Determine which members to show based on expanded state
  const visibleMembers = expanded ? missingReports : missingReports.slice(0, MAX_VISIBLE);
  const hasMore = missingReports.length > MAX_VISIBLE;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100 shadow-sm mb-6"
      onMouseLeave={() => setHoveredUserId(null)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
            <FiAlertCircle className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-orange-900 text-sm">
            Missing Reports ({missingReports.length})
          </h3>
        </div>

        {hasMore && (
          <motion.button
            className="flex items-center gap-1 text-orange-700 text-xs font-medium hover:text-orange-900"
            onClick={() => setExpanded(!expanded)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {expanded ? (
              <>
                Show Less <FiChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                +{missingReports.length - MAX_VISIBLE} More <FiChevronDown className="w-3 h-3" />
              </>
            )}
          </motion.button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {visibleMembers.map(member => (
          <motion.div
            key={member.id}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${hoveredUserId === member.id
              ? 'bg-white shadow-md border border-orange-200 scale-105'
              : 'bg-white border border-orange-100'
              }`}
            onMouseEnter={() => setHoveredUserId(member.id)}
            onMouseLeave={() => setHoveredUserId(null)}
            onClick={() => {
              onAvatarClick?.(member.id);
            }}
            whileHover={{ y: -2 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {member.avatar_url ? (
              <img
                src={member.avatar_url}
                alt={member.name}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-bold">
                {member.name[0]}
              </div>
            )}
            <span className={`text-gray-700 truncate max-w-[80px] ${hoveredUserId === member.id ? 'font-medium' : ''}`}>
              {member.name}
            </span>
          </motion.div>
        ))}

        {/* Show "and X more" when collapsed and there are more than MAX_VISIBLE */}
        {!expanded && hasMore && (
          <motion.div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-orange-100 text-xs font-medium text-gray-500"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            +{missingReports.length - MAX_VISIBLE} more
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default MissingReports;
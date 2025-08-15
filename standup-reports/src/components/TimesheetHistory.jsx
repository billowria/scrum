import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { FiClock, FiCheck, FiX, FiEye, FiRefreshCw } from 'react-icons/fi';
import { supabase } from '../supabaseClient';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function TimesheetHistory() {
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [managedTeamIds, setManagedTeamIds] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selected, setSelected] = useState(null); // submission for modal view
  const [timesheetDetail, setTimesheetDetail] = useState({ loading: false, entries: [] });
  const [error, setError] = useState(null);

  const fetchManagedTeams = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data: teamsData, error: rpcErr } = await supabase.rpc('get_managed_team_ids', { manager_id_param: user.id });
      if (rpcErr) throw rpcErr;
      return (teamsData || []).map(t => t.team_id);
    } catch (e) {
      console.error('Error fetching managed teams', e);
      return [];
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const teamIds = managedTeamIds.length ? managedTeamIds : await fetchManagedTeams();
      if (!managedTeamIds.length) setManagedTeamIds(teamIds);

      let query = supabase
        .from('timesheet_submissions')
        .select(`
          id, user_id, start_date, end_date, status, created_at,
          users:user_id ( id, name, team_id, teams:team_id ( id, name ) )
        `)
        .order('created_at', { ascending: false });

      if (teamIds.length > 0) {
        // Filter only submissions from managed teams
        query = query.filter('users.team_id', 'in', `(${teamIds.join(',')})`);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      const { data, error: qErr } = await query;
      if (qErr) throw qErr;
      setSubmissions(data || []);
    } catch (e) {
      console.error('Error fetching timesheet submissions:', e);
      setError(e.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleAction = async (id, action) => {
    try {
      const updates = {
        status: action,
        updated_at: new Date().toISOString(),
      };
      const { error: upErr } = await supabase
        .from('timesheet_submissions')
        .update(updates)
        .eq('id', id);
      if (upErr) throw upErr;
      await fetchSubmissions();
    } catch (e) {
      console.error(`Error ${action} submission:`, e);
    }
  };

  const openDetail = async (submission) => {
    setSelected(submission);
    setTimesheetDetail({ loading: true, entries: [] });
    try {
      const { data, error: tsErr } = await supabase
        .from('timesheets')
        .select('id, date, hours, notes, project_id, projects:project_id ( id, name )')
        .eq('submission_id', submission.id)
        .order('date', { ascending: true });
      if (tsErr) throw tsErr;
      setTimesheetDetail({ loading: false, entries: data || [] });
    } catch (e) {
      console.error('Error loading timesheet details:', e);
      setTimesheetDetail({ loading: false, entries: [] });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Timesheet Submissions</h2>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['all','pending','approved','rejected'].map(s => (
              <button
                key={s}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${statusFilter === s ? 'bg-white shadow-sm text-primary-700' : 'text-gray-600 hover:text-gray-800'}`}
                onClick={() => setStatusFilter(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:text-primary-600" onClick={fetchSubmissions}>
            <FiRefreshCw />
          </motion.button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">{error}</div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No submissions found</div>
      ) : (
        <div className="overflow-x-auto">
          <motion.table className="min-w-full divide-y divide-gray-200" variants={containerVariants} initial="hidden" animate="visible">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <AnimatePresence>
                {submissions.map((s) => {
                  const isPending = s.status === 'pending';
                  return (
                    <motion.tr key={s.id} variants={itemVariants} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                            {s.users?.name?.charAt(0) || '?'}
                          </div>
                          <div className="ml-2">
                            <div className="text-sm font-medium text-gray-900">{s.users?.name || 'Unknown'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{s.users?.teams?.name || '-'}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {format(parseISO(s.start_date), 'MMM dd, yyyy')} - {format(parseISO(s.end_date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {s.created_at ? format(parseISO(s.created_at), 'MMM dd, yyyy h:mm a') : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                          isPending ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : s.status === 'approved' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {isPending ? (<><FiClock className="mr-1" />Pending</>) : s.status === 'approved' ? (<><FiCheck className="mr-1" />Approved</>) : (<><FiX className="mr-1" />Rejected</>)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex gap-2">
                          <motion.button className="p-1.5 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openDetail(s)} title="View">
                            <FiEye />
                          </motion.button>
                          {isPending && (
                            <>
                              <motion.button className="p-1.5 rounded-md bg-green-100 text-green-700 hover:bg-green-200" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleAction(s.id, 'approved')} title="Approve">
                                <FiCheck />
                              </motion.button>
                              <motion.button className="p-1.5 rounded-md bg-red-100 text-red-700 hover:bg-red-200" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleAction(s.id, 'rejected')} title="Reject">
                                <FiX />
                              </motion.button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </motion.table>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)}>
            <motion.div className="absolute inset-0 bg-black/60" />
            <motion.div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">Timesheet Details</div>
                  <div className="text-sm text-gray-600">{selected.users?.name} • {format(parseISO(selected.start_date), 'MMM dd')} - {format(parseISO(selected.end_date), 'MMM dd, yyyy')}</div>
                </div>
                <button className="p-2 text-gray-500 hover:text-gray-700" onClick={() => setSelected(null)}>
                  <FiX />
                </button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {timesheetDetail.loading ? (
                  <div className="flex items-center justify-center py-12 text-gray-500">Loading…</div>
                ) : timesheetDetail.entries.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">No entries in this range</div>
                ) : (
                  <div className="space-y-2">
                    {timesheetDetail.entries.map((e) => (
                      <div key={e.id} className="flex items-center justify-between px-3 py-2 rounded-lg border bg-gray-50">
                        <div className="text-sm text-gray-700">{format(parseISO(e.date), 'EEE, MMM dd')}</div>
                        <div className="text-sm text-gray-700">{e.projects?.name || 'Unassigned'}</div>
                        <div className="text-sm font-medium text-gray-900">{Number(e.hours).toFixed(2)} h</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



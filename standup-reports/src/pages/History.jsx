import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function History() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    // Set default date range to last 7 days
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
    
    fetchTeams();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchReports();
    }
  }, [startDate, endDate, selectedTeam]);

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

  const fetchReports = async () => {
    if (!startDate || !endDate) return;
    
    setLoading(true);
    setError(null);

    try {
      // Query to get reports within date range with user and team information
      let query = supabase
        .from('daily_reports')
        .select(`
          id, date, yesterday, today, blockers, created_at,
          users:user_id (id, name, team_id, teams:team_id (id, name))
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      setReports(data || []);
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

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Report History</h1>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-medium mb-3">Filters</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="start-date" className="block text-sm text-gray-600 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              max={endDate}
            />
          </div>
          
          <div>
            <label htmlFor="end-date" className="block text-sm text-gray-600 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              min={startDate}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div>
            <label htmlFor="team-filter" className="block text-sm text-gray-600 mb-1">
              Team
            </label>
            <select
              id="team-filter"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full px-3 py-2 border rounded"
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

      {/* Reports */}
      {loading ? (
        <div className="text-center py-8">Loading reports...</div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>
      ) : Object.keys(reportsByDate).length === 0 ? (
        <div className="bg-yellow-50 text-yellow-700 p-6 rounded text-center">
          <p className="font-medium">No reports found for the selected criteria.</p>
          <p className="text-sm mt-1">Try adjusting your filters or date range.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(reportsByDate).map(([date, dateReports]) => (
            <div key={date} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="font-medium">{formatDate(date)}</h3>
              </div>
              
              <div className="divide-y">
                {dateReports.map((report) => (
                  <div key={report.id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold">{report.users?.name || 'Unknown User'}</h4>
                        <p className="text-sm text-gray-500">
                          Team: {report.users?.teams?.name || 'Unassigned'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid gap-4">
                      <div>
                        <h5 className="font-medium text-gray-700 mb-1">Yesterday:</h5>
                        <p className="text-gray-800 whitespace-pre-line">{report.yesterday || 'No update provided'}</p>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-gray-700 mb-1">Today:</h5>
                        <p className="text-gray-800 whitespace-pre-line">{report.today || 'No update provided'}</p>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-gray-700 mb-1">Blockers:</h5>
                        {report.blockers ? (
                          <p className="text-red-600 whitespace-pre-line">{report.blockers}</p>
                        ) : (
                          <p className="text-green-600">No blockers reported</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Export button */}
      {filteredReports.length > 0 && (
        <div className="mt-6 flex justify-end">
          <button
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
            className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
          >
            Export to CSV
          </button>
        </div>
      )}
    </div>
  );
}

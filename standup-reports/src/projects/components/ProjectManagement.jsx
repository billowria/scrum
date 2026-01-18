import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFolder, FiUsers, FiCalendar, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import Avatar from '../../components/shared/Avatar';
import { supabase } from '../supabaseClient';
import { notifyProjectUpdate } from '../utils/notificationHelper';
import { useCompany } from '../../contexts/CompanyContext';

export default function ProjectManagement({ selectedProjectId, onClose }) {
  const { currentCompany } = useCompany();
  const [projects, setProjects] = useState([]);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [projectForm, setProjectForm] = useState({
    id: null,
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'active'
  });
  const [createProjectLoading, setCreateProjectLoading] = useState(false);
  const [createProjectError, setCreateProjectError] = useState('');
  const [selectedProjectForAssignment, setSelectedProjectForAssignment] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentError, setAssignmentError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAssignedMembersModal, setShowAssignedMembersModal] = useState(false);
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [selectedProjectForMembers, setSelectedProjectForMembers] = useState(null);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setCurrentUser(null);
          return;
        }
        const { data, error } = await supabase
          .from('users')
          .select('id, name, role, team_id, manager_id, avatar_url')
          .eq('id', user.id)
          .single();
        if (error) throw error;
        setCurrentUser(data);
      } catch (err) {
        console.error('Error fetching current user:', err);
        setCurrentUser(null);
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch projects
  const fetchProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: currentUserData } = await supabase.from('users').select('role, team_id').eq('id', user.id).single();

      let query = supabase
        .from('projects')
        .select('*, project_assignments(user_id, users(id, name, avatar_url))')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create or update project
  const handleSaveProject = async (e) => {
    e.preventDefault();
    setCreateProjectLoading(true);
    setCreateProjectError('');
    try {
      if (!projectForm.name) {
        setCreateProjectError('Project name is required.');
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      const projectData = {
        name: projectForm.name,
        description: projectForm.description,
        start_date: projectForm.start_date || null,
        end_date: projectForm.end_date || null,
        status: projectForm.status,
      };
      let isUpdate = !!projectForm.id;

      if (projectForm.id) {
        const { error } = await supabase.from('projects').update(projectData).eq('id', projectForm.id);
        if (error) throw error;
      } else {
        projectData.created_by = user.id;
        const { error } = await supabase.from('projects').insert(projectData);
        if (error) throw error;
      }

      // Send notification about project creation/update
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('team_id')
          .eq('id', user.id)
          .single();

        if (userData?.team_id) {
          const message = isUpdate
            ? `Project "${projectForm.name}" has been updated.`
            : `New project "${projectForm.name}" has been created.`;

          await notifyProjectUpdate(
            projectForm.name,
            message,
            userData.team_id,
            user.id
          );
        }
      } catch (notificationError) {
        console.error('Error sending project notification:', notificationError);
        // Continue even if notification fails
      }

      setShowCreateProjectModal(false);
      setProjectForm({ id: null, name: '', description: '', start_date: '', end_date: '', status: 'active' });
      fetchProjects();
    } catch (err) {
      setCreateProjectError('Failed to save project.');
    } finally {
      setCreateProjectLoading(false);
    }
  };

  // Fetch available users (only unassigned users)
  const fetchAvailableUsers = async (projectId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !currentUser) return;

      // Get all users in the same team
      const { data: allUsers, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, role, avatar_url')
        .eq('team_id', currentUser.team_id)
        .eq('company_id', currentCompany?.id);

      if (usersError) throw usersError;

      // Get already assigned users for this project
      const { data: assignedUsers, error: assignedError } = await supabase
        .from('project_assignments')
        .select('user_id')
        .eq('project_id', projectId);

      if (assignedError) throw assignedError;

      // Filter out already assigned users
      const assignedUserIds = assignedUsers.map(assignment => assignment.user_id);
      const availableUsers = allUsers.filter(user => !assignedUserIds.includes(user.id));

      setAvailableUsers(availableUsers || []);
    } catch (err) {
      console.error('Error fetching available users:', err);
    }
  };

  // Fetch assigned members for a project
  const fetchAssignedMembers = async (projectId) => {
    try {
      const { data, error } = await supabase
        .from('project_assignments')
        .select(`
          user_id,
          role_in_project,
          users (
            id,
            name,
            email,
            role
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      setAssignedMembers(data || []);
    } catch (err) {
      console.error('Error fetching assigned members:', err);
    }
  };

  // Assign project
  const handleAssignProject = async (userId) => {
    setAssignmentLoading(true);
    setAssignmentError('');
    try {
      // Check if user is already assigned to this project
      const { data: existingAssignment, error: checkError } = await supabase
        .from('project_assignments')
        .select('id')
        .eq('project_id', selectedProjectForAssignment.id)
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw checkError;
      }

      if (existingAssignment) {
        setAssignmentError('User is already assigned to this project');
        return;
      }

      const { error } = await supabase.from('project_assignments').insert({
        project_id: selectedProjectForAssignment.id,
        user_id: userId,
        role_in_project: 'member'
      });
      if (error) throw error;
      setShowAssignmentModal(false);
      fetchProjects();
      // Refresh available users list
      fetchAvailableUsers(selectedProjectForAssignment.id);
    } catch (err) {
      console.error('Error assigning project:', err);
      if (err.code === '23505') {
        setAssignmentError('User is already assigned to this project');
      } else {
        setAssignmentError('Failed to assign user to project');
      }
    } finally {
      setAssignmentLoading(false);
    }
  };

  // Remove user from project
  const handleRemoveUser = async (userId) => {
    try {
      const { error } = await supabase
        .from('project_assignments')
        .delete()
        .eq('project_id', selectedProjectForMembers.id)
        .eq('user_id', userId);

      if (error) throw error;
      fetchAssignedMembers(selectedProjectForMembers.id);
      fetchProjects(); // Refresh project list to update member count
    } catch (err) {
      console.error('Error removing user from project:', err);
    }
  };

  // Load data
  useEffect(() => {
    if (currentUser) {
      fetchProjects();
    }
  }, [currentUser]);

  // Edit project
  const handleEditProject = (project) => {
    setProjectForm({
      id: project.id,
      name: project.name,
      description: project.description,
      start_date: project.start_date,
      end_date: project.end_date,
      status: project.status
    });
    setShowCreateProjectModal(true);
  };

  // Delete project
  const handleDeleteProject = async (projectId) => {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw error;
      fetchProjects();
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  // View assigned members
  const handleViewMembers = (project) => {
    setSelectedProjectForMembers(project);
    fetchAssignedMembers(project.id);
    setShowAssignedMembersModal(true);
  };

  // Handle assignment modal open
  const handleOpenAssignmentModal = (project) => {
    setSelectedProjectForAssignment(project);
    fetchAvailableUsers(project.id);
    setShowAssignmentModal(true);
  };

  return (
    <div className="w-full h-full">
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <FiFolder className="text-indigo-600" size={24} />
              All Projects
            </h1>
            <p className="text-gray-600 mt-1 text-base">
              Manage your projects and assign team members.
            </p>
          </div>
          <motion.button
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-shadow"
            onClick={() => {
              setProjectForm({ id: null, name: '', description: '', start_date: '', end_date: '', status: 'active' });
              setShowCreateProjectModal(true);
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <FiPlus size={18} /> Create Project
          </motion.button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {loading ? (
            <div className="col-span-full flex justify-center items-center h-40">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"
              />
            </div>
          ) : projects.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-xl shadow">
              <FiFolder className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Projects Found</h3>
              <p className="text-gray-600 mb-6">Start by creating your first project.</p>
            </div>
          ) : (
            projects.map(project => (
              <motion.div
                key={project.id}
                className="bg-white rounded-lg shadow-md p-4 flex flex-col gap-3 hover:shadow-xl transition-shadow"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                      <FiFolder className="text-indigo-600" />
                      {project.name}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{project.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${project.status === 'active' ? 'bg-green-100 text-green-800' :
                    project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                    {project.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><FiCalendar /> {project.start_date || 'N/A'}</span>
                  <span className="flex items-center gap-1"><FiCalendar /> {project.end_date || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FiUsers />
                  {project.project_assignments?.length || 0} members
                </div>
                <div className="flex gap-2 mt-auto pt-2 border-t">
                  <button
                    className="flex-1 py-1.5 rounded-lg bg-indigo-100 text-indigo-800 font-medium text-xs hover:bg-indigo-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenAssignmentModal(project);
                    }}
                  >
                    Assign
                  </button>
                  <button
                    className="p-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewMembers(project);
                    }}
                  >
                    <FiUsers />
                  </button>
                  <button
                    className="p-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditProject(project);
                    }}
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id);
                    }}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Create/Edit Project Modal */}
        <AnimatePresence>
          {showCreateProjectModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl p-6 w-full max-w-md"
              >
                <h2 className="text-xl font-bold mb-4">{projectForm.id ? 'Edit Project' : 'Create Project'}</h2>
                <form onSubmit={handleSaveProject}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                        value={projectForm.name}
                        onChange={e => setProjectForm({ ...projectForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                        value={projectForm.description}
                        onChange={e => setProjectForm({ ...projectForm, description: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                          type="date"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                          value={projectForm.start_date}
                          onChange={e => setProjectForm({ ...projectForm, start_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                          type="date"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                          value={projectForm.end_date}
                          onChange={e => setProjectForm({ ...projectForm, end_date: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                        value={projectForm.status}
                        onChange={e => setProjectForm({ ...projectForm, status: e.target.value })}
                      >
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>
                  {createProjectError && <p className="text-red-500 text-sm mt-2">{createProjectError}</p>}
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                      onClick={() => setShowCreateProjectModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                      disabled={createProjectLoading}
                    >
                      {createProjectLoading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Assignment Modal */}
        <AnimatePresence>
          {showAssignmentModal && selectedProjectForAssignment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl p-6 w-full max-w-md"
              >
                <h2 className="text-xl font-bold mb-4">Assign Members to {selectedProjectForAssignment.name}</h2>
                {assignmentError && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                    {assignmentError}
                  </div>
                )}
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {availableUsers.map(user => (
                    <div key={user.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar user={user} size="sm" />
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{user.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      <button
                        className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        onClick={() => handleAssignProject(user.id)}
                        disabled={assignmentLoading}
                      >
                        {assignmentLoading ? 'Assigning...' : 'Assign'}
                      </button>
                    </div>
                  ))}
                  {availableUsers.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No available users.</p>
                  )}
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                    onClick={() => setShowAssignmentModal(false)}
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Assigned Members Modal */}
        <AnimatePresence>
          {showAssignedMembersModal && selectedProjectForMembers && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl p-6 w-full max-w-2xl"
              >
                <h2 className="text-xl font-bold mb-4">Members Assigned to {selectedProjectForMembers.name}</h2>
                <div className="space-y-4 max-h-full overflow-y-auto">
                  {assignedMembers.map(assignment => (
                    <div key={assignment.user_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar user={assignment.users} size="sm" />
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{assignment.users.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{assignment.users.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${assignment.role_in_project === 'manager' ? 'bg-purple-100 text-purple-800' :
                          assignment.role_in_project === 'admin' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                          {assignment.role_in_project}
                        </span>
                        <button
                          className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-xs"
                          onClick={() => handleRemoveUser(assignment.user_id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  {assignedMembers.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No members assigned yet.</p>
                  )}
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                    onClick={() => setShowAssignedMembersModal(false)}
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

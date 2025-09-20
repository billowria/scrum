import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiTarget, FiCalendar, FiCheck } from 'react-icons/fi';
import { supabase } from '../supabaseClient';
import { format } from 'date-fns';

const modalVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 50 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  },
  exit: { opacity: 0, scale: 0.8, y: 50, transition: { duration: 0.2 } }
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

export default function SprintAssignmentModal({ isOpen, onClose, task, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [selectedSprintId, setSelectedSprintId] = useState(task?.sprint_id || '');
  const [projectId, setProjectId] = useState(task?.project_id || '');
  const [projects, setProjects] = useState([]);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name')
          .order('name', { ascending: true });
          
        if (error) throw error;
        setProjects(data || []);
        
        // Set initial project ID if task has one
        if (task?.project_id) {
          setProjectId(task.project_id);
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Failed to load projects');
      }
    };
    
    fetchProjects();
  }, [task]);

  // Fetch sprints based on selected project
  useEffect(() => {
    const fetchSprints = async () => {
      if (!projectId) {
        setSprints([]);
        return;
      }
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('sprints')
          .select('id, name, start_date, end_date, status')
          .eq('project_id', projectId)
          .order('start_date', { ascending: false });
          
        if (error) throw error;
        setSprints(data || []);
        
        // If task has a sprint_id that's not in the current sprints, reset it
        if (selectedSprintId && !data.some(sprint => sprint.id === selectedSprintId)) {
          setSelectedSprintId('');
        }
      } catch (err) {
        console.error('Error fetching sprints:', err);
        setError('Failed to load sprints');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSprints();
  }, [projectId, selectedSprintId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Get existing metadata or initialize empty object
      const { data: taskData } = await supabase
        .from('tasks')
        .select('metadata')
        .eq('id', task.id)
        .single();
        
      const existingMetadata = taskData?.metadata || {};
      
      // Update task with project_id and metadata including sprint_id
      const { error } = await supabase
        .from('tasks')
        .update({ 
          project_id: projectId || null,
          metadata: {
            ...existingMetadata,
            sprint_id: selectedSprintId
          }
        })
        .eq('id', task.id);
        
      if (error) throw error;
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error assigning sprint:', err);
      setError('Failed to assign sprint to task');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <motion.div 
          className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center">
              <FiTarget className="mr-2" />
              Assign to Sprint
            </h2>
            <button 
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
          
          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
                {error}
              </div>
            )}
            
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 mb-2">Task</h3>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-medium">{task?.title}</p>
                <p className="text-sm text-gray-600 mt-1">{task?.description}</p>
              </div>
            </div>
            
            {/* Project Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
              <div className="relative">
                <select
                  value={projectId}
                  onChange={(e) => {
                    setProjectId(e.target.value);
                    setSelectedSprintId(''); // Reset sprint when project changes
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
                  disabled={loading}
                >
                  <option value="">Select a project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Sprint Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Sprint</label>
              <div className="relative">
                <select
                  value={selectedSprintId}
                  onChange={(e) => setSelectedSprintId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
                  disabled={loading || !projectId || sprints.length === 0}
                >
                  <option value="">No sprint</option>
                  {sprints.map(sprint => (
                    <option key={sprint.id} value={sprint.id}>
                      {sprint.name} 
                      {sprint.start_date && sprint.end_date && (
                        ` (${format(new Date(sprint.start_date), 'MMM d')} - ${format(new Date(sprint.end_date), 'MMM d')})`
                      )}
                      {sprint.status ? ` - ${sprint.status}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {projectId && sprints.length === 0 && (
                <p className="mt-1 text-sm text-amber-600">No sprints available for this project</p>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Assigning...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <FiCheck className="mr-2" />
                    Assign Sprint
                  </span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
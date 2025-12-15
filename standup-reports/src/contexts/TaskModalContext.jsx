import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { isShortId, shortIdToUuidPrefix } from '../utils/taskIdUtils';
import TaskDetailView from '../components/tasks/TaskDetailView';
import { AnimatePresence } from 'framer-motion';

const TaskModalContext = createContext();

export const useTaskModal = () => {
    const context = useContext(TaskModalContext);
    if (!context) {
        throw new Error('useTaskModal must be used within a TaskModalProvider');
    }
    return context;
};

export const TaskModalProvider = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [modalProps, setModalProps] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const closeTask = useCallback(() => {
        setIsOpen(false);
        // Don't clear ID immediately to allow animation to finish
        setTimeout(() => {
            setSelectedTaskId(null);
            setModalProps({});
            setError(null);
        }, 300);
    }, []);

    const openTask = useCallback(async (id, additionalProps = {}) => {
        if (!id) return;
        setLoading(true);
        setError(null);

        try {
            let finalId = id;

            // Handle Short ID resolution
            if (isShortId(id)) {
                const prefix = shortIdToUuidPrefix(id);

                // Client-side filtering strategy (same as TasksPage)
                const { data: allTaskIds, error: fetchError } = await supabase
                    .from('tasks')
                    .select('id')
                    .limit(1000); // Reasonable limit for most use cases

                if (fetchError) throw fetchError;

                const matchingTask = allTaskIds.find(t =>
                    t.id.toLowerCase().startsWith(prefix.toLowerCase())
                );

                if (matchingTask) {
                    finalId = matchingTask.id;
                } else {
                    // If not found in recent 1000, try a more specific query just in case (optional, but good backup)
                    // For now, assume not found
                    throw new Error(`Task #${id} not found.`);
                }
            }

            setSelectedTaskId(finalId);
            setModalProps(additionalProps);
            setIsOpen(true);
        } catch (err) {
            console.error('Error opening task:', err);
            setError(err.message);
            // Optional: Show error toast here via additionalProps.onError or global toast
        } finally {
            setLoading(false);
        }
    }, []);

    // Update handler wrapper - ensures modal props onUpdate is called but also handles global refresh if needed
    const handleUpdate = useCallback(() => {
        if (modalProps.onUpdate) {
            modalProps.onUpdate();
        }
    }, [modalProps]);

    return (
        <TaskModalContext.Provider value={{ openTask, closeTask, isOpen, loading, error }}>
            {children}

            {/* Global Modal Instance */}
            <AnimatePresence>
                {isOpen && selectedTaskId && (
                    <TaskDetailView
                        key={`global-task-detail-${selectedTaskId}`}
                        isOpen={isOpen}
                        onClose={closeTask}
                        taskId={selectedTaskId}
                        onUpdate={handleUpdate}
                        currentUser={modalProps.currentUser}
                        userRole={modalProps.userRole}
                    // Pass other props if needed
                    />
                )}
            </AnimatePresence>
        </TaskModalContext.Provider>
    );
};

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSprintStatus, getSprintMetrics, calculateSprintProgress, getHealthColor } from '../../utils/sprintUtils';
import SprintCard from './SprintCard';

const SprintGridView = ({
    sprints,
    getSprintTasks,
    onSelectSprint,
    onEditSprint,
    onDeleteSprint,
    onStartSprint,
    onCompleteSprint,
    selectedSprintId,
    userRole
}) => {
    return (
        <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.08 }
                }
            }}
            initial="hidden"
            animate="visible"
        >
            <AnimatePresence mode="popLayout">
                {sprints.map((sprint, index) => {
                    const sprintTasks = getSprintTasks(sprint.id);
                    const status = getSprintStatus(sprint);
                    const metrics = getSprintMetrics(sprint, sprintTasks);
                    const progress = calculateSprintProgress(sprint);
                    const healthColor = getHealthColor(metrics.health);

                    return (
                        <motion.div
                            key={sprint.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                        >
                            <SprintCard
                                sprint={sprint}
                                status={status}
                                metrics={metrics}
                                progress={progress}
                                healthColor={healthColor}
                                isSelected={selectedSprintId === sprint.id}
                                onSelect={() => onSelectSprint && onSelectSprint(sprint)}
                                onEdit={() => onEditSprint && onEditSprint(sprint)}
                                onDelete={() => onDeleteSprint && onDeleteSprint(sprint.id)}
                                onStart={() => onStartSprint && onStartSprint(sprint.id)}
                                onComplete={() => onCompleteSprint && onCompleteSprint(sprint.id)}
                                userRole={userRole}
                                index={index}
                            />
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </motion.div>
    );
};

export default SprintGridView;

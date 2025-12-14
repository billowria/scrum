import React from 'react';
import { motion } from 'framer-motion';
import {
    FiFolder,
    FiTarget,
    FiCheckCircle,
    FiChevronRight,
    FiTrendingUp,
    FiActivity
} from 'react-icons/fi';
import { getSprintStatus } from '../../utils/sprintUtils';

const ProjectListView = ({
    projects,
    sprints,
    getSprintTasks,
    setSelectedProjectId
}) => {
    const getProjectGradient = (index) => {
        const gradients = [
            'from-blue-500 to-cyan-500',
            'from-purple-500 to-pink-500',
            'from-orange-500 to-red-500',
            'from-emerald-500 to-teal-500',
            'from-indigo-500 to-purple-500',
            'from-rose-500 to-pink-500',
        ];
        return gradients[index % gradients.length];
    };

    return (
        <div className="space-y-4">
            {/* Table Header */}
            <div className="bg-white/60 backdrop-blur-xl px-6 py-4 rounded-2xl border border-gray-200/50 shadow-sm">
                <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700">
                    <div className="col-span-4">Project Name</div>
                    <div className="col-span-2 text-center">Sprints</div>
                    <div className="col-span-2 text-center">Tasks</div>
                    <div className="col-span-3 text-center">Completion</div>
                    <div className="col-span-1 text-center">Action</div>
                </div>
            </div>

            {/* List Body */}
            <div className="space-y-3">
                {projects.map((project, index) => {
                    const projectSprints = sprints.filter(s => s.project_id === project.id);
                    const sprintCount = projectSprints.length;
                    const activeSprints = projectSprints.filter(s => getSprintStatus(s) === 'Active').length;
                    const totalTasks = projectSprints.reduce((total, sprint) => {
                        return total + getSprintTasks(sprint.id).length;
                    }, 0);
                    const completedTasks = projectSprints.reduce((total, sprint) => {
                        const sprintTasks = getSprintTasks(sprint.id);
                        return total + sprintTasks.filter(task => task.status === 'Completed').length;
                    }, 0);
                    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                    const gradient = getProjectGradient(index);

                    return (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group relative bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 hover:border-purple-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer overflow-hidden"
                            onClick={() => setSelectedProjectId(project.id)}
                        >
                            {/* Hover Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                            {/* Left Accent Bar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${gradient}`} />

                            <div className="relative grid grid-cols-12 gap-4 px-6 py-4 items-center pl-8">
                                {/* Project Name */}
                                <div className="col-span-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg bg-gradient-to-r ${gradient} shadow-md`}>
                                            <FiFolder className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 truncate text-lg group-hover:text-purple-700 transition-colors">
                                                {project.name}
                                            </h3>
                                            {activeSprints > 0 ? (
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                    </span>
                                                    <span className="text-xs text-emerald-600 font-semibold">
                                                        {activeSprints} Active Sprint{activeSprints !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-gray-400 mt-1 font-medium">No active sprints</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Sprints Count */}
                                <div className="col-span-2 flex justify-center">
                                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-blue-50/50 border border-blue-100 w-24">
                                        <span className="text-lg font-bold text-blue-700">{sprintCount}</span>
                                        <span className="text-xs text-blue-600 font-medium">Sprints</span>
                                    </div>
                                </div>

                                {/* Tasks Count */}
                                <div className="col-span-2 flex justify-center">
                                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-purple-50/50 border border-purple-100 w-24">
                                        <span className="text-lg font-bold text-purple-700">{totalTasks}</span>
                                        <span className="text-xs text-purple-600 font-medium">Tasks</span>
                                    </div>
                                </div>

                                {/* Completion Percentage */}
                                <div className="col-span-3">
                                    <div className="flex flex-col gap-2 px-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                                                <FiActivity className="w-4 h-4 text-gray-400" />
                                                Progress
                                            </span>
                                            <span className="font-bold text-gray-900">{completionPercentage}%</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                                            <motion.div
                                                className={`h-full bg-gradient-to-r ${gradient} rounded-full`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${completionPercentage}%` }}
                                                transition={{ duration: 0.8, ease: "easeOut" }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Action */}
                                <div className="col-span-1 flex justify-center">
                                    <motion.button
                                        className="p-2 bg-white rounded-full text-gray-400 hover:text-purple-600 hover:bg-purple-50 shadow-sm border border-gray-200 transition-all"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <FiChevronRight className="w-5 h-5" />
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Empty State */}
            {projects.length === 0 && (
                <div className="text-center py-12 bg-white/50 backdrop-blur-xl rounded-2xl border border-gray-200 border-dashed">
                    <FiFolder className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 font-medium">No projects found</p>
                </div>
            )}
        </div>
    );
};

export default ProjectListView;

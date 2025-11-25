import React from 'react';
import { motion } from 'framer-motion';
import {
    FiFolder,
    FiTarget,
    FiCheckCircle,
    FiClock,
    FiChevronRight
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
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
                <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700">
                    <div className="col-span-4">Project Name</div>
                    <div className="col-span-2 text-center">Sprints</div>
                    <div className="col-span-2 text-center">Tasks</div>
                    <div className="col-span-2 text-center">Completion</div>
                    <div className="col-span-2 text-center">Status</div>
                </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
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

                    return (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/30 transition-all duration-200 cursor-pointer"
                            onClick={() => setSelectedProjectId(project.id)}
                        >
                            <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
                                {/* Project Name */}
                                <div className="col-span-4 flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-gradient-to-r ${getProjectGradient(index)} shadow-md`}>
                                        <FiFolder className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                                            {project.name}
                                        </h3>
                                        {activeSprints > 0 && (
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                                <span className="text-xs text-emerald-600 font-medium">
                                                    {activeSprints} Active
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Sprints Count */}
                                <div className="col-span-2 text-center">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg">
                                        <FiTarget className="w-3.5 h-3.5 text-blue-600" />
                                        <span className="text-sm font-bold text-blue-700">{sprintCount}</span>
                                    </div>
                                </div>

                                {/* Tasks Count */}
                                <div className="col-span-2 text-center">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg">
                                        <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                        <span className="text-sm font-bold text-emerald-700">{completedTasks}/{totalTasks}</span>
                                    </div>
                                </div>

                                {/* Completion Percentage */}
                                <div className="col-span-2">
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="text-sm font-bold text-gray-900">{completionPercentage}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <motion.div
                                                className={`h-full bg-gradient-to-r ${getProjectGradient(index)} rounded-full`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${completionPercentage}%` }}
                                                transition={{ duration: 0.8, ease: "easeOut" }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Status/Action */}
                                <div className="col-span-2 flex items-center justify-center">
                                    <motion.button
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-shadow"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <span>View</span>
                                        <FiChevronRight className="w-4 h-4" />
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Empty State */}
            {projects.length === 0 && (
                <div className="text-center py-12">
                    <FiFolder className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 font-medium">No projects found</p>
                </div>
            )}
        </div>
    );
};

export default ProjectListView;

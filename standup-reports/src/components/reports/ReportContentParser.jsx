import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import TaskDetailView from '../tasks/TaskDetailView';
import UserProfileInfoModal from '../UserProfileInfoModal';

const ReportContentParser = ({ content, mode = 'view' }) => {
    const [parsedContent, setParsedContent] = useState('');
    const [tasks, setTasks] = useState({});
    const [users, setUsers] = useState({});
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null);

    useEffect(() => {
        parseContent();
    }, [content]);

    const parseContent = async () => {
        if (!content) {
            setParsedContent('');
            return;
        }

        // Extract task IDs: #TASK-123
        const taskMatches = content.matchAll(/#TASK-(\d+)/g);
        const taskIds = [...taskMatches].map(match => match[1]);

        // Extract user IDs: @uuid
        const userMatches = content.matchAll(/@([a-f0-9-]{36})/g);
        const userIds = [...userMatches].map(match => match[1]);

        // Fetch tasks
        if (taskIds.length > 0) {
            const { data: tasksData } = await supabase
                .from('tasks')
                .select('id, title')
                .in('id', taskIds);

            const tasksMap = {};
            (tasksData || []).forEach(task => {
                tasksMap[task.id] = task;
            });
            setTasks(tasksMap);
        }

        // Fetch users
        if (userIds.length > 0) {
            const { data: usersData } = await supabase
                .from('users')
                .select('id, name, avatar_url')
                .in('id', userIds);

            const usersMap = {};
            (usersData || []).forEach(user => {
                usersMap[user.id] = user;
            });
            setUsers(usersMap);
        }

        // Parse and replace
        let parsed = content;

        // Replace tasks
        parsed = parsed.replace(/#TASK-(\d+)/g, (match, taskId) => {
            if (mode === 'editor') {
                return `<span class="task-ref text-indigo-600 font-medium cursor-pointer hover:underline" data-task-id="${taskId}">${match}</span>`;
            } else {
                return `<span class="task-ref text-indigo-600 font-medium cursor-pointer hover:underline decoration-indigo-300 underline-offset-2" data-task-id="${taskId}">${match}</span>`;
            }
        });

        // Replace mentions
        parsed = parsed.replace(/@([a-f0-9-]{36})/g, (match, userId) => {
            const user = users[userId];
            if (mode === 'editor') {
                return `<span class="mention-ref text-blue-600 font-medium bg-blue-50 px-1 rounded cursor-pointer" data-user-id="${userId}">@${user?.name || 'User'}</span>`;
            } else {
                // For standup reports view - with avatar
                return `<span class="mention-ref inline-flex items-center gap-1 text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full cursor-pointer hover:bg-blue-100 transition-colors" data-user-id="${userId}">
          ${user?.avatar_url ? `<img src="${user.avatar_url}" class="w-4 h-4 rounded-full" />` : ''}
          <span>@${user?.name || 'User'}</span>
        </span>`;
            }
        });

        setParsedContent(parsed);
    };

    const handleClick = (e) => {
        const target = e.target.closest('[data-task-id], [data-user-id]');
        if (!target) return;

        if (target.dataset.taskId) {
            setSelectedTaskId(target.dataset.taskId);
        } else if (target.dataset.userId) {
            setSelectedUserId(target.dataset.userId);
        }
    };

    return (
        <>
            <div
                onClick={handleClick}
                dangerouslySetInnerHTML={{ __html: parsedContent }}
            />

            {selectedTaskId && (
                <TaskDetailView
                    taskId={selectedTaskId}
                    isOpen={!!selectedTaskId}
                    onClose={() => setSelectedTaskId(null)}
                />
            )}

            {selectedUserId && (
                <UserProfileInfoModal
                    isOpen={!!selectedUserId}
                    onClose={() => setSelectedUserId(null)}
                    userId={selectedUserId}
                />
            )}
        </>
    );
};

export default ReportContentParser;

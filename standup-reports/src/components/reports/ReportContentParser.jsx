import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../supabaseClient';
import TaskDetailView from '../tasks/TaskDetailView';
import UserProfileInfoModal from '../UserProfileInfoModal';
import { uuidToShortId } from '../../utils/taskIdUtils';

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

        // --- Step 0: Handle potential double-escaping ---
        // If content comes in as &lt;span... it means it was escaped before reaching here
        let rawContent = content;
        if (rawContent.includes('&lt;') || rawContent.includes('&gt;')) {
            const doc = new DOMParser().parseFromString(rawContent, 'text/html');
            rawContent = doc.documentElement.textContent || doc.documentElement.innerText;
        }

        // Extract task IDs: #TASK-123 OR from raw spans if they leaked into the DB
        const taskRegex = /#TASK-([a-f0-9-]+|\d+)/g;
        const taskIds = [...rawContent.matchAll(taskRegex)].map(match => match[1]);

        // Also look for data-id in any raw spans
        const spanTaskIdRegex = /data-id="([a-f0-9-]+|\d+)"/g;
        const spanTaskIds = [...rawContent.matchAll(spanTaskIdRegex)].map(match => match[1]);
        const combinedTaskIds = [...new Set([...taskIds, ...spanTaskIds])];

        // Extract user IDs: @uuid OR from raw spans
        const userRegex = /@([a-f0-9-]{36})/g;
        const userIds = [...rawContent.matchAll(userRegex)].map(match => match[1]);

        const spanUserIdRegex = /data-user-id="([a-f0-9-]{36})"/g;
        const spanUserIds = [...rawContent.matchAll(spanUserIdRegex)].map(match => match[1]);
        const combinedUserIds = [...new Set([...userIds, ...spanUserIds])];

        // Fetch tasks
        if (combinedTaskIds.length > 0) {
            const { data: tasksData } = await supabase
                .from('tasks')
                .select('id, title')
                .in('id', combinedTaskIds);

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
                .in('id', combinedUserIds);

            const usersMap = {};
            (usersData || []).forEach(user => {
                usersMap[user.id] = user;
            });
            setUsers(usersMap);
        }

        // Parse and replace
        let parsed = rawContent;

        // 1. Replace any raw spans that leaked in with the proper Chip component
        // This fixes legacy data or "leaked" HTML from the editor
        parsed = parsed.replace(/<span[^>]*data-id="([a-f0-9-]+|\d+)"[^>]*>.*?<\/span>/g, '#TASK-$1');
        parsed = parsed.replace(/<span[^>]*data-user-id="([a-f0-9-]{36})"[^>]*>.*?<\/span>/g, '@$1');

        // 2. Replace tasks syntax with interactive spans
        parsed = parsed.replace(/#TASK-([a-f0-9-]+|\d+)/g, (match, taskId) => {
            const task = tasks[taskId];
            const shortId = taskId.length > 20 ? uuidToShortId(taskId) : taskId;
            const title = task?.title || taskId;

            if (mode === 'editor') {
                return `<span class="task-ref text-indigo-600 font-medium cursor-pointer hover:underline" data-task-id="${taskId}">#${shortId}: ${title}</span>`;
            } else {
                return `<span class="task-ref text-indigo-600 font-medium cursor-pointer hover:underline decoration-indigo-300 underline-offset-2" data-task-id="${taskId}">#${shortId}: ${title}</span>`;
            }
        });

        // 3. Replace mentions syntax with interactive spans
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

        // 4. Convert newlines to <br/> for non-HTML content
        if (!parsed.includes('<p>') && !parsed.includes('<br')) {
            parsed = parsed.replace(/\n/g, '<br/>');
        }

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

            {selectedTaskId && createPortal(
                <TaskDetailView
                    taskId={selectedTaskId}
                    isOpen={!!selectedTaskId}
                    onClose={() => setSelectedTaskId(null)}
                />,
                document.body
            )}

            {selectedUserId && createPortal(
                <UserProfileInfoModal
                    isOpen={!!selectedUserId}
                    onClose={() => setSelectedUserId(null)}
                    userId={selectedUserId}
                />,
                document.body
            )}
        </>
    );
};

export default ReportContentParser;

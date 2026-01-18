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

        // Fetch tasks and users data FIRST, then use it for parsing
        let tasksMap = {};
        let usersMap = {};

        // Fetch tasks
        if (combinedTaskIds.length > 0) {
            const { data: tasksData } = await supabase
                .from('tasks')
                .select('id, title')
                .in('id', combinedTaskIds);

            (tasksData || []).forEach(task => {
                tasksMap[task.id] = task;
            });
            setTasks(tasksMap);
        }

        // Fetch users
        if (combinedUserIds.length > 0) {
            const { data: usersData } = await supabase
                .from('users')
                .select('id, name, avatar_url')
                .in('id', combinedUserIds);

            (usersData || []).forEach(user => {
                usersMap[user.id] = user;
            });
            setUsers(usersMap);
        }

        // Parse and replace - use tasksMap and usersMap directly (not state which is async)
        let parsed = rawContent;

        // 1. Replace any raw spans that leaked in with the proper Chip component
        // This fixes legacy data or "leaked" HTML from the editor
        parsed = parsed.replace(/<span[^>]*data-id="([a-f0-9-]+|\d+)"[^>]*>.*?<\/span>/g, '#TASK-$1');
        parsed = parsed.replace(/<span[^>]*data-user-id="([a-f0-9-]{36})"[^>]*>.*?<\/span>/g, '@$1');

        // 2. Replace tasks syntax with interactive chips (inline pill style)
        parsed = parsed.replace(/#TASK-([a-f0-9-]+|\d+)/g, (match, taskId) => {
            const task = tasksMap[taskId]; // Use local variable, not state
            const shortId = taskId.length > 20 ? uuidToShortId(taskId) : taskId;
            const title = task?.title || '';
            const truncatedTitle = title.length > 25 ? title.slice(0, 25) + '...' : title;

            if (mode === 'editor') {
                return `<span class="task-ref inline-flex items-center gap-1 text-indigo-700 dark:text-indigo-300 font-medium bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-800/50 transition-colors text-sm border border-indigo-200/50 dark:border-indigo-500/30" data-task-id="${taskId}">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>#${shortId}</span>
                </span>`;
            } else {
                // For standup reports view - with title
                return `<span class="task-ref inline-flex items-center gap-1 text-indigo-700 dark:text-indigo-300 font-medium bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-800/50 transition-colors text-xs border border-indigo-200/50 dark:border-indigo-500/30" data-task-id="${taskId}">
                    <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>#${shortId}${truncatedTitle ? ': ' + truncatedTitle : ''}</span>
                </span>`;
            }
        });

        // 3. Replace mentions syntax with interactive chips (inline pill style with avatar)
        parsed = parsed.replace(/@([a-f0-9-]{36})/g, (match, userId) => {
            const user = usersMap[userId]; // Use local variable, not state
            const userName = user?.name || 'User';
            const avatarHtml = user?.avatar_url
                ? `<img src="${user.avatar_url}" class="w-4 h-4 rounded-full flex-shrink-0" alt="" />`
                : `<span class="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">${userName[0] || 'U'}</span>`;

            if (mode === 'editor') {
                return `<span class="mention-ref inline-flex items-center gap-1 text-blue-700 dark:text-blue-300 font-medium bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-full cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors text-sm border border-blue-200/50 dark:border-blue-500/30" data-user-id="${userId}">
                    ${avatarHtml}
                    <span>@${userName}</span>
                </span>`;
            } else {
                // For standup reports view
                return `<span class="mention-ref inline-flex items-center gap-1 text-blue-700 dark:text-blue-300 font-medium bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-full cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors text-xs border border-blue-200/50 dark:border-blue-500/30" data-user-id="${userId}">
                    ${avatarHtml}
                    <span>@${userName}</span>
                </span>`;
            }
        });

        // 4. Convert text patterns to proper HTML lists (numbered and bulleted)
        // Only if content doesn't already have HTML list tags
        if (!parsed.includes('<ol') && !parsed.includes('<ul') && !parsed.includes('<li')) {
            parsed = convertTextToLists(parsed);
        }

        // 5. Convert remaining newlines to <br/> for non-HTML content
        // But skip if we already have list or paragraph structure
        if (!parsed.includes('<p>') && !parsed.includes('<br') && !parsed.includes('<ol') && !parsed.includes('<ul')) {
            parsed = parsed.replace(/\n/g, '<br/>');
        }

        setParsedContent(parsed);
    };

    // Helper function to convert plain text lists to HTML lists
    const convertTextToLists = (text) => {
        // First, normalize the text - add newlines before list patterns if they're inline
        // This handles cases like "1. First 2. Second" or "- one - two"
        let normalizedText = text
            // Add newline before numbered patterns like "1.", "2." when preceded by text
            .replace(/([^\n])\s+(\d+[.)]\s+)/g, '$1\n$2')
            // Add newline before bullet patterns like "- ", "* " when preceded by text
            .replace(/([^\n])\s+([-*•→]\s+)/g, '$1\n$2');

        const lines = normalizedText.split(/\n|<br\s*\/?>/);
        let result = [];
        let currentList = null;
        let currentListType = null;

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;

            // Check for numbered list: "1.", "2.", "1)", "2)", etc.
            const numberedMatch = trimmedLine.match(/^(\d+)[.)]\s+(.+)$/);
            // Check for bullet list: "-", "*", "•", "→"
            const bulletMatch = trimmedLine.match(/^[-*•→]\s+(.+)$/);
            // Check for checkbox style: "[ ]", "[x]", "[X]"
            const checkboxMatch = trimmedLine.match(/^\[[ xX]?\]\s+(.+)$/);

            if (numberedMatch) {
                const content = numberedMatch[2];
                if (currentListType !== 'ol') {
                    if (currentList) {
                        result.push(`</${currentListType}>`);
                    }
                    result.push('<ol>');
                    currentListType = 'ol';
                    currentList = true;
                }
                result.push(`<li>${content}</li>`);
            } else if (bulletMatch || checkboxMatch) {
                const content = bulletMatch ? bulletMatch[1] : checkboxMatch[1];
                if (currentListType !== 'ul') {
                    if (currentList) {
                        result.push(`</${currentListType}>`);
                    }
                    result.push('<ul>');
                    currentListType = 'ul';
                    currentList = true;
                }
                result.push(`<li>${content}</li>`);
            } else {
                // Close any open list
                if (currentList) {
                    result.push(`</${currentListType}>`);
                    currentList = null;
                    currentListType = null;
                }
                // Add non-list content
                if (trimmedLine) {
                    result.push(trimmedLine);
                    // Add line break after non-list content if not the last line
                    if (index < lines.length - 1 && lines[index + 1]?.trim()) {
                        result.push('<br/>');
                    }
                }
            }
        });

        // Close any remaining open list
        if (currentList) {
            result.push(`</${currentListType}>`);
        }

        return result.join('');
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
                className="report-content"
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

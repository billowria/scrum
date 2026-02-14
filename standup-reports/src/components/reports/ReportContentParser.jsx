import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../supabaseClient';
import TaskDetailView from '../tasks/TaskDetailView';
import UserProfileInfoModal from '../UserProfileInfoModal';
import { uuidToShortId } from '../../utils/taskIdUtils';

const ReportContentParser = ({ content, mode = 'view' }) => {
    const [parsedContent, setParsedContent] = useState('');
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const containerRef = useRef(null);

    // Stable click handler
    const handleClick = useCallback((e) => {
        const target = e.target.closest('[data-task-id], [data-user-id]');
        if (!target) return;
        e.preventDefault();
        e.stopPropagation();
        if (target.dataset.taskId) {
            setSelectedTaskId(target.dataset.taskId);
        } else if (target.dataset.userId) {
            setSelectedUserId(target.dataset.userId);
        }
    }, []);

    useEffect(() => {
        if (!content) {
            setParsedContent('');
            return;
        }

        let cancelled = false;

        const parse = async () => {
            try {
                let raw = String(content);

                // ─── Step 0: Unescape double-encoded HTML ───
                // Some content may arrive as &lt;p&gt;... from the DB
                if (raw.includes('&lt;') || raw.includes('&gt;') || raw.includes('&amp;lt;')) {
                    const doc = new DOMParser().parseFromString(raw, 'text/html');
                    raw = doc.body.innerHTML || raw;
                }

                // Determine if content is already HTML (from Tiptap editor)
                const isHtml = /<\s*(p|ul|ol|li|br|strong|em|span|div|a|h[1-6]|blockquote|pre|code)[\s>]/i.test(raw);

                // ─── Step 1: Extract all task IDs and user IDs ───
                const taskIdSet = new Set();
                const userIdSet = new Set();

                // From #TASK-xxx tokens
                const taskTokenRegex = /#TASK-([a-f0-9-]+|\d+)/g;
                for (const m of raw.matchAll(taskTokenRegex)) taskIdSet.add(m[1]);

                // From data-id attributes (Tiptap spans that leaked)
                const dataIdRegex = /data-id="([a-f0-9-]+|\d+)"/g;
                for (const m of raw.matchAll(dataIdRegex)) taskIdSet.add(m[1]);

                // From [TASK:id|title] format
                const bracketTaskRegex = /\[TASK:([^|\]]+)\|([^\]]+)\]/g;
                for (const m of raw.matchAll(bracketTaskRegex)) taskIdSet.add(m[1]);

                // User IDs from @uuid
                const userTokenRegex = /@([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/g;
                for (const m of raw.matchAll(userTokenRegex)) userIdSet.add(m[1]);

                // User IDs from data-user-id
                const dataUserRegex = /data-user-id="([a-f0-9-]{36})"/g;
                for (const m of raw.matchAll(dataUserRegex)) userIdSet.add(m[1]);

                // ─── Step 2: Batch fetch tasks and users ───
                let tasksMap = {};
                let usersMap = {};

                const fetches = [];

                if (taskIdSet.size > 0) {
                    fetches.push(
                        supabase.from('tasks').select('id, title').in('id', [...taskIdSet])
                            .then(({ data }) => {
                                (data || []).forEach(t => { tasksMap[t.id] = t; });
                            })
                    );
                }

                if (userIdSet.size > 0) {
                    fetches.push(
                        supabase.from('users').select('id, name, avatar_url').in('id', [...userIdSet])
                            .then(({ data }) => {
                                (data || []).forEach(u => { usersMap[u.id] = u; });
                            })
                    );
                }

                await Promise.all(fetches);
                if (cancelled) return;

                // ─── Step 3: Build replacement helpers ───
                const makeTaskChip = (taskId) => {
                    const task = tasksMap[taskId];
                    const shortId = taskId.length > 20 ? uuidToShortId(taskId) : taskId;
                    const title = task?.title || '';
                    const truncated = title.length > 30 ? title.slice(0, 30) + '…' : title;
                    const label = truncated ? `#${shortId}: ${truncated}` : `#${shortId}`;
                    return `<span class="task-ref inline-flex items-center gap-1 text-indigo-700 dark:text-indigo-300 font-medium bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-800/50 transition-colors text-xs border border-indigo-200/50 dark:border-indigo-500/30 whitespace-nowrap" data-task-id="${taskId}"><svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>${label}</span></span>`;
                };

                const makeUserChip = (userId) => {
                    const user = usersMap[userId];
                    const name = user?.name || 'User';
                    const avatar = user?.avatar_url
                        ? `<img src="${user.avatar_url}" class="w-4 h-4 rounded-full flex-shrink-0 object-cover" alt="" />`
                        : `<span class="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">${name[0] || 'U'}</span>`;
                    return `<span class="mention-ref inline-flex items-center gap-1 text-blue-700 dark:text-blue-300 font-medium bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-full cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors text-xs border border-blue-200/50 dark:border-blue-500/30 whitespace-nowrap" data-user-id="${userId}">${avatar}<span>@${name}</span></span>`;
                };

                // ─── Step 4: Replace tokens in content ───
                let parsed = raw;

                // Replace leaked Tiptap spans for tasks
                parsed = parsed.replace(/<span[^>]*data-id="([a-f0-9-]+|\d+)"[^>]*>.*?<\/span>/g, (_, id) => makeTaskChip(id));

                // Replace leaked Tiptap spans for users
                parsed = parsed.replace(/<span[^>]*data-user-id="([a-f0-9-]{36})"[^>]*>.*?<\/span>/g, (_, id) => makeUserChip(id));

                // Replace [TASK:id|title] format
                parsed = parsed.replace(/\[TASK:([^|\]]+)\|([^\]]+)\]/g, (_, id) => makeTaskChip(id));

                // Replace #TASK-xxx tokens
                parsed = parsed.replace(/#TASK-([a-f0-9-]+|\d+)/g, (_, id) => makeTaskChip(id));

                // Replace @uuid tokens (but not already-replaced ones inside data-user-id="...")
                parsed = parsed.replace(/(?<!data-user-id=")@([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/g, (_, id) => makeUserChip(id));

                // ─── Step 5: Handle plain-text content formatting ───
                if (!isHtml) {
                    parsed = convertPlainTextToHtml(parsed);
                } else {
                    // Even for HTML, ensure empty paragraphs have some height
                    parsed = parsed.replace(/<p><\/p>/g, '<p><br/></p>');
                    // Clean up any double <br> tags  
                    parsed = parsed.replace(/(<br\s*\/?>){3,}/g, '<br/><br/>');
                }

                if (!cancelled) {
                    setParsedContent(parsed);
                }
            } catch (err) {
                console.error('ReportContentParser error:', err);
                // Fallback: show raw content
                if (!cancelled) {
                    setParsedContent(String(content));
                }
            }
        };

        parse();
        return () => { cancelled = true; };
    }, [content]);

    return (
        <>
            <div
                ref={containerRef}
                onClick={handleClick}
                className="report-content prose prose-sm max-w-none dark:prose-invert
                    prose-p:my-1 prose-li:my-0.5 prose-ul:my-1 prose-ol:my-1
                    prose-headings:my-2 prose-blockquote:my-2
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
                    [&_li]:text-inherit [&_p]:text-inherit"
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

/**
 * Convert plain text with lists/newlines into structured HTML.
 * Handles numbered lists (1. / 1)), bullet lists (- / * / • / →), and checkboxes.
 */
function convertPlainTextToHtml(text) {
    // Normalize inline list patterns → ensure they're on separate lines
    let normalized = text
        .replace(/([^\n])\s+(\d+[.)]\s+)/g, '$1\n$2')
        .replace(/([^\n])\s+([-*•→]\s+)/g, '$1\n$2');

    const lines = normalized.split(/\n|<br\s*\/?>/);
    const parts = [];
    let listType = null; // 'ol' or 'ul'

    const closeList = () => {
        if (listType) {
            parts.push(`</${listType}>`);
            listType = null;
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
            closeList();
            continue;
        }

        const numberedMatch = line.match(/^(\d+)[.)]\s+(.+)$/);
        const bulletMatch = line.match(/^[-*•→]\s+(.+)$/);
        const checkboxMatch = line.match(/^\[[ xX]?\]\s+(.+)$/);

        if (numberedMatch) {
            if (listType !== 'ol') { closeList(); parts.push('<ol>'); listType = 'ol'; }
            parts.push(`<li>${numberedMatch[2]}</li>`);
        } else if (bulletMatch || checkboxMatch) {
            if (listType !== 'ul') { closeList(); parts.push('<ul>'); listType = 'ul'; }
            parts.push(`<li>${(bulletMatch || checkboxMatch)[1]}</li>`);
        } else {
            closeList();
            parts.push(`<p>${line}</p>`);
        }
    }

    closeList();
    return parts.join('');
}

export default ReportContentParser;

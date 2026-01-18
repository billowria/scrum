import React, { useMemo } from 'react';
import MermaidRenderer from './MermaidRenderer';

/**
 * NoteContentViewer - Renders note content with Mermaid diagrams.
 * Parses HTML content, finds mermaid code blocks, and renders them as diagrams.
 * 
 * @param {string} content - HTML content of the note.
 * @param {string} themeMode - Current theme mode.
 */
const NoteContentViewer = ({ content, themeMode = 'dark' }) => {
    // Parse content and replace mermaid code blocks with rendered diagrams
    const renderedContent = useMemo(() => {
        if (!content) return null;

        // Regex to find code blocks with mermaid language
        const mermaidBlockRegex = /<pre[^>]*><code[^>]*(?:class="[^"]*language-mermaid[^"]*"|data-language="mermaid")[^>]*>([\s\S]*?)<\/code><\/pre>/gi;

        // Also check for simpler code blocks that might contain mermaid
        const simpleMermaidRegex = /<pre[^>]*>\s*<code[^>]*>(graph\s+(?:TD|TB|BT|RL|LR)|sequenceDiagram|classDiagram|stateDiagram|erDiagram|flowchart|pie|journey|gantt)([\s\S]*?)<\/code><\/pre>/gi;

        const parts = [];
        let lastIndex = 0;
        let match;

        // Find all mermaid code blocks with explicit language
        const allMatches = [];

        while ((match = mermaidBlockRegex.exec(content)) !== null) {
            allMatches.push({
                index: match.index,
                length: match[0].length,
                code: decodeHTMLEntities(match[1]),
            });
        }

        // Also find implicit mermaid blocks (starting with graph, sequenceDiagram, etc.)
        while ((match = simpleMermaidRegex.exec(content)) !== null) {
            // Check if this match overlaps with explicit mermaid blocks
            const overlaps = allMatches.some(
                m => (match.index >= m.index && match.index < m.index + m.length) ||
                    (m.index >= match.index && m.index < match.index + match[0].length)
            );

            if (!overlaps) {
                allMatches.push({
                    index: match.index,
                    length: match[0].length,
                    code: decodeHTMLEntities(match[1] + match[2]),
                });
            }
        }

        // Sort matches by index
        allMatches.sort((a, b) => a.index - b.index);

        // Build parts array
        allMatches.forEach((m, idx) => {
            // Add HTML before this match
            if (m.index > lastIndex) {
                parts.push({
                    type: 'html',
                    content: content.substring(lastIndex, m.index),
                    key: `html-${idx}`,
                });
            }

            // Add mermaid diagram
            parts.push({
                type: 'mermaid',
                code: m.code,
                key: `mermaid-${idx}`,
            });

            lastIndex = m.index + m.length;
        });

        // Add remaining HTML after last match
        if (lastIndex < content.length) {
            parts.push({
                type: 'html',
                content: content.substring(lastIndex),
                key: 'html-final',
            });
        }

        // If no mermaid blocks found, just return the content as-is
        if (parts.length === 0) {
            parts.push({
                type: 'html',
                content: content,
                key: 'html-only',
            });
        }

        return parts;
    }, [content]);

    // Decode HTML entities (for code blocks that might have escaped characters)
    function decodeHTMLEntities(text) {
        const textArea = document.createElement('textarea');
        textArea.innerHTML = text;
        return textArea.value;
    }

    const proseClasses = themeMode === 'light'
        ? 'prose prose-slate'
        : 'prose prose-invert prose-p:text-slate-300 prose-headings:text-white prose-strong:text-white prose-code:text-indigo-300';

    return (
        <div className={`${proseClasses} prose-lg max-w-none`}>
            {renderedContent?.map((part) => {
                if (part.type === 'mermaid') {
                    return (
                        <MermaidRenderer
                            key={part.key}
                            code={part.code}
                            themeMode={themeMode}
                        />
                    );
                }
                return (
                    <div
                        key={part.key}
                        dangerouslySetInnerHTML={{ __html: part.content }}
                    />
                );
            })}
        </div>
    );
};

export default NoteContentViewer;

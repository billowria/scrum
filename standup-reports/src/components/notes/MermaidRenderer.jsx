import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid with a safe, non-auto-rendering configuration
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
});

/**
 * MermaidRenderer - Renders Mermaid diagram code into an SVG.
 * @param {string} code - The Mermaid syntax string.
 * @param {string} themeMode - Current theme mode ('light', 'dark', etc.).
 */
const MermaidRenderer = ({ code, themeMode = 'dark' }) => {
    const containerRef = useRef(null);
    const [svg, setSvg] = useState('');
    const [error, setError] = useState(null);
    const idRef = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

    useEffect(() => {
        if (!code || !code.trim()) {
            setSvg('');
            setError(null);
            return;
        }

        const renderDiagram = async () => {
            try {
                // Update theme based on mode
                const isDark = themeMode !== 'light';
                mermaid.initialize({
                    startOnLoad: false,
                    theme: isDark ? 'dark' : 'default',
                    securityLevel: 'loose',
                    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                    themeVariables: isDark
                        ? {
                            primaryColor: '#6366f1',
                            primaryTextColor: '#e2e8f0',
                            primaryBorderColor: '#4f46e5',
                            lineColor: '#94a3b8',
                            secondaryColor: '#1e293b',
                            tertiaryColor: '#0f172a',
                            background: '#0f172a',
                            mainBkg: '#1e293b',
                            nodeBorder: '#4f46e5',
                            clusterBkg: '#1e293b',
                            titleColor: '#f1f5f9',
                            edgeLabelBackground: '#1e293b',
                        }
                        : {
                            primaryColor: '#6366f1',
                            primaryTextColor: '#1e293b',
                            primaryBorderColor: '#4f46e5',
                            lineColor: '#64748b',
                            secondaryColor: '#f1f5f9',
                            tertiaryColor: '#e2e8f0',
                            background: '#ffffff',
                            mainBkg: '#f8fafc',
                            nodeBorder: '#6366f1',
                            clusterBkg: '#f1f5f9',
                            titleColor: '#0f172a',
                            edgeLabelBackground: '#ffffff',
                        },
                });

                const { svg: renderedSvg } = await mermaid.render(idRef.current, code.trim());
                setSvg(renderedSvg);
                setError(null);
            } catch (err) {
                console.error('Mermaid render error:', err);
                setError(err.message || 'Failed to render diagram');
                setSvg('');
            }
        };

        renderDiagram();
    }, [code, themeMode]);

    if (error) {
        return (
            <div className="my-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono">
                <div className="font-semibold mb-2">⚠ Diagram Error</div>
                <pre className="whitespace-pre-wrap text-xs opacity-80">{error}</pre>
            </div>
        );
    }

    if (!svg) {
        return (
            <div className="my-4 p-6 rounded-xl bg-slate-800/50 border border-white/5 flex items-center justify-center text-slate-500 text-sm">
                Enter Mermaid syntax to render diagram...
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="my-4 p-4 rounded-xl bg-slate-800/30 border border-white/5 overflow-x-auto flex justify-center"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
};

export default MermaidRenderer;

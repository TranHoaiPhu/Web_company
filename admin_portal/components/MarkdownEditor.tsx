"use client"
import { useState } from 'react';
import { Eye, Code } from 'lucide-react';

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
}

export default function MarkdownEditor({ value, onChange, placeholder, rows = 6 }: MarkdownEditorProps) {
    const [showPreview, setShowPreview] = useState(false);

    // Enhanced markdown to HTML converter with table support
    const renderMarkdown = (markdown: string) => {
        if (!markdown) return '';

        let html = markdown;

        // Process tables first (before other replacements)
        html = html.replace(/\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g, (match, header, rows) => {
            const headers = header.split('|').map((h: string) => h.trim()).filter((h: string) => h);
            const rowData = rows.trim().split('\n').map((row: string) =>
                row.split('|').map((cell: string) => cell.trim()).filter((cell: string) => cell)
            );

            let tableHtml = '<div class="overflow-x-auto my-4"><table class="min-w-full border-collapse border border-slate-300 rounded-lg">';

            // Header
            tableHtml += '<thead class="bg-slate-100"><tr>';
            headers.forEach((h: string) => {
                tableHtml += `<th class="border border-slate-300 px-4 py-2 text-left font-semibold text-slate-900">${h}</th>`;
            });
            tableHtml += '</tr></thead>';

            // Body
            tableHtml += '<tbody>';
            rowData.forEach((row: string[]) => {
                tableHtml += '<tr class="hover:bg-slate-50">';
                row.forEach((cell: string) => {
                    tableHtml += `<td class="border border-slate-300 px-4 py-2 text-slate-700">${cell}</td>`;
                });
                tableHtml += '</tr>';
            });
            tableHtml += '</tbody></table></div>';

            return tableHtml;
        });

        // Code blocks (before inline code)
        html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-100 p-4 rounded-lg my-3 overflow-x-auto border border-slate-200"><code class="text-sm font-mono text-slate-800">$1</code></pre>');

        // Blockquotes
        html = html.replace(/^> (.+)$/gim, '<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-3 italic text-slate-600 bg-blue-50 rounded-r">$1</blockquote>');

        // Headers (must be before bold/italic)
        html = html.replace(/^#### (.*$)/gim, '<h4 class="text-base font-semibold text-slate-900 mt-3 mb-2">$1</h4>');
        html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-slate-900 mt-4 mb-2">$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-slate-900 mt-5 mb-3">$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-slate-900 mt-6 mb-4">$1</h1>');

        // Strikethrough
        html = html.replace(/~~(.*?)~~/g, '<del class="line-through text-slate-500">$1</del>');

        // Bold (must be before italic)
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>');

        // Italic
        html = html.replace(/\*(.*?)\*/g, '<em class="italic text-slate-700">$1</em>');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono text-slate-800">$1</code>');

        // Horizontal rule
        html = html.replace(/^---+$/gim, '<hr class="my-4 border-t-2 border-slate-200" />');

        // Lists - Process line by line to maintain structure
        const lines = html.split('\n');
        let inList = false;
        let listType = '';
        const processedLines: string[] = [];

        lines.forEach((line) => {
            const unorderedMatch = line.match(/^(\s*)[*-] (.+)$/);
            const orderedMatch = line.match(/^(\s*)\d+\. (.+)$/);

            if (unorderedMatch) {
                if (!inList || listType !== 'ul') {
                    if (inList) processedLines.push(`</${listType}>`);
                    processedLines.push('<ul class="list-disc ml-6 my-2 space-y-1">');
                    inList = true;
                    listType = 'ul';
                }
                processedLines.push(`<li class="text-slate-700">${unorderedMatch[2]}</li>`);
            } else if (orderedMatch) {
                if (!inList || listType !== 'ol') {
                    if (inList) processedLines.push(`</${listType}>`);
                    processedLines.push('<ol class="list-decimal ml-6 my-2 space-y-1">');
                    inList = true;
                    listType = 'ol';
                }
                processedLines.push(`<li class="text-slate-700">${orderedMatch[2]}</li>`);
            } else {
                if (inList) {
                    processedLines.push(`</${listType}>`);
                    inList = false;
                    listType = '';
                }
                processedLines.push(line);
            }
        });

        if (inList) processedLines.push(`</${listType}>`);
        html = processedLines.join('\n');

        // Paragraphs (double line breaks)
        html = html.replace(/\n\n+/g, '</p><p class="mb-3 text-slate-700">');

        // Wrap in paragraph if not already wrapped
        if (!html.match(/^<(h[1-6]|table|div|ul|ol|blockquote|pre|hr)/)) {
            html = '<p class="mb-3 text-slate-700">' + html + '</p>';
        }

        return html;
    };

    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-600">Markdown Editor</span>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded font-mono">#</span>
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded font-mono">**bold**</span>
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded font-mono">|table|</span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setShowPreview(false)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded transition-colors ${!showPreview
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <Code size={14} />
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowPreview(true)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded transition-colors ${showPreview
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <Eye size={14} />
                        Preview
                    </button>
                </div>
            </div>

            {/* Editor/Preview Area */}
            <div className="relative">
                {!showPreview ? (
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        rows={rows}
                        className="w-full px-4 py-3 bg-white text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset font-mono text-sm"
                        placeholder={placeholder || "Nhập nội dung markdown...\n\n# Tiêu đề\n## Tiêu đề phụ\n**Chữ đậm** *Chữ nghiêng*\n- Danh sách\n\n| Cột 1 | Cột 2 |\n|-------|-------|\n| A     | B     |"}
                    />
                ) : (
                    <div
                        className="w-full px-4 py-3 bg-white min-h-[150px] prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
                    />
                )}
            </div>

            {/* Helper text */}
            <div className="px-3 py-2 bg-slate-50 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                    💡 Hỗ trợ: <code className="bg-slate-100 px-1 rounded">#</code> tiêu đề,
                    <code className="bg-slate-100 px-1 rounded mx-1">**bold**</code>,
                    <code className="bg-slate-100 px-1 rounded">*italic*</code>,
                    <code className="bg-slate-100 px-1 rounded mx-1">- list</code>,
                    <code className="bg-slate-100 px-1 rounded">`code`</code>,
                    <code className="bg-slate-100 px-1 rounded mx-1">| table |</code>
                </p>
            </div>
        </div>
    );
}

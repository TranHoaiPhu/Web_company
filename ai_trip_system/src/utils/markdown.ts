// Utility function to render markdown to HTML
export function renderMarkdown(markdown: string): string {
    if (!markdown) return '';

    let html = markdown;

    // Process tables first (before other replacements)
    html = html.replace(/\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g, (match, header, rows) => {
        const headers = header.split('|').map((h: string) => h.trim()).filter((h: string) => h);
        const rowData = rows.trim().split('\n').map((row: string) =>
            row.split('|').map((cell: string) => cell.trim()).filter((cell: string) => cell)
        );

        let tableHtml = '<div class="overflow-x-auto my-4"><table class="min-w-full border-collapse border border-gray-300 rounded-lg">';

        // Header
        tableHtml += '<thead class="bg-gray-100"><tr>';
        headers.forEach((h: string) => {
            tableHtml += `<th class="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">${h}</th>`;
        });
        tableHtml += '</tr></thead>';

        // Body
        tableHtml += '<tbody>';
        rowData.forEach((row: string[]) => {
            tableHtml += '<tr class="hover:bg-gray-50">';
            row.forEach((cell: string) => {
                tableHtml += `<td class="border border-gray-300 px-4 py-2 text-gray-700">${cell}</td>`;
            });
            tableHtml += '</tr>';
        });
        tableHtml += '</tbody></table></div>';

        return tableHtml;
    });

    // Code blocks (before inline code)
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-4 rounded-lg my-3 overflow-x-auto border border-gray-200"><code class="text-sm font-mono text-gray-800">$1</code></pre>');

    // Blockquotes
    html = html.replace(/^> (.+)$/gim, '<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-3 italic text-gray-600 bg-blue-50 rounded-r">$1</blockquote>');

    // Headers (must be before bold/italic)
    html = html.replace(/^#### (.*$)/gim, '<h4 class="text-base font-semibold text-gray-900 mt-3 mb-2">$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-gray-900 mt-5 mb-3">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mt-6 mb-4">$1</h1>');

    // Strikethrough
    html = html.replace(/~~(.*?)~~/g, '<del class="line-through text-gray-500">$1</del>');

    // Bold (must be before italic)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800">$1</code>');

    // Horizontal rule
    html = html.replace(/^---+$/gim, '<hr class="my-4 border-t-2 border-gray-200" />');

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
            processedLines.push(`<li class="text-gray-700">${unorderedMatch[2]}</li>`);
        } else if (orderedMatch) {
            if (!inList || listType !== 'ol') {
                if (inList) processedLines.push(`</${listType}>`);
                processedLines.push('<ol class="list-decimal ml-6 my-2 space-y-1">');
                inList = true;
                listType = 'ol';
            }
            processedLines.push(`<li class="text-gray-700">${orderedMatch[2]}</li>`);
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
    html = html.replace(/\n\n+/g, '</p><p class="mb-3 text-gray-700">');

    // Wrap in paragraph if not already wrapped
    if (!html.match(/^<(h[1-6]|table|div|ul|ol|blockquote|pre|hr)/)) {
        html = '<p class="mb-3 text-gray-700">' + html + '</p>';
    }

    return html;
}

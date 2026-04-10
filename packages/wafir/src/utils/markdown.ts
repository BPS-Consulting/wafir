/**
 * Lightweight markdown parser for basic formatting.
 */
export function parseMarkdown(markdown: string): string {
  if (!markdown) return "";

  let html = markdown;

  // Escape HTML to prevent XSS
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code${lang ? ` class="language-${lang}"` : ""}>${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Headers
  html = html.replace(/^######\s+(.+)$/gm, "<h6>$1</h6>");
  html = html.replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>");
  html = html.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");

  // Lists
  // Process Unordered Lists: wrap each line in <ul><li>...</li></ul>
  html = html.replace(/^[\*\-]\s+(.+)$/gm, "<ul><li>$1</li></ul>");

  // Process Ordered Lists: capture the number and wrap in <ol start="x"><li>...</li></ol>
  html = html.replace(/^(\d+)\.\s+(.+)$/gm, (_match, num, content) => {
    return `<ol start="${num}"><li>${content}</li></ol>`;
  });

  // Merge adjacent <ul> tags
  html = html.replace(/<\/ul>\s?<ul>/g, "");

  // Merge adjacent <ol> tags
  // This logic keeps the 'start' attribute of the FIRST list item in a sequence
  html = html.replace(/<\/ol>\s?<ol start="\d+">/g, "");

  // Bold & Italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.+?)_/g, "<em>$1</em>");

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Line breaks (Double newline to <br><br>)
  // We exclude breaks inside list tags or pre tags to keep formatting clean
  html = html.replace(/\n\n/g, "<br><br>");

  return html;
}

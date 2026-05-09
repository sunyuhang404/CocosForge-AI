import DOMPurify from "dompurify";
import MarkdownIt from "markdown-it";

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true
});

export function renderMarkdown(content: string): string {
  const rendered = markdown.render(content);
  return DOMPurify.sanitize(rendered);
}

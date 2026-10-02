import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { CopyButton } from './CopyButton';

const SAFE_PROTOCOL = /^(https?:|mailto:)/i;

const components: Components = {
  a: ({ href, children }) =>
    href && SAFE_PROTOCOL.test(href) ? (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ) : (
      <span>{children}</span>
    ),
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children }) => {
    const text = String(children ?? '');
    const lang = /language-(\w+)/.exec(className ?? '')?.[1];
    const isBlock = Boolean(lang) || text.includes('\n');
    if (!isBlock) return <code className={className}>{children}</code>;
    const code = text.replace(/\n$/, '');
    return (
      <div className="not-prose relative my-3 overflow-hidden rounded-lg bg-gray-900 text-gray-100">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5 text-xs text-gray-400">
          <span>{lang ?? 'code'}</span>
          <CopyButton text={code} size="xs" variant="dark" />
        </div>
        <pre className="overflow-x-auto p-3 text-sm leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    );
  },
};

/**
 * Renders untrusted Markdown (AI output) safely: raw HTML in the source is shown as text,
 * never injected, and only http(s)/mailto links become clickable.
 */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn('prose prose-sm max-w-none break-words prose-headings:font-semibold prose-a:text-purple-700 prose-code:before:content-none prose-code:after:content-none prose-code:rounded prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}

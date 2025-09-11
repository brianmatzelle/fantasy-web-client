'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-sm max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-[#ECDFCC] mb-4 mt-6 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-[#ECDFCC] mb-3 mt-5 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-medium text-[#ECDFCC] mb-2 mt-4 first:mt-0">
              {children}
            </h3>
          ),
          
          // Paragraphs
          p: ({ children }) => (
            <p className="text-[#ECDFCC] mb-3 leading-relaxed last:mb-0">
              {children}
            </p>
          ),
          
          // Lists
          ul: ({ children }) => (
            <ul className="text-[#ECDFCC] mb-3 pl-4 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="text-[#ECDFCC] mb-3 pl-4 space-y-1 list-decimal">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-[#ECDFCC] leading-relaxed">
              <span className="text-[#697565] mr-2">•</span>
              {children}
            </li>
          ),
          
          // Emphasis
          strong: ({ children }) => (
            <strong className="font-semibold text-[#ECDFCC]">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-[#C4B8A8]">
              {children}
            </em>
          ),
          
          // Code
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-[#1A1C20] text-[#697565] px-1.5 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              );
            }
            return (
              <code className="block bg-[#1A1C20] text-[#ECDFCC] p-3 rounded-lg text-sm font-mono overflow-x-auto">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-[#1A1C20] p-3 rounded-lg mb-3 overflow-x-auto">
              {children}
            </pre>
          ),
          
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#697565] pl-4 my-3 text-[#C4B8A8] italic">
              {children}
            </blockquote>
          ),
          
          // Links
          a: ({ children, href }) => (
            <a 
              href={href} 
              className="text-[#697565] hover:text-[#697565]/80 underline transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="w-full border-collapse border border-[#1A1C20]">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#1A1C20]">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="border border-[#1A1C20] px-3 py-2 text-left text-[#ECDFCC] font-medium">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-[#1A1C20] px-3 py-2 text-[#ECDFCC]">
              {children}
            </td>
          ),
          
          // Horizontal rule
          hr: () => (
            <hr className="border-[#1A1C20] my-6" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

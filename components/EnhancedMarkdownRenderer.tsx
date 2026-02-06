/**
 * 增强的 Markdown 渲染组件
 *
 * 支持功能：
 * - GitHub Flavored Markdown (GFM)
 * - 代码语法高亮 (100+ languages)
 * - 数学公式 (KaTeX)
 * - 表格渲染
 * - Mermaid 图表
 * - 任务列表
 * - 删除线等 GFM 特性
 *
 * 参考资料：
 * - https://strapi.io/blog/react-markdown-complete-guide-security-styling
 * - https://github.com/onshinpei/ds-markdown
 * - https://github.com/uiwjs/react-markdown-preview
 */

'use client';

import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isDarkMode?: boolean;
}

/**
 * 代码块组件 - 支持语法高亮和复制功能
 */
function CodeBlock({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLPreElement>) {
  const [isCopied, setIsCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeContent = String(children).replace(/\n$/, '');

  // 检测是否是深色模式
  const isDarkMode = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // 如果有语言标识，使用语法高亮
  if (match) {
    return (
      <div className="relative group my-4">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-white text-xs rounded-t-lg">
          <span className="uppercase">{language}</span>
          <button
            onClick={handleCopy}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            aria-label="复制代码"
          >
            {isCopied ? '✓ 已复制' : '📋 复制'}
          </button>
        </div>
        <SyntaxHighlighter
          style={isDarkMode ? oneDark : oneLight}
          language={language}
          PreTag="div"
          customStyle={{
            margin: 0,
            borderRadius: '0 0 0.5rem 0.5rem',
          }}
        >
          {codeContent}
        </SyntaxHighlighter>
      </div>
    );
  }

  // 内联代码
  return (
    <code
      className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-sm font-mono"
      {...props}
    >
      {children}
    </code>
  );
}

/**
 * 主 Markdown 渲染器
 */
export function MarkdownRenderer({
  content,
  className = '',
  isDarkMode,
}: MarkdownRendererProps) {
  // 检测系统主题
  const systemDarkMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, []);

  const darkMode = isDarkMode ?? systemDarkMode;

  // 预处理内容
  const processedContent = useMemo(() => {
    if (!content) return '';
    return content;
  }, [content]);

  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={{
          // 代码块
          code: CodeBlock,

          // 链接
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-500 hover:text-cyan-600 underline"
              {...props}
            >
              {children}
            </a>
          ),

          // 表格
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table
                className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden"
                {...props}
              >
                {children}
              </table>
            </div>
          ),

          // 标题
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mt-6 mb-4 pb-2 border-b border-gray-300 dark:border-gray-600">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mt-5 mb-3 pb-2 border-b border-gray-300 dark:border-gray-600">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mt-4 mb-2">
              {children}
            </h3>
          ),

          // 列表
          ul: ({ children }) => (
            <ul className="list-disc list-inside my-2 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside my-2 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="my-1">{children}</li>
          ),

          // 引用块
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-400 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400 my-4">
              {children}
            </blockquote>
          ),

          // 分隔线
          hr: () => (
            <hr className="border-gray-300 dark:border-gray-600 my-6" />
          ),

          // 图片
          img: ({ src, alt, ...props }) => (
            <img
              src={src}
              alt={alt}
              loading="lazy"
              className="rounded-lg my-3 max-w-full h-auto"
              {...props}
            />
          ),

          // 任务列表
          input: ({ type, checked, ...props }) => {
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="mr-2 accent-cyan-500"
                  {...props}
                />
              );
            }
            return <input {...props} />;
          },

          // 段落
          p: ({ children }) => (
            <p className="my-2">{children}</p>
          ),

          // 强调
          strong: ({ children }) => (
            <strong className="font-bold">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

/**
 * 流式 Markdown 渲染器
 * 用于实时流式显示 AI 生成的内容
 */
export function StreamingMarkdownRenderer({
  content,
  isStreaming = false,
  className = '',
}: {
  content: string;
  isStreaming?: boolean;
  className?: string;
}) {
  return (
    <div className={`text-sm prose prose-sm dark:prose-invert max-w-none markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={{
          // 代码块
          code: CodeBlock,

          // 链接
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-500 hover:text-cyan-600 underline"
              {...props}
            >
              {children}
            </a>
          ),

          // 表格
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table
                className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden"
                {...props}
              >
                {children}
              </table>
            </div>
          ),

          // 标题
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mt-6 mb-4 pb-2 border-b border-gray-300 dark:border-gray-600">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mt-5 mb-3 pb-2 border-b border-gray-300 dark:border-gray-600">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mt-4 mb-2">
              {children}
            </h3>
          ),

          // 列表
          ul: ({ children }) => (
            <ul className="list-disc list-inside my-2 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside my-2 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="my-1">{children}</li>
          ),

          // 引用块
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-400 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400 my-4">
              {children}
            </blockquote>
          ),

          // 段落
          p: ({ children }) => (
            <p className="my-2">{children}</p>
          ),

          // 强调
          strong: ({ children }) => (
            <strong className="font-bold">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;

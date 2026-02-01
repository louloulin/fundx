/**
 * Message Content Renderer
 *
 * 渲染 Markdown 格式的 AI 聊天消息
 */

'use client';

import React from 'react';

interface MessageContentProps {
  content: string;
  isUser?: boolean;
}

export function MessageContent({ content, isUser = false }: MessageContentProps) {
  // Parse markdown and return React nodes
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    const result: React.ReactNode[] = [];
    const listStack: Array<{ type: 'ul' | 'ol'; items: React.ReactNode[] }> = [];
    let inCodeBlock = false;
    let codeContent = '';
    let codeLang = '';

    const flushList = () => {
      if (listStack.length > 0) {
        const currentList = listStack[listStack.length - 1];
        if (currentList.type === 'ul') {
          result.push(<ul key={`list-${listStack.length}-${result.length}`} className="message-list">{currentList.items}</ul>);
        } else {
          result.push(<ol key={`list-${listStack.length}-${result.length}`} className="message-list">{currentList.items}</ol>);
        }
        listStack.pop();
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle code blocks
      if (line.startsWith('```')) {
        flushList();
        if (inCodeBlock) {
          result.push(
            <pre key={`code-${i}`} className="code-block">
              <code>{codeContent}</code>
            </pre>
          );
          codeContent = '';
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          codeLang = line.slice(3).trim() || 'text';
          result.push(<div key={`code-start-${i}`} className="code-header">{codeLang}</div>);
        }
        continue;
      }

      if (inCodeBlock) {
        codeContent += line + '\n';
        continue;
      }

      // Process markdown syntax
      let processedLine = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

      const trimmedLine = line.trim();

      // Handle unordered list items
      if (trimmedLine.startsWith('- ')) {
        if (listStack.length === 0 || listStack[listStack.length - 1].type !== 'ul') {
          flushList();
          listStack.push({ type: 'ul', items: [] });
        }
        const itemContent = processedLine.trim().slice(2);
        listStack[listStack.length - 1].items.push(
          <li key={`li-${i}`} dangerouslySetInnerHTML={{ __html: itemContent }} />
        );
        continue;
      }

      // Handle ordered list items
      const orderedMatch = trimmedLine.match(/^\d+\.\s/);
      if (orderedMatch) {
        if (listStack.length === 0 || listStack[listStack.length - 1].type !== 'ol') {
          flushList();
          listStack.push({ type: 'ol', items: [] });
        }
        const itemContent = processedLine.trim().replace(/^\d+\.\s/, '');
        listStack[listStack.length - 1].items.push(
          <li key={`li-${i}`} dangerouslySetInnerHTML={{ __html: itemContent }} />
        );
        continue;
      }

      // Flush any open list before non-list content
      if (listStack.length > 0) {
        flushList();
      }

      // Handle headings
      if (trimmedLine.startsWith('#')) {
        const level = Math.min(trimmedLine.match(/^#+/)![0].length, 6);
        const headingContent = processedLine.slice(level);
        const HeadingTag = `h${level}` as keyof React.JSX.IntrinsicElements;
        result.push(
          React.createElement(HeadingTag, {
            key: `heading-${i}`,
            dangerouslySetInnerHTML: { __html: headingContent }
          })
        );
        continue;
      }

      // Handle empty lines
      if (trimmedLine === '') {
        result.push(<br key={`br-${i}`} />);
        continue;
      }

      // Handle regular paragraphs
      if (processedLine.trim()) {
        result.push(
          <p key={`p-${i}`} dangerouslySetInnerHTML={{ __html: processedLine }} />
        );
      }
    }

    // Flush any remaining list
    flushList();

    return result;
  };

  return (
    <div className={`message-content ${isUser ? 'user-message' : 'assistant-message'}`}>
      {renderMarkdown(content)}
    </div>
  );
}

// 工具调用结果渲染器
interface ToolCallProps {
  toolName: string;
  result: any;
}

export function ToolCallResult({ toolName, result }: ToolCallProps) {
  const renderResult = () => {
    switch (toolName) {
      case 'searchFunds':
        return (
          <div className="tool-search-results">
            <div className="tool-result-header">
              <span className="tool-icon">🔍</span>
              <span>搜索结果: {result.message}</span>
            </div>
            {result.results?.map((fund: any) => (
              <div key={fund.code} className="tool-fund-item">
                <div className="fund-info">
                  <span className="fund-code">#{fund.code}</span>
                  <span className="fund-name">{fund.name}</span>
                  <span className="fund-type">{fund.type}</span>
                </div>
                <div className="fund-metrics">
                  <span>净值: {fund.nav}</span>
                  <span className={fund.change >= 0 ? 'positive' : 'negative'}>
                    {fund.change >= 0 ? '+' : ''}{fund.change}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        );

      case 'analyzePortfolio':
        return (
          <div className="tool-portfolio-analysis">
            <div className="tool-result-header">
              <span className="tool-icon">📊</span>
              <span>持仓分析</span>
            </div>
            <div className="analysis-content">
              <div className="analysis-item">
                <span>基金数量:</span>
                <strong>{result.analysis.totalFunds} 只</strong>
              </div>
              <div className="analysis-item">
                <span>分散度:</span>
                <strong>{result.analysis.diversification}</strong>
              </div>
              <div className="analysis-item">
                <span>风险等级:</span>
                <strong className={result.analysis.riskLevel === '集中' ? 'warning' : 'good'}>
                  {result.analysis.riskLevel}
                </strong>
              </div>
              <div className="analysis-suggestion">
                💡 {result.analysis.suggestion}
              </div>
            </div>
          </div>
        );

      case 'getMarketOverview':
        return (
          <div className="tool-market-overview">
            <div className="tool-result-header">
              <span className="tool-icon">📈</span>
              <span>市场概况 ({result.overview.date})</span>
            </div>
            <div className="market-metrics">
              <div className="market-item">
                <span>上证指数:</span>
                <strong className="positive">{result.overview.shanghai}</strong>
              </div>
              <div className="market-item">
                <span>深证成指:</span>
                <strong className="positive">{result.overview.shenzhen}</strong>
              </div>
              <div className="market-item">
                <span>市场情绪:</span>
                <strong>{result.overview.sentiment}</strong>
              </div>
            </div>
            <div className="market-advice">
              💡 {result.overview.advice}
            </div>
          </div>
        );

      default:
        return (
          <div className="tool-raw-result">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        );
    }
  };

  return (
    <div className="tool-call-result">
      {renderResult()}
    </div>
  );
}

export default MessageContent;

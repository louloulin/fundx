/**
 * Enhanced AI Chat Component
 *
 * 真正的 Mastra 框架实现 - 基于 Mastra Core + GLM
 *
 * 特性：
 * - 使用 Mastra Agent 的 stream() 方法
 * - 支持工具调用 (searchFunds, analyzePortfolio, etc.)
 * - Markdown 渲染
 * - 智能建议
 * - 聊天历史管理
 *
 * 架构：
 * - UI 层: EnhancedAIChat.tsx (React 组件)
 * - API 层: /api/ai/mastra-stream (使用 Mastra Agent.stream())
 * - Agent 层: lib/mastra/agents/fund-advisor.ts (Mastra Agent)
 * - 工具层: lib/mastra/agents/fund-advisor.ts (7个分析工具)
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageContent } from './MessageContent';
import { SmartSuggestions, QuickActions } from './SmartSuggestions';
import { ChatHistory, useChatHistory } from './ChatHistory';

interface FundData {
  code: string;
  name: string;
  [key: string]: any;
}

interface EnhancedAIChatProps {
  funds?: FundData[];
}

export function EnhancedAIChat({ funds = [] }: EnhancedAIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showConfigNotice, setShowConfigNotice] = useState(false);
  const [apiConfigured, setApiConfigured] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 窗口尺寸状态：'normal' | 'minimized' | 'maximized' | 'fullscreen'
  const [windowSize, setWindowSize] = useState<'normal' | 'minimized' | 'maximized' | 'fullscreen'>('normal');

  // 聊天历史管理
  const {
    sessions,
    currentSessionId,
    createNewSession,
    updateSession,
    deleteSession,
    exportSession,
    setCurrentSessionId,
  } = useChatHistory();

  // 获取当前会话的消息
  const getCurrentSessionMessages = () => {
    const session = sessions.find(s => s.id === currentSessionId);
    return session?.messages || [];
  };

  // 初始化会话
  useEffect(() => {
    if (sessions.length === 0) {
      createNewSession();
    }
  }, []);

  // 检查 API 配置状态
  useEffect(() => {
    checkApiConfig();
  }, []);

  const checkApiConfig = async () => {
    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      setApiConfigured(data.configured);
    } catch (error) {
      console.error('Failed to check API config:', error);
      setApiConfigured(false);
    }
  };

  const currentMessages = getCurrentSessionMessages();

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // 发送消息（流式响应）
  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    setIsLoading(true);

    // 添加用户消息
    const userMessage = {
      id: `msg_${Date.now()}`,
      role: 'user' as const,
      content,
    };
    const updatedMessages = [...currentMessages, userMessage];
    updateSession(currentSessionId, updatedMessages);

    // 创建一个空的 AI 消息用于流式更新
    const aiMessageId = `msg_${Date.now()}_assistant`;
    const aiMessage = {
      id: aiMessageId,
      role: 'assistant' as const,
      content: '',
      tool_calls: [] as any[],
    };

    try {
      // 调用真正的 Mastra Streaming API (基于 Mastra 框架的 Agent.stream() 方法)
      const response = await fetch('/api/ai/mastra-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let buffer = '';
      let toolCalls: any[] = [];

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // 保留最后一个不完整的行
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const data = JSON.parse(line);

            switch (data.type) {
              case 'start':
                // 开始流式响应
                aiMessage.content = '';
                break;

              case 'tool_calls':
                // 工具调用开始
                toolCalls = data.tool_calls;
                aiMessage.tool_calls = toolCalls;
                break;

              case 'tool_start':
                // 工具执行开始 - 设置工具调用状态，不修改 content
                aiMessage.tool_calls = [...(aiMessage.tool_calls || []), {
                  name: data.tool_name,
                  status: 'running'
                }];
                break;

              case 'tool_result':
                // 工具执行完成 - 更新工具状态
                if (aiMessage.tool_calls) {
                  aiMessage.tool_calls = aiMessage.tool_calls.map(tc =>
                    tc.name === data.tool_name ? { ...tc, status: 'completed' } : tc
                  );
                }
                break;

              case 'content':
                // 流式内容更新
                aiMessage.content += data.content;
                break;

              case 'done':
                // 流式响应完成
                break;

              case 'error':
                throw new Error(data.error);
            }

            // 实时更新消息
            updateSession(currentSessionId, [...updatedMessages, { ...aiMessage }]);
          } catch (e) {
            console.error('Parse error:', e);
          }
        }
      }

      // 最终更新
      const finalMessages = [...updatedMessages, aiMessage];
      updateSession(currentSessionId, finalMessages);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMsg = error.message === 'ZHIPU_API_KEY is not configured'
        ? 'AI 功能需要配置 API 密钥。请点击右下角的"配置指南"了解如何配置。'
        : '抱歉，服务暂时不可用，请稍后重试。';

      const errorMessages = [
        ...updatedMessages,
        {
          id: `msg_${Date.now()}_error`,
          role: 'assistant',
          content: errorMsg,
        },
      ];
      updateSession(currentSessionId, errorMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (question: string) => {
    handleSendMessage(question);
  };

  // 新建会话
  const handleNewSession = () => {
    createNewSession();
  };

  // 切换会话
  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  // 删除会话
  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
  };

  // 导出会话
  const handleExportSession = (sessionId: string) => {
    exportSession(sessionId);
  };

  // 打开聊天窗口
  const handleOpenChat = () => {
    if (!apiConfigured) {
      setShowConfigNotice(true);
    } else {
      setIsOpen(true);
    }
  };

  // 统一的渲染函数
  return (
    <>
      {/* 聊天按钮 - 当窗口未打开时显示 */}
      {!isOpen && (
        <>
          <button
            onClick={handleOpenChat}
            className="ai-chat-button"
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(180deg, #0ea5e9, #22d3ee)',
              border: 'none',
              color: '#05263b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 30px rgba(34,211,238,0.3)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              zIndex: 100,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(34,211,238,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(34,211,238,0.3)';
            }}
            title="AI 投资顾问"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>

          <QuickActions
            onSearch={() => {
              if (!apiConfigured) {
                setShowConfigNotice(true);
                return;
              }
              setIsOpen(true);
              setTimeout(() => handleSuggestionClick('帮我搜索一些优质的科技类基金'), 100);
            }}
            onAnalyze={() => {
              if (!apiConfigured) {
                setShowConfigNotice(true);
                return;
              }
              if (funds.length === 0) {
                alert('请先添加基金到持仓');
                return;
              }
              setIsOpen(true);
              const fundCodes = funds.map(f => f.code).join(',');
              setTimeout(() => handleSuggestionClick(`分析我的持仓: ${fundCodes}`), 100);
            }}
            onRecommend={() => {
              if (!apiConfigured) {
                setShowConfigNotice(true);
                return;
              }
              setIsOpen(true);
              setTimeout(() => handleSuggestionClick('根据我的情况推荐一些基金'), 100);
            }}
          />
        </>
      )}

      {/* API 配置提示 */}
      {showConfigNotice && (
        <div
          onClick={() => setShowConfigNotice(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#111827',
              border: '1px solid #1f2937',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(180deg, #f59e0b, #ef4444)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#e5e7eb', fontSize: '18px', fontWeight: 600 }}>
                  需要配置 AI 功能
                </h3>
              </div>
            </div>

            <div style={{ marginBottom: '20px', color: '#9ca3af', lineHeight: '1.6' }}>
              <p style={{ margin: '0 0 12px 0' }}>
                AI Chat 功能需要配置 API 密钥才能使用。我们推荐使用 <strong>Zhipu AI (智谱AI)</strong>：
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#e5e7eb' }}>
                <li style={{ marginBottom: '8px' }}>✅ 成本仅为 OpenAI 的 5%</li>
                <li style={{ marginBottom: '8px' }}>✅ GLM-4V-Flash 视觉模型完全免费</li>
                <li style={{ marginBottom: '8px' }}>✅ 中文优化，更适合国内用户</li>
              </ul>
            </div>

            <div
              style={{
                background: '#0b1220',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px',
              }}
            >
              <h4 style={{ margin: '0 0 12px 0', color: '#e5e7eb', fontSize: '14px', fontWeight: 600 }}>
                配置步骤：
              </h4>
              <ol style={{ margin: 0, paddingLeft: '20px', color: '#9ca3af', fontSize: '14px' }}>
                <li style={{ marginBottom: '8px' }}>
                  访问{' '}
                  <a
                    href="https://open.bigmodel.cn/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#22d3ee', textDecoration: 'none' }}
                  >
                    https://open.bigmodel.cn/
                  </a>{' '}
                  注册/登录
                </li>
                <li style={{ marginBottom: '8px' }}>进入"API Keys"页面，创建新的 API Key</li>
                <li style={{ marginBottom: '8px' }}>
                  编辑项目根目录的 <code style={{ background: '#1f2937', padding: '2px 6px', borderRadius: '4px' }}>/.env.local</code>{' '}
                  文件
                </li>
                <li style={{ marginBottom: '8px' }}>
                  将 API Key 填入：<code style={{ background: '#1f2937', padding: '2px 6px', borderRadius: '4px' }}>ZHIPU_API_KEY=your_key_here</code>
                </li>
                <li>重启开发服务器</li>
              </ol>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => window.open('https://open.bigmodel.cn/', '_blank')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #1f2937',
                  background: 'transparent',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(34, 211, 238, 0.1)';
                  e.currentTarget.style.borderColor = '#22d3ee';
                  e.currentTarget.style.color = '#22d3ee';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = '#1f2937';
                  e.currentTarget.style.color = '#9ca3af';
                }}
              >
                获取 API Key
              </button>
              <button
                onClick={() => setShowConfigNotice(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(180deg, #0ea5e9, #22d3ee)',
                  color: '#05263b',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'transform 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 聊天窗口 */}
      {isOpen && (
        <div
          className="ai-chat-window enhanced"
          style={{
            position: windowSize === 'fullscreen' ? 'fixed' : 'fixed',
            top: windowSize === 'fullscreen' ? 0 : 'auto',
            left: windowSize === 'fullscreen' ? 0 : 'auto',
            bottom: windowSize === 'fullscreen' ? 0 : '24px',
            right: windowSize === 'fullscreen' ? 0 : '24px',
            width: windowSize === 'fullscreen' ? '100vw' : windowSize === 'maximized' ? 'calc(100vw - 48px)' : windowSize === 'minimized' ? '340px' : '520px',
            maxWidth: windowSize === 'fullscreen' ? '100vw' : windowSize === 'maximized' ? 'calc(100vw - 48px)' : 'calc(100vw - 48px)',
            height: windowSize === 'fullscreen' ? '100vh' : windowSize === 'maximized' ? 'calc(100vh - 48px)' : windowSize === 'minimized' ? '60px' : '700px',
            maxHeight: windowSize === 'fullscreen' ? '100vh' : windowSize === 'maximized' ? 'calc(100vh - 48px)' : 'calc(100vh - 48px)',
            background: '#111827',
            border: windowSize === 'fullscreen' ? 'none' : '1px solid #1f2937',
            borderRadius: windowSize === 'fullscreen' ? '0' : '16px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: windowSize === 'fullscreen' ? 'none' : '0 20px 60px rgba(0,0,0,0.5)',
            zIndex: windowSize === 'fullscreen' ? 9999 : 100,
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* 头部 */}
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid #1f2937',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(180deg, #0ea5e9, #22d3ee)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#05263b" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#e5e7eb' }}>AI 投资顾问</div>
                <div style={{ fontSize: '12px', color: '#22d3ee' }}>Mastra + GLM 框架</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {/* 全屏切换按钮 */}
              {windowSize !== 'minimized' && (
                <button
                  onClick={() => {
                    if (windowSize === 'fullscreen') {
                      setWindowSize('normal');
                    } else {
                      setWindowSize('fullscreen');
                    }
                  }}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={windowSize === 'fullscreen' ? '退出全屏' : '全屏'}
                >
                  {windowSize === 'fullscreen' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    </svg>
                  )}
                </button>
              )}

              {/* 最大化/还原按钮 */}
              {windowSize !== 'minimized' && windowSize !== 'fullscreen' && (
                <button
                  onClick={() => {
                    if (windowSize === 'maximized') {
                      setWindowSize('normal');
                    } else {
                      setWindowSize('maximized');
                    }
                  }}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={windowSize === 'maximized' ? '还原' : '最大化'}
                >
                  {windowSize === 'maximized' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="4" y="4" width="14" height="14" rx="2" />
                      <path d="M15 15l5 5M20 15v5M15 20h5" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                    </svg>
                  )}
                </button>
              )}

              {/* 最小化/展开按钮 */}
              <button
                onClick={() => {
                  if (windowSize === 'minimized') {
                    setWindowSize('normal');
                  } else {
                    setWindowSize('minimized');
                  }
                }}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={windowSize === 'minimized' ? '展开' : '最小化'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {windowSize === 'minimized' ? (
                    <path d="M5 15l7-7 7 7-7" />
                  ) : (
                    <path d="M19 9l-7 7-7-7" />
                  )}
                </svg>
              </button>

              {/* 关闭按钮 */}
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="关闭"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* 聊天历史按钮 */}
          <div
            style={{
              padding: '8px 16px',
              borderBottom: '1px solid #1f2937',
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
            }}
          >
            <button
              onClick={handleNewSession}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #1f2937',
                background: 'transparent',
                color: '#9ca3af',
                fontSize: '12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              + 新对话
            </button>
            <button
              onClick={() => setShowConfigNotice(true)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #1f2937',
                background: 'transparent',
                color: '#9ca3af',
                fontSize: '12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              ⚙️ 配置
            </button>
          </div>

          {/* 消息列表 */}
          {windowSize !== 'minimized' && (
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: windowSize === 'fullscreen' ? '24px' : '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {currentMessages.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: '#9ca3af',
                  padding: windowSize === 'fullscreen' ? '80px 40px' : '40px 20px'
                }}>
                  <div style={{ fontSize: windowSize === 'fullscreen' ? '48px' : '24px', marginBottom: '12px' }}>👋</div>
                  <div style={{ fontSize: windowSize === 'fullscreen' ? '18px' : '14px', marginBottom: '8px' }}>开始新的对话</div>
                  <div style={{ fontSize: windowSize === 'fullscreen' ? '14px' : '12px' }}>试试问我关于基金投资的问题</div>
                </div>
              ) : (
                currentMessages.map((message) => (
                  <div
                    key={message.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      maxWidth: message.role === 'user' ? (windowSize === 'fullscreen' ? '60%' : '80%') : '100%',
                      alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <MessageContent content={message.content} isUser={message.role === 'user'} />
                    {message.tool_calls && (
                      <div style={{ fontSize: '12px', color: '#22d3ee', marginTop: '4px' }}>
                        🔧 使用工具获取数据...
                      </div>
                    )}
                  </div>
                ))
              )}
              {isLoading && (
                <div style={{ alignSelf: 'flex-start' }}>
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: '#0b1220',
                      border: '1px solid #1f2937',
                      display: 'flex',
                      gap: '4px',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#22d3ee',
                        animation: 'bounce 1.4s infinite ease-in-out both',
                      }}
                    />
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#22d3ee',
                        animation: 'bounce 1.4s infinite ease-in-out both 0.16s',
                      }}
                    />
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#22d3ee',
                        animation: 'bounce 1.4s infinite ease-in-out both 0.32s',
                      }}
                    />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* 智能建议 */}
          {windowSize !== 'minimized' && currentMessages.length <= 1 && (
            <SmartSuggestions
              funds={funds}
              onSelectSuggestion={handleSuggestionClick}
              onClose={() => {}}
            />
          )}

          {/* 输入框 */}
          {windowSize !== 'minimized' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.elements.namedItem('message-input') as HTMLInputElement;
                if (input.value.trim()) {
                  handleSendMessage(input.value);
                  input.value = '';
                }
              }}
              style={{
                padding: windowSize === 'fullscreen' ? '16px 24px' : '12px 16px',
                borderTop: '1px solid #1f2937',
                display: 'flex',
                gap: '8px',
              }}
            >
              <input
                name="message-input"
                placeholder="向 AI 顾问提问..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  height: windowSize === 'fullscreen' ? '52px' : '44px',
                  padding: '0 14px',
                  borderRadius: '12px',
                  border: '1px solid #1f2937',
                  background: '#0b1220',
                  color: '#e5e7eb',
                  outline: 'none',
                  fontSize: windowSize === 'fullscreen' ? '15px' : '14px',
                }}
              />
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  height: windowSize === 'fullscreen' ? '52px' : '44px',
                  padding: windowSize === 'fullscreen' ? '0 20px' : '0 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isLoading ? '#374151' : 'linear-gradient(180deg, #0ea5e9, #22d3ee)',
                  color: '#05263b',
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {isLoading ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spin">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }

        .spin {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}

export default EnhancedAIChat;

/**
 * AI Advisor Chat Component
 *
 * AI 投顾聊天组件
 * 提供智能基金投资建议
 *
 * Features:
 * - 流式响应
 * - 智能建议问题
 * - 对话历史管理
 * - 自适应主题
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  '帮我推荐一些低风险的债券基金',
  '分析一下我当前的持仓风险',
  '哪些科技类基金值得长期持有？',
  '根据我的偏好优化投资组合',
  '解释一下什么是夏普比率',
];

export function AIAdvisorChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, append, error } = useChat({
    api: '/api/ai/chat',
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: '你好！我是你的智能基金投资顾问。我可以帮你：\n\n📊 基金搜索与分析\n💡 投资建议与推荐\n⚠️ 风险评估\n📈 持仓优化\n\n有什么可以帮到你的吗？',
      },
    ],
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSuggestionClick = (question: string) => {
    append({ role: 'user', content: question });
  };

  // 清除对话历史
  const handleClearHistory = () => {
    // 重新加载页面或清除消息
    window.location.reload();
  };

  return (
    <>
      {/* 聊天按钮 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
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
      )}

      {/* 聊天窗口 */}
      {isOpen && (
        <div
          className="ai-chat-window"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '400px',
            maxWidth: 'calc(100vw - 48px)',
            height: '600px',
            maxHeight: 'calc(100vh - 48px)',
            background: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            zIndex: 100,
            overflow: 'hidden',
          }}
        >
          {/* 头部 */}
          <div
            className="ai-chat-header"
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
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>智能基金投资助手</div>
              </div>
            </div>
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
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.color = '#f87171';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#9ca3af';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 消息列表 */}
          <div
            className="ai-chat-messages"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`ai-message ${message.role === 'user' ? 'user' : 'assistant'}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  maxWidth: message.role === 'user' ? '80%' : '100%',
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: message.role === 'user'
                      ? 'linear-gradient(180deg, #0ea5e9, #22d3ee)'
                      : '#0b1220',
                    color: message.role === 'user' ? '#05263b' : '#e5e7eb',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    border: message.role === 'assistant' ? '1px solid #1f2937' : 'none',
                  }}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="ai-message assistant" style={{ alignSelf: 'flex-start' }}>
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

          {/* 建议问题 */}
          {messages.length <= 1 && (
            <div
              className="ai-chat-suggestions"
              style={{
                padding: '0 16px 12px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              {SUGGESTED_QUESTIONS.slice(0, 3).map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(question)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #1f2937',
                    background: 'transparent',
                    color: '#9ca3af',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
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
                  {question}
                </button>
              ))}
            </div>
          )}

          {/* 输入框 */}
          <form
            onSubmit={handleSubmit}
            className="ai-chat-input-form"
            style={{
              padding: '12px 16px',
              borderTop: '1px solid #1f2937',
              display: 'flex',
              gap: '8px',
            }}
          >
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="向 AI 顾问提问..."
              disabled={isLoading}
              style={{
                flex: 1,
                height: '44px',
                padding: '0 14px',
                borderRadius: '12px',
                border: '1px solid #1f2937',
                background: '#0b1220',
                color: '#e5e7eb',
                outline: 'none',
                fontSize: '14px',
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                height: '44px',
                padding: '0 16px',
                borderRadius: '12px',
                border: 'none',
                background: isLoading || !input.trim()
                  ? '#374151'
                  : 'linear-gradient(180deg, #0ea5e9, #22d3ee)',
                color: '#05263b',
                fontWeight: 600,
                cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.2s ease',
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

export default AIAdvisorChat;

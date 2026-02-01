/**
 * Chat History and Session Management
 *
 * 聊天历史和会话管理组件
 */

'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  messages: any[];
}

interface ChatHistoryProps {
  currentSessionId: string;
  sessions: ChatSession[];
  onNewSession: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onExportSession: (id: string) => void;
}

export function ChatHistory({
  currentSessionId,
  sessions,
  onNewSession,
  onSelectSession,
  onDeleteSession,
  onExportSession,
}: ChatHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectSession = (id: string) => {
    onSelectSession(id);
    setIsOpen(false);
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);

  return typeof document === 'undefined' ? null : createPortal(
    <>
      {/* 历史按钮 */}
      <button
        className="chat-history-button"
        onClick={() => setIsOpen(!isOpen)}
        title="聊天历史"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0" />
        </svg>
      </button>

      {/* 历史侧边栏 */}
      {isOpen && (
        <>
          <div className="chat-history-overlay" onClick={() => setIsOpen(false)} />
          <div className="chat-history-sidebar">
            <div className="chat-history-header">
              <h3>对话历史</h3>
              <button
                className="icon-button"
                onClick={() => setIsOpen(false)}
                title="关闭"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="chat-history-actions">
              <button className="new-chat-button" onClick={onNewSession}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                新建对话
              </button>
            </div>

            <div className="chat-sessions-list">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`chat-session-item ${session.id === currentSessionId ? 'active' : ''}`}
                  onClick={() => handleSelectSession(session.id)}
                >
                  <div className="session-info">
                    <div className="session-title">
                      {session.title || '新对话'}
                    </div>
                    <div className="session-time">
                      {new Date(session.createdAt).toLocaleDateString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <div className="session-actions">
                    <button
                      className="session-action-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onExportSession(session.id);
                      }}
                      title="导出"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                      </svg>
                    </button>
                    <button
                      className="session-action-button delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('确定删除这个对话吗？')) {
                          onDeleteSession(session.id);
                        }
                      }}
                      title="删除"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {currentSession && (
              <div className="session-detail">
                <div className="session-detail-header">
                  <span>当前对话</span>
                </div>
                <div className="session-stats">
                  <div className="session-stat">
                    <span>消息数</span>
                    <strong>{currentSession.messages.length}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>,
    document.body
  );
}

// 聊天历史 Hook
export function useChatHistory() {
  const [sessions, setSessions] = React.useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = React.useState<string>('');

  React.useEffect(() => {
    // 加载会话历史
    const saved = localStorage.getItem('chatSessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) {
          setCurrentSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error('Failed to load chat sessions:', e);
      }
    }
  }, []);

  const saveSessions = (newSessions: ChatSession[]) => {
    setSessions(newSessions);
    localStorage.setItem('chatSessions', JSON.stringify(newSessions));
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: '新对话',
      createdAt: Date.now(),
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: '你好！我是你的智能基金投资顾问。有什么可以帮到你的吗？',
        },
      ],
    };
    const newSessions = [newSession, ...sessions];
    saveSessions(newSessions);
    setCurrentSessionId(newSession.id);
    return newSession;
  };

  const updateSession = (sessionId: string, messages: any[]) => {
    const updatedSessions = sessions.map(session => {
      if (session.id === sessionId) {
        // 自动生成标题（使用第一条用户消息）
        const firstUserMessage = messages.find(m => m.role === 'user');
        const title = firstUserMessage
          ? firstUserMessage.content.slice(0, 20) + (firstUserMessage.content.length > 20 ? '...' : '')
          : session.title;
        return {
          ...session,
          title,
          messages,
        };
      }
      return session;
    });
    saveSessions(updatedSessions);
  };

  const deleteSession = (sessionId: string) => {
    let newSessions = sessions.filter(s => s.id !== sessionId);
    if (sessionId === currentSessionId) {
      if (newSessions.length > 0) {
        setCurrentSessionId(newSessions[0].id);
      } else {
        const newSession = createNewSession();
        return newSession;
      }
    }
    saveSessions(newSessions);
  };

  const exportSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const content = session.messages
      .map((m: any) => `${m.role === 'user' ? '我' : 'AI'}: ${m.content}`)
      .join('\n\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${session.title}-${new Date(session.createdAt).toLocaleDateString('zh-CN')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    sessions,
    currentSessionId,
    createNewSession,
    updateSession,
    deleteSession,
    exportSession,
    setCurrentSessionId,
  };
}

export default ChatHistory;

/**
 * Smart Suggestions Panel
 *
 * 动态生成的智能建议问题
 */

'use client';

import React from 'react';

interface SmartSuggestionsProps {
  funds: any[];
  onSelectSuggestion: (question: string) => void;
  onClose?: () => void;
}

export function SmartSuggestions({ funds, onSelectSuggestion, onClose }: SmartSuggestionsProps) {
  // 根据用户持仓动态生成建议
  const generateSuggestions = () => {
    const suggestions = [
      {
        icon: '🔍',
        text: '搜索优质科技基金',
        action: () => '帮我搜索一些科技类的优质基金'
      },
      {
        icon: '📊',
        text: '分析市场概况',
        action: () => '今天市场表现怎么样？有什么热点板块？'
      },
    ];

    // 根据持仓数量添加建议
    if (funds.length === 0) {
      suggestions.unshift({
        icon: '💡',
        text: '新手入门指南',
        action: () => '我是新手，应该如何开始基金投资？'
      });
      suggestions.unshift({
        icon: '📚',
        text: '基金基础知识',
        action: () => '请解释什么是净值、涨跌幅、夏普比率等概念'
      });
    } else if (funds.length >= 1 && funds.length <= 3) {
      const fundCodes = funds.map(f => f.code).join(',');
      suggestions.unshift({
        icon: '📊',
        text: '分析我的持仓',
        action: () => `分析一下我的持仓: ${fundCodes}`
      });
    } else if (funds.length > 3) {
      suggestions.unshift({
        icon: '⚖️',
        text: '持仓风险评估',
        action: () => '我的持仓是否过于集中？应该如何优化？'
      });
      suggestions.unshift({
        icon: '🔄',
        text: '组合优化建议',
        action: () => '根据我的持仓给出优化建议'
      });
    }

    // 添加快速操作
    suggestions.push({
      icon: '📈',
      text: '今日涨幅榜',
      action: () => '今天涨幅最好的基金有哪些？'
    });

    suggestions.push({
      icon: '💰',
      text: '债券基金推荐',
      action: () => '推荐一些稳健的债券基金'
    });

    return suggestions.slice(0, 4);
  };

  const suggestions = generateSuggestions();

  const handleClick = (suggestion: any) => {
    onSelectSuggestion(suggestion.action());
    onClose?.();
  };

  return (
    <div style={{
      padding: '0 16px 12px',
    }}>
      <div style={{
        fontSize: '12px',
        color: '#9ca3af',
        marginBottom: '8px',
        fontWeight: 500,
      }}>
        💡 智能建议
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '8px',
      }}>
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleClick(suggestion)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px',
              background: 'rgba(34, 211, 238, 0.08)',
              border: '1px solid rgba(34, 211, 238, 0.15)',
              borderRadius: '10px',
              color: '#e5e7eb',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left',
              width: '100%',
              boxSizing: 'border-box',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(34, 211, 238, 0.15)';
              e.currentTarget.style.borderColor = '#22d3ee';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(34, 211, 238, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.15)';
            }}
          >
            <span style={{
              fontSize: '16px',
              flexShrink: 0,
              lineHeight: 1,
            }}>{suggestion.icon}</span>
            <span style={{
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>{suggestion.text}</span>
            <span style={{
              color: '#22d3ee',
              fontSize: '14px',
              flexShrink: 0,
            }}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// 快速操作按钮组
interface QuickActionsProps {
  onSearch: () => void;
  onAnalyze: () => void;
  onRecommend: () => void;
}

export function QuickActions({ onSearch, onAnalyze, onRecommend }: QuickActionsProps) {
  const actions = [
    { icon: '🔍', label: '搜索基金', action: onSearch },
    { icon: '📊', label: '持仓分析', action: onAnalyze },
    { icon: '💡', label: '智能推荐', action: onRecommend },
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: '100px',
      right: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      zIndex: 99,
    }}>
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.action}
          title={action.label}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(17, 24, 39, 0.9)',
            border: '1px solid rgba(34, 211, 238, 0.3)',
            color: '#22d3ee',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.background = 'rgba(34, 211, 238, 0.15)';
            e.currentTarget.style.borderColor = '#22d3ee';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.background = 'rgba(17, 24, 39, 0.9)';
            e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.3)';
          }}
        >
          <span>{action.icon}</span>
        </button>
      ))}
    </div>
  );
}

export default SmartSuggestions;

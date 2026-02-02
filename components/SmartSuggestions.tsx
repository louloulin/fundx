/**
 * Smart Suggestions Panel
 *
 * 动态生成的智能建议问题
 * 增强版：集成基金分析功能
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
    const suggestions: any[] = [];

    // 基础分析建议（无持仓时）
    if (funds.length === 0) {
      suggestions.push(
        {
          icon: '💡',
          text: '新手入门指南',
          action: () => '我是新手，应该如何开始基金投资？'
        },
        {
          icon: '📚',
          text: '基金基础知识',
          action: () => '请解释什么是净值、涨跌幅、夏普比率等概念'
        },
        {
          icon: '🔍',
          text: '搜索优质科技基金',
          action: () => '帮我搜索一些科技类的优质基金'
        }
      );
    }

    // 单只基金深度分析
    if (funds.length === 1) {
      const fund = funds[0];
      suggestions.push(
        {
          icon: '🔬',
          text: `深度分析 ${fund.name}`,
          action: () => `对 ${fund.name}(${fund.code}) 进行全面深度分析，包括理论分析和资料搜索`
        },
        {
          icon: '📊',
          text: '多维度风险评估',
          action: () => `从 MPT、CAPM、Fama-French 等多个角度分析 ${fund.code}`
        },
        {
          icon: '📰',
          text: '搜索基金相关资料',
          action: () => `搜索 ${fund.name} 的最新公告、研报和新闻`
        }
      );
    }

    // 多只基金组合分析
    if (funds.length >= 2 && funds.length <= 5) {
      const fundCodes = funds.map(f => f.code).join(', ');
      suggestions.push(
        {
          icon: '⚖️',
          text: '持仓组合分析',
          action: () => `分析我的持仓组合: ${fundCodes}，评估风险和收益`
        },
        {
          icon: '🎯',
          text: '相关性分析',
          action: () => `分析这些基金的相关性，是否存在重复配置`
        },
        {
          icon: '📈',
          text: '组合优化建议',
          action: () => '根据现代投资组合理论，给出优化建议'
        }
      );
    }

    // 大额持仓分析
    if (funds.length > 5) {
      suggestions.push(
        {
          icon: '⚠️',
          text: '集中度风险评估',
          action: () => '我的持仓是否过于集中？是否存在行业过度暴露？'
        },
        {
          icon: '🔄',
          text: '再平衡建议',
          action: () => '根据市场变化，我的持仓是否需要再平衡？'
        }
      );
    }

    // 市场分析（始终可用）
    suggestions.push(
      {
        icon: '📊',
        text: '分析市场概况',
        action: () => '今天市场表现怎么样？有什么热点板块？'
      }
    );

    // 技术分析（有持仓时）
    if (funds.length > 0) {
      const topFund = funds[0];
      suggestions.push({
        icon: '📈',
        text: '技术面分析',
        action: () => `使用 MACD、布林带等技术指标分析 ${topFund.name}`
      });
    }

    return suggestions.slice(0, 6);
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

// 快速操作按钮组（增强版）
interface QuickActionsProps {
  onSearch: () => void;
  onAnalyze: () => void;
  onRecommend: () => void;
  funds?: any[];
}

export function QuickActions({ onSearch, onAnalyze, onRecommend, funds = [] }: QuickActionsProps) {
  const actions = [
    { icon: '🔍', label: '搜索基金', action: onSearch },
    { icon: '📊', label: '持仓分析', action: onAnalyze },
    { icon: '💡', label: '智能推荐', action: onRecommend },
  ];

  // 如果有持仓，添加深度分析按钮
  if (funds.length > 0) {
    actions.push({
      icon: '🔬',
      label: '深度分析',
      action: () => {/* 在实际使用中需要传递处理函数 */}
    });
  }

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

/**
 * Smart Recommendations Component
 *
 * 智能推荐组件
 * 根据用户偏好推荐基金
 */

'use client';

import React, { useState } from 'react';

interface UserPreferences {
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentHorizon: 'short' | 'medium' | 'long';
  investmentGoal: 'preservation' | 'steady' | 'growth' | 'aggressive';
}

interface FundRecommendation {
  fund: {
    code: string;
    name: string;
    type: string;
  };
  score: {
    totalScore: number;
    rating: string;
    performance: number;
    risk: number;
  };
  matchReasons: string[];
  riskLevel: 'low' | 'medium' | 'high';
  expectedReturn: number;
  expectedRisk: number;
}

interface RAGDocument {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  relevanceScore: number;
}

interface RAGResult {
  relevantDocuments: RAGDocument[];
  ragAdvice: string;
}

const RISK_OPTIONS = [
  { value: 'conservative', label: '保守', description: '低风险，追求稳定收益' },
  { value: 'moderate', label: '稳健', description: '中等风险，平衡收益与风险' },
  { value: 'aggressive', label: '激进', description: '高风险，追求高收益' },
];

const HORIZON_OPTIONS = [
  { value: 'short', label: '短期（<1年）' },
  { value: 'medium', label: '中期（1-3年）' },
  { value: 'long', label: '长期（>3年）' },
];

const GOAL_OPTIONS = [
  { value: 'preservation', label: '资产保值' },
  { value: 'steady', label: '稳健增长' },
  { value: 'growth', label: '积极成长' },
  { value: 'aggressive', label: '激进增值' },
];

export function SmartRecommendations() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    riskTolerance: 'moderate',
    investmentHorizon: 'medium',
    investmentGoal: 'steady',
  });

  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<FundRecommendation[]>([]);
  const [advice, setAdvice] = useState<string>('');
  const [showResults, setShowResults] = useState(false);
  const [ragResult, setRagResult] = useState<RAGResult | null>(null);
  const [userQuery, setUserQuery] = useState<string>('');

  const handleGetRecommendations = async () => {
    setLoading(true);
    setShowResults(false);
    setRagResult(null);

    try {
      // Call both recommendation APIs in parallel
      const [recommendResponse, ragResponse] = await Promise.all([
        fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(preferences),
        }),
        // Only call RAG API if user provided a query
        userQuery.trim() ? fetch('/api/rag/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: userQuery,
            preferences,
          }),
        }) : Promise.resolve(null),
      ]);

      if (!recommendResponse.ok) {
        throw new Error('获取推荐失败');
      }

      const recommendData = await recommendResponse.json();

      if (recommendData.success) {
        setRecommendations(recommendData.data.recommendations);
        setAdvice(recommendData.data.advice);
        setShowResults(true);
      }

      // Process RAG results if query was provided
      if (ragResponse && ragResponse.ok) {
        const ragData = await ragResponse.json();
        if (ragData.success) {
          setRagResult({
            relevantDocuments: ragData.data.relevantContext || [],
            ragAdvice: ragData.data.advice || '',
          });
        }
      }
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      alert('获取推荐失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'AAA': return '#22c55e';
      case 'AA': return '#84cc16';
      case 'A': return '#eab308';
      case 'BBB': return '#f97316';
      case 'BB': return '#ef4444';
      case 'B': return '#dc2626';
      default: return '#991b1b';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'low': return '低风险';
      case 'medium': return '中等风险';
      case 'high': return '高风险';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return '#22c55e';
      case 'medium': return '#eab308';
      case 'high': return '#ef4444';
    }
  };

  return (
    <div className="smart-recommendations">
      <div className="card" style={{ padding: '20px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>
          智能推荐
        </h2>

        {/* 偏好设置 */}
        <div className="preferences-form" style={{ marginBottom: '20px' }}>
          {/* 风险偏好 */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#9ca3af' }}>
              风险偏好
            </label>
            <div className="chips" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {RISK_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`chip ${preferences.riskTolerance === option.value ? 'active' : ''}`}
                  onClick={() => setPreferences({ ...preferences, riskTolerance: option.value as any })}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${preferences.riskTolerance === option.value ? '#22d3ee' : '#1f2937'}`,
                    background: preferences.riskTolerance === option.value ? 'rgba(34, 211, 238, 0.1)' : 'transparent',
                    color: preferences.riskTolerance === option.value ? '#22d3ee' : '#9ca3af',
                    cursor: 'pointer',
                    fontSize: '13px',
                    transition: 'all 0.2s ease',
                  }}
                  title={option.description}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 投资期限 */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#9ca3af' }}>
              投资期限
            </label>
            <div className="chips" style={{ display: 'flex', gap: '8px' }}>
              {HORIZON_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`chip ${preferences.investmentHorizon === option.value ? 'active' : ''}`}
                  onClick={() => setPreferences({ ...preferences, investmentHorizon: option.value as any })}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${preferences.investmentHorizon === option.value ? '#22d3ee' : '#1f2937'}`,
                    background: preferences.investmentHorizon === option.value ? 'rgba(34, 211, 238, 0.1)' : 'transparent',
                    color: preferences.investmentHorizon === option.value ? '#22d3ee' : '#9ca3af',
                    cursor: 'pointer',
                    fontSize: '13px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 投资目标 */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#9ca3af' }}>
              投资目标
            </label>
            <select
              value={preferences.investmentGoal}
              onChange={(e) => setPreferences({ ...preferences, investmentGoal: e.target.value as any })}
              style={{
                width: '100%',
                height: '40px',
                padding: '0 12px',
                borderRadius: '8px',
                border: '1px solid #1f2937',
                background: '#0b1220',
                color: '#e5e7eb',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {GOAL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* RAG 智能查询 */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#9ca3af' }}>
              <span style={{ color: '#22d3ee' }}>🤖</span> 智能问答（可选）
            </label>
            <input
              type="text"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="例如：我想投资债券基金，有什么建议？"
              style={{
                width: '100%',
                height: '44px',
                padding: '0 12px',
                borderRadius: '8px',
                border: '1px solid #1f2937',
                background: '#0b1220',
                color: '#e5e7eb',
                outline: 'none',
                fontSize: '13px',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => e.target.style.borderColor = '#22d3ee'}
              onBlur={(e) => e.target.style.borderColor = '#1f2937'}
            />
            <div style={{ marginTop: '6px', fontSize: '11px', color: '#6b7280' }}>
              💡 输入问题将基于基金研究知识库为您提供专业建议
            </div>
          </div>

          <button
            onClick={handleGetRecommendations}
            disabled={loading}
            style={{
              width: '100%',
              height: '44px',
              borderRadius: '12px',
              border: 'none',
              background: loading
                ? '#374151'
                : 'linear-gradient(180deg, #0ea5e9, #22d3ee)',
              color: '#05263b',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.15s ease',
            }}
          >
            {loading ? 'AI 分析中...' : '获取智能推荐'}
          </button>
        </div>

        {/* 推荐结果 */}
        {showResults && recommendations.length > 0 && (
          <div className="recommendations-results" style={{ marginTop: '24px' }}>
            {/* RAG 智能分析结果 */}
            {ragResult && ragResult.relevantDocuments.length > 0 && (
              <div className="rag-results" style={{
                padding: '16px',
                background: 'rgba(168, 85, 247, 0.05)',
                border: '1px solid rgba(168, 85, 247, 0.2)',
                borderRadius: '12px',
                marginBottom: '20px',
              }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#a855f7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📚</span>
                  <span>知识库分析</span>
                </h4>

                {ragResult.ragAdvice && (
                  <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(168, 85, 247, 0.1)' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', lineHeight: '1.6' }}>
                      {ragResult.ragAdvice}
                    </p>
                  </div>
                )}

                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                  相关研究资料：
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {ragResult.relevantDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        padding: '10px',
                        background: 'rgba(168, 85, 247, 0.05)',
                        border: '1px solid rgba(168, 85, 247, 0.1)',
                        borderRadius: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#e5e7eb' }}>
                          {doc.title}
                        </span>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(168, 85, 247, 0.1)',
                          color: '#a855f7',
                          fontSize: '10px',
                          fontWeight: 600,
                        }}>
                          {Math.round(doc.relevanceScore * 100)}% 匹配
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
                        {doc.content.substring(0, 80)}...
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {doc.tags.map((tag, i) => (
                          <span
                            key={i}
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(168, 85, 247, 0.1)',
                              color: '#a855f7',
                              fontSize: '10px',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {advice && (
              <div className="advice-box" style={{
                padding: '16px',
                background: 'rgba(34, 211, 238, 0.05)',
                border: '1px solid rgba(34, 211, 238, 0.2)',
                borderRadius: '12px',
                marginBottom: '20px',
              }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#22d3ee' }}>
                  投资建议
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', lineHeight: '1.6' }}>
                  {advice}
                </p>
              </div>
            )}

            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>
              推荐基金 ({recommendations.length})
            </h3>

            <div className="recommendations-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recommendations.map((rec, index) => (
                <div
                  key={rec.fund.code}
                  className="recommendation-card"
                  style={{
                    padding: '16px',
                    background: '#0b1220',
                    border: '1px solid #1f2937',
                    borderRadius: '12px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 600, color: '#e5e7eb' }}>
                          {rec.fund.name}
                        </span>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(34, 211, 238, 0.1)',
                          color: '#22d3ee',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}>
                          {rec.fund.code}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {rec.fund.type}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '24px',
                        fontWeight: 700,
                        color: getRatingColor(rec.score.rating),
                      }}>
                        {rec.score.rating}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>
                        综合评分 {rec.score.totalScore.toFixed(0)}
                      </div>
                    </div>
                  </div>

                  {/* 匹配理由 */}
                  {rec.matchReasons.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
                        推荐理由：
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {rec.matchReasons.slice(0, 3).map((reason, i) => (
                          <span
                            key={i}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: 'rgba(16, 185, 129, 0.1)',
                              color: '#34d399',
                              fontSize: '11px',
                            }}
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 风险收益指标 */}
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: '#6b7280' }}>风险等级：</span>
                      <span style={{ color: getRiskColor(rec.riskLevel), fontWeight: 600 }}>
                        {getRiskLabel(rec.riskLevel)}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280' }}>预期收益：</span>
                      <span style={{ color: '#e5e7eb', fontWeight: 600 }}>
                        {rec.expectedReturn > 0 ? `+${rec.expectedReturn.toFixed(1)}%` : '—'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280' }}>预期风险：</span>
                      <span style={{ color: '#e5e7eb', fontWeight: 600 }}>
                        {rec.expectedRisk.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SmartRecommendations;

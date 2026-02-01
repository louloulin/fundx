/**
 * 基金详情弹窗组件
 *
 * 显示基金的详细信息，包括基本资料、历史走势、费率等
 */

'use client';

import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';

interface FundDetailModalProps {
  fund: any;
  onClose: () => void;
  onToggleFavorite?: (code: string) => void;
  isFavorite?: boolean;
  onRemove?: (code: string) => void;
}

export function FundDetailModal({ fund, onClose, onToggleFavorite, isFavorite = false, onRemove }: FundDetailModalProps) {
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    setAnimationClass('fade-in');
    return () => setAnimationClass('');
  }, []);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  useEffect(() => {
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // 生成模拟历史数据（实际应从API获取）
  const generateHistoryData = () => {
    const currentNav = parseFloat(fund.dwjz || fund.gsz || 1);
    const data = [];
    let nav = currentNav * 0.85;
    for (let i = 0; i < 30; i++) {
      nav = nav + (Math.random() - 0.45) * 0.02;
      data.push({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN'),
        nav: Math.max(0.5, nav).toFixed(4)
      });
    }
    return data;
  };

  const historyData = generateHistoryData();
  const maxNav = Math.max(...historyData.map(d => parseFloat(d.nav)));
  const minNav = Math.min(...historyData.map(d => parseFloat(d.nav)));

  return typeof document === 'undefined' ? null : createPortal(
    <div className={`modal-overlay ${animationClass}`} onClick={handleOverlayClick}>
      <div className="glass card fund-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <div className="detail-header">
          <div className="detail-title">
            <h3>{fund.name}</h3>
            <div className="detail-code">#{fund.code}</div>
            <div className="detail-type">{fund.type || '混合型'}</div>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="关闭">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* 核心数据 */}
        <div className="detail-stats">
          <div className="stat-box">
            <div className="stat-label">单位净值</div>
            <div className="stat-value">{fund.dwjz || fund.gsz || '—'}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">估值净值</div>
            <div className="stat-value">{fund.gsz || '—'}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">涨跌幅</div>
            <div className={`stat-value ${typeof fund.gszzl === 'number' && fund.gszzl > 0 ? 'up' : fund.gszzl < 0 ? 'down' : ''}`}>
              {typeof fund.gszzl === 'number' ? `${fund.gszzl > 0 ? '+' : ''}${fund.gszzl.toFixed(2)}%` : fund.gszzl || '—'}
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-label">估值时间</div>
            <div className="stat-value small">{fund.gztime || fund.time || '—'}</div>
          </div>
        </div>

        {/* 历史走势图 */}
        <div className="detail-section">
          <h4>净值走势（近30日）</h4>
          <div className="chart-container">
            <svg viewBox="0 0 400 120" className="nav-chart">
              {/* Y轴网格线 */}
              {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                <line
                  key={i}
                  x1="0"
                  y1={120 - p * 120}
                  x2="400"
                  y2={120 - p * 120}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="1"
                />
              ))}
              {/* 走势线 */}
              <polyline
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2"
                points={historyData.map((d, i) => {
                  const nav = parseFloat(d.nav);
                  const normalized = (nav - minNav) / (maxNav - minNav || 1);
                  return `${(i / (historyData.length - 1)) * 400},${120 - normalized * 100 - 10}`;
                }).join(' ')}
              />
              {/* 数据点 */}
              {historyData.map((d, i) => {
                const nav = parseFloat(d.nav);
                const normalized = (nav - minNav) / (maxNav - minNav || 1);
                const x = (i / (historyData.length - 1)) * 400;
                const y = 120 - normalized * 100 - 10;
                return i % 5 === 0 ? (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="3"
                    fill="var(--accent)"
                  />
                ) : null;
              })}
            </svg>
            <div className="chart-labels">
              <span>{historyData[0].date}</span>
              <span>{historyData[historyData.length - 1].date}</span>
            </div>
          </div>
        </div>

        {/* 重仓股票 */}
        {Array.isArray(fund.holdings) && fund.holdings.length > 0 && (
          <div className="detail-section">
            <h4>前10大重仓股</h4>
            <div className="holdings-table">
              <div className="holdings-header">
                <span>股票名称</span>
                <span>涨跌幅</span>
                <span>占比</span>
              </div>
              {fund.holdings.map((h, idx) => (
                <div key={idx} className="holdings-row">
                  <span className="holding-name">{h.name}</span>
                  <span className={`holding-change ${typeof h.change === 'number' ? (h.change > 0 ? 'up' : h.change < 0 ? 'down' : '') : ''}`}>
                    {typeof h.change === 'number' ? `${h.change > 0 ? '+' : ''}${h.change.toFixed(2)}%` : '—'}
                  </span>
                  <span className="holding-weight">{h.weight}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 基金信息 */}
        <div className="detail-section">
          <h4>基金信息</h4>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">基金代码</span>
              <span className="info-value">{fund.code}</span>
            </div>
            <div className="info-item">
              <span className="info-label">基金类型</span>
              <span className="info-value">{fund.type || '混合型'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">成立时间</span>
              <span className="info-value">—</span>
            </div>
            <div className="info-item">
              <span className="info-label">基金规模</span>
              <span className="info-value">—</span>
            </div>
            <div className="info-item">
              <span className="info-label">基金经理</span>
              <span className="info-value">—</span>
            </div>
            <div className="info-item">
              <span className="info-label">管理费率</span>
              <span className="info-value">1.50%</span>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="detail-actions">
          {onToggleFavorite && (
            <button
              className={`button ${isFavorite ? 'secondary' : 'primary'}`}
              onClick={() => onToggleFavorite(fund.code)}
            >
              {isFavorite ? '★ 已自选' : '☆ 加自选'}
            </button>
          )}
          {onRemove && (
            <button
              className="button danger"
              onClick={() => {
                onRemove(fund.code);
                onClose();
              }}
            >
              删除基金
            </button>
          )}
          <button
            className="button secondary"
            onClick={onClose}
          >
            关闭
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default FundDetailModal;

/**
 * Fund Comparison Component
 *
 * Compare multiple funds side by side
 */

'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';

interface Fund {
  code: string;
  name: string;
  type?: string;
  dwjz?: string;
  gsz?: string;
  gszzl?: number;
  [key: string]: any;
}

interface FundCompareProps {
  funds: Fund[];
  comparingFunds: Fund[];
  onAddToCompare: (fund: Fund) => void;
  onRemoveFromCompare: (code: string) => void;
  onClearAll: () => void;
}

export function FundCompare({
  funds,
  comparingFunds,
  onAddToCompare,
  onRemoveFromCompare,
  onClearAll
}: FundCompareProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (comparingFunds.length === 0) {
    return null;
  }

  const metrics = [
    { key: 'code', label: '基金代码', format: (v: any) => v },
    { key: 'name', label: '基金名称', format: (v: any) => v },
    { key: 'type', label: '基金类型', format: (v: any) => v || '—' },
    { key: 'dwjz', label: '单位净值', format: (v: any) => v || '—' },
    { key: 'gsz', label: '估值净值', format: (v: any) => v || '—' },
    {
      key: 'gszzl',
      label: '涨跌幅',
      format: (v: any) => typeof v === 'number' ? `${v > 0 ? '+' : ''}${v.toFixed(2)}%` : v || '—',
      highlight: true
    },
  ];

  return typeof document === 'undefined' ? null : createPortal(
    <>
      {/* 对比浮窗按钮 */}
      <div className="compare-float-button" onClick={() => setIsOpen(true)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a2 2 0 0 0-1-1.73l-2.74-.77a2 2 0 0 1-1-1.73V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2.93a2 2 0 0 1-1 1.73l-2.74.77a2 2 0 0 0-1 1.73V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span>对比 ({comparingFunds.length})</span>
      </div>

      {/* 对比弹窗 */}
      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="glass card compare-modal" onClick={(e) => e.stopPropagation()}>
            {/* 头部 */}
            <div className="compare-header">
              <h3>基金对比 ({comparingFunds.length}只)</h3>
              <div className="compare-actions">
                <button className="icon-button" onClick={onClearAll} title="清空对比">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
                <button className="icon-button" onClick={() => setIsOpen(false)} title="关闭">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 对比表格 */}
            <div className="compare-table-container">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th className="metric-label">指标</th>
                    {comparingFunds.map(fund => (
                      <th key={fund.code} className="fund-header">
                        <div className="fund-name" title={fund.name}>{fund.name}</div>
                        <div className="fund-code">#{fund.code}</div>
                        <button
                          className="remove-fund"
                          onClick={() => onRemoveFromCompare(fund.code)}
                          title="移除"
                        >
                          ✕
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric, index) => (
                    <tr key={metric.key} className={index % 2 === 0 ? 'even' : 'odd'}>
                      <td className="metric-label">{metric.label}</td>
                      {comparingFunds.map(fund => {
                        const value = fund[metric.key];
                        const formatted = metric.format(value);
                        const isPositive = metric.highlight && typeof value === 'number' && value > 0;
                        const isNegative = metric.highlight && typeof value === 'number' && value < 0;

                        return (
                          <td
                            key={fund.code}
                            className={`metric-value ${isPositive ? 'positive' : ''} ${isNegative ? 'negative' : ''}`}
                          >
                            {formatted}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 添加更多基金提示 */}
            {funds.length > comparingFunds.length && (
              <div className="compare-footer">
                <span className="muted">
                  还可以添加 {funds.length - comparingFunds.length} 只基金进行对比
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>,
    document.body
  );
}

// 对比按钮组件（用于基金卡片）
interface CompareButtonProps {
  fund: Fund;
  isComparing: boolean;
  onToggle: () => void;
}

export function CompareButton({ fund, isComparing, onToggle }: CompareButtonProps) {
  return (
    <button
      className={`compare-toggle-button ${isComparing ? 'active' : ''}`}
      onClick={onToggle}
      title={isComparing ? '从对比中移除' : '添加到对比'}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a2 2 0 0 0-1-1.73l-2.74-.77a2 2 0 0 1-1-1.73V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2.93a2 2 0 0 1-1 1.73l-2.74.77a2 2 0 0 0-1 1.73V19"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span>{isComparing ? '对比中' : '对比'}</span>
    </button>
  );
}

export default FundCompare;

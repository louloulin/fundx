/**
 * Portfolio Statistics and Charts Component
 *
 * Displays portfolio statistics and trends with SVG charts
 */

'use client';

import { useMemo } from 'react';

interface PortfolioStatsProps {
  funds: any[];
}

export function PortfolioStats({ funds }: PortfolioStatsProps) {
  // 计算统计数据
  const stats = useMemo(() => {
    if (funds.length === 0) return null;

    // 总资产（假设每只基金等权重，实际应从持仓数据计算）
    const totalValue = funds.reduce((sum, f) => {
      const nav = parseFloat(f.gsz || f.dwjz || 0);
      return sum + nav;
    }, 0);

    // 平均涨跌幅
    const avgChange = funds.reduce((sum, f) => sum + (Number(f.gszzl) || 0), 0) / funds.length;

    // 计算当日总收益（假设每只1000份）
    const dailyProfit = funds.reduce((sum, f) => {
      const nav = parseFloat(f.gsz || f.dwjz || 0);
      const change = Number(f.gszzl) || 0;
      return sum + (nav * change / 100 * 1000);
    }, 0);

    // 上涨/下跌/平盘基金数
    const upCount = funds.filter(f => (Number(f.gszzl) || 0) > 0).length;
    const downCount = funds.filter(f => (Number(f.gszzl) || 0) < 0).length;
    const flatCount = funds.filter(f => (Number(f.gszzl) || 0) === 0).length;

    // 按类型分组统计
    const typeStats = funds.reduce((acc, f) => {
      const type = f.type || '其他';
      if (!acc[type]) acc[type] = { count: 0, avgChange: 0 };
      acc[type].count++;
      acc[type].avgChange += Number(f.gszzl) || 0;
      return acc;
    }, {} as Record<string, { count: number; avgChange: number }>);

    Object.keys(typeStats).forEach(type => {
      typeStats[type].avgChange /= typeStats[type].count;
    });

    // 生成模拟历史收益数据（实际应从API获取）
    const historyData = Array.from({ length: 30 }, (_, i) => {
      const baseProfit = dailyProfit * (1 + Math.sin(i / 5) * 0.3);
      return {
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        profit: baseProfit,
      };
    });

    return {
      totalValue: totalValue.toFixed(2),
      avgChange: avgChange.toFixed(2),
      dailyProfit: dailyProfit.toFixed(2),
      upCount,
      downCount,
      flatCount,
      typeStats,
      historyData,
    };
  }, [funds]);

  if (!stats) {
    return (
      <div className="portfolio-stats-empty">
        <p>添加基金后查看统计数据</p>
      </div>
    );
  }

  // 绘制收益折线图
  const renderLineChart = (data: typeof stats.historyData) => {
    const maxProfit = Math.max(...data.map(d => d.profit));
    const minProfit = Math.min(...data.map(d => d.profit));
    const range = maxProfit - minProfit || 1;
    const height = 120;
    const width = 400;
    const padding = 10;

    // 生成路径
    const linePath = data.map((d, i) => {
      const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
      const y = height - padding - ((d.profit - minProfit) / range) * (height - padding * 2);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    // 生成填充区域
    const areaPath = `${linePath} L ${width - padding} ${height} L ${padding} ${height} Z`;

    const isPositive = stats.dailyProfit >= 0;
    const color = isPositive ? '#22c55e' : '#ef4444';

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="stats-chart">
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* 零线 */}
        {minProfit < 0 && maxProfit > 0 && (
          <line
            x1={padding}
            y1={height - padding - ((0 - minProfit) / range) * (height - padding * 2)}
            x2={width - padding}
            y2={height - padding - ((0 - minProfit) / range) * (height - padding * 2)}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        )}
        {/* 填充区域 */}
        <path d={areaPath} fill="url(#areaGradient)" />
        {/* 折线 */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" />
        {/* 数据点 */}
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
          const y = height - padding - ((d.profit - minProfit) / range) * (height - padding * 2);
          return i % 5 === 0 ? (
            <circle key={i} cx={x} cy={y} r="3" fill={color} />
          ) : null;
        })}
      </svg>
    );
  };

  // 绘制饼图
  const renderPieChart = () => {
    const types = Object.entries(stats.typeStats) as [string, { count: number; avgChange: number }][];
    const total = types.reduce((sum, [, data]) => sum + data.count, 0);
    let currentAngle = 0;

    const colors = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return (
      <svg viewBox="0 0 200 200" className="pie-chart">
        {types.map(([type, data], index) => {
          const percentage = data.count / total;
          const angle = percentage * Math.PI * 2;
          const x1 = 100 + 80 * Math.cos(currentAngle);
          const y1 = 100 + 80 * Math.sin(currentAngle);
          const x2 = 100 + 80 * Math.cos(currentAngle + angle);
          const y2 = 100 + 80 * Math.sin(currentAngle + angle);
          const largeArc = angle > Math.PI ? 1 : 0;

          currentAngle += angle;

          return (
            <g key={type}>
              <path
                d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={colors[index % colors.length]}
                stroke="rgba(0,0,0,0.2)"
                strokeWidth="1"
              />
            </g>
          );
        })}
        {/* 中心圆（环形效果） */}
        <circle cx="100" cy="100" r="40" fill="#0b1220" />
        <text x="100" y="95" textAnchor="middle" fill="#9ca3af" fontSize="12">
          总计
        </text>
        <text x="100" y="115" textAnchor="middle" fill="#e5e7eb" fontSize="18" fontWeight="700">
          {funds.length}
        </text>
      </svg>
    );
  };

  return (
    <div className="portfolio-stats">
      {/* 统计卡片 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">总资产</div>
          <div className="stat-value">{stats.totalValue}</div>
          <div className="stat-unit">单位</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">平均涨跌</div>
          <div className={`stat-value ${parseFloat(stats.avgChange) >= 0 ? 'positive' : 'negative'}`}>
            {parseFloat(stats.avgChange) >= 0 ? '+' : ''}{stats.avgChange}%
          </div>
          <div className="stat-unit">全部基金</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">当日收益</div>
          <div className={`stat-value ${parseFloat(stats.dailyProfit) >= 0 ? 'positive' : 'negative'}`}>
            {parseFloat(stats.dailyProfit) >= 0 ? '+' : ''}{stats.dailyProfit}
          </div>
          <div className="stat-unit">估算</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">涨跌分布</div>
          <div className="stat-distribution">
            <span className="up">{stats.upCount}涨</span>
            <span className="flat">{stats.flatCount}平</span>
            <span className="down">{stats.downCount}跌</span>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="charts-grid">
        {/* 收益趋势图 */}
        <div className="chart-card">
          <h4>收益趋势（近30日）</h4>
          <div className="chart-container">
            {renderLineChart(stats.historyData)}
          </div>
        </div>

        {/* 基金类型分布 */}
        <div className="chart-card">
          <h4>基金类型分布</h4>
          <div className="chart-container pie-container">
            {renderPieChart()}
          </div>
          <div className="pie-legend">
            {Object.entries(stats.typeStats).map(([type, data]) => {
              const colors = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
              const typeData = data as { count: number; avgChange: number };
              const index = Object.keys(stats.typeStats).indexOf(type);
              return (
                <div key={type} className="legend-item">
                  <span
                    className="legend-color"
                    style={{ background: colors[index % colors.length] }}
                  />
                  <span className="legend-label">{type}</span>
                  <span className="legend-value">{typeData.count}只</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 类型统计详情 */}
      <div className="type-stats">
        <h4>类型表现</h4>
        <div className="type-stats-list">
          {Object.entries(stats.typeStats).map(([type, data]) => {
            const typeData = data as { count: number; avgChange: number };
            return (
              <div key={type} className="type-stat-item">
                <span className="type-name">{type}</span>
                <span className="type-count">{typeData.count}只</span>
                <span className={`type-change ${typeData.avgChange >= 0 ? 'positive' : 'negative'}`}>
                  {typeData.avgChange >= 0 ? '+' : ''}{typeData.avgChange.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PortfolioStats;

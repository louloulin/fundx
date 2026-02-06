/**
 * 基金估值计算引擎
 *
 * 根据基金持仓和实时股票行情计算估算净值
 */

export interface StockQuote {
  code: string;        // 股票代码
  price: number;       // 当前价格
  change: number;      // 涨跌额
  changePercent: number; // 涨跌幅 (%)
  prevClose: number;   // 昨收价
  open: number;        // 今开价
}

export interface FundHolding {
  stockCode: string;
  stockName: string;
  ratio: number;       // 持仓比例 (%)
  shares?: number;     // 持股数量 (如果可用)
  reportDate: string;
}

export interface ValuationResult {
  fundCode: string;
  fundName: string;
  lastNav: number;         // 昨日净值
  estimatedNav: number;    // 估算净值
  estimatedChange: number; // 估算涨跌额
  estimatedChangePercent: number; // 估算涨跌幅 (%)
  calculationTime: string; // 计算时间
  holdings: {
    code: string;
    name: string;
    ratio: number;
    currentPrice: number;
    changePercent: number;
    contribution: number;  // 对净值变化的贡献
  }[];
  dataQuality: {
    totalRatio: number;    // 总持仓比例
    coverage: number;      // 数据覆盖率
    isReliable: boolean;   // 是否可靠
  };
}

/**
 * 计算基金估算净值
 *
 * 核心公式:
 * 估算净值 = 昨日净值 × (1 + Σ(持仓比例 × 股票涨跌幅))
 *
 * @param fundCode - 基金代码
 * @param fundName - 基金名称
 * @param lastNav - 昨日净值
 * @param holdings - 基金持仓
 * @param quotes - 股票实时行情
 * @returns 估值结果
 */
export function calculateEstimatedNav(
  fundCode: string,
  fundName: string,
  lastNav: number,
  holdings: FundHolding[],
  quotes: StockQuote[]
): ValuationResult {
  // 创建股票代码到行情的映射
  const quoteMap = new Map<string, StockQuote>();
  quotes.forEach(q => quoteMap.set(q.code, q));

  // 计算加权平均涨跌幅
  let weightedChangePercent = 0;
  let totalRatio = 0;
  let validHoldings = 0;

  const holdingDetails: ValuationResult['holdings'] = [];

  for (const holding of holdings) {
    const quote = quoteMap.get(holding.stockCode);

    if (quote) {
      validHoldings++;
      totalRatio += holding.ratio;

      // 计算该股票对净值变化的贡献
      const contribution = (holding.ratio / 100) * quote.changePercent;
      weightedChangePercent += contribution;

      holdingDetails.push({
        code: holding.stockCode,
        name: holding.stockName,
        ratio: holding.ratio,
        currentPrice: quote.price,
        changePercent: quote.changePercent,
        contribution,
      });
    } else {
      // 没有找到行情数据的股票
      holdingDetails.push({
        code: holding.stockCode,
        name: holding.stockName,
        ratio: holding.ratio,
        currentPrice: 0,
        changePercent: 0,
        contribution: 0,
      });
    }
  }

  // 计算估算净值
  // 公式: 估算净值 = 昨日净值 × (1 + 加权平均涨跌幅)
  const estimatedChangePercent = weightedChangePercent;
  const estimatedChange = lastNav * (estimatedChangePercent / 100);
  const estimatedNav = lastNav + estimatedChange;

  // 评估数据质量
  const coverage = totalRatio; // 持仓覆盖率
  const isReliable = coverage >= 50; // 覆盖率超过 50% 认为可靠

  return {
    fundCode,
    fundName,
    lastNav,
    estimatedNav: parseFloat(estimatedNav.toFixed(4)),
    estimatedChange: parseFloat(estimatedChange.toFixed(4)),
    estimatedChangePercent: parseFloat(estimatedChangePercent.toFixed(2)),
    calculationTime: new Date().toISOString(),
    holdings: holdingDetails.sort((a, b) => b.contribution - a.contribution),
    dataQuality: {
      totalRatio: parseFloat(totalRatio.toFixed(2)),
      coverage: parseFloat(coverage.toFixed(2)),
      isReliable,
    },
  };
}

/**
 * 格式化估值结果为用户友好的文本
 */
export function formatValuationResult(result: ValuationResult): string {
  const lines: string[] = [];

  lines.push(`## ${result.fundName} (${result.fundCode}) 实时估值`);
  lines.push('');
  lines.push(`**昨日净值**: ${result.lastNav.toFixed(4)} 元`);
  lines.push(`**估算净值**: ${result.estimatedNav.toFixed(4)} 元`);
  lines.push(`**估算涨跌**: ${result.estimatedChange >= 0 ? '+' : ''}${result.estimatedChange.toFixed(4)} 元 (${result.estimatedChangePercent >= 0 ? '+' : ''}${result.estimatedChangePercent.toFixed(2)}%)`);
  lines.push('');
  lines.push(`**计算时间**: ${new Date(result.calculationTime).toLocaleString('zh-CN')}`);
  lines.push('');

  // 数据质量
  lines.push(`### 数据质量`);
  lines.push(`- 持仓覆盖率: ${result.dataQuality.coverage.toFixed(2)}%`);
  lines.push(`- 可靠性: ${result.dataQuality.isReliable ? '✅ 可靠' : '⚠️ 数据不足'}`);
  lines.push('');

  // 前 10 大持仓贡献
  lines.push(`### 前 10 大持仓贡献`);
  lines.push('');
  lines.push(`| 股票代码 | 股票名称 | 持仓比例 | 当前价 | 涨跌幅 | 贡献 |`);
  lines.push(`| --- | --- | --- | --- | --- | --- |`);

  for (const h of result.holdings.slice(0, 10)) {
    const sign = h.contribution >= 0 ? '+' : '';
    lines.push(`| ${h.code} | ${h.name} | ${h.ratio.toFixed(2)}% | ${h.currentPrice.toFixed(2)} | ${h.changePercent >= 0 ? '+' : ''}${h.changePercent.toFixed(2)}% | ${sign}${h.contribution.toFixed(3)}% |`);
  }

  lines.push('');
  lines.push(`*说明: 估算净值基于最新持仓数据和实时股价计算，实际净值以基金公司公告为准。*`);

  return lines.join('\n');
}

/**
 * 获取估值状态颜色
 */
export function getValuationColor(changePercent: number): string {
  if (changePercent > 0) return 'text-red-500'; // 上涨用红色（中国习惯）
  if (changePercent < 0) return 'text-green-500'; // 下跌用绿色
  return 'text-gray-500';
}

/**
 * 获取估值趋势图标
 */
export function getValuationIcon(changePercent: number): string {
  if (changePercent > 0) return '📈';
  if (changePercent < 0) return '📉';
  return '➡️';
}

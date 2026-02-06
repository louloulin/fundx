/**
 * 基金持仓数据解析器
 *
 * 从东方财富的基金持仓页面 HTML 中提取结构化持仓数据
 */

// import * as cheerio from 'cheerio'; // 暂时禁用，等待安装完成

/**
 * 基金持仓项接口
 */
export interface FundHolding {
  stockCode: string;      // 股票代码
  stockName: string;      // 股票名称
  ratio: number;          // 持仓比例 (%)
  shares?: number;        // 持股数量 (万股)
  reportDate: string;     // 报告期
  fundCode: string;       // 基金代码
}

/**
 * 解析结果接口
 */
export interface ParseResult {
  success: boolean;
  holdings: FundHolding[];
  reportDate: string;
  total: number;
  error?: string;
}

/**
 * 从基金持仓 HTML 中解析持仓数据
 *
 * @param html - 东方财富基金持仓页面 HTML
 * @param fundCode - 基金代码
 * @returns 解析结果
 */
export function parseFundHoldings(html: string, fundCode: string): ParseResult {
  try {
    // const $ = cheerio.load(html); // 暂时禁用 Cheerio
    const holdings: FundHolding[] = [];

    // 方法 1: 查找 JSON 数据嵌入在 script 标签中
    console.log('尝试查找 JSON 数据...');

    // 提取所有 script 标签内容
    const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];

    for (const scriptContent of scriptMatches) {
      const patterns = [
        /var\s+stockholdings\s*=\s*(\{[\s\S]*?\});/i,
        /var\s+Data_StockHoldings\s*=\s*(\{[\s\S]*?\});/i,
        /"stockholdings":\s*(\{[\s\S]*?\})/i,
        /"Data_StockHoldings":\s*(\{[\s\S]*?\})/i,
        /var\s+ccmx\s*=\s*(\{[\s\S]*?\});/i,
        /var\s+DATA\s*=\s*(\{[\s\S]*?\});/i,
      ];

      for (const pattern of patterns) {
        const match = scriptContent.match(pattern);
        if (match) {
          try {
            const jsonStr = match[1].replace(/(\w+):/g, '"$1":').replace(/'/g, '"');
            const jsonData = JSON.parse(jsonStr);
            console.log('找到 JSON 数据:', Object.keys(jsonData));

            // 尝试解析不同可能的 JSON 结构
            // 需要根据实际数据结构调整
          } catch (e) {
            console.log('JSON 解析失败:', e);
          }
        }
      }
    }

    // 方法 2: 正则表达式直接匹配表格数据
    console.log('使用正则表达式解析表格数据...');

    // 尝试多种模式匹配持仓数据
    const patterns = [
      // 模式 1: 标准表格行 <td>代码</td><td>名称</td><td>比例%</td>
      // 使用 [\s\S] 代替 . 以避免需要 ES2018 的 s 标志
      /<tr[^>]*>[\s\S]*?<td[^>]*>(\d{6})<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([\d.]+)%/g,
      // 模式 2: 代码和比例在同一行
      /(\d{6})[^<\d]*?([^<\n]{2,15})[^<\d]*?([\d.]+)%/g,
      // 模式 3: 带换行的表格
      /<td[^>]*>(\d{6})[\s\S]*?<td[^>]*>([^<]+)[\s\S]*?<td[^>]*>([\d.]+)%/g,
    ];

    const seenStocks = new Set<string>(); // 去重

    for (const pattern of patterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      const matches = html.matchAll(regex);

      for (const match of matches) {
        const stockCode = match[1];
        const stockName = match[2]?.trim() || '';
        const ratio = parseFloat(match[3]);

        // 去重并验证
        if (!isNaN(ratio) && ratio > 0 && ratio <= 100 && !seenStocks.has(stockCode)) {
          seenStocks.add(stockCode);
          holdings.push({
            stockCode,
            stockName,
            ratio,
            fundCode,
            reportDate: '',
          });
        }
      }

      if (holdings.length >= 10) {
        break; // 找到足够的数据就停止
      }
    }

    // 提取报告日期
    let reportDate = '';
    const datePatterns = [
      /(\d{4})年(\d{1,2})季/,
      /(\d{4})-(\d{1,2})-(\d{1,2})/,
      /报告期[：:]\s*(\d{4}-\d{1,2}-\d{1,2})/,
      /(\d{4})-(\d{1,2})-(\d{1,2})\s*\([一二三四]季度\)/,
    ];

    for (const pattern of datePatterns) {
      const match = html.match(pattern);
      if (match) {
        reportDate = match[0];
        break;
      }
    }

    // 如果找到了报告日期，更新所有持仓项
    if (reportDate && holdings.length > 0) {
      holdings.forEach(h => h.reportDate = reportDate);
    }

    console.log(`解析结果: 找到 ${holdings.length} 条持仓数据`);

    return {
      success: holdings.length > 0,
      holdings,
      reportDate,
      total: holdings.length,
    };
  } catch (error) {
    console.error('解析持仓数据时出错:', error);
    return {
      success: false,
      holdings: [],
      reportDate: '',
      total: 0,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

/**
 * 获取基金持仓数据（带缓存）
 *
 * @param fundCode - 基金代码
 * @param forceRefresh - 强制刷新缓存
 * @returns 持仓数据
 */
export async function getFundHoldings(
  fundCode: string,
  forceRefresh: boolean = false
): Promise<ParseResult> {
  const url = `https://fundf10.eastmoney.com/ccmx_${fundCode}.html`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    return parseFundHoldings(html, fundCode);
  } catch (error) {
    return {
      success: false,
      holdings: [],
      reportDate: '',
      total: 0,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

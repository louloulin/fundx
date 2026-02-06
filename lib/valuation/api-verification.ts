/**
 * 基金估值计算系统 - API 验证脚本
 *
 * Phase 1: 数据源验证
 *
 * 验证以下 API 的可用性:
 * 1. fundf10.eastmoney.com - 基金持仓数据
 * 2. push2.eastmoney.com - 实时股票行情
 * 3. qt.gtimg.cn - 股票实时价格
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * API 验证结果接口
 */
interface ApiVerificationResult {
  apiName: string;
  url: string;
  status: 'success' | 'error' | 'timeout';
  responseTime: number;
  data?: any;
  error?: string;
  sampleData?: any;
}

/**
 * 验证基金持仓数据 API (fundf10.eastmoney.com)
 *
 * 用途: 获取基金的最新持仓信息
 * 请求频率: 每天 1 次
 */
export async function verifyFundHoldingsApi(fundCode: string = '000001'): Promise<ApiVerificationResult> {
  const startTime = Date.now();
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

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        apiName: '基金持仓数据 API',
        url,
        status: 'error',
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const html = await response.text();

    // 检查是否包含持仓数据
    const hasHoldingsData = html.includes('持仓') || html.includes('stockholdings');

    // 尝试提取样本数据 (股票代码、名称、比例)
    const stockMatches = html.match(/(\d{6})[^\d]*?([^<]+)</g);

    return {
      apiName: '基金持仓数据 API',
      url,
      status: 'success',
      responseTime,
      data: {
        contentType: response.headers.get('content-type'),
        contentLength: html.length,
        hasHoldingsData,
      },
      sampleData: stockMatches ? stockMatches.slice(0, 5) : ['未找到明确的持仓数据模式'],
    };
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    return {
      apiName: '基金持仓数据 API',
      url,
      status: isTimeout ? 'timeout' : 'error',
      responseTime: Date.now() - startTime,
      error: isTimeout ? '请求超时 (10秒)' : (error instanceof Error ? error.message : '未知错误'),
    };
  }
}

/**
 * 验证实时股票行情 API (push2.eastmoney.com)
 *
 * 用途: 获取股票的实时行情数据
 * 请求频率: 每 3 分钟
 */
export async function verifyRealtimeQuoteApi(stockCodes: string[] = ['000001', '000002']): Promise<ApiVerificationResult> {
  const startTime = Date.now();

  // push2 API 格式
  const codes = stockCodes.map(code => {
    if (code.startsWith('6')) {
      return `1.${code}`; // 上海交易所
    } else if (code.startsWith('0') || code.startsWith('3')) {
      return `0.${code}`; // 深圳交易所
    }
    return code;
  }).join(',');

  const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=${codes}&fields=f43,f44,f45,f46,f47,f48,f49,f50,f51,f52,f57,f58,f60,f107,f116,f117,f127,f152,f161,f162,f167,f168,f169,f170,f171,f84,f85,f115`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://quote.eastmoney.com/',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        apiName: '实时股票行情 API (push2)',
        url,
        status: 'error',
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

    return {
      apiName: '实时股票行情 API (push2)',
      url,
      status: 'success',
      responseTime,
      data: {
        rc: data.rc,
        rt: data.rt,
        svr: data.svr,
        lt: data.lt,
        full: data.full,
        dataCount: data.data?.length || 0,
      },
      sampleData: data.data?.slice(0, 2),
    };
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    return {
      apiName: '实时股票行情 API (push2)',
      url,
      status: isTimeout ? 'timeout' : 'error',
      responseTime: Date.now() - startTime,
      error: isTimeout ? '请求超时 (10秒)' : (error instanceof Error ? error.message : '未知错误'),
    };
  }
}

/**
 * 验证腾讯行情 API (qt.gtimg.cn)
 *
 * 用途: 获取股票实时价格
 * 请求频率: 每 3 分钟
 */
export async function verifyTencentQuoteApi(stockCodes: string[] = ['sz000001', 'sh000001']): Promise<ApiVerificationResult> {
  const startTime = Date.now();
  const url = `https://qt.gtimg.cn/q=${stockCodes.join(',')}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://stockapp.finance.qq.com/',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        apiName: '腾讯行情 API (qt.gtimg)',
        url,
        status: 'error',
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const text = await response.text();

    // 腾讯 API 返回的是特殊格式的字符串
    // 格式: v_sz000001="51~名称~代码~当前价~昨收~今开~..."
    // 字段: 0=未知, 1=名称(乱码), 2=代码, 3=当前价, 4=昨收, 5=今开, 6=成交量, 7=成交额, 8=...
    const samples: string[] = [];
    const matches = text.match(/v_[^=]+="([^"]+)"/g);

    if (matches) {
      matches.slice(0, 3).forEach(match => {
        const parts = match.split('=');
        if (parts.length >= 2) {
          const code = parts[0].replace('v_', '');
          // 腾讯 API 使用 ~ 作为分隔符
          const values = parts[1].replace(/"/g, '').split('~');
          // 根据实际解析: 2=股票代码, 3=当前价, 4=昨收, 5=今开
          const stockCode = values[2] || 'N/A';
          const currentPrice = values[3] || 'N/A';
          const prevClose = values[4] || 'N/A';
          const openPrice = values[5] || 'N/A';
          const volume = values[6] || 'N/A';
          // 计算涨跌幅
          const changeAmount = prevClose !== 'N/A' && currentPrice !== 'N/A'
            ? (parseFloat(currentPrice) - parseFloat(prevClose)).toFixed(2)
            : 'N/A';
          const changePercent = prevClose !== 'N/A' && currentPrice !== 'N/A'
            ? ((parseFloat(currentPrice) - parseFloat(prevClose)) / parseFloat(prevClose) * 100).toFixed(2)
            : 'N/A';
          samples.push(`${code}: 当前价=${currentPrice}, 昨收=${prevClose}, 今开=${openPrice}, 涨跌=${changeAmount}, 涨跌幅=${changePercent}%`);
        }
      });
    }

    return {
      apiName: '腾讯行情 API (qt.gtimg)',
      url,
      status: 'success',
      responseTime,
      data: {
        responseLength: text.length,
        hasData: text.includes('='),
        dataCount: matches?.length || 0,
      },
      sampleData: samples,
    };
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    return {
      apiName: '腾讯行情 API (qt.gtimg)',
      url,
      status: isTimeout ? 'timeout' : 'error',
      responseTime: Date.now() - startTime,
      error: isTimeout ? '请求超时 (10秒)' : (error instanceof Error ? error.message : '未知错误'),
    };
  }
}

/**
 * 运行所有 API 验证
 */
export async function verifyAllApis(fundCode: string = '000001', stockCodes: string[] = ['000001', '000002']) {
  const results = await Promise.all([
    verifyFundHoldingsApi(fundCode),
    verifyRealtimeQuoteApi(stockCodes),
    verifyTencentQuoteApi(stockCodes.map(c => (c.startsWith('6') ? `sh${c}` : `sz${c}`))),
  ]);

  return {
    timestamp: new Date().toISOString(),
    fundCode,
    stockCodes,
    results,
    summary: {
      total: results.length,
      success: results.filter(r => r.status === 'success').length,
      error: results.filter(r => r.status === 'error').length,
      avgResponseTime: Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / results.length),
    },
  };
}

/**
 * Next.js API 路由处理器
 * GET /api/valuation/verify-apis
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fundCode = searchParams.get('fundCode') || '000001';
  const stockCodes = searchParams.get('stocks')?.split(',') || ['000001', '000002'];

  try {
    const verification = await verifyAllApis(fundCode, stockCodes);
    return NextResponse.json(verification);
  } catch (error) {
    return NextResponse.json(
      {
        error: '验证失败',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

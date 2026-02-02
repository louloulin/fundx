/**
 * Fund Search Proxy API (Optimized)
 *
 * 使用模糊搜索，避免加载全部 4MB 数据
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * 本地基金数据库（缓存常用基金）
 * 避免每次都请求外部 API
 */
const LOCAL_FUND_DB = new Map<string, any>();

/**
 * 初始化本地基金数据库
 * 从东方财富获取数据并缓存到内存
 */
async function initFundDB() {
  if (LOCAL_FUND_DB.size > 0) {
    return; // 已初始化
  }

  try {
    const url = `https://fund.eastmoney.com/js/fundcode_search.js?timestamp=${Date.now()}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) return;

    const text = await response.text();
    const startIndex = text.indexOf('var r = ');
    if (startIndex === -1) return;

    const jsonStart = startIndex + 8;
    const jsonEnd = text.lastIndexOf(']');
    const jsonStr = text.substring(jsonStart, jsonEnd + 1);

    const fundsData = JSON.parse(jsonStr);

    // 构建搜索索引
    for (const fund of fundsData) {
      const code = fund[0];
      const pinyin = fund[1];
      const name = fund[2];
      const type = fund[3];

      // 创建搜索键（代码、拼音首字母、名称关键词）
      const searchKeys = [
        code,
        pinyin,
        name,
        type,
        // 拼音首字母
        pinyin.split('').join(''),
        // 名称拼音（简单处理）
        code + name,
      ].filter(Boolean);

      LOCAL_FUND_DB.set(code, { code, pinyin, name, type, searchKeys });
    }

    console.log(`基金数据库已初始化，共 ${LOCAL_FUND_DB.size} 只基金`);
  } catch (error) {
    console.error('初始化基金数据库失败:', error);
  }
}

/**
 * 模糊搜索函数（优化版）
 */
function fuzzySearch(query: string, funds: Map<string, any>, limit = 20): any[] {
  if (!query) {
    // 没有关键词时返回热门基金（按代码排序的前几个）
    return Array.from(funds.values())
      .filter(f => f.code.startsWith('00') || f.code.startsWith('11'))
      .slice(0, limit);
  }

  const queryLower = query.toLowerCase().trim();
  const results: { fund: any; score: number }[] = [];

  for (const fund of funds.values()) {
    let score = 0;
    const { code, pinyin, name, type } = fund;

    // 1. 代码匹配（权重最高）
    if (code === query) score += 100;
    else if (code.includes(query)) score += 80;

    // 2. 名称匹配（包含任意关键词）
    const nameLower = name.toLowerCase();
    if (nameLower === queryLower) score += 100;
    else if (nameLower.includes(queryLower)) score += 70;

    // 3. 分词匹配（处理多字查询）
    if (queryLower.length >= 2) {
      const words = queryLower.split(/[\s\-，、]+/).filter(w => w.length >= 1);
      const matchCount = words.reduce((count, word) => {
        if (nameLower.includes(word)) return count + 1;
        return count;
      }, 0);
      if (matchCount > 0) {
        score += 30 * matchCount; // 每个匹配词加分
      }
    }

    // 4. 拼音匹配
    const pinyinLower = pinyin.toLowerCase();
    if (pinyinLower === queryLower) score += 90;
    else if (pinyinLower.includes(queryLower)) score += 60;

    // 5. 类型匹配
    const typeLower = type.toLowerCase();
    if (typeLower.includes(queryLower)) score += 40;
    else if (queryLower.includes('股票') && typeLower.includes('股票')) score += 20;
    else if (queryLower.includes('债券') && typeLower.includes('债券')) score += 20;
    else if (queryLower.includes('混合') && typeLower.includes('混合')) score += 20;
    else if (queryLower.includes('指数') && typeLower.includes('指数')) score += 20;

    // 6. 首字母匹配（支持输入首字母搜索）
    if (queryLower.length >= 1 && queryLower.length <= 3) {
      const initials = pinyin.split('').filter(c => /[A-Z]/.test(c)).join('').toLowerCase();
      if (initials.includes(queryLower) || initials.startsWith(queryLower)) {
        score += 30;
      }
    }

    // 只有分数大于 0 才加入结果
    if (score > 0) {
      results.push({ fund, score });
    }
  }

  // 按分数排序，返回前 N 个
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit).map(r => r.fund);
}

/**
 * GET /api/proxy/fund-search
 *
 * 模糊搜索基金 API
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || '';
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  try {
    // 初始化基金数据库
    await initFundDB();

    // 调试日志
    console.log(`Search keyword: "${keyword}"`);
    console.log(`DB size: ${LOCAL_FUND_DB.size}`);

    // 执行模糊搜索
    const results = fuzzySearch(keyword, LOCAL_FUND_DB, limit);
    console.log(`Results count: ${results.length}`);

    return NextResponse.json({
      success: true,
      data: results.map(fund => ({
        code: fund.code,
        name: fund.name,
        type: fund.type,
      })),
      total: results.length,
      query: keyword,
      dbSize: LOCAL_FUND_DB.size,
    });
  } catch (error) {
    console.error('Fund search proxy error:', error);
    return NextResponse.json(
      {
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

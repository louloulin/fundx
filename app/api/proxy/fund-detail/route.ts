/**
 * Fund Detail Proxy API
 *
 * 服务端代理，获取单个基金详情（真实净值数据）
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 从东方财富获取基金净值数据
 */
async function getFundNavFromEastmoney(fundCode: string) {
  const urls = [
    `https://fundf10.eastmoney.com/F10DataApi.aspx?type=lsjz&code=${fundCode}&sort=date&desc=true&page=1&per=1`,
    `http://fundf10.eastmoney.com/F10DataApi.aspx?type=lsjz&code=${fundCode}&sort=date&desc=true&page=1&per=1`,
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) continue;

      const text = await response.text();

      // 解析返回的数据
      const match = text.match(/var apidata=\{ content:"<table[^>]*>.*?<tr>.*?<td>([\d-]+)<\/td>.*?<td class='tor bold'>([\d.]+)<\/td>.*?<td class='tor bold'>([\d.]+)<\/td>.*?<td class='tor bold[^']*'>([^<]+)<\/td>/s);

      if (match) {
        return {
          date: match[1],
          nav: parseFloat(match[2]),
          accumulatedNav: parseFloat(match[3]),
          dayGrowth: parseFloat(match[4].replace('%', '')),
        };
      }
    } catch (e) {
      continue;
    }
  }

  return null;
}

/**
 * 从东方财富获取基金名称
 */
async function getFundNameFromEastmoney(fundCode: string): Promise<string> {
  const url = `http://fundf10.eastmoney.com/${fundCode}.html`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return `基金${fundCode}`;

    const html = await response.text();

    // 从标题中提取基金名称: 华夏成长混合(000001)基金基本概况...
    const titleMatch = html.match(/<title>([^(]+)\(\d+\)/);
    if (titleMatch) {
      return titleMatch[1].trim();
    }
  } catch (e) {
    console.error('获取基金名称失败:', e);
  }

  return `基金${fundCode}`;
}

/**
 * GET /api/proxy/fund-detail
 *
 * 代理东方财富基金净值接口
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json(
      { error: 'Fund code is required' },
      { status: 400 }
    );
  }

  try {
    // 并行获取净值数据和基金名称
    const [navData, fundName] = await Promise.all([
      getFundNavFromEastmoney(code),
      getFundNameFromEastmoney(code),
    ]);

    if (!navData) {
      return NextResponse.json(
        { error: 'Fund not found' },
        { status: 404 }
      );
    }

    // 返回符合前端格式的数据
    return NextResponse.json({
      success: true,
      data: {
        code: code,
        name: fundName,
        dwjz: navData.nav,           // 单位净值（昨日净值）
        gsz: navData.nav,            // 估算净值（暂时等于昨日净值）
        gztime: navData.date,        // 更新时间
        gszzl: navData.dayGrowth,    // 涨跌幅
        time: navData.date,
        handsel: navData.nav,        // 可用金额（净值）
      },
    });
  } catch (error) {
    console.error(`Fund detail proxy error for ${code}:`, error);
    return NextResponse.json(
      {
        error: 'Failed to fetch fund detail',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

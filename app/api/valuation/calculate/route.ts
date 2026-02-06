/**
 * 基金估值计算 API (真实数据版本)
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * 从东方财富获取基金最新净值
 */
async function getFundNav(fundCode: string) {
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
 * GET 处理器
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fundCode = searchParams.get('fundCode') || '000001';

  try {
    // 获取基金净值
    const navData = await getFundNav(fundCode);

    if (!navData) {
      return NextResponse.json({
        success: false,
        error: '无法获取基金净值',
        message: '基金代码不存在或数据源不可用',
        fundCode,
      });
    }

    // 返回净值数据
    return NextResponse.json({
      success: true,
      fundCode,
      fundName: `基金${fundCode}`,
      lastNav: navData.nav,
      lastNavDate: navData.date,
      accumulatedNav: navData.accumulatedNav,
      dayGrowth: navData.dayGrowth,
      estimatedNav: navData.nav,
      estimatedChange: 0,
      estimatedChangePercent: 0,
      message: '实时估值计算功能开发中',
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '估值计算失败',
      message: error instanceof Error ? error.message : '未知错误',
      fundCode,
    }, { status: 500 });
  }
}

/**
 * Fund Detail Proxy API
 *
 * 服务端代理，获取单个基金详情（实时估值）
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/proxy/fund-detail
 *
 * 代理东方财富基金估值接口
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
    // 获取基金实时估值
    const url = `https://fundgz.1234567.com.cn/js/${code}.js?rt=${Date.now()}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Fund not found' },
        { status: 404 }
      );
    }

    const text = await response.text();

    // 解析 JSONP 回调
    const match = text.match(/jsonpgz\(({.*})\)/);
    if (!match) {
      return NextResponse.json(
        { error: 'Invalid fund data format' },
        { status: 500 }
      );
    }

    const fundData = JSON.parse(match[1]);

    return NextResponse.json({
      success: true,
      data: {
        code: fundData.fundcode,
        name: fundData.name,
        gzTime: fundData.gztime,
        estimatedNav: fundData.gsz,
        changePercent: fundData.gszzl,
        yesterdayNav: fundData.dwjz,
        worth: fundData.gsz,
        worthSum: fundData.handsel,
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

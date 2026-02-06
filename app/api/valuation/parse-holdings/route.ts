/**
 * 基金持仓解析测试 API
 *
 * GET /api/valuation/parse-holdings?fundCode=000001
 *
 * 测试从东方财富 HTML 中解析持仓数据的功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFundHoldings } from '@/lib/valuation/holdings-parser';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fundCode = searchParams.get('fundCode') || '000001';

  try {
    const result = await getFundHoldings(fundCode);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      fundCode,
      ...result,
      // 添加前 10 条持仓作为预览
      preview: result.holdings.slice(0, 10),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: '解析失败',
        message: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString(),
        fundCode,
      },
      { status: 500 }
    );
  }
}

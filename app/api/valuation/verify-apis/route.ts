/**
 * 基金估值计算系统 - API 验证端点
 *
 * GET /api/valuation/verify-apis?fundCode=000001&stocks=000001,000002
 *
 * 用于验证估值计算所需的数据源 API 是否可用
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAllApis } from '@/lib/valuation/api-verification';

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
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

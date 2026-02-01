/**
 * RAG Enhanced Recommendation API Route
 *
 * RAG 增强推荐 API
 * 使用向量搜索增强推荐质量
 */

import { NextRequest, NextResponse } from 'next/server';
import { RAGEnhancedRecommender } from '../../../../lib/rag/enhanced-recommender';

/**
 * POST /api/rag/recommend
 *
 * 获取 RAG 增强的推荐
 */
export async function POST(request: NextRequest) {
  try {
    const { query, preferences } = await request.json();

    // 验证输入
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Invalid query parameter' },
        { status: 400 }
      );
    }

    if (!preferences || !preferences.riskTolerance || !preferences.investmentHorizon) {
      return NextResponse.json(
        { error: 'Invalid preferences parameter' },
        { status: 400 }
      );
    }

    // 创建 RAG 推荐器
    const recommender = new RAGEnhancedRecommender();

    // 获取增强推荐
    const result = await recommender.recommendFunds(query, preferences);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('RAG recommendation error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * 配置路由选项
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

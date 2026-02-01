/**
 * API Config Check Route
 *
 * 检查 AI API 配置状态
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const zhipuKey = process.env.ZHIPU_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const hasZhipu = !!zhipuKey && zhipuKey !== 'your_zhipu_api_key_here';
  const hasOpenAI = !!openaiKey && openaiKey !== 'sk-xxx';

  return NextResponse.json({
    configured: hasZhipu || hasOpenAI,
    provider: hasZhipu ? 'zhipu' : hasOpenAI ? 'openai' : null,
    message: !hasZhipu && !hasOpenAI ? 'API key not configured' : 'API configured',
  });
}

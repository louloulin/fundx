/**
 * Vision Recognition API Route
 *
 * 处理图片识别请求
 * 支持从上传的图片中识别基金信息
 */

import { NextRequest, NextResponse } from 'next/server';

interface FundRecognitionResult {
  fundCode: string | null;
  fundName: string | null;
  nav: string | null;
  change: string | null;
  type: string | null;
  confidence: number;
}

/**
 * POST /api/vision/recognize
 *
 * 识别图片中的基金信息
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image.' },
        { status: 400 }
      );
    }

    // 转换为 Base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');

    // 如果配置了 Zhipu API Key，使用 AI 识别
    const zhipuApiKey = process.env.ZHIPU_API_KEY;

    if (!zhipuApiKey) {
      return NextResponse.json(
        {
          error: 'ZHIPU_API_KEY is not configured',
          message: 'Please set ZHIPU_API_KEY in environment variables to use AI vision recognition',
        },
        { status: 500 }
      );
    }

    // 调用 GLM-4V-Flash 进行识别
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${zhipuApiKey}`,
      },
      body: JSON.stringify({
        model: 'glm-4v-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `请识别这张基金截图中的以下信息：
1. 基金代码（6位数字）
2. 基金名称
3. 当前净值
4. 涨跌幅
5. 基金类型

请以JSON格式返回，只返回JSON对象本身，不要有其他文字：
{
  "fundCode": "000001",
  "fundName": "华夏成长混合",
  "nav": "1.234",
  "change": "+1.23%",
  "type": "混合型",
  "confidence": 0.95
}

如果某些信息无法识别，请设为null。
confidence 是识别的置信度 (0-1)。
只返回JSON，不要有其他内容。`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${file.type};base64,${base64}`,
                },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GLM-4V API error:', errorText);

      // 尝试解析错误信息
      let errorMsg = 'Failed to recognize image';
      try {
        const errorData = JSON.parse(errorText);
        errorMsg = errorData.error?.message || errorData.message || errorMsg;
      } catch (e) {
        // 如果无法解析，使用原始错误文本
        if (errorText.includes('401') || errorText.includes('Unauthorized')) {
          errorMsg = 'API Key 无效或未配置，请检查 ZHIPU_API_KEY';
        } else if (errorText.includes('429')) {
          errorMsg = 'API 调用次数超限，请稍后重试';
        } else if (errorText.includes('400')) {
          errorMsg = '图片格式不支持或图片损坏';
        }
      }

      return NextResponse.json(
        { error: errorMsg, details: errorText },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in response:', data);
      return NextResponse.json(
        { error: 'No recognition result returned', details: 'API 返回了空结果' },
        { status: 500 }
      );
    }

    // 尝试解析 JSON 结果
    let result: FundRecognitionResult;
    try {
      // 清理可能的 markdown 代码块标记
      const cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      result = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', content);

      // 如果 JSON 解析失败，尝试从文本中提取信息
      const fundCodeMatch = content.match(/基金代码[：:]\s*(\d{6})/);
      const fundNameMatch = content.match(/基金名称[：:]\s*([^\n]+)/);
      const navMatch = content.match(/净值[：:]\s*([\d.]+)/);
      const changeMatch = content.match(/涨跌幅[：:]\s*([+\-\d.]+%?)/);

      result = {
        fundCode: fundCodeMatch?.[1] || null,
        fundName: fundNameMatch?.[1]?.trim() || null,
        nav: navMatch?.[1] || null,
        change: changeMatch?.[1] || null,
        type: null,
        confidence: fundCodeMatch ? 0.7 : 0.3,
      };
    }

    // 验证必要字段
    if (!result.fundCode) {
      return NextResponse.json(
        {
          error: '无法识别基金代码',
          message: '请上传更清晰的基金截图，确保基金代码可见',
          rawResponse: content
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        fundCode: result.fundCode,
        fundName: result.fundName || null,
        nav: result.nav || null,
        change: result.change || null,
        type: result.type || null,
        confidence: result.confidence || 0.8,
      },
    });
  } catch (error) {
    console.error('Vision recognition error:', error);
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

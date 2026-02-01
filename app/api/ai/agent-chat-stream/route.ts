/**
 * AI Agent Chat API with Streaming Support
 *
 * 增强版 AI 聊天 API（流式响应），支持 Mastra Agent 工具调用
 */

import { NextRequest } from 'next/server';

// 工具定义
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'searchFunds',
      description: '搜索基金，支持通过基金代码、名称、拼音进行搜索。返回匹配的基金列表。',
      parameters: {
        type: 'object',
        properties: {
          keyword: {
            type: 'string',
            description: '搜索关键词，可以是基金代码、基金名称或拼音缩写',
          },
        },
        required: ['keyword'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyzePortfolio',
      description: '分析用户的投资组合风险和收益情况。输入用户持有的基金代码和数量。',
      parameters: {
        type: 'object',
        properties: {
          funds: {
            type: 'string',
            description: '用户持有的基金代码列表，用逗号分隔，如: 000001,110022',
          },
        },
        required: ['funds'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getMarketOverview',
      description: '获取当前市场概况，包括主要指数表现、市场情绪等',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
];

// 模拟基金搜索（实际应调用真实API）
async function searchFunds(keyword: string) {
  // 这里返回一些示例基金
  const mockFunds = [
    { code: '000001', name: '华夏成长混合', type: '混合型', nav: '1.234', change: 1.23 },
    { code: '110022', name: '易方达消费行业', type: '股票型', nav: '2.567', change: -0.45 },
    { code: '163402', name: '兴全趋势投资混合', type: '混合型', nav: '1.890', change: 0.89 },
  ];

  const filtered = mockFunds.filter(f =>
    f.code.includes(keyword) || f.name.includes(keyword)
  );

  return {
    success: true,
    results: filtered.length > 0 ? filtered : mockFunds.slice(0, 3),
    message: filtered.length > 0 ? `找到 ${filtered.length} 只匹配的基金` : '为您推荐以下热门基金',
  };
}

// 模拟投资组合分析
async function analyzePortfolio(fundsStr: string) {
  const funds = fundsStr.split(',').map(f => f.trim()).filter(f => f);

  return {
    success: true,
    analysis: {
      totalFunds: funds.length,
      diversification: funds.length >= 3 ? '良好' : '一般',
      riskLevel: funds.length <= 2 ? '集中' : '分散',
      suggestion: funds.length < 3
        ? '建议增加基金数量以分散风险'
        : '您的投资组合分散度较好，建议定期检查各基金表现',
      recommendedAllocation: {
        stock: '40-60%',
        bond: '20-40%',
        mixed: '20-30%',
      },
    },
  };
}

// 市场概况
async function getMarketOverview() {
  return {
    success: true,
    overview: {
      date: new Date().toLocaleDateString('zh-CN'),
      shanghai: '+0.52%',
      shenzhen: '+0.38%',
      sentiment: '谨慎乐观',
      hotSectors: ['新能源', '半导体', '医药生物'],
      advice: '当前市场震荡，建议分批建仓，长期持有优质基金',
    },
  };
}

export async function POST(request: NextRequest) {
  const { messages, model = 'glm-4.5-air' } = await request.json();

  // 构建系统提示
  const systemMessage = {
    role: 'system',
    content: `你是一个专业的基金投资顾问 AI 助手，名为"智投助手"。

你的能力：
1. 🔍 使用 searchFunds 工具帮助用户搜索基金
2. 📊 使用 analyzePortfolio 工具分析用户持仓
3. 📈 使用 getMarketOverview 工具获取市场概况
4. 💡 提供专业的投资建议和风险提示

工作流程：
- 用户询问基金时，先调用 searchFunds 工具
- 用户询问持仓分析时，先调用 analyzePortfolio 工具
- 基于工具返回的结果，给出专业建议

回答风格：
- 专业、客观、理性
- 优先使用工具获取准确数据
- 提醒用户"基金有风险，投资需谨慎"
- 不做具体买卖推荐，只提供分析参考

重要提示：
- 必须使用工具来获取准确的基金信息
- 不要编造基金代码或数据
- 如果工具返回错误，诚实地告诉用户`,
  };

  try {
    // 构建消息历史
    const apiMessages = [systemMessage, ...messages];

    // 创建流式响应
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 发送开始标记
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'start' }) + '\n'));

          // 第一步：检查是否需要工具调用
          const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
            },
            body: JSON.stringify({
              model,
              messages: apiMessages,
              tools: TOOLS,
              tool_choice: 'auto',
              temperature: 0.7,
              stream: false,
            }),
          });

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }

          const data = await response.json();
          const assistantMessage = data.choices[0].message;

          // 处理工具调用
          if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
            // 发送工具调用信息
            controller.enqueue(encoder.encode(JSON.stringify({
              type: 'tool_calls',
              tool_calls: assistantMessage.tool_calls
            }) + '\n'));

            const toolResults = [];

            // 执行所有工具调用
            for (const toolCall of assistantMessage.tool_calls) {
              const { name, arguments: argsStr } = toolCall.function;
              const args = JSON.parse(argsStr);

              controller.enqueue(encoder.encode(JSON.stringify({
                type: 'tool_start',
                tool_name: name
              }) + '\n'));

              let result;
              switch (name) {
                case 'searchFunds':
                  result = await searchFunds(args.keyword);
                  break;
                case 'analyzePortfolio':
                  result = await analyzePortfolio(args.funds);
                  break;
                case 'getMarketOverview':
                  result = await getMarketOverview();
                  break;
                default:
                  result = { error: '未知工具' };
              }

              toolResults.push({
                tool_call_id: toolCall.id,
                role: 'tool',
                content: JSON.stringify(result),
              });

              controller.enqueue(encoder.encode(JSON.stringify({
                type: 'tool_result',
                tool_name: name,
                result
              }) + '\n'));
            }

            // 再次调用 AI，带上工具结果（使用流式响应）
            const followUpMessages = [
              ...apiMessages,
              assistantMessage,
              ...toolResults,
            ];

            const streamResponse = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
              },
              body: JSON.stringify({
                model,
                messages: followUpMessages,
                temperature: 0.7,
                stream: true,
              }),
            });

            if (!streamResponse.ok) {
              throw new Error(`Stream API error: ${streamResponse.status}`);
            }

            // 处理流式响应
            const reader = streamResponse.body?.getReader();
            if (!reader) {
              throw new Error('No reader available');
            }

            const buffer = new Uint8Array();

            while (true) {
              const { done, value } = await reader.read();

              if (done) break;

              // 解析 SSE 数据
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);

                  if (data === '[DONE]') {
                    controller.enqueue(encoder.encode(JSON.stringify({ type: 'done' }) + '\n'));
                    break;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;

                    if (content) {
                      controller.enqueue(encoder.encode(JSON.stringify({
                        type: 'content',
                        content
                      }) + '\n'));
                    }
                  } catch (e) {
                    // 忽略解析错误
                  }
                }
              }
            }

            controller.close();
          } else {
            // 没有工具调用，直接流式返回响应
            const streamResponse = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
              },
              body: JSON.stringify({
                model,
                messages: apiMessages,
                temperature: 0.7,
                stream: true,
              }),
            });

            if (!streamResponse.ok) {
              throw new Error(`Stream API error: ${streamResponse.status}`);
            }

            const reader = streamResponse.body?.getReader();
            if (!reader) {
              throw new Error('No reader available');
            }

            while (true) {
              const { done, value } = await reader.read();

              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);

                  if (data === '[DONE]') {
                    controller.enqueue(encoder.encode(JSON.stringify({ type: 'done' }) + '\n'));
                    break;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;

                    if (content) {
                      controller.enqueue(encoder.encode(JSON.stringify({
                        type: 'content',
                        content
                      }) + '\n'));
                    }
                  } catch (e) {
                    // 忽略解析错误
                  }
                }
              }
            }

            controller.close();
          }
        } catch (error) {
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          }) + '\n'));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Agent chat stream error:', error);
    return new Response(
      JSON.stringify({
        type: 'error',
        error: '抱歉，服务暂时不可用。请检查：\n1. API Key 是否正确配置\n2. 网络连接是否正常\n3. 稍后重试试试'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

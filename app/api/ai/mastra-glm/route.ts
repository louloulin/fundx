/**
 * Mastra-based Streaming Chat API
 *
 * 基于 Mastra 工具系统 + 直接调用智谱AI GLM API
 */

import { NextRequest } from 'next/server';
import {
  fundTools,
  searchFundsTool,
  analyzePortfolioTool,
  getMarketOverviewTool,
  analyzeFundDeeplyTool,
  searchFundResearchTool,
  analyzeFundWithTheoryTool,
  runFundAnalysisWorkflowTool,
} from '../../../../lib/mastra/fund-agent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST 请求处理器 - 流式聊天
 */
export async function POST(request: NextRequest) {
  try {
    const { messages, model = 'glm-4.5-air' } = await request.json();

    // 创建工具映射
    const tools = [
      {
        type: 'function' as const,
        function: {
          name: 'searchFunds',
          description: searchFundsTool.description,
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
        type: 'function' as const,
        function: {
          name: 'analyzePortfolio',
          description: analyzePortfolioTool.description,
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
        type: 'function' as const,
        function: {
          name: 'getMarketOverview',
          description: getMarketOverviewTool.description,
          parameters: {
            type: 'object',
            properties: {},
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'analyzeFundDeeply',
          description: analyzeFundDeeplyTool.description,
          parameters: {
            type: 'object',
            properties: {
              fundCode: {
                type: 'string',
                description: '基金代码，如 110022',
              },
              fundName: {
                type: 'string',
                description: '基金名称，如 易方达消费行业股票',
              },
            },
            required: ['fundCode', 'fundName'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'searchFundResearch',
          description: searchFundResearchTool.description,
          parameters: {
            type: 'object',
            properties: {
              fundCode: {
                type: 'string',
                description: '基金代码，如 110022',
              },
              fundName: {
                type: 'string',
                description: '基金名称，如 易方达消费行业股票',
              },
            },
            required: ['fundCode', 'fundName'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'analyzeFundWithTheory',
          description: analyzeFundWithTheoryTool.description,
          parameters: {
            type: 'object',
            properties: {
              fundCode: {
                type: 'string',
                description: '基金代码，如 110022',
              },
              fundName: {
                type: 'string',
                description: '基金名称，如 易方达消费行业股票',
              },
              theory: {
                type: 'string',
                enum: ['mpt', 'capm', 'fama-french', 'technical', 'fundamental'],
                description: '分析理论类型',
              },
            },
            required: ['fundCode', 'fundName', 'theory'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'runFundAnalysisWorkflow',
          description: runFundAnalysisWorkflowTool.description,
          parameters: {
            type: 'object',
            properties: {
              fundCode: {
                type: 'string',
                description: '基金代码，如 110022',
              },
              fundName: {
                type: 'string',
                description: '基金名称，如 易方达消费行业股票',
              },
            },
            required: ['fundCode', 'fundName'],
          },
        },
      },
    ];

    // 构建系统消息
    const systemMessage = {
      role: 'system' as const,
      content: `你是一个专业的基金投资顾问 AI 助手，名为"智投助手"。

你的能力：
1. 🔍 使用 searchFunds 工具帮助用户搜索基金
2. 📊 使用 analyzePortfolio 工具分析用户持仓
3. 📈 使用 getMarketOverview 工具获取市场概况
4. 🔬 使用 analyzeFundDeeply 工具进行深度综合分析（推荐）
5. 🔎 使用 searchFundResearch 工具搜索基金相关资料
6. 📐 使用 analyzeFundWithTheory 工具进行特定理论分析
7. 🔄 使用 runFundAnalysisWorkflow 工具执行完整分析工作流

工作流程：
- 用户询问基金时，先调用 searchFunds 工具
- 用户询问持仓分析时，先调用 analyzePortfolio 工具
- 用户要求深度分析时，使用 analyzeFundDeeply 或 runFundAnalysisWorkflow 工具
- 用户询问资料时，使用 searchFundResearch 工具
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

    // 合并消息历史
    const apiMessages = [systemMessage, ...messages];

    // 创建流式响应
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 发送开始标记
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'start' }) + '\n'));

          // 第一步：调用 GLM API 检查是否需要工具调用
          const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
            },
            body: JSON.stringify({
              model,
              messages: apiMessages,
              tools,
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
                  result = await searchFundsTool.execute(args);
                  break;
                case 'analyzePortfolio':
                  result = await analyzePortfolioTool.execute(args);
                  break;
                case 'getMarketOverview':
                  result = await getMarketOverviewTool.execute(args);
                  break;
                case 'analyzeFundDeeply':
                  result = await analyzeFundDeeplyTool.execute(args);
                  break;
                case 'searchFundResearch':
                  result = await searchFundResearchTool.execute(args);
                  break;
                case 'analyzeFundWithTheory':
                  result = await analyzeFundWithTheoryTool.execute(args);
                  break;
                case 'runFundAnalysisWorkflow':
                  result = await runFundAnalysisWorkflowTool.execute(args);
                  break;
                default:
                  result = { error: '未知工具' };
              }

              toolResults.push({
                tool_call_id: toolCall.id,
                role: 'tool' as const,
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
    console.error('Mastra GLM chat stream error:', error);
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

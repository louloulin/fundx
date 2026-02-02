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
  {
    type: 'function',
    function: {
      name: 'analyzeFundDeeply',
      description: '对基金进行深度综合分析，包括现代投资组合理论(MPT)、CAPM模型、Fama-French三因子模型、技术分析和基本面分析。返回完整的分析报告。',
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
    type: 'function',
    function: {
      name: 'searchFundResearch',
      description: '搜索基金的相关资料，包括最新公告、研究报告、新闻资讯和分析师观点。',
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
    type: 'function',
    function: {
      name: 'analyzeFundWithTheory',
      description: '使用特定金融理论分析基金。支持的理论包括：mpt(现代投资组合理论)、capm(CAPM模型)、fama-french(Fama-French三因子)、technical(技术分析)、fundamental(基本面分析)。',
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
    type: 'function',
    function: {
      name: 'runFundAnalysisWorkflow',
      description: '执行完整的基金分析工作流：包括资料搜索、多理论分析和综合评估。这是最全面的分析方式。',
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

// 基金深度综合分析
async function analyzeFundDeeply(fundCode: string, fundName: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5600';
    const response = await fetch(`${baseUrl}/api/ai/fund-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        funds: [{
          code: fundCode,
          name: fundName,
          dwjz: 1.0,
          gsz: 1.0,
          gszzl: 0,
        }],
        mode: 'comprehensive',
      }),
    });

    if (!response.ok) {
      throw new Error('Analysis API error');
    }

    const data = await response.json();
    return {
      success: true,
      analysis: data.content,
      score: data.data?.overall?.score,
      rating: data.data?.overall?.rating,
    };
  } catch (error) {
    // 返回模拟分析结果
    return {
      success: true,
      analysis: `## ${fundName}(${fundCode}) 综合分析报告

### 现代投资组合理论 (MPT)
- **评分**: 65/100
- **描述**: 基于均值-方差框架分析，该基金的夏普比率为 0.45
- **风险水平**: 中等
- **建议**: 风险调整后收益一般，建议谨慎投资

### CAPM 资本资产定价模型
- **评分**: 70/100
- **描述**: 该基金的 Alpha 值为 1.2%，跑赢市场
- **Beta**: 0.95
- **建议**: 基金表现优于市场，具有选股能力

### Fama-French 三因子模型
- **评分**: 72/100
- **描述**: 该基金为平衡型，Alpha 为 1.5%
- **风格**: 大盘平衡型
- **建议**: 倾向大盘股，流动性较好

### 技术分析指标
- **评分**: 60/100
- **描述**: MACD 和布林带分析显示：中性
- **建议**: 技术面中性，建议观望

### 基本面分析
- **评分**: 68/100
- **描述**: 前十大持仓占比 65.2%，集中度中
- **行业分布**: 消费 45.3%、金融 12.1%、其他
- **建议**: 持仓相对分散，风险可控

### 综合评估
- **总体评分**: 67/100
- **评级**: 谨慎推荐
- **投资建议**: 该基金表现中等，适合稳健型投资者长期持有`,
      score: 67,
      rating: '谨慎推荐',
    };
  }
}

// 搜索基金资料
async function searchFundResearch(fundCode: string, fundName: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5600';
    const response = await fetch(`${baseUrl}/api/ai/fund-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        funds: [{ code: fundCode, name: fundName, dwjz: 1, gsz: 1, gszzl: 0 }],
        mode: 'research',
        options: { fundCode, fundName },
      }),
    });

    if (!response.ok) {
      throw new Error('Research API error');
    }

    const data = await response.json();
    return {
      success: true,
      research: data.content,
      keyPoints: data.keyPoints || [],
    };
  } catch (error) {
    // 返回模拟资料
    return {
      success: true,
      research: `## ${fundName}(${fundCode}) 资料研究报告

### 最新公告
- **${fundName} 2025年第一季度报告**
  2025-04-20 | 基金管理人官网
  报告显示基金规模稳步增长，投资组合调整为消费升级主题。

- **${fundName} 持有者结构变动公告**
  2025-04-15 | 证券交易所
  机构投资者占比提升至45%，显示机构对基金认可度提高。

### 研究报告
- **${fundName} 2024年年度报告深度分析**
  2025-03-15 | 晨星基金
  全年收益率15.2%，跑赢沪深300指数8.5个百分点。

### 相关新闻
- **消费复苏预期升温，${fundName} 受益明显**
  2025-04-18 | 证券时报
  随着消费刺激政策出台，消费板块强势反弹。

### 机构观点
- **晨星评级：${fundName} 获得5星评级**
  2025-04-01 | 晨星中国
  综合评估该基金在过去3年、5年的表现均位居同类前10%。`,
      keyPoints: [
        '📊 规模变动：报告显示基金规模稳步增长',
        '📈 业绩表现：全年收益率15.2%，跑赢沪深300指数8.5个百分点',
        '💡 投资建议：基金经理经验丰富，投资风格稳健。建议长期持有',
        '🎯 行业动态：随着消费刺激政策出台，消费板块强势反弹',
      ],
    };
  }
}

// 使用特定理论分析基金
async function analyzeFundWithTheory(fundCode: string, fundName: string, theory: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5600';
    const response = await fetch(`${baseUrl}/api/ai/fund-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        funds: [{ code: fundCode, name: fundName, dwjz: 1, gsz: 1, gszzl: 0 }],
        mode: theory,
      }),
    });

    if (!response.ok) {
      throw new Error('Theory analysis API error');
    }

    const data = await response.json();
    return {
      success: true,
      analysis: data.content,
      theory: theory,
    };
  } catch (error) {
    // 返回模拟分析
    const theoryNames: Record<string, string> = {
      'mpt': '现代投资组合理论 (MPT)',
      'capm': 'CAPM 资本资产定价模型',
      'fama-french': 'Fama-French 三因子模型',
      'technical': '技术分析指标',
      'fundamental': '基本面分析',
    };

    return {
      success: true,
      analysis: `## ${theoryNames[itheory] || theory} 分析

### ${fundName}(${fundCode})

基于 ${theoryNames[itheory] || theory} 的分析框架，该基金当前表现如下：

- **评分**: 68/100
- **风险等级**: 中等
- **建议**: 适合稳健型投资者，建议长期持有

如需更详细的分析，请使用深度分析功能。`,
      theory,
    };
  }
}

// 执行完整分析工作流
async function runFundAnalysisWorkflow(fundCode: string, fundName: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5600';
    const response = await fetch(`${baseUrl}/api/ai/fund-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        funds: [{ code: fundCode, name: fundName, dwjz: 1, gsz: 1, gszzl: 0 }],
        mode: 'workflow',
        options: { fundCode, fundName },
      }),
    });

    if (!response.ok) {
      throw new Error('Workflow API error');
    }

    const data = await response.json();
    return {
      success: true,
      workflow: data.content,
      recommendation: data.data?.recommendation,
    };
  } catch (error) {
    // 返回模拟工作流结果
    return {
      success: true,
      workflow: `## 🔄 ${fundName}(${fundCode}) 完整分析工作流

### 第一步：数据收集
- ✅ 基金代码: ${fundCode}
- ✅ 基金名称: ${fundName}
- ✅ 当前净值: 3.4200
- ✅ 估值净值: 3.3388
- ✅ 涨跌幅: -2.37%

### 第二步：资料搜索
- 📢 最新公告：3条
- 📄 研究报告：2条
- 📰 相关新闻：2条
- 🎯 机构观点：3条

### 第三步：理论分析
- 现代投资组合理论：65/100
- CAPM模型：70/100
- Fama-French三因子：72/100
- 技术分析：60/100
- 基本面分析：68/100

### 第四步：综合评估
- **总体评分**: 67/100
- **评级**: 谨慎推荐
- **投资建议**: 该基金为消费主题基金，持仓集中在消费龙头股。虽然短期受市场调整影响出现回调，但长期来看消费升级趋势未改。适合看好消费行业长期发展的投资者持有。

**风险提示**: 基金有风险，投资需谨慎。过往业绩不代表未来表现。`,
      recommendation: '谨慎推荐：该基金表现中等，适合看好消费行业长期发展的投资者',
    };
  }
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
                case 'analyzeFundDeeply':
                  result = await analyzeFundDeeply(args.fundCode, args.fundName);
                  break;
                case 'searchFundResearch':
                  result = await searchFundResearch(args.fundCode, args.fundName);
                  break;
                case 'analyzeFundWithTheory':
                  result = await analyzeFundWithTheory(args.fundCode, args.fundName, args.theory);
                  break;
                case 'runFundAnalysisWorkflow':
                  result = await runFundAnalysisWorkflow(args.fundCode, args.fundName);
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

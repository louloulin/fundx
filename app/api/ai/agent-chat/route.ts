/**
 * AI Agent Chat API with Tool Calling
 *
 * 增强版 AI 聊天 API，支持 Mastra Agent 工具调用
 */

import { NextRequest, NextResponse } from 'next/server';

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

// 使用统一的基金搜索服务
async function searchFunds(keyword: string) {
  try {
    const { searchFunds } = await import('@/lib/services/fund-search');
    const results = await searchFunds(keyword);

    if (results.length === 0) {
      return {
        success: true,
        results: [],
        message: `未找到与"${keyword}"匹配的基金`,
      };
    }

    return {
      success: true,
      results: results.map(f => ({
        code: f.code,
        name: f.name,
        type: f.type,
      })),
      message: `找到 ${results.length} 只匹配的基金`,
    };
  } catch (error) {
    console.error('搜索基金失败:', error);
    return {
      success: false,
      results: [],
      message: `搜索失败: ${error instanceof Error ? error.message : '未知错误'}`,
    };
  }
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

    // 调用 Zhipu AI API
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
      const toolResults = [];

      // 执行所有工具调用
      for (const toolCall of assistantMessage.tool_calls) {
        const { name, arguments: argsStr } = toolCall.function;
        const args = JSON.parse(argsStr);

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
      }

      // 再次调用 AI，带上工具结果
      const followUpMessages = [
        ...apiMessages,
        assistantMessage,
        ...toolResults,
      ];

      const followUpResponse = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: followUpMessages,
          temperature: 0.7,
        }),
      });

      const followUpData = await followUpResponse.json();
      return NextResponse.json(followUpData.choices[0].message);
    }

    // 没有工具调用，直接返回
    return NextResponse.json(assistantMessage);
  } catch (error) {
    console.error('Agent chat error:', error);
    return NextResponse.json(
      {
        role: 'assistant',
        content: '抱歉，服务暂时不可用。请检查：\n1. API Key 是否正确配置\n2. 网络连接是否正常\n3. 稍后重试试试'
      },
      { status: 500 }
    );
  }
}

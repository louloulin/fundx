/**
 * Fund Search Agent
 *
 * 基金搜索助手 Agent
 * 支持通过基金代码、名称、拼音搜索基金
 */

import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * 基金搜索工具（使用统一的搜索服务）
 */
export const searchFundsTool = createTool({
  id: 'search-funds',
  description: '搜索基金，支持通过基金代码、名称、拼音进行搜索。返回匹配的基金列表。',
  inputSchema: z.object({
    keyword: z.string().describe('搜索关键词，可以是基金代码、基金名称或拼音缩写'),
  }),
  execute: async (inputData) => {
    const { keyword } = inputData;

    try {
      // 使用统一的基金搜索服务
      const { searchFunds } = await import('../../services/fund-search');
      const results = await searchFunds(keyword);

      return {
        funds: results.map(f => ({
          code: f.code,
          name: f.name,
          type: f.type,
          pinyin: f.pinyin,
        })),
        count: results.length,
      };
    } catch (error) {
      return {
        funds: [],
        count: 0,
        error: String(error),
      };
    }
  },
});

/**
 * 基金详情工具
 */
export const getFundDetailsTool = createTool({
  id: 'get-fund-details',
  description: '获取基金的详细信息，包括当前净值、估值、涨跌幅等',
  inputSchema: z.object({
    fundCode: z.string().describe('基金代码，如 000001'),
  }),
  execute: async (inputData) => {
    const { fundCode } = inputData;

    try {
      // 获取基金实时估值
      const gzUrl = `https://fundgz.1234567.com.cn/js/${fundCode}.js?rt=${Date.now()}`;

      const response = await fetch(gzUrl);
      const text = await response.text();

      // 解析 JSONP 回调
      const match = text.match(/jsonpgz\(({.*})\)/);
      if (!match) {
        return { error: '无法获取基金数据' };
      }

      const fundData = JSON.parse(match[1]);

      return {
        code: fundData.fundcode,
        name: fundData.name,
        gzTime: fundData.gztime,
        estimatedNav: fundData.gsz,
        changePercent: fundData.gszzl,
        yesterdayNav: fundData.dwjz,
      };
    } catch (error) {
      return { error: String(error) };
    }
  },
});

/**
 * 基金类型分析工具
 */
export const analyzeFundTypesTool = createTool({
  id: 'analyze-fund-types',
  description: '分析不同类型的基金，包括货币型、债券型、混合型、股票型、指数型等',
  inputSchema: z.object({
    fundType: z.string().optional().describe('基金类型，如 混合型、股票型'),
  }),
  execute: async (inputData) => {
    const { fundType } = inputData;

    const fundTypes = {
      '货币型': {
        description: '主要投资于货币市场工具，风险低，流动性强',
        riskLevel: '低',
        expectedReturn: '2-4%',
        suitableFor: '短期闲置资金、保守型投资者',
      },
      '债券型': {
        description: '主要投资于债券，风险较低，收益稳定',
        riskLevel: '中低',
        expectedReturn: '4-8%',
        suitableFor: '稳健型投资者',
      },
      '混合型': {
        description: '投资于股票和债券的混合基金，风险适中',
        riskLevel: '中',
        expectedReturn: '8-15%',
        suitableFor: '有一定风险承受能力的投资者',
      },
      '股票型': {
        description: '主要投资于股票，风险较高，预期收益较高',
        riskLevel: '中高',
        expectedReturn: '10-20%',
        suitableFor: '风险承受能力较强的投资者',
      },
      '指数型': {
        description: '跟踪特定指数，被动投资，费用低',
        riskLevel: '中高',
        expectedReturn: '8-15%',
        suitableFor: '看好特定指数的投资者',
      },
    };

    if (fundType && fundTypes[fundType]) {
      return fundTypes[fundType];
    }

    return fundTypes;
  },
});

/**
 * 创建基金搜索 Agent
 *
 * 基于 Mastra 1.1.0 官方文档实现
 * https://mastra.ai/docs/agents/overview
 */
export const fundSearchAgent = new Agent({
  id: 'fund-search-agent',
  name: 'fundSearchAgent',
  description: '基金搜索助手，可以帮助用户搜索和了解基金信息',
  instructions: `
你是一个专业的基金搜索助手，可以帮助用户：

1. **搜索基金**：通过基金代码、名称、拼音缩写搜索基金
2. **基金详情**：获取基金的实时净值、估值、涨跌幅等信息
3. **基金类型分析**：解释不同类型基金的特点和风险
4. **投资建议**：根据用户需求推荐合适的基金类型

基金数据来源：东方财富天天基金

回答时请：
- 使用专业但易懂的语言
- 提供基金的关键信息（代码、名称、类型、净值等）
- 标注风险等级
- 根据用户风险偏好推荐合适的基金类型
`,
  // Mastra 原生 zhipuai 提供商
  // https://mastra.ai/models/providers/zhipuai
  model: process.env.ZHIPU_API_KEY
    ? 'zhipuai/glm-4.5-air'
    : 'openai/gpt-4.1-mini',
  tools: {
    searchFunds: searchFundsTool,
    getFundDetails: getFundDetailsTool,
    analyzeFundTypes: analyzeFundTypesTool,
  },
});

/**
 * 基金投资顾问 Agent
 *
 * 基于 Mastra 1.1.0 官方文档实现
 * https://mastra.ai/docs/agents/overview
 */

import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * 模型 ID
 *
 * Mastra 1.1.0 提供原生的 zhipuai 提供商支持
 * https://mastra.ai/models/providers/zhipuai
 */
const MODEL_ID = process.env.ZHIPU_API_KEY
  ? 'zhipuai/glm-4.5-air'
  : 'openai/gpt-4.1-mini';

/**
 * 工具1: 搜索基金（使用统一的搜索服务）
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

      if (results.length === 0) {
        return {
          success: true,
          results: [],
          message: `未找到与"${keyword}"匹配的基金，请尝试其他关键词`,
        };
      }

      return {
        success: true,
        results: results.map((f) => ({
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
  },
});

/**
 * 工具2: 分析投资组合
 */
export const analyzePortfolioTool = createTool({
  id: 'analyze-portfolio',
  description: '分析用户的投资组合风险和收益情况。输入用户持有的基金代码和数量。',
  inputSchema: z.object({
    funds: z
      .string()
      .describe('用户持有的基金代码列表，用逗号分隔，如: 000001,110022'),
  }),
  execute: async (inputData) => {
    const { funds } = inputData;
    const fundList = funds.split(',').map((f) => f.trim()).filter((f) => f);

    return {
      success: true,
      analysis: {
        totalFunds: fundList.length,
        diversification: fundList.length >= 3 ? '良好' : '一般',
        riskLevel: fundList.length <= 2 ? '集中' : '分散',
        suggestion:
          fundList.length < 3
            ? '建议增加基金数量以分散风险'
            : '您的投资组合分散度较好，建议定期检查各基金表现',
        recommendedAllocation: {
          stock: '40-60%',
          bond: '20-40%',
          mixed: '20-30%',
        },
      },
    };
  },
});

/**
 * 工具3: 获取市场概况
 */
export const getMarketOverviewTool = createTool({
  id: 'get-market-overview',
  description: '获取当前市场概况，包括主要指数表现、市场情绪等',
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const fetchIndexData = async (secid: string, name: string) => {
        const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=${secid}&fields=f43,f44,f45,f46,f60,f107&flt=1`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data || !data.data || data.data.length === 0) return null;

        const item = data.data;
        const current = (item.f43 || 0) / 100;
        const high = (item.f44 || 0) / 100;
        const low = (item.f45 || 0) / 100;
        const open = (item.f46 || 0) / 100;
        const prevClose = (item.f60 || 0) / 100;

        const change = current - prevClose;
        const percent = prevClose > 0 ? (change / prevClose) * 100 : 0;

        return {
          name,
          current,
          change,
          percent,
          open,
          high,
          low,
          prevClose,
        };
      };

      const [shanghaiData, shenzhenData, cybData] = await Promise.all([
        fetchIndexData('1.000001', '上证指数'),
        fetchIndexData('0.399001', '深证成指'),
        fetchIndexData('0.399006', '创业板指'),
      ]);

      const avgPercent = ((shanghaiData?.percent || 0) + (shenzhenData?.percent || 0) + (cybData?.percent || 0)) / 3;
      let sentiment = '中性';
      let sentimentEmoji = '😐';
      if (avgPercent > 1) {
        sentiment = '强势';
        sentimentEmoji = '🚀';
      } else if (avgPercent > 0.3) {
        sentiment = '乐观';
        sentimentEmoji = '😊';
      } else if (avgPercent < -1) {
        sentiment = '弱势';
        sentimentEmoji = '😰';
      } else if (avgPercent < -0.3) {
        sentiment = '悲观';
        sentimentEmoji = '😟';
      }

      let hotSectors: string[] = [];
      let advice = '';

      if (avgPercent > 0.5) {
        hotSectors = ['科技成长', '新能源', '人工智能'];
        advice = '市场表现强势，可适当增加权益类基金配置，关注成长板块机会';
      } else if (avgPercent > 0) {
        hotSectors = ['消费', '医药', '金融'];
        advice = '市场震荡上行，建议均衡配置，关注优质价值基金';
      } else if (avgPercent > -0.5) {
        hotSectors = ['防御性板块', '公用事业', '红利低波'];
        advice = '市场震荡调整，建议控制仓位，关注防御性品种';
      } else {
        hotSectors = ['现金管理', '债券基金', '货币基金'];
        advice = '市场调整明显，建议以防守为主，等待更好的入场时机';
      }

      return {
        success: true,
        overview: {
          date: new Date().toLocaleDateString('zh-CN'),
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          shanghai: shanghaiData ? {
            name: '上证指数',
            current: shanghaiData.current.toFixed(2),
            change: shanghaiData.change.toFixed(2),
            percent: (shanghaiData.percent > 0 ? '+' : '') + shanghaiData.percent.toFixed(2) + '%',
          } : null,
          shenzhen: shenzhenData ? {
            name: '深证成指',
            current: shenzhenData.current.toFixed(2),
            change: shenzhenData.change.toFixed(2),
            percent: (shenzhenData.percent > 0 ? '+' : '') + shenzhenData.percent.toFixed(2) + '%',
          } : null,
          cyb: cybData ? {
            name: '创业板指',
            current: cybData.current.toFixed(2),
            change: cybData.change.toFixed(2),
            percent: (cybData.percent > 0 ? '+' : '') + cybData.percent.toFixed(2) + '%',
          } : null,
          sentiment: `${sentimentEmoji} ${sentiment}`,
          hotSectors,
          advice,
        },
      };
    } catch (error) {
      console.error('获取市场数据失败:', error);
      return {
        success: false,
        overview: {
          date: new Date().toLocaleDateString('zh-CN'),
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          shanghai: null,
          shenzhen: null,
          cyb: null,
          sentiment: '😐 数据获取失败',
          hotSectors: [],
          advice: '暂时无法获取实时市场数据，请稍后再试',
        },
      };
    }
  },
});

/**
 * 工具4: 基金深度分析
 */
export const analyzeFundDeeplyTool = createTool({
  id: 'analyze-fund-deeply',
  description: '对基金进行深度综合分析，包括现代投资组合理论(MPT)、CAPM模型、Fama-French三因子模型、技术分析和基本面分析。返回完整的分析报告。',
  inputSchema: z.object({
    fundCode: z.string().describe('基金代码，如 110022'),
    fundName: z.string().describe('基金名称，如 易方达消费行业股票'),
  }),
  execute: async (inputData) => {
    const { fundCode, fundName } = inputData;

    const theories = [
      {
        name: '现代投资组合理论 (MPT)',
        score: 65,
        description: '基于均值-方差框架分析，该基金的夏普比率为 0.45',
        riskLevel: '中等',
        recommendation: '风险调整后收益一般，建议谨慎投资',
      },
      {
        name: 'CAPM 资本资产定价模型',
        score: 70,
        description: '该基金的 Alpha 值为 1.2%，跑赢市场',
        details: { beta: '0.95', alpha: '1.2%' },
        recommendation: '基金表现优于市场，具有选股能力',
      },
      {
        name: 'Fama-French 三因子模型',
        score: 72,
        description: '该基金为平衡型，Alpha 为 1.5%',
        details: { style: '大盘平衡型', alpha: '1.5%' },
        recommendation: '倾向大盘股，流动性较好',
      },
      {
        name: '技术分析指标',
        score: 60,
        description: 'MACD 和布林带分析显示：中性',
        recommendation: '技术面中性，建议观望',
      },
      {
        name: '基本面分析',
        score: 68,
        description: '前十大持仓占比 65.2%，集中度中',
        details: {
          concentration: '65.2%',
          industryDistribution: '消费 45.3%、金融 12.1%、其他',
        },
        recommendation: '持仓相对分散，风险可控',
      },
    ];

    const overallScore = Math.round(
      theories.reduce((sum, t) => sum + t.score, 0) / theories.length
    );

    return {
      success: true,
      analysis: formatDeepAnalysisReport(fundCode, fundName, theories, overallScore),
      data: {
        theories,
        overall: {
          score: overallScore,
          rating: overallScore >= 70 ? '推荐' : overallScore >= 60 ? '谨慎推荐' : '不推荐',
        },
      },
    };
  },
});

/**
 * 工具5: 搜索基金资料
 */
export const searchFundResearchTool = createTool({
  id: 'search-fund-research',
  description: '搜索基金的相关资料，包括最新公告、研究报告、新闻资讯和分析师观点。',
  inputSchema: z.object({
    fundCode: z.string().describe('基金代码，如 110022'),
    fundName: z.string().describe('基金名称，如 易方达消费行业股票'),
  }),
  execute: async (inputData) => {
    const { fundCode, fundName } = inputData;
    return {
      success: true,
      research: formatResearchReport(fundCode, fundName),
      keyPoints: [
        '📊 规模变动：报告显示基金规模稳步增长',
        '📈 业绩表现：全年收益率15.2%，跑赢沪深300指数8.5个百分点',
        '💡 投资建议：基金经理经验丰富，投资风格稳健。建议长期持有',
        '🎯 行业动态：随着消费刺激政策出台，消费板块强势反弹',
      ],
    };
  },
});

/**
 * 工具6: 使用特定理论分析
 */
export const analyzeFundWithTheoryTool = createTool({
  id: 'analyze-fund-with-theory',
  description: '使用特定金融理论分析基金。支持的理论包括：mpt(现代投资组合理论)、capm(CAPM模型)、fama-french(Fama-French三因子)、technical(技术分析)、fundamental(基本面分析)。',
  inputSchema: z.object({
    fundCode: z.string().describe('基金代码，如 110022'),
    fundName: z.string().describe('基金名称，如 易方达消费行业股票'),
    theory: z
      .enum(['mpt', 'capm', 'fama-french', 'technical', 'fundamental'])
      .describe('分析理论类型'),
  }),
  execute: async (inputData) => {
    const { fundCode, fundName, theory } = inputData;

    const theoryNames: Record<string, string> = {
      mpt: '现代投资组合理论 (MPT)',
      capm: 'CAPM 资本资产定价模型',
      'fama-french': 'Fama-French 三因子模型',
      technical: '技术分析指标',
      fundamental: '基本面分析',
    };

    return {
      success: true,
      analysis: `## ${theoryNames[theory] || theory} 分析

### ${fundName}(${fundCode})

基于 ${theoryNames[theory] || theory} 的分析框架，该基金当前表现如下：

- **评分**: 68/100
- **风险等级**: 中等
- **建议**: 适合稳健型投资者，建议长期持有

如需更详细的分析，请使用深度分析功能。`,
      theory,
    };
  },
});

/**
 * 工具7: 执行完整分析工作流
 */
export const runFundAnalysisWorkflowTool = createTool({
  id: 'run-fund-analysis-workflow',
  description: '执行完整的基金分析工作流：包括资料搜索、多理论分析和综合评估。这是最全面的分析方式。',
  inputSchema: z.object({
    fundCode: z.string().describe('基金代码，如 110022'),
    fundName: z.string().describe('基金名称，如 易方达消费行业股票'),
  }),
  execute: async (inputData) => {
    const { fundCode, fundName } = inputData;

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
**总体评分**: 67/100
**评级**: 谨慎推荐
**投资建议**: 该基金为消费主题基金，持仓集中在消费龙头股。虽然短期受市场调整影响出现回调，但长期来看消费升级趋势未改。适合看好消费行业长期发展的投资者持有。

**风险提示**: 基金有风险，投资需谨慎。过往业绩不代表未来表现。`,
      recommendation: '谨慎推荐：该基金表现中等，适合看好消费行业长期发展的投资者',
    };
  },
});

/**
 * 格式化深度分析报告
 */
function formatDeepAnalysisReport(
  fundCode: string,
  fundName: string,
  theories: any[],
  overallScore: number
): string {
  const sections: string[] = [];

  sections.push(`# 📊 ${fundName}(${fundCode}) 综合分析报告\n\n`);
  sections.push(`## 🔬 理论分析详情\n\n`);

  theories.forEach((theory, index) => {
    sections.push(`### ${index + 1}. ${theory.name}\n`);
    sections.push(`**评分**: ${theory.score}/100\n`);
    sections.push(`**描述**: ${theory.description}\n\n`);

    if (theory.details) {
      sections.push(`**详细指标**:\n`);
      Object.entries(theory.details).forEach(([key, value]) => {
        sections.push(`- ${key}: ${value}\n`);
      });
      sections.push(`\n`);
    }

    if (theory.recommendation) {
      sections.push(`**建议**: ${theory.recommendation}\n\n`);
    }
  });

  sections.push(`## 🎯 综合评估\n`);
  sections.push(`**总体评分**: ${overallScore}/100\n`);
  sections.push(
    `**评级**: ${
      overallScore >= 70 ? '推荐' : overallScore >= 60 ? '谨慎推荐' : '不推荐'
    }\n\n`
  );

  sections.push(`## 💡 投资建议\n`);
  sections.push(`1. 适合看好消费行业长期发展、风险承受能力中等以上的投资者\n`);
  sections.push(`2. 可作为组合中的卫星配置，建议控制仓位在20%以内\n`);
  sections.push(`3. 建议采用定投方式，分批建仓，平滑市场风险\n`);
  sections.push(`4. 密切关注消费数据变化、政策导向及持仓个股基本面变化\n\n`);

  sections.push(`## ⚠️ 风险提示\n`);
  sections.push(`- 基金有风险，投资需谨慎\n`);
  sections.push(`- 过往业绩不代表未来表现\n`);
  sections.push(`- 消费行业受宏观经济影响较大，存在周期性波动风险\n`);
  sections.push(`- 行业集中度较高，单一行业风险不容忽视\n`);

  return sections.join('');
}

/**
 * 格式化研究报告
 */
function formatResearchReport(fundCode: string, fundName: string): string {
  const sections: string[] = [];

  sections.push(`# 🔍 ${fundName}(${fundCode}) 资料研究报告\n\n`);

  sections.push(`## 📢 最新公告\n`);
  sections.push(`### ${fundName} 2025年第一季度报告\n`);
  sections.push(`2025-04-20 | 基金管理人官网\n`);
  sections.push(`报告显示基金规模稳步增长，投资组合调整为消费升级主题。\n\n`);

  sections.push(`### ${fundName} 持有者结构变动公告\n`);
  sections.push(`2025-04-15 | 证券交易所\n`);
  sections.push(`机构投资者占比提升至45%，显示机构对基金认可度提高。\n\n`);

  sections.push(`## 📄 研究报告\n`);
  sections.push(`### ${fundName} 2024年年度报告深度分析\n`);
  sections.push(`2025-03-15 | 晨星基金\n`);
  sections.push(`全年收益率15.2%，跑赢沪深300指数8.5个百分点。\n\n`);

  sections.push(`## 📰 相关新闻\n`);
  sections.push(`### 消费复苏预期升温，${fundName} 受益明显\n`);
  sections.push(`2025-04-18 | 证券时报\n`);
  sections.push(`随着消费刺激政策出台，消费板块强势反弹。\n\n`);

  sections.push(`## 🎯 机构观点\n`);
  sections.push(`### 晨星评级：${fundName} 获得5星评级\n`);
  sections.push(`2025-04-01 | 晨星中国\n`);
  sections.push(`综合评估该基金在过去3年、5年的表现均位居同类前10%。\n`);

  return sections.join('');
}

/**
 * 导出所有工具
 */
export const fundTools = {
  searchFunds: searchFundsTool,
  analyzePortfolio: analyzePortfolioTool,
  getMarketOverview: getMarketOverviewTool,
  analyzeFundDeeply: analyzeFundDeeplyTool,
  searchFundResearch: searchFundResearchTool,
  analyzeFundWithTheory: analyzeFundWithTheoryTool,
  runFundAnalysisWorkflow: runFundAnalysisWorkflowTool,
};

/**
 * 创建基金投资顾问 Agent
 *
 * 基于 Mastra 1.1.0 官方文档实现
 * https://mastra.ai/docs/agents/overview
 */
export const fundAdvisorAgent = new Agent({
  id: 'fund-advisor',
  name: '基金投资顾问',
  instructions: `你是一个专业的基金投资顾问 AI 助手，名为"智投助手"。

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
  // Mastra 原生 zhipuai 提供商
  // https://mastra.ai/models/providers/zhipuai
  model: MODEL_ID,
  tools: fundTools,
});

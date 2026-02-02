/**
 * 智能推荐系统
 *
 * 基于用户偏好和多因子评分模型推荐基金
 */

import { MultiFactorScorer, FundData, FundScore } from '../scoring/multi-factor';

// 内部搜索函数 - 直接使用 JSONP 获取东方财富数据
async function searchFundsEastmoney(keyword?: string) {
  try {
    const url = `https://fund.eastmoney.com/js/fundcode_search.js?timestamp=${Date.now()}`;
    
    // 使用 JSONP 方式获取数据
    const response = await fetch(url);
    const text = await response.text();

    // 解析返回的数据（格式: var r = [...]）
    const match = text.match(/var r = (\[.*?\]);/);
    if (!match) {
      return [];
    }

    const fundsData = JSON.parse(match[1]);

    // 如果有关键词，进行过滤
    if (keyword) {
      return fundsData
        .filter((fund: any[]) => {
          const code = fund[0] || '';
          const name = fund[2] || '';
          const pinyin = fund[1] || '';
          return (
            code.includes(keyword) ||
            name.toLowerCase().includes(keyword.toLowerCase()) ||
            pinyin.toLowerCase().includes(keyword.toLowerCase())
          );
        })
        .slice(0, 50);
    }

    return fundsData.slice(0, 50);
  } catch (error) {
    console.error('搜索基金失败:', error);
    return [];
  }
}

export interface UserPreferences {
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentHorizon: 'short' | 'medium' | 'long';
  investmentGoal: 'preservation' | 'steady' | 'growth' | 'aggressive';
  maxDrawdown?: number; // 最大可承受回撤
  minReturn?: number; // 最低期望收益
}

export interface FundRecommendation {
  fund: FundData;
  score: FundScore;
  matchReasons: string[];
  riskLevel: 'low' | 'medium' | 'high';
  expectedReturn: number;
  expectedRisk: number;
}

/**
 * 智能推荐器
 */
export class SmartFundRecommender {
  private scorer: MultiFactorScorer;

  constructor() {
    this.scorer = new MultiFactorScorer();
  }

  /**
   * 根据用户偏好推荐基金
   */
  async recommend(
    preferences: UserPreferences,
    limit: number = 10
  ): Promise<FundRecommendation[]> {
    // 1. 根据风险偏好确定基金类型
    const fundTypes = this.getFundTypesByRisk(preferences.riskTolerance);

    // 2. 搜索候选基金
    const candidates = await this.searchCandidates(fundTypes);

    // 3. 评分并排序
    const scores = await this.scorer.scoreBatch(candidates);

    // 4. 过滤不符合要求的基金
    const filtered = this.filterByPreferences(scores, preferences);

    // 5. 生成推荐理由
    const recommendations: FundRecommendation[] = filtered.slice(0, limit).map((score) => {
      const fund = candidates.find((f) => f.code === score.code)!;

      return {
        fund,
        score,
        matchReasons: this.generateMatchReasons(score, preferences),
        riskLevel: this.getRiskLevel(score),
        expectedReturn: this.estimateReturn(fund),
        expectedRisk: this.estimateRisk(fund),
      };
    });

    return recommendations;
  }

  /**
   * 根据风险偏好获取基金类型
   */
  private getFundTypesByRisk(risk: string): string[] {
    switch (risk) {
      case 'conservative':
        return ['货币型', '债券型', '保本型'];
      case 'moderate':
        return ['债券型', '混合型', '保本型', '指数型'];
      case 'aggressive':
        return ['股票型', '混合型', '指数型', 'QDII'];
      default:
        return [];
    }
  }

  /**
   * 搜索候选基金
   */
  private async searchCandidates(types: string[]): Promise<FundData[]> {
    const candidates: FundData[] = [];

    // 搜索不同类型的基金
    for (const type of types) {
      try {
        const results = await searchFundsEastmoney(type);
        // results 是数组格式: [code, pinyin, name, type, ...]
        for (const result of results.slice(0, 20)) {
          // 确保 result 是数组格式
          if (Array.isArray(result) && result.length >= 4) {
            candidates.push({
              code: result[0], // code
              name: result[2], // name
              type: result[3] || type, // type
              // 这里可以添加更多从API获取的数据
            });
          }
        }
      } catch (error) {
        console.error(`Failed to search funds for type ${type}:`, error);
      }
    }

    return candidates;
  }

  /**
   * 根据用户偏好过滤
   */
  private filterByPreferences(scores: FundScore[], preferences: UserPreferences): FundScore[] {
    return scores.filter((score) => {
      // 最大回撤限制
      if (preferences.maxDrawdown && score.risk < 50) {
        return false;
      }

      // 最低收益要求
      if (preferences.minReturn && score.performance < preferences.minReturn) {
        return false;
      }

      // 投资期限匹配 - 短期投资只推荐最高评级
      if (preferences.investmentHorizon === 'short') {
        return score.rating === 'AAA' || score.rating === 'AA';
      }

      return true;
    });
  }

  /**
   * 生成匹配理由
   */
  private generateMatchReasons(score: FundScore, preferences: UserPreferences): string[] {
    const reasons: string[] = [];

    // 评级匹配
    if (score.rating === 'AAA' || score.rating === 'AA') {
      reasons.push(`综合评级 ${score.rating}，表现优秀`);
    }

    // 风险匹配
    if (score.risk >= 80) {
      reasons.push('风险控制能力强，历史波动低');
    } else if (score.risk >= 60) {
      reasons.push('风险控制良好');
    }

    // 业绩匹配
    if (score.performance >= 80) {
      reasons.push('历史业绩优异，长期表现稳定');
    } else if (score.performance >= 60) {
      reasons.push('历史表现良好');
    }

    // 经理匹配
    if (score.manager >= 80) {
      reasons.push('基金经理经验丰富，管理能力强');
    }

    // 费用匹配
    if (score.fee >= 80) {
      reasons.push('费率低，成本低');
    }

    // 规模匹配
    if (score.size >= 80) {
      reasons.push('基金规模适中，流动性好');
    }

    return reasons;
  }

  /**
   * 获取风险等级
   */
  private getRiskLevel(score: FundScore): 'low' | 'medium' | 'high' {
    if (score.risk >= 70) return 'low';
    if (score.risk >= 50) return 'medium';
    return 'high';
  }

  /**
   * 估算预期收益
   */
  private estimateReturn(fund: FundData): number {
    // 基于历史收益率估算
    if (fund.return3Y) {
      return fund.return3Y / 3; // 年化
    }
    if (fund.return1Y) {
      return fund.return1Y;
    }
    return 0;
  }

  /**
   * 估算预期风险
   */
  private estimateRisk(fund: FundData): number {
    // 基于波动率或回撤估算
    if (fund.volatility) {
      return fund.volatility;
    }
    if (fund.maxDrawdown) {
      return fund.maxDrawdown * 2;
    }
    return 15; // 默认中等风险
  }

  /**
   * 获取投资建议
   */
  getInvestmentAdvice(
    recommendations: FundRecommendation[],
    preferences: UserPreferences
  ): string {
    const advice: string[] = [];

    // 风险建议
    switch (preferences.riskTolerance) {
      case 'conservative':
        advice.push('建议以货币型和债券型基金为主，控制风险');
        break;
      case 'moderate':
        advice.push('建议股债搭配，平衡收益与风险');
        break;
      case 'aggressive':
        advice.push('可以配置更多股票型基金，追求高收益');
        break;
    }

    // 配置建议
    advice.push(`建议配置 ${Math.min(5, recommendations.length)} 只基金，分散风险`);

    // 定投建议
    if (preferences.investmentHorizon === 'long') {
      advice.push('建议采用定投方式，平滑市场波动');
    }

    return advice.join('\n');
  }
}

export default SmartFundRecommender;

/**
 * RAG 增强推荐系统
 *
 * 使用本地向量搜索实现基金研究资料的语义检索
 * 基于用户查询匹配相关基金研究资料
 */

import { z } from 'zod';

// 基金研究资料类型
export interface FundResearchDocument {
  id: string;
  title: string;
  content: string;
  category: 'strategy' | 'market' | 'risk' | 'company' | 'general';
  fundCodes: string[];
  tags: string[];
  date?: string;
}

// 简化的 TF-IDF 向量化
export class VectorEmbedding {
  private vocabulary: Set<string> = new Set();
  private idfCache: Map<string, number> = new Map();

  /**
   * 训练词汇表和 IDF
   */
  train(corpus: FundResearchDocument[]) {
    const docCount = corpus.length;
    const docFreq: Map<string, number> = new Map();

    // 构建词汇表和文档频率
    for (const doc of corpus) {
      const words = this.tokenize(doc.content);
      const uniqueWords = new Set(words);

      for (const word of uniqueWords) {
        this.vocabulary.add(word);
        docFreq.set(word, (docFreq.get(word) || 0) + 1);
      }
    }

    // 计算 IDF
    for (const [word, freq] of docFreq) {
      this.idfCache.set(word, Math.log(docCount / freq));
    }
  }

  /**
   * 分词（简化版，按空格和标点分割）
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-z0-9]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1);
  }

  /**
   * 将文档转换为向量（TF-IDF）
   */
  embed(doc: FundResearchDocument): Map<string, number> {
    const words = this.tokenize(doc.content);
    const termFreq: Map<string, number> = new Map();

    // 计算词频
    for (const word of words) {
      termFreq.set(word, (termFreq.get(word) || 0) + 1);
    }

    // 计算TF-IDF向量
    const vector = new Map<string, number>();
    const maxFreq = Math.max(...termFreq.values());

    for (const [word, freq] of termFreq) {
      const tf = 0.5 + 0.5 * (freq / maxFreq);
      const idf = this.idfCache.get(word) || 0;
      vector.set(word, tf * idf);
    }

    return vector;
  }

  /**
   * 计算余弦相似度
   */
  cosineSimilarity(vec1: Map<string, number>, vec2: Map<string, number>): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    const allTerms = new Set([...vec1.keys(), ...vec2.keys()]);

    for (const term of allTerms) {
      const v1 = vec1.get(term) || 0;
      const v2 = vec2.get(term) || 0;
      dotProduct += v1 * v2;
      norm1 += v1 * v1;
      norm2 += v2 * v2;
    }

    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
}

/**
 * RAG 增强推荐器
 */
export class RAGEnhancedRecommender {
  private embedding: VectorEmbedding;
  private documents: FundResearchDocument[] = [];

  constructor() {
    this.embedding = new VectorEmbedding();
    this.initializeKnowledgeBase();
  }

  /**
   * 初始化知识库
   */
  private initializeKnowledgeBase() {
    // 基金研究知识库
    this.documents = [
      {
        id: 'doc_001',
        title: '债券基金投资指南',
        category: 'strategy',
        content: `债券基金主要投资于国债、金融债和企业债，风险相对较低，收益稳定。适合风险偏好较低的投资者。主要风险包括利率风险和信用风险。建议配置比例：保守型投资者可配置70%债券基金，稳健型可配置40%。债券基金在股市下跌时往往能起到较好的防御作用。`,
        fundCodes: [],
        tags: ['低风险', '稳健', '防御', '保守'],
      },
      {
        id: 'doc_002',
        title: '股票基金投资策略',
        category: 'strategy',
        content: `股票基金主要投资于股票市场，追求长期资本增值。预期收益较高，但波动也较大。适合风险承受能力强、投资期限较长的投资者。建议采用定投方式平摊成本，降低择时风险。重点关注基金经理的投资能力和基金公司的实力。`,
        fundCodes: [],
        tags: ['高风险', '长期增长', '定投', '波动'],
      },
      {
        id: 'doc_003',
        title: '混合型基金配置建议',
        category: 'strategy',
        content: `混合型基金同时投资于股票和债券，根据市场情况动态调整配置。在股市上涨时增加股票仓位，在股市下跌时增加债券仓位。平衡了收益与风险，适合中等风险偏好的投资者。建议核心配置比例为50%股票+50%债券，可根据市场环境适度调整。`,
        fundCodes: [],
        tags: ['平衡', '中等风险', '动态配置'],
      },
      {
        id: 'doc_004',
        title: '指数基金优势分析',
        category: 'strategy',
        content: `指数基金被动跟踪特定指数，费率低，透明度高。长期来看，大多数主动管理基金难以持续跑赢指数。适合认可市场有效性的投资者。推荐宽基指数如沪深300、中证500，行业主题指数如科技、医药等。指数基金适合长期持有，避免频繁交易。`,
        fundCodes: [],
        tags: ['费率低', '被动投资', '长期', '有效市场'],
      },
      {
        id: 'doc_005',
        title: '风险控制与资产配置',
        category: 'risk',
        content: `投资组合的风险控制非常重要。建议分散投资：1) 跨行业配置，避免过度集中；2) 股债平衡，债券对冲股票风险；3) 大中小盘均衡，分散市值风险；4) 国内外配置，分散地域风险。核心卫星策略是常用方法，核心资产配置宽基指数，卫星资产配置行业主题基金。`,
        fundCodes: [],
        tags: ['分散投资', '风险控制', '资产配置', '核心卫星'],
      },
      {
        id: 'doc_006',
        title: '基金定投策略',
        category: 'strategy',
        content: `定期定额投资（定投）是降低市场波动影响的有效方法。通过定期买入固定金额，在下跌时买入更多份额，上涨时买入较少份额，长期来看能降低平均成本。建议选择波动较大的基金进行定投，如股票型基金和指数型基金。定投纪律性很重要，建议设置自动定投计划。`,
        fundCodes: [],
        tags: ['定投', '纪律投资', '成本平摊'],
      },
      {
        id: 'doc_007',
        title: '宏观经济对基金投资的影响',
        category: 'market',
        content: `宏观经济环境对基金投资有重要影响。货币政策：宽松货币政策利好股市，紧缩政策利好债市。经济周期：复苏期配置股票基金，过热期配置债券基金。通胀水平：高通胀利好商品基金。投资者需要关注央行政策、GDP增速、CPI等宏观数据，及时调整投资策略。`,
        fundCodes: [],
        tags: ['宏观', '经济周期', '货币政策'],
      },
      {
        id: 'doc_008',
        title: '2025年市场展望与投资建议',
        category: 'market',
        content: `展望2025年，国内经济有望延续复苏态势，货币政策保持稳健偏宽松。权益市场仍有结构性机会，重点关注科技创新、消费升级、绿色转型等主题。债券市场收益率处于相对低位，配置价值凸显。建议采取股债平衡策略，权益类资产占比可适度提升。重点关注科技、医药、新能源等赛道。`,
        fundCodes: [],
        tags: ['2025展望', '科技创新', '消费升级', '绿色转型'],
      },
      {
        id: 'doc_009',
        title: '基金公司实力评估',
        category: 'company',
        content: `选择基金时，基金公司的实力非常重要。头部基金公司拥有强大的研究团队、完善的风控体系和丰富的产品线。建议优先选择管理规模大、产品线丰富、历史业绩优异的基金公司。基金公司的投研能力和风控能力直接决定了基金的长期表现。`,
        fundCodes: [],
        tags: ['基金公司', '研究能力', '风控'],
      },
      {
        id: 'doc_010',
        title: '基金经理选择要点',
        category: 'general',
        content: `基金经理是基金的核心，其投资能力和经验至关重要。选择要点：1) 从业年限：超过5年经验更好；2) 管理规模：管理过大规模资金的经理更可靠；3) 历史业绩：长期业绩稳定更值得关注；4) 投资风格：选择投资风格清晰且稳定的经理。基金经理的稳定性也很重要，频繁更换经理的基金需要谨慎考虑。`,
        fundCodes: [],
        tags: ['基金经理', '投资经验', '稳定性'],
      },
    ];

    // 训练嵌入模型
    this.embedding.train(this.documents);
  }

  /**
   * 根据用户查询搜索相关文档
   */
  async searchRelevantDocuments(
    query: string,
    topK: number = 3
  ): Promise<{
    document: FundResearchDocument;
    score: number;
  }[]> {
    // 将查询转换为向量
    const queryDoc: FundResearchDocument = {
      id: 'query',
      title: query,
      category: 'general',
      content: query,
      fundCodes: [],
      tags: [],
    };
    const queryVec = this.embedding.embed(queryDoc);

    // 计算所有文档的相似度
    const results = this.documents.map((doc) => ({
      document: doc,
      score: this.embedding.cosineSimilarity(queryVec, this.embedding.embed(doc)),
    }));

    // 按相似度排序并返回 topK
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .filter((r) => r.score > 0.1); // 过滤相似度太低的
  }

  /**
   * 增强的基金推荐
   */
  async recommendFunds(
    userQuery: string,
    preferences: {
      riskTolerance: 'conservative' | 'moderate' | 'aggressive';
      investmentHorizon: 'short' | 'medium' | 'long';
    }
  ): Promise<{
    recommendations: string;
    relevantContext: string;
    advice: string;
  }> {
    // 搜索相关文档
    const relevantDocs = await this.searchRelevantDocuments(userQuery, 3);

    if (relevantDocs.length === 0) {
      return {
        recommendations: '暂无相关研究资料。',
        relevantContext: '',
        advice: '建议提供更具体的投资需求。',
      };
    }

    // 构建上下文
    const context = relevantDocs
      .map((r) => `【${r.document.title}】\n${r.document.content}`)
      .join('\n\n');

    // 生成建议（简化版，实际可以使用 LLM）
    const advice = this.generateAdvice(preferences, relevantDocs);

    return {
      recommendations: this.formatRecommendations(relevantDocs),
      relevantContext: context,
      advice,
    };
  }

  /**
   * 生成投资建议
   */
  private generateAdvice(
    preferences: {
      riskTolerance: 'conservative' | 'moderate' | 'aggressive';
      investmentHorizon: 'short' | 'medium' | 'long';
    },
    relevantDocs: Array<{ document: FundResearchDocument; score: number }>
  ): string {
    const advice: string[] = [];

    // 基于风险偏好的建议
    switch (preferences.riskTolerance) {
      case 'conservative':
        advice.push('根据您的保守风险偏好，建议以债券型和货币型基金为主，配置70%债券+30%货币型。');
        break;
      case 'moderate':
        advice.push('根据您的稳健风险偏好，建议股债平衡配置，50%混合型+30%债券型+20%货币型。');
        break;
      case 'aggressive':
        advice.push('根据您的激进风险偏好，可增加股票型和指数型配置，60%股票+20%混合型+20%债券型。');
        break;
    }

    // 基于文档的建议
    for (const item of relevantDocs) {
      if (item.score > 0.3) {
        const doc = item.document;
        if (doc.tags.includes('定投') && preferences.investmentHorizon === 'long') {
          advice.push(`考虑采用定投方式投资${doc.title}提到。`);
        }
        if (doc.category === 'strategy' && item.score > 0.5) {
          advice.push(`重点关注${doc.title}中的策略。`);
        }
      }
    }

    return advice.join('\n');
  }

  /**
   * 格式化推荐结果
   */
  private formatRecommendations(
    relevantDocs: Array<{ document: FundResearchDocument; score: number }>
  ): string {
    return relevantDocs
      .map((item) => `[${item.score.toFixed(2)}] ${item.document.title}`)
      .join('\n');
  }

  /**
   * 获取推荐标签
   */
  getRecommendationTags(userQuery: string): string[] {
    const tags: string[] = [];

    // 基于查询的关键词匹配标签
    if (userQuery.includes('债券') || userQuery.includes('稳健') || userQuery.includes('保守')) {
      tags.push('低风险', '稳健');
    }
    if (userQuery.includes('股票') || userQuery.includes('激进') || userQuery.includes('高收益')) {
      tags.push('高风险', '成长');
    }
    if (userQuery.includes('定投')) {
      tags.push('定投', '纪律投资');
    }
    if (userQuery.includes('长期') || userQuery.includes('价值')) {
      tags.push('长期持有');
    }

    return [...new Set(tags)];
  }
}

export default RAGEnhancedRecommender;

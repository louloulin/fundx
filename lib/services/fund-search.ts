/**
 * 统一的基金搜索服务
 *
 * 提供一致的基金搜索接口，支持多种搜索方式
 * 所有模块都应该使用这个服务来搜索基金
 */

export interface FundSearchResult {
  code: string;
  name: string;
  type: string;
  pinyin?: string;
}

export interface FundDetailResult {
  code: string;
  name: string;
  estimatedNav?: string;
  changePercent?: string;
  yesterdayNav?: string;
  gzTime?: string;
}

/**
 * 基金搜索服务类
 */
export class FundSearchService {
  private static cache: Map<string, { data: FundSearchResult[]; timestamp: number }> = new Map();
  private static CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

  /**
   * 从东方财富获取基金数据（服务端）
   */
  private async fetchFromEastmoney(keyword?: string): Promise<FundSearchResult[]> {
    try {
      const url = `https://fund.eastmoney.com/js/fundcode_search.js?timestamp=${Date.now()}`;
      const response = await fetch(url);
      const text = await response.text();

      // 解析返回的数据（格式: var r = [...]）
      const match = text.match(/var r = (\[.*?\]);/);
      if (!match) {
        console.warn('无法解析基金数据');
        return [];
      }

      const fundsData = JSON.parse(match[1]);

      // 如果有关键词，进行过滤
      // 数据格式: [code, pinyin, name, type, ...]
      if (keyword && keyword.trim()) {
        return fundsData
          .filter((fund: any[]) => {
            const code = fund[0] || '';
            const pinyin = fund[1] || '';
            const name = fund[2] || '';
            const type = fund[3] || '';

            return (
              code.includes(keyword) ||
              name.toLowerCase().includes(keyword.toLowerCase()) ||
              pinyin.toLowerCase().includes(keyword.toLowerCase()) ||
              type.toLowerCase().includes(keyword.toLowerCase())
            );
          })
          .slice(0, 20)
          .map((fund: any[]) => ({
            code: fund[0],
            pinyin: fund[1],
            name: fund[2],
            type: fund[3],
          }));
      }

      // 没有关键词时返回前 50 个
      return fundsData.slice(0, 50).map((fund: any[]) => ({
        code: fund[0],
        pinyin: fund[1],
        name: fund[2],
        type: fund[3],
      }));
    } catch (error) {
      console.error('获取基金数据失败:', error);
      return [];
    }
  }

  /**
   * 搜索基金（带缓存）
   */
  async search(keyword: string = '', useCache = true): Promise<FundSearchResult[]> {
    const cacheKey = keyword || 'all';

    // 检查缓存
    if (useCache) {
      const cached = FundSearchService.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < FundSearchService.CACHE_TTL) {
        return cached.data;
      }
    }

    // 获取数据
    const results = await this.fetchFromEastmoney(keyword);

    // 更新缓存
    FundSearchService.cache.set(cacheKey, {
      data: results,
      timestamp: Date.now(),
    });

    return results;
  }

  /**
   * 获取基金详情（实时估值）
   */
  async getFundDetail(fundCode: string): Promise<FundDetailResult | null> {
    try {
      const url = `https://fundgz.1234567.com.cn/js/${fundCode}.js?rt=${Date.now()}`;
      const response = await fetch(url);
      const text = await response.text();

      // 解析 JSONP 回调
      const match = text.match(/jsonpgz\(({.*})\)/);
      if (!match) {
        return null;
      }

      const fundData = JSON.parse(match[1]);

      return {
        code: fundData.fundcode,
        name: fundData.name,
        estimatedNav: fundData.gsz,
        changePercent: fundData.gszzl,
        yesterdayNav: fundData.dwjz,
        gzTime: fundData.gztime,
      };
    } catch (error) {
      console.error(`获取基金 ${fundCode} 详情失败:`, error);
      return null;
    }
  }

  /**
   * 批量获取基金详情
   */
  async getBatchFundDetails(fundCodes: string[]): Promise<Map<string, FundDetailResult>> {
    const results = new Map<string, FundDetailResult>();

    // 并发获取，但限制并发数量
    const batchSize = 5;
    for (let i = 0; i < fundCodes.length; i += batchSize) {
      const batch = fundCodes.slice(i, i + batchSize);
      const details = await Promise.all(
        batch.map(async (code) => {
          const detail = await this.getFundDetail(code);
          return detail ? { code, detail } : null;
        })
      );

      details.forEach((item) => {
        if (item) {
          results.set(item.code, item.detail);
        }
      });
    }

    return results;
  }

  /**
   * 清除缓存
   */
  static clearCache(): void {
    FundSearchService.cache.clear();
  }

  /**
   * 获取热门基金（按类型）
   */
  async getPopularFundsByType(type: string, limit = 10): Promise<FundSearchResult[]> {
    const results = await this.search(type);
    return results.slice(0, limit);
  }

  /**
   * 根据基金代码验证基金是否存在
   */
  async validateFundCode(fundCode: string): Promise<boolean> {
    const detail = await this.getFundDetail(fundCode);
    return detail !== null;
  }
}

// 导出单例实例
export const fundSearchService = new FundSearchService();

// 导出便捷函数
export async function searchFunds(keyword?: string): Promise<FundSearchResult[]> {
  return fundSearchService.search(keyword);
}

export async function getFundDetail(fundCode: string): Promise<FundDetailResult | null> {
  return fundSearchService.getFundDetail(fundCode);
}

export async function getBatchFundDetails(fundCodes: string[]): Promise<Map<string, FundDetailResult>> {
  return fundSearchService.getBatchFundDetails(fundCodes);
}

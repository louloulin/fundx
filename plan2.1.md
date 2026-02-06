# 基金估值实时计算系统 - 开发计划 v2.1

**项目**: 实时基金估值平台
**日期**: 2025-02-05
**版本**: v2.1
**目标**: 实现基金净值的实时计算功能，摆脱对第三方估值数据的依赖

---

## 📊 项目背景

### 当前问题
- 之前依赖东方财富的 `fundgz.1234567.com.cn` API 提供实时估值数据
- 该 API 已失效，导致估值功能无法正常工作
- 需要自己实现基金净值的实时计算

### 估值计算原理
根据证券时报网（2025-09-11）报道：
> "一般而言，估算净值涨跌幅是根据最新基金年报或季报中所披露的持仓信息以及一些修正方法，结合当时股市情况实时计算出来的数据。"

**核心公式**:
```
估算净值 = (昨日净值 × (1 + 今日持仓涨跌幅加权平均)) × (1 - 费用)
```

---

## 🔍 相关开源项目研究

### 1. **东方财富 API 集成项目**

#### LeekHub/leek-fund
- **链接**: https://github.com/LeekHub/leek-fund
- **描述**: VSCode 插件，实时监控股票和基金数据
- **特点**:
  - 集成 eastmoney.com 数据源
  - 实时监控股票、基金、期货
  - 开发文档中提到 eastmoney.com/f10 接口

#### piginzoo/fund_analysis
- **链接**: https://github.com/piginzoo/fund_analysis
- **功能**:
  - 使用 JQData API 抓取股票数据
  - 基于 CAPM 计算基金 Beta 系数
  - 使用 Jensen Alpha 计算 Alpha 和 Beta 系数
- **参考价值**: 估值计算方法论

### 2. **基金数据分析项目**

#### AKShare
- **链接**: https://github.com/akfamily/akshare
- **特点**:
  - 中国金融数据库
  - 频繁更新东方财富 API 集成
  - 活跃维护
- **数据源**: https://data.eastmoney.com/zjlx/dpzjlx.html (资金流向)

### 3. **金融评测基准**

#### FinEval
- **链接**: https://github.com/SUFE-AIFLM-Lab/FinEval
- **描述**: 中文金融领域评测基准
- **功能**: 评估 LLM 的金融知识和实践能力
- **参考价值**: 中文金融数据处理方法

#### PIXIU
- **链接**: https://github.com/The-FinAI/PIXIU
- **描述**: 开源金融大语言模型
- **内容**: 金融 LLM、指令调优数据、评测框架
- **参考价值**: 中文金融 AI 应用

### 4. **量化投资工具**

#### Fundingscope
- **链接**: https://github.com/MarcusNeufeldt/fundingscope
- **功能**:
  - 加密货币永续合约资金费率分析
  - 实时数据处理
  - 场景建模
  - ROI 比较

---

## 🎯 技术方案设计

### 方案 1: 基于持仓数据的实时计算（推荐）

#### 数据流程
```
1. 获取基金最新持仓 (季报/年报)
   └─> 来源: fundf10.eastmoney.com (基金 F10)

2. 获取持仓股票的实时行情
   └─> 来源: push2.eastmoney.com (实时行情 API)
   └─> 或: qt.gtimg.cn (腾讯行情 API)

3. 计算持仓涨跌幅
   └─> 公式: Σ(持仓比例 × 个股涨跌幅)

4. 计算估算净值
   └─> 公式: 昨日净值 × (1 + 持仓涨跌幅) × (1 - 费用)
```

#### API 端点
| API | 用途 | 请求频率 |
|-----|------|---------|
| `fundf10.eastmoney.com/ccmx_{code}.html` | 获取基金持仓数据 | 每天 1 次 |
| `push2.eastmoney.com/api/qt/stock/get` | 实时股票行情 | 每 3 分钟 |
| `qt.gtimg.cn/q={stock_code}` | 股票实时价格 | 每 3 分钟 |

#### 计算逻辑
```javascript
function calculateEstimatedValue(yesterdayValue, holdings, stockPrices, feeRate = 0.005) {
  let weightedChange = 0;

  holdings.forEach(holding => {
    const stock = stockPrices[holding.code];
    const changePercent = stock.changePercent; // 今日涨跌幅

    weightedChange += holding.ratio * changePercent;
  });

  const estimatedValue = yesterdayValue * (1 + weightedChange / 100) * (1 - feeRate);

  return estimatedValue;
}
```

### 方案 2: 基于 CFI (中国基金指数) 的估算

#### 数据源
- 中国基金指数实时数据
- 同类基金平均涨跌幅

#### 计算方法
```
估算涨跌幅 = 基金类型平均涨跌幅 × 修正系数
```

### 方案 3: 机器学习预测

#### 参考资料
- [ScienceDirect 2025 系统综述](https://www.sciencedirect.com/science/article/pii/S0952197624020839)
- 贝叶斯模型基金绩效评估

#### 实现思路
1. 收集历史净值数据
2. 收集市场因子数据（指数、行业板块等）
3. 训练回归模型
4. 实时预测当日净值

---

## 📁 开发计划

### Phase 1: 数据源验证（第 1 周）

#### 任务列表
- [ ] 验证 `fundf10.eastmoney.com` 持仓数据 API
- [ ] 验证 `push2.eastmoney.com` 实时行情 API
- [ ] 验证 `qt.gtimg.cn` 行情 API
- [ ] 测试 API 请求频率限制
- [ ] 记录 API 响应格式

#### 输出
- API 验证报告
- 数据格式文档
- 请求频率限制说明

### Phase 2: 持仓数据抓取（第 2 周）

#### 任务列表
- [ ] 实现基金持仓数据抓取函数
- [ ] 解析 fundf10 页面结构
- [ ] 提取持仓股票代码和比例
- [ ] 数据持久化（SQLite/JSON）
- [ ] 增量更新机制（每日更新）

#### 代码结构
```typescript
// lib/fund-holdings/scraper.ts
export async function scrapeFundHoldings(fundCode: string) {
  // 抓取基金 F10 页面
  // 解析持仓数据
  // 返回结构化数据
}

// lib/fund-holdings/parser.ts
export function parseHoldings(html: string): FundHolding[] {
  // 使用 Cheerio 解析 HTML
  // 提取股票代码、名称、比例
}

// lib/fund-holdings/cache.ts
export class HoldingsCache {
  // 本地缓存持仓数据
  // 提供查询接口
}
```

### Phase 3: 实时行情数据集成（第 3 周）

#### 任务列表
- [ ] 实现实时行情 API 封装
- [ ] 批量查询优化（减少 API 请求）
- [ ] 数据缓存策略（Redis/内存）
- [ ] 错误处理和重试机制
- [ ] WebSocket 长连接（可选）

#### 代码结构
```typescript
// lib/market-data/realtime.ts
export class RealtimeMarketData {
  // 获取多只股票的实时行情
  async getStockPrices(symbols: string[]): Promise<StockPrice[]>;

  // WebSocket 订阅
  subscribe(symbols: string[], callback: Callback);
}

// lib/market-data/cache.ts
export class MarketDataCache {
  // 内存缓存
  // TTL: 3 秒
}
```

### Phase 4: 估值计算引擎（第 4 周）

#### 任务列表
- [ ] 实现核心估值计算算法
- [ ] 费用计算（管理费、托管费）
- [ ] 精度优化（四舍五入）
- [ ] 异常处理（停牌、涨跌停）
- [ ] 单元测试

#### 代码结构
```typescript
// lib/valuation/calculator.ts
export class FundValuationCalculator {
  calculate(
    yesterdayValue: number,
    holdings: FundHolding[],
    stockPrices: StockPrice[],
    options: CalculationOptions
  ): ValuationResult;
}

// lib/valuation/validator.ts
export function validateValuation(result: ValuationResult): boolean;
```

### Phase 5: API 开发（第 5 周）

#### 新增 API 端点
```typescript
// GET /api/fund/{code}/valuation-estimate
// 获取基金估算净值

// GET /api/fund/{code}/holdings
// 获取基金持仓数据

// GET /api/market/batch
// 批量获取股票行情
```

#### 任务列表
- [ ] 实现估值估算 API
- [ ] 实现持仓数据 API
- [ ] 实现批量行情 API
- [ ] API 文档编写
- [ ] 性能优化

### Phase 6: 前端集成（第 6 周）

#### 任务列表
- [ ] 更新前端估值显示逻辑
- [ ] 添加数据源标识（"实时计算" vs "API 获取"）
- [ ] 优化刷新策略
- [ ] 错误提示优化
- [ ] 加载状态处理

#### UI 改进
```typescript
// 估值数据卡片
<div className="valuation-card">
  <div className="valuation-header">
    <span>估值净值</span>
    <span className="source-badge">实时计算</span>
  </div>
  <div className="valuation-value">{estimatedValue}</div>
  <div className="valuation-time">更新时间: {updateTime}</div>
</div>
```

### Phase 7: 测试和优化（第 7 周）

#### 任务列表
- [ ] 单元测试（覆盖率 > 80%）
- [ ] 集成测试
- [ ] 性能测试（计算延迟 < 500ms）
- [ ] 压力测试（并发请求）
- [ ] 准确性验证（与实际净值对比）

### Phase 8: 文档和部署（第 8 周）

#### 任务列表
- [ ] API 文档完善
- [ ] 部署文档编写
- [ ] 监控告警配置
- [ ] 用户手册更新
- [ ] 生产环境部署

---

## 🛠️ 技术栈

### 后端
- **框架**: Next.js 14 App Router
- **语言**: TypeScript
- **数据抓取**: Cheerio / Puppeteer
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **缓存**: Redis (可选)

### 前端
- **框架**: React 18
- **状态管理**: Zustand / React Context
- **UI**: Tailwind CSS

### 工具库
- **数据验证**: Zod
- **HTTP 客户端**: fetch
- **定时任务**: node-cron / Vercel Cron

---

## 📈 数据流图

```
┌─────────────────┐
│  基金代码输入     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  检查本地缓存     │
│  (持仓数据)       │
└────────┬────────┘
         │
         ▼
    ┌────────┴────────┐
    │                     │
    │ 未缓存              │ 已缓存
    │                     │
    ▼                     ▼
┌─────────────┐      ┌─────────────┐
│ 抓取 F10    │      │ 使用缓存数据 │
└──────┬──────┘      └──────┬──────┘
       │                    │
       ▼                    ▼
┌──────────────────────────┐
│  获取持仓股票列表         │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  批量查询实时行情         │
│  (push2 / qt.gtimg)      │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  执行估值计算             │
│  (加权平均 + 费用)         │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  返回估算净值             │
│  ± 误差范围               │
└──────────────────────────┘
```

---

## ⚠️ 风险和挑战

### 1. 数据准确性
- **问题**: 估算值与实际净值可能存在偏差
- **缓解**:
  - 添加误差范围提示
  - 定期与实际净值对比校准
  - 使用多因子模型优化

### 2. API 稳定性
- **问题**: 东方财富 API 可能随时变更
- **缓解**:
  - 多数据源备份
  - API 变更监控
  - 降级方案

### 3. 性能问题
- **问题**: 大量基金同时计算可能影响性能
- **缓解**:
  - 批量查询优化
  - 异步计算
  - 结果缓存

### 4. 合规性
- **问题**: 提供估值数据可能涉及合规风险
- **缓解**:
  - 明确标注"估算"而非"实际"
  - 免责声明
  - 数据来源透明化

---

## 📚 参考资料

### 开源项目
- [LeekHub/leek-fund](https://github.com/LeekHub/leek-fund) - 东方财富数据集成
- [piginzoo/fund_analysis](https://github.com/piginzoo/fund_analysis) - 基金分析计算
- [akfamily/akshare](https://github.com/akfamily/akshare) - 中国金融数据
- [SUFE-AIFLM-Lab/FinEval](https://github.com/SUFE-AIFLM-Lab/FinEval) - 金融评测基准
- [The-FinAI/PIXIU](https://github.com/The-FinAI/PIXIU) - 金融大语言模型

### 技术文档
- 证券时报网: [基金估值计算说明](https://www.stcn.com/article/detail/3332257.html)
- CSDN: [基金净值估值自动定时查询系统设计](https://blog.csdn.net/weixin_35294091/article/details/147624185)
- 东方财富 API: fundf10.eastmoney.com
- 实时行情 API: push2.eastmoney.com

### 学术研究
- ScienceDirect (2025): [AI for Investment Management](https://www.sciencedirect.com/science/article/pii/S0952197624020839)
- Wiley (2022): [Fund Performance Evaluation Based on Bayesian Model](https://onlinelibrary.wiley.com/doi/10.1155/2022/2467521)

---

## 🎯 成功指标

### 功能指标
- ✅ 估值计算准确率 > 95%（与实际净值对比）
- ✅ 计算响应时间 < 500ms
- ✅ 数据更新频率: 每 3 分钟
- ✅ 支持基金数量 > 1000 只

### 质量指标
- ✅ 代码单元测试覆盖率 > 80%
- ✅ API 响应时间 < 100ms (P95)
- ✅ 系统可用性 > 99.5%

---

## 📅 时间表

| 阶段 | 周期 | 交付物 |
|------|------|--------|
| Phase 1: 数据源验证 | 第 1 周 | API 验证报告 |
| Phase 2: 持仓数据抓取 | 第 2 周 | 持仓数据抓取模块 |
| Phase 3: 实时行情集成 | 第 3 周 | 行情数据模块 |
| Phase 4: 估值计算引擎 | 第 4 周 | 计算引擎核心代码 |
| Phase 5: API 开发 | 第 5 周 | REST API |
| Phase 6: 前端集成 | 第 6 周 | 前端更新 |
| Phase 7: 测试优化 | 第 7 周 | 测试报告 |
| Phase 8: 文档部署 | 第 8 周 | 完整系统 |

**总周期**: 约 2 个月

---

## 🚀 下一步行动

### 立即开始
1. 创建新的开发分支: `feature/valuation-calculation`
2. 验证东方财富 API 可用性
3. 搭建数据抓取原型
4. 编写第一个计算函数

### 需要讨论的问题
1. 是否使用 WebSocket 实现实时推送？
2. 是否需要机器学习优化计算精度？
3. 如何处理停牌股票的计算？
4. 是否需要用户反馈机制来校准计算？

---

**文档版本**: v2.1
**最后更新**: 2025-02-05
**负责人**: 开发团队
**审核人**: 产品经理

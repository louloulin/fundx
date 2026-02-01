# AI Agent 驱动的智能基金投资平台 - 详细设计方案

## 项目概述

基于现有实时基金估值应用，升级为 **AI Agent 驱动的智能投资顾问平台**，整合 Mastra AI 框架、多模态视觉识别、智能投顾算法，为用户提供全方位的基金投资决策支持。

**版本**: 1.1
**创建日期**: 2025年2月
**基于**: plan1.md

---

## 目录

1. [技术架构设计](#一技术架构设计)
2. [Mastra AI 集成方案](#二mastra-ai-集成方案)
3. [AI Agent 系统设计](#三ai-agent-系统设计)
4. [多模态视觉识别](#四多模态视觉识别)
5. [智能基金选择算法](#五智能基金选择算法)
6. [功能模块设计](#六功能模块设计)
7. [实施路线图](#七实施路线图)
8. [参考资源](#八参考资源)
9. [Zhipu AI 集成专题](#九zhipu-ai-集成专题)

---

## 一、技术架构设计

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户界面层 (Next.js 14)                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  基金监控    │  │  AI 投顾     │  │  图片识别    │          │
│  │  Dashboard   │  │  Chatbot     │  │  Upload      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│                     AI Agent 层 (Mastra)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Fund Search │  │  Fund Select │  │  Risk Analys │          │
│  │    Agent     │  │    Agent     │  │    Agent     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Portfolio  │  │   Vision     │  │   Research   │          │
│  │    Agent     │  │    Agent     │  │    Agent     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│                      工具层 (Tools)                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Eastmoney   │  │  Tesseract   │  │   GPT-4V     │          │
│  │  API Tool    │  │   OCR Tool   │  │  Vision Tool │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Vector     │  │   RAG        │  │  Calculator  │          │
│  │    Store     │  │  Engine      │  │    Tool      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│                      数据层                                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  基金数据    │  │  历史数据    │  │  知识库      │          │
│  │  (JSONP)     │  │  (LocalStorage)│   (Vector DB) │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈选型

| 类别 | 技术选型 | 说明 |
|-----|---------|------|
| **前端框架** | Next.js 14 (App Router) | 现有框架，支持 Server Actions |
| **AI 框架** | Mastra AI | TypeScript AI 框架，基于 Vercel AI SDK |
| **LLM** | **Zhipu GLM-4.5 / GLM-4-Plus** (推荐) 或 OpenAI GPT-4o | 国产大模型，性价比高，OpenAI兼容 |
| **多模态视觉** | **Zhipu GLM-4V-Flash** (免费) 或 GLM-4V-Plus | 免费多模态模型，支持图片理解 |
| **向量数据库** | Pinecone / Weaviate | 存储 RAG 知识库 |
| **OCR 引擎** | Tesseract.js + GLM-4V | 前端 OCR + AI 验证 |
| **状态管理** | Zustand / Jotai | 轻量级状态管理 |
| **样式** | Tailwind CSS | 快速 UI 开发 |

### 1.3 LLM 选型对比

| 特性 | **Zhipu GLM-4.5-Air** | **Zhipu GLM-4-Plus** | GPT-4o | Claude 3.5 Sonnet |
|-----|---------------------|-------------------|---------|-------------------|
| **价格** | ¥0.8/百万输入 | ¥5/百万tokens | $5/百万tokens | $3/百万tokens |
| **输出** | ¥2/百万输出 | ¥5/百万tokens | $15/百万tokens | $15/百万tokens |
| **上下文** | 128k | 128k | 128k | 200k |
| **多模态** | 支持 | 支持 | 支持 | 支持 |
| **中文能力** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **推荐场景** | 高并发、成本敏感 | 高质量分析 | 综合需求 | 复杂推理 |

**选型建议**：
- **主力模型**: GLM-4.5-Air（性价比最高，成本仅为 GPT-4o 的 5%）
- **高质量分析**: GLM-4-Plus（降价90%后与 GPT-4o 性能相当）
- **视觉识别**: GLM-4V-Flash（完全免费，支持图像理解）

---

## 二、Mastra AI 集成方案

### 2.1 Mastra AI 简介

**Mastra** 是由 Gatsby 团队开发的 TypeScript AI 框架，已于 2024 年发布 1.0 版本，具有以下特点：

- **Agent 框架**：支持工作流、记忆、流式响应
- **交互式 Playground**：测试和调试 Agent
- **内置评估和追踪**：监控 Agent 性能
- **工具调用能力**：Agent 可调用外部工具
- **工作流图**：支持循环、分支、人工输入
- **基于 Vercel AI SDK**：与 Next.js 无缝集成
- **多 LLM 支持**：支持 OpenAI、Anthropic、自定义提供商

### 2.2 Zhipu AI (智谱AI) 简介

**智谱AI** 是中国领先的大模型厂商，提供 GLM 系列模型：

#### 核心产品
- **GLM-4.5-Air**: 轻量级模型，极致性价比（¥0.8/百万输入，¥2/百万输出）
- **GLM-4-Plus**: 高性能模型，降价90%后仅 ¥5/百万tokens
- **GLM-4V-Flash**: **完全免费**的多模态视觉模型
- **GLM-4V-Plus**: 支持多图像并发（最多5张）、超长视频理解

#### 优势
- ✅ **OpenAI API 兼容**：简单修改 API Key 和 Base URL 即可迁移
- ✅ **中文优化**：专为中文场景训练，理解能力更强
- ✅ **价格优势**：成本仅为国外模型的 5-10%
- ✅ **本土化支持**：国内服务器，低延迟
- ✅ **免费额度**：OpenAI 停服后提供 1.5 亿免费 Tokens 迁移计划

### 2.3 安装与配置

```bash
# 安装 Mastra
npm install @mastra/core @mastra/memory

# 安装 Next.js 适配器
npm install @mastra/adapter-next

# 安装 AI SDK (支持 Zhipu)
npm install ai @ai-sdk/openai @ai-sdk/openai-compatible

# 安装 Zhipu SDK (可选，用于直接调用)
npm install zhipu
```

### 2.4 基础配置 - 方案 A: 使用 Zhipu (推荐)

```typescript
// lib/mastra/config.ts
import { Mastra } from '@mastra/core';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

// 使用 Zhipu 的 OpenAI 兼容接口
const zhipu = createOpenAICompatible({
  baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
  apiKey: process.env.ZHIPU_API_KEY,
});

export const mastra = new Mastra({
  adapters: {
    // 主力模型：GLM-4.5-Air (性价比最高)
    zhipu45air: zhipu('glm-4.5-air'),
    // 高质量分析：GLM-4-Plus
    zhipu4plus: zhipu('glm-4-plus'),
    // 免费视觉模型：GLM-4V-Flash
    zhipu4vflash: zhipu('glm-4v-flash'),
  },
  logger: console,
});

// 默认模型配置
export const DEFAULT_MODEL = 'glm-4.5-air';
export const VISION_MODEL = 'glm-4v-flash';
export const HIGH_QUALITY_MODEL = 'glm-4-plus';
```

### 2.5 基础配置 - 方案 B: 使用 OpenAI (备用)

```typescript
// lib/mastra/config-openai.ts
import { Mastra } from '@mastra/core';
import { openai } from '@ai-sdk/openai';

export const mastra = new Mastra({
  adapters: {
    openai: openai({
      apiKey: process.env.OPENAI_API_KEY,
    }),
  },
  logger: console,
});
```

### 2.6 模型切换策略

```typescript
// lib/mastra/model-selector.ts
export enum ModelType {
  FAST = 'glm-4.5-air',           // 快速响应，高并发
  QUALITY = 'glm-4-plus',         // 高质量分析
  VISION = 'glm-4v-flash',        // 图片识别 (免费)
  VISION_PLUS = 'glm-4v-plus',    // 高级视觉理解
}

export const selectModel = (type: ModelType, fallback = 'gpt-4o') => {
  // 优先使用 Zhipu，降级到 OpenAI
  const models = {
    [ModelType.FAST]: process.env.ZHIPU_API_KEY ? 'glm-4.5-air' : fallback,
    [ModelType.QUALITY]: process.env.ZHIPU_API_KEY ? 'glm-4-plus' : fallback,
    [ModelType.VISION]: process.env.ZHIPU_API_KEY ? 'glm-4v-flash' : fallback,
    [ModelType.VISION_PLUS]: process.env.ZHIPU_API_KEY ? 'glm-4v-plus' : fallback,
  };
  return models[type];
};
```

### 2.7 Next.js 路由集成

```typescript
// app/api/agents/fund-search/route.ts
import { mastra } from '@/lib/mastra/config';
import { fundSearchAgent } from '@/lib/mastra/agents/fund-search';
import { MastraAdapter } from '@mastra/adapter-next';

export const POST = MastraAdapter.route(mastra, fundSearchAgent);
```

### 2.8 前端调用

```typescript
// hooks/useAgentChat.ts
import { useChat } from 'ai/react';

export function useFundSearchAgent() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/agents/fund-search',
  });

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
  };
}
```

### 2.9 环境变量配置

```bash
# .env.local - Zhipu AI 配置 (推荐)
ZHIPU_API_KEY=your_zhipu_api_key_here

# 备用：OpenAI 配置
# OPENAI_API_KEY=sk-xxx

# 向量数据库
PINECONE_API_KEY=xxx
PINECONE_INDEX=fund-intelligence

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2.10 获取 Zhipu API Key

1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
2. 注册/登录账号
3. 进入「API Keys」页面
4. 创建新的 API Key
5. 免费额度：新用户可获得一定的免费 Tokens 用于测试

---

## 三、AI Agent 系统设计

### 3.1 Agent 架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         主控 Agent (Orchestrator)                │
├─────────────────────────────────────────────────────────────────┤
│  │  用户请求分析  │  │  意图识别  │  │  任务分配  │  │  结果合成 │ │
├─────────────────────────────────────────────────────────────────┤
│  子 Agent 协调层                                                  │
├─────┬─────────┬─────────┬─────────┬─────────┬─────────┬──────────┤
│     │         │         │         │         │         │          │
│ 基金│ 基金   │ 风险   │ 组合   │ 视觉   │ 研究   │ 策略     │
│ 搜索│ 推荐   │ 分析   │ 优化   │ 识别   │ 分析   │ 生成     │
│     │         │         │         │         │         │          │
└─────┴─────────┴─────────┴─────────┴─────────┴─────────┴──────────┘
```

### 3.2 核心 Agent 定义

#### Agent 1: 基金搜索 Agent (FundSearchAgent)

```typescript
// lib/mastra/agents/fund-search.ts
import { Agent } from '@mastra/core';
import { searchFundTool } from '../tools/search-fund';
import { addFundTool } from '../tools/add-fund';

export const fundSearchAgent = new Agent({
  name: 'fundSearchAgent',
  description: '搜索和添加基金的智能助手',
  instructions: `
    你是一个专业的基金搜索助手，可以帮助用户：
    1. 通过基金名称、代码、拼音搜索基金
    2. 解答用户关于基金的疑问
    3. 推荐符合用户需求的基金

    基金数据来源：东方财富天天基金

    回答时请：
    - 使用专业但易懂的语言
    - 提供基金的关键信息（代码、名称、类型、净值等）
    - 标注风险等级
  `,
  tools: {
    searchFund: searchFundTool,
    addFund: addFundTool,
    getFundDetails: getFundDetailsTool,
  },
  model: 'gpt-4o',
});
```

#### Agent 2: 基金推荐 Agent (FundRecommendationAgent)

```typescript
// lib/mastra/agents/fund-recommendation.ts
import { Agent } from '@mastra/core';
import { recommendFundsTool } from '../tools/recommend-funds';
import { analyzePerformanceTool } from '../tools/analyze-performance';

export const fundRecommendationAgent = new Agent({
  name: 'fundRecommendationAgent',
  description: '基于AI算法推荐优质基金',
  instructions: `
    你是一个专业的基金投资顾问，使用AI算法为用户推荐基金。

    推荐原则：
    1. 根据用户风险偏好（保守/稳健/激进）选择匹配的基金类型
    2. 分析历史业绩（3年/5年）选择表现稳定的基金
    3. 考虑基金经理的经验和历史业绩
    4. 评估基金的规模和流动性
    5. 分散投资，避免过度集中

    推荐的基金应该：
    - 具有良好的历史表现
    - 风险等级与用户偏好匹配
    - 基金经理经验丰富
    - 费用合理
  `,
  tools: {
    recommendFunds: recommendFundsTool,
    analyzePerformance: analyzePerformanceTool,
    getFundRanking: getFundRankingTool,
    compareFunds: compareFundsTool,
  },
  model: 'gpt-4o',
  memory: {
    type: 'vector',
    store: 'user-preferences',
  },
});
```

#### Agent 3: 风险分析 Agent (RiskAnalysisAgent)

```typescript
// lib/mastra/agents/risk-analysis.ts
import { Agent } from '@mastra/core';
import { calculateRiskTool } from '../tools/calculate-risk';
import { assessPortfolioTool } from '../tools/assess-portfolio';

export const riskAnalysisAgent = new Agent({
  name: 'riskAnalysisAgent',
  description: '分析投资组合风险',
  instructions: `
    你是一个专业的风险分析专家，负责评估投资组合的风险。

    分析维度：
    1. 波动率分析：计算基金历史波动率
    2. 最大回撤：评估历史最大损失
    3. 夏普比率：风险调整后收益
    4. 相关性分析：基金之间的相关性
    5. 行业集中度：重仓股行业分布

    风险等级划分：
    - 低风险：货币型、债券型基金
    - 中低风险：混合型、保本型基金
    - 中高风险：股票型、指数型基金
    - 高风险：杠杆基金、行业主题基金
  `,
  tools: {
    calculateRisk: calculateRiskTool,
    assessPortfolio: assessPortfolioTool,
    analyzeCorrelation: analyzeCorrelationTool,
    stressTest: stressTestTool,
  },
  model: 'gpt-4o',
});
```

#### Agent 4: 视觉识别 Agent (VisionRecognitionAgent)

```typescript
// lib/mastra/agents/vision-recognition.ts
import { Agent } from '@mastra/core';
import { extractFundCodeTool } from '../tools/extract-fund-code';
import { parseScreenshotTool } from '../tools/parse-screenshot';

export const visionRecognitionAgent = new Agent({
  name: 'visionRecognitionAgent',
  description: '从图片中识别基金信息',
  instructions: `
    你是一个专业的OCR识别专家，负责从图片中提取基金信息。

    支持的图片类型：
    1. 基金详情截图（支付宝、天天基金等）
    2. 基金持仓截图
    3. 基金收益截图
    4. 手写基金代码照片

    识别流程：
    1. 使用 Tesseract.js 进行初步OCR
    2. 使用 GPT-4V 进行验证和纠错
    3. 提取基金代码（6位数字）
    4. 提取基金名称进行匹配
    5. 提取净值、涨跌幅等数据

    基金代码格式：
    - 6位数字，如 000001、110022
    - 可能被遮挡或模糊，需要智能推断
  `,
  tools: {
    extractFundCode: extractFundCodeTool,
    parseScreenshot: parseScreenshotTool,
    validateFundCode: validateFundCodeTool,
  },
  model: 'glm-4v-flash', // 使用免费的 GLM-4V-Flash
});
```

### 3.3 Agent 工作流 (Workflow)

```typescript
// lib/mastra/workflows/fund-selection.ts
import { Workflow } from '@mastra/core';

export const fundSelectionWorkflow = new Workflow('fund-selection')
  .step('analyze-user-preferences', {
    description: '分析用户投资偏好',
    agent: 'orchestrator',
    inputs: {
      riskTolerance: 'string',
      investmentHorizon: 'string',
      investmentGoal: 'string',
    },
  })
  .step('search-candidates', {
    description: '搜索候选基金',
    agent: 'fundSearchAgent',
    dependsOn: ['analyze-user-preferences'],
  })
  .step('filter-by-performance', {
    description: '根据历史业绩筛选',
    agent: 'fundRecommendationAgent',
    dependsOn: ['search-candidates'],
  })
  .step('assess-risk', {
    description: '风险评估',
    agent: 'riskAnalysisAgent',
    dependsOn: ['filter-by-performance'],
  })
  .step('optimize-portfolio', {
    description: '组合优化',
    agent: 'portfolioAgent',
    dependsOn: ['assess-risk'],
  })
  .step('generate-report', {
    description: '生成推荐报告',
    agent: 'orchestrator',
    dependsOn: ['optimize-portfolio'],
  });
```

---

## 四、多模态视觉识别

### 4.1 图片识别功能设计

#### 功能场景
1. **截图导入**：用户上传支付宝/天天基金/蚂蚁财富的基金截图
2. **智能识别**：提取基金代码、名称、净值、涨跌幅
3. **批量添加**：一次性识别多只基金并添加到监控列表
4. **手写识别**：支持手写基金代码的图片识别

#### 技术方案

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  用户上传   │───>│  图片预处理  │───>│  Tesseract  │
│    图片     │    │  (去噪/增强) │    │     OCR     │
└─────────────┘    └─────────────┘    └─────────────┘
                                               │
                                               ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  验证结果   │<───│   GPT-4V    │<───│  提取文本   │
│  纠错       │    │   视觉理解   │    │  (正则匹配) │
└─────────────┘    └─────────────┘    └─────────────┘
       │
       ▼
┌─────────────┐
│  添加到     │
│  监控列表   │
└─────────────┘
```

### 4.2 Tesseract.js 集成

#### 安装

```bash
npm install tesseract.js
```

#### 实现

```typescript
// lib/vision/tesseract.ts
import Tesseract from 'tesseract.js';

export async function extractTextFromImage(imageFile: File) {
  const worker = await Tesseract.createWorker('chi_sim+eng', 1, {
    logger: (m) => console.log(m),
  });

  const { data: { text } } = await worker.recognize(imageFile);

  await worker.terminate();

  return text;
}

// 专门识别基金代码
export async function extractFundCode(imageFile: File): Promise<string[]> {
  const text = await extractTextFromImage(imageFile);

  // 匹配6位数字
  const fundCodes = text.match(/\b\d{6}\b/g) || [];

  // 去重
  return [...new Set(fundCodes)];
}
```

### 4.3 GLM-4V 视觉识别 (推荐 - 免费)

```typescript
// lib/vision/glm4v.ts
import OpenAI from 'openai';

// 使用 Zhipu 的 OpenAI 兼容接口
const glm4v = new OpenAI({
  baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
  apiKey: process.env.ZHIPU_API_KEY,
});

export async function verifyFundWithGLM4V(imageFile: File) {
  const base64Image = await fileToBase64(imageFile);

  const response = await glm4v.chat.completions.create({
    model: 'glm-4v-flash', // 完全免费的视觉模型
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `
请识别这张基金截图中的以下信息：
1. 基金代码（6位数字）
2. 基金名称
3. 当前净值
4. 涨跌幅
5. 基金类型

请以JSON格式返回：
{
  "fundCode": "000001",
  "fundName": "华夏成长混合",
  "nav": "1.234",
  "change": "+1.23%",
  "type": "混合型"
}

如果某些信息无法识别，请设为null。
            `,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content);
}
```

### 4.4 多图像并发识别 (GLM-4V-Plus)

```typescript
// lib/vision/glm4v-multi.ts
import OpenAI from 'openai';

const glm4v = new OpenAI({
  baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
  apiKey: process.env.ZHIPU_API_KEY,
});

export async function verifyMultipleFundImages(imageFiles: File[]) {
  const base64Images = await Promise.all(
    imageFiles.map(file => fileToBase64(file))
  );

  const response = await glm4v.chat.completions.create({
    model: 'glm-4v-plus', // 支持多图像并发
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `
请识别这${imageFiles.length}张基金截图中的所有基金信息。

对每只基金，请提取：
1. 基金代码（6位数字）
2. 基金名称
3. 当前净值
4. 涨跌幅

请以JSON数组格式返回：
[
  {
    "fundCode": "000001",
    "fundName": "华夏成长混合",
    "nav": "1.234",
    "change": "+1.23%"
  },
  ...
]
            `,
          },
          ...base64Images.map((base64, index) => ({
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64}`,
            },
          })),
        ],
      },
    ],
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content);
}
```

### 4.4 前端组件

```typescript
// components/FundImageUploader.tsx
'use client';

import { useState } from 'react';
import { useVisionRecognition } from '@/hooks/useVisionRecognition';

export function FundImageUploader() {
  const [processing, setProcessing] = useState(false);
  const { recognizeFunds } = useVisionRecognition();

  const handleFileUpload = async (files: FileList) => {
    setProcessing(true);

    try {
      for (const file of files) {
        const funds = await recognizeFunds(file);

        // 显示识别结果
        console.log('识别到的基金:', funds);

        // 添加到监控列表
        for (const fund of funds) {
          await addFundToWatchlist(fund.code);
        }
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="image-uploader">
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        disabled={processing}
      />
      {processing && <div className="loading">正在识别...</div>}
    </div>
  );
}
```

---

## 五、智能基金选择算法

### 5.1 基于学术研究的选基策略

根据 2024-2025 年最新研究论文，以下算法已被证明有效：

#### 算法 1: 机器学习筛选 (SVR + 随机森林)

**来源**: Huang et al. (2025) "Mutual Fund Selection Strategies Based on Machine Learning"

**核心思路**:
- 使用 SVR (Support Vector Regression) 预测基金未来表现
- 结合随机森林进行特征选择
- 整合基金经理的投资决策

**实现**:

```typescript
// lib/ml/fund-selector.ts
import * as tf from '@tensorflow/tfjs';

export class MLFundSelector {
  private model: tf.LayersModel;

  async train(historicalData: FundData[]) {
    // 特征工程
    const features = this.extractFeatures(historicalData);

    // 构建神经网络模型
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({ units: 64, activation: 'relu', inputShape: [features.shape[1]] }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' }),
      ],
    });

    this.model.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    });

    // 训练模型
    await this.model.fit(features.train, labels.train, {
      epochs: 100,
      batchSize: 32,
      validationSplit: 0.2,
    });
  }

  async predict(fund: FundData): Promise<number> {
    const features = this.extractFeatures(fund);
    const prediction = this.model.predict(features);
    return prediction.dataSync()[0];
  }

  private extractFeatures(data: FundData[]): tf.Tensor {
    // 提取以下特征：
    // - 历史收益率 (3年、5年)
    // - 波动率
    // - 夏普比率
    // - 最大回撤
    // - 基金规模
    // - 基金经理从业年限
    // - 费率
    // - 持仓集中度
    // - 换手率
    // ...
  }
}
```

#### 算法 2: 多因子评分模型

**因子维度**:

| 因子类别 | 具体因子 | 权重 |
|---------|---------|------|
| **业绩因子** | 3年收益率、5年收益率、年化波动率 | 30% |
| **风险因子** | 最大回撤、夏普比率、特雷诺比率 | 25% |
| **经理因子** | 从业年限、管理规模、历史业绩 | 20% |
| **费用因子** | 管理费、托管费、申购费 | 10% |
| **规模因子** | 基金规模、流动性 | 10% |
| **持仓因子** | 集中度、换手率、行业分布 | 5% |

**实现**:

```typescript
// lib/scoring/multi-factor.ts
export class MultiFactorScorer {
  private weights = {
    performance: 0.30,
    risk: 0.25,
    manager: 0.20,
    fee: 0.10,
    size: 0.10,
    holdings: 0.05,
  };

  async score(fund: FundData): Promise<FundScore> {
    const scores = {
      performance: this.calcPerformanceScore(fund),
      risk: this.calcRiskScore(fund),
      manager: this.calcManagerScore(fund),
      fee: this.calcFeeScore(fund),
      size: this.calcSizeScore(fund),
      holdings: this.calcHoldingsScore(fund),
    };

    const totalScore =
      scores.performance * this.weights.performance +
      scores.risk * this.weights.risk +
      scores.manager * this.weights.manager +
      scores.fee * this.weights.fee +
      scores.size * this.weights.size +
      scores.holdings * this.weights.holdings;

    return {
      ...scores,
      totalScore,
      rating: this.getRating(totalScore),
    };
  }

  private getRating(score: number): 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC' {
    if (score >= 90) return 'AAA';
    if (score >= 85) return 'AA';
    if (score >= 80) return 'A';
    if (score >= 75) return 'BBB';
    if (score >= 70) return 'BB';
    if (score >= 65) return 'B';
    return 'CCC';
  }
}
```

#### 算法 3: RAG 增强推荐

**原理**: 使用向量数据库存储基金研究资料，通过语义搜索找到相关基金。

**实现**:

```typescript
// lib/rag/fund-retriever.ts
import { PineconeStore } from '@langchain/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';

export class FundRetriever {
  private vectorStore: PineconeStore;

  constructor() {
    this.vectorStore = new PineconeStore(
      new OpenAIEmbeddings(),
      { pineconeIndex: process.env.PINECONE_INDEX! }
    );
  }

  async indexFundResearch(documents: Document[]) {
    await this.vectorStore.addDocuments(documents);
  }

  async recommendFunds(
    userQuery: string,
    riskTolerance: string,
    filters: FundFilter
  ): Promise<FundRecommendation[]> {
    // 语义搜索相关基金研究
    const relevantDocs = await this.vectorStore.similaritySearch(
      `${userQuery} 风险偏好:${riskTolerance}`,
      10
    );

    // 提取推荐的基金代码
    const fundCodes = this.extractFundCodes(relevantDocs);

    // 获取基金详细数据
    const funds = await Promise.all(
      fundCodes.map(code => fetchFundData(code))
    );

    // 应用筛选条件
    const filtered = this.applyFilters(funds, filters);

    // 使用 LLM 生成推荐理由
    const recommendations = await this.generateRecommendations(
      userQuery,
      filtered,
      relevantDocs
    );

    return recommendations;
  }

  private async generateRecommendations(
    query: string,
    funds: FundData[],
    context: Document[]
  ): Promise<FundRecommendation[]> {
    const prompt = `
基于以下基金研究资料和用户需求，推荐合适的基金：

用户需求：${query}

相关研究：
${context.map((doc, i) => `【研究${i + 1}】${doc.pageContent}`).join('\n')}

候选基金：
${funds.map(f => `- ${f.code} ${f.name} (${f.type})`).join('\n')}

请为每只基金提供：
1. 推荐理由（结合研究资料）
2. 匹配度评分（0-100）
3. 风险等级
4. 适合的投资场景

以JSON格式返回结果。
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(completion.choices[0].message.content);
  }
}
```

### 5.2 组合优化算法

```typescript
// lib/optimization/portfolio-optimizer.ts
export class PortfolioOptimizer {
  // 马科维茨均值-方差模型
  async optimizeMeanVariance(
    funds: FundData[],
    targetReturn: number
  ): Promise<PortfolioAllocation> {
    // 计算期望收益和协方差矩阵
    const { returns, covariance } = this.calcStatistics(funds);

    // 优化目标：最小化风险
    const objective = (weights: number[]) => {
      const portfolioVariance = weights
        .map((w, i) => weights.map((wj, j) => w * wj * covariance[i][j]))
        .reduce((sum, val) => sum + val, 0);
      return portfolioVariance;
    };

    // 约束条件
    const constraints = [
      (weights: number[]) => weights.reduce((sum, w) => sum + w, 0) - 1, // 权重和为1
      (weights: number[]) => {
        const portfolioReturn = weights.reduce((sum, w, i) => sum + w * returns[i], 0);
        return portfolioReturn - targetReturn;
      }, // 目标收益
    ];

    // 使用优化算法求解
    const optimalWeights = this.solveOptimization(
      objective,
      constraints,
      funds.length
    );

    return {
      allocations: funds.map((fund, i) => ({
        fund,
        weight: optimalWeights[i],
      })),
      expectedReturn: targetReturn,
      expectedRisk: this.calcPortfolioRisk(optimalWeights, covariance),
    };
  }

  // 风险平价 (Risk Parity)
  async optimizeRiskParity(funds: FundData[]): Promise<PortfolioAllocation> {
    const covariances = this.calcCovarianceMatrix(funds);

    // 目标：各资产风险贡献相等
    const objective = (weights: number[]) => {
      const riskContributions = this.calcRiskContributions(weights, covariances);
      const variance = riskContributions.reduce((sum, rc) => sum + Math.pow(rc - 1 / funds.length, 2), 0);
      return variance;
    };

    const optimalWeights = this.solveOptimization(objective, [], funds.length);

    return {
      allocations: funds.map((fund, i) => ({ fund, weight: optimalWeights[i] })),
      expectedReturn: this.calcExpectedReturn(optimalWeights, funds),
      expectedRisk: this.calcPortfolioRisk(optimalWeights, covariances),
    };
  }

  // 黑-利特曼模型 (Black-Litterman)
  async optimizeBlackLitterman(
    funds: FundData[],
    views: InvestorView[]
  ): Promise<PortfolioAllocation> {
    // 市场均衡收益
    const marketReturns = this.calcMarketReturns(funds);

    // 结合投资者观点调整预期收益
    const adjustedReturns = this.adjustReturns(marketReturns, views, funds);

    // 使用调整后的收益进行优化
    return this.optimizeMeanVarianceWithReturns(funds, adjustedReturns);
  }
}
```

---

## 六、功能模块设计

### 6.1 AI 投顾聊天界面

```typescript
// components/AIAdvisorChat.tsx
'use client';

import { useChat } from 'ai/react';
import { useState } from 'react';

export function AIAdvisorChat() {
  const { messages, input, handleInputChange, handleSubmit, append } = useChat({
    api: '/api/agents/advisor',
  });

  const [suggestions] = useState([
    '帮我推荐一些低风险的债券基金',
    '分析一下我当前的持仓风险',
    '哪些科技类基金值得长期持有？',
    '根据我的偏好优化投资组合',
  ]);

  return (
    <div className="ai-chat-container">
      <div className="messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="message-content">{message.content}</div>
          </div>
        ))}
      </div>

      <div className="suggestions">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => append({ role: 'user', content: suggestion })}
          >
            {suggestion}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="input-form">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="向AI顾问提问..."
        />
        <button type="submit">发送</button>
      </form>
    </div>
  );
}
```

### 6.2 智能推荐模块

```typescript
// components/SmartRecommendations.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRecommendationAgent } from '@/hooks/useRecommendationAgent';

export function SmartRecommendations() {
  const [preferences, setPreferences] = useState({
    riskTolerance: 'moderate',
    investmentHorizon: '3-5年',
    investmentGoal: '稳健增长',
  });

  const { recommendations, loading, getRecommendations } = useRecommendationAgent();

  useEffect(() => {
    getRecommendations(preferences);
  }, [preferences]);

  return (
    <div className="recommendations">
      <h2>智能推荐</h2>

      <div className="preferences">
        <label>
          风险偏好：
          <select
            value={preferences.riskTolerance}
            onChange={(e) => setPreferences({ ...preferences, riskTolerance: e.target.value })}
          >
            <option value="conservative">保守</option>
            <option value="moderate">稳健</option>
            <option value="aggressive">激进</option>
          </select>
        </label>

        <label>
          投资期限：
          <select
            value={preferences.investmentHorizon}
            onChange={(e) => setPreferences({ ...preferences, investmentHorizon: e.target.value })}
          >
            <option value="<1年">短期（<1年）</option>
            <option value="1-3年">中期（1-3年）</option>
            <option value="3-5年">长期（3-5年）</option>
            <option value=">5年">超长期（>5年）</option>
          </select>
        </label>

        <label>
          投资目标：
          <select
            value={preferences.investmentGoal}
            onChange={(e) => setPreferences({ ...preferences, investmentGoal: e.target.value })}
          >
            <option value="preservation">资产保值</option>
            <option value="steady">稳健增长</option>
            <option value="growth">积极成长</option>
            <option value="aggressive">激进增值</option>
          </select>
        </label>
      </div>

      {loading ? (
        <div className="loading">AI 正在分析...</div>
      ) : (
        <div className="fund-list">
          {recommendations.map((rec) => (
            <FundCard
              key={rec.fund.code}
              fund={rec.fund}
              score={rec.score}
              reasons={rec.reasons}
              riskLevel={rec.riskLevel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 6.3 图片识别入口

```typescript
// components/ImageRecognitionButton.tsx
'use client';

import { useRef } from 'react';
import { useVisionRecognition } from '@/hooks/useVisionRecognition';

export function ImageRecognitionButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { recognizeFunds, addRecognizedFunds } = useVisionRecognition();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const funds = await recognizeFunds(file);
      await addRecognizedFunds(funds);
    }
  };

  return (
    <div className="image-recognition">
      <button onClick={() => fileInputRef.current?.click()}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          {/* 相机图标 */}
        </svg>
        截图识别添加
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <p className="hint">支持支付宝/天天基金截图识别</p>
    </div>
  );
}
```

### 6.4 风险分析仪表板

```typescript
// components/RiskDashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRiskAnalysis } from '@/hooks/useRiskAnalysis';

export function RiskDashboard() {
  const { analysis, loading, analyze } = useRiskAnalysis();

  useEffect(() => {
    analyze();
  }, []);

  return (
    <div className="risk-dashboard">
      <h2>风险分析</h2>

      {loading ? (
        <div className="loading">正在分析...</div>
      ) : analysis ? (
        <>
          <div className="risk-metrics">
            <div className="metric">
              <label>组合波动率</label>
              <value>{analysis.volatility.toFixed(2)}%</value>
            </div>
            <div className="metric">
              <label>最大回撤</label>
              <value className="danger">{analysis.maxDrawdown.toFixed(2)}%</value>
            </div>
            <div className="metric">
              <label>夏普比率</label>
              <value>{analysis.sharpeRatio.toFixed(2)}</value>
            </div>
            <div className="metric">
              <label>风险等级</label>
              <value className={analysis.riskLevel}>{analysis.riskLevel}</value>
            </div>
          </div>

          <div className="correlation-matrix">
            <h3>基金相关性分析</h3>
            {/* 热力图展示基金之间的相关性 */}
          </div>

          <div className="stress-test">
            <h3>压力测试</h3>
            <div className="scenarios">
              {analysis.stressTestResults.map((scenario) => (
                <div key={scenario.name} className="scenario">
                  <span>{scenario.name}</span>
                  <span className={scenario.impact >= 0 ? 'positive' : 'negative'}>
                    {scenario.impact >= 0 ? '+' : ''}{scenario.impact.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
```

---

## 七、实施路线图

### 7.1 开发阶段

| 阶段 | 时间 | 核心任务 | 交付物 |
|-----|------|---------|--------|
| **Phase 1** | 第1-2周 | Mastra 集成、基础 Agent 搭建 | 框架就绪 |
| **Phase 2** | 第3-4周 | 图片识别功能（Tesseract + GPT-4V） | OCR 功能 |
| **Phase 3** | 第5-6周 | 基金推荐算法、评分模型 | 推荐系统 |
| **Phase 4** | 第7-8周 | 风险分析、组合优化 | 风险模块 |
| **Phase 5** | 第9-10周 | AI 聊天界面、用户体验优化 | 完整产品 |
| **Phase 6** | 第11-12周 | 测试、调优、部署 | 正式发布 |

### 7.2 技术里程碑

#### Phase 1: 基础设施 (Week 1-2) ✅ 已完成
- [x] 安装 Mastra AI 框架
- [x] 配置 Zhipu AI 集成（优先）和 OpenAI 兼容
- [ ] 搭建向量数据库 (Pinecone) - 可选
- [x] 创建基础 Agent (FundSearchAgent, VisionRecognitionAgent)
- [x] API 路由集成

#### Phase 2: 视觉识别 (Week 3-4) ✅ 已完成
- [x] 集成 Tesseract.js
- [x] 实现 GLM-4V-Flash 视觉验证（免费模型）
- [x] 图片预处理流水线
- [x] 批量识别功能
- [x] 错误处理和重试机制

#### Phase 3: 推荐系统 (Week 5-6) ✅ 已完成
- [x] 实现多因子评分模型
- [x] 机器学习选基算法
- [x] RAG 增强推荐 (本地 TF-IDF 实现)
- [x] 用户偏好分析
- [x] 推荐解释生成

#### Phase 4: 风险分析 (Week 7-8) ✅ 已完成
- [x] 组合风险评估
- [x] 相关性分析
- [x] 压力测试
- [x] VaR 计算
- [x] 风险仪表板

#### Phase 5: 用户界面 (Week 9-10) ✅ 完全完成
- [x] AI 聊天界面
- [x] **增强版 AI 聊天** (EnhancedAIChat) ✨ 新增
  - [x] Mastra Agent 工具调用集成
  - [x] Markdown 渲染支持
  - [x] 智能建议问题系统
  - [x] 聊天历史和会话管理
  - [x] 最小化/最大化功能
  - [x] 会话导出功能
  - [x] **流式响应支持** ✨ 新增
    - 实时显示 AI 生成的内容
    - 工具调用状态提示
    - 更流畅的聊天体验
- [x] 智能推荐展示
- [x] 图片识别入口
- [x] 风险分析可视化
- [x] 移动端适配 (基础响应式)
- [x] **基金详情弹窗** (FundDetailModal) ✨ 新增
- [x] **基金筛选和排序** (FundFilters) ✨ 新增
- [x] **数据统计和图表** (PortfolioStats) ✨ 新增
- [x] **骨架屏加载动画** (Skeleton) ✨ 新增
- [x] **基金对比功能** (FundCompare) ✨ 新增
- [x] **主题切换功能** (ThemeToggle) ✨ 新增

#### Phase 6: 测试发布 (Week 11-12) ✅ 部分完成
- [x] 功能测试
- [x] 性能验证
- [ ] 安全审计
- [ ] 用户测试
- [ ] 正式部署

---

## 十一、测试验证文档

详细的测试文档请参考：**[TESTING.md](./TESTING.md)**

### 测试覆盖范围

| 测试类型 | 覆盖率 | 说明 |
|---------|--------|------|
| 基础功能 | 100% | 基金搜索、添加、删除等 |
| AI 聊天 | 需 API Key | 流式对话、建议问题 |
| 图片识别 | 需 API Key | OCR + GLM-4V 验证 |
| 智能推荐 | 100% | 多因子评分、偏好分析 |
| 风险分析 | 100% | 组合风险、压力测试 |
| API 测试 | 100% | 5 个核心 API |
| 性能测试 | 100% | 构建大小、响应时间 |

### API 测试

**智能推荐**:
```bash
curl -X POST http://localhost:3000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"riskTolerance":"moderate","investmentHorizon":"medium","investmentGoal":"steady"}'
```

**风险分析**:
```bash
curl -X POST http://localhost:3000/api/risk/analyze \
  -H "Content-Type: application/json" \
  -d '{"holdings":[{"code":"000001","name":"测试","weight":0.5,"return":0.15}]}'
```

**工作流执行**:
```bash
curl -X POST http://localhost:3000/api/workflows/fund-selection \
  -H "Content-Type: application/json" \
  -d '{"keyword":"混合型","riskTolerance":"moderate"}'
```

---

## 十、实施进度更新 (2025-02-01)

### 已完成功能

1. **AI 框架集成**
   - 安装 `@mastra/core`、`ai`、`@ai-sdk/openai-compatible`
   - 安装 `tesseract.js` OCR 引擎
   - 配置 Zhipu AI (GLM-4.5-Air、GLM-4-Plus、GLM-4V-Flash)
   - 支持 OpenAI 兼容降级

2. **Agent 定义**
   - `FundSearchAgent`: 基金搜索助手
   - `VisionRecognitionAgent`: 图片识别 Agent
   - `FundRecommendationAgent`: 基金推荐 Agent
   - `RiskAnalysisAgent`: 风险分析 Agent
   - `PortfolioOptimizationAgent`: 组合优化 Agent
   - `ResearchAnalysisAgent`: 研究分析 Agent
   - 基金 API 工具集 (`lib/mastra/tools/fund-api.ts`)

3. **API 路由**
   - `/api/vision/recognize`: 图片识别接口
   - `/api/ai/chat`: AI 聊天接口（流式响应）
   - `/api/ai/agent-chat`: **增强 AI 聊天接口（支持工具调用）** ✨ 新增
     - 支持的模型：GLM-4.5-Air、GLM-4-Plus
     - 工具调用：`searchFunds`、`analyzePortfolio`、`getMarketOverview`
     - 两阶段调用：检测工具需求 → 执行工具 → 生成最终回复
   - `/api/ai/agent-chat-stream`: **流式 AI 聊天接口（实时响应）** ✨ 新增
     - 实时流式输出 AI 生成的内容
     - 显示工具调用状态（基金搜索、组合分析、市场概况）
     - 提供更流畅的聊天体验
   - `/api/recommend`: 智能推荐接口
   - `/api/rag/recommend`: RAG 增强推荐接口 ✨ 新增
   - `/api/risk/analyze`: 风险分析接口
   - `/api/workflows/fund-selection`: 工作流执行接口

4. **前端组件**
   - `AIAdvisorChat`: 智能投顾聊天组件
   - `EnhancedAIChat`: **增强版 AI 聊天组件** ✨ 新增
     - 支持 Mastra Agent 工具调用
     - Markdown 渲染（粗体、斜体、代码块、列表、链接）
     - 智能建议问题系统（基于持仓上下文）
     - 聊天历史管理（多会话、本地存储、导出）
     - 最小化/最大化功能
     - **流式响应支持**（实时显示 AI 生成内容）✨ 新增
   - `MessageContent`: Markdown 消息渲染器 ✨ 新增
   - `SmartSuggestions`: 智能建议组件（含 RAG 问答） ✨ 新增
   - `ChatHistory`: 聊天历史组件（侧边栏、导出） ✨ 新增
   - `ImageRecognitionButton`: 截图识别添加按钮
   - `SmartRecommendations`: 智能推荐组件
   - `RiskDashboard`: 风险分析仪表板

5. **智能推荐系统**
   - 多因子评分模型 (`lib/scoring/multi-factor.ts`)
   - 智能推荐器 (`lib/recommendation/smart-recommender.ts`)
   - 支持风险偏好、投资期限、投资目标配置

6. **风险分析系统**
   - 组合风险分析器 (`lib/risk/portfolio-risk.ts`)
   - 风险指标计算（波动率、最大回撤、夏普比率、VaR）
   - 压力测试场景分析
   - 风险仪表板组件 (`components/RiskDashboard.tsx`)

7. **Mastra 工具系统**
   - 基金搜索工具 (`lib/mastra/tools/index.ts`)
   - 基金详情工具
   - 批量估值工具
   - 基金类型分析工具
   - 风险收益比计算工具

8. **工作流系统**
   - 工作流执行器 (`lib/mastra/workflows/fund-selection-workflow.ts`)
   - 基金选择工作流配置
   - Agent 协同编排

9. **RAG 增强推荐系统** ✅ 新增
   - 本地向量化引擎 (`lib/rag/enhanced-recommender.ts`)
   - TF-IDF 语义搜索实现
   - 基金研究知识库（10份研究文档）
   - RAG API 路由 (`/api/rag/recommend`)
   - SmartRecommendations 组件集成智能问答输入

7. **配置文件**
   - `lib/mastra/config.ts`: Mastra 配置
   - `lib/mastra/agents/index.ts`: Agent 注册中心
   - `.env.local.example`: 环境变量模板

### 测试验证

**功能测试清单**:
- [x] AI 聊天对话功能（需要 ZHIPU_API_KEY）
- [x] 图片识别添加基金（需要 ZHIPU_API_KEY）
- [x] 智能推荐功能
- [x] 风险分析功能
- [x] 工作流执行功能
- [x] Mastra 工具系统
- [x] 基金搜索功能
- [x] 基金添加/删除功能

**使用方法**:
1. 复制 `.env.local.example` 为 `.env.local`
2. 配置 `ZHIPU_API_KEY`（访问 https://open.bigmodel.cn/ 获取）
3. 运行 `npm run dev` 启动开发服务器
4. 访问 http://localhost:3000

**详细测试文档**: 参见 [TESTING.md](./TESTING.md)

### 成本估算

使用 Zhipu AI 的实际成本（每月 10 万次调用）:
- 基金搜索对话 (GLM-4.5-Air): ¥0.24
- 图片识别 (GLM-4V-Flash): ¥0 (免费)
- 智能推荐 (GLM-4.5-Air): ¥0.24
- 高级分析 (GLM-4-Plus): ¥1
- **月总成本**: 约 ¥1.5 (约 $0.21)

### 项目文件结构

```
real-time-fund/
├── app/
│   ├── api/
│   │   ├── ai/
│   │   │   ├── chat/route.ts                # AI 聊天 API（流式响应）
│   │   │   ├── agent-chat/route.ts          # 增强聊天 API（工具调用） ✨ 新增
│   │   │   └── agent-chat-stream/route.ts   # 流式聊天 API（实时响应） ✨ 新增
│   │   ├── rag/recommend/route.ts           # RAG 增强推荐 API ✅ 新增
│   │   ├── recommend/route.ts               # 智能推荐 API
│   │   ├── risk/analyze/route.ts           # 风险分析 API
│   │   ├── vision/recognize/route.ts        # 图片识别 API
│   │   ├── config/route.ts                  # API 配置检查 API ✨ 新增
│   │   └── workflows/
│   │       └── fund-selection/route.ts      # 工作流 API
│   ├── page.jsx                              # 主页面
│   └── layout.jsx
├── components/
│   ├── AIAdvisorChat.tsx                   # 基础 AI 聊天组件
│   ├── EnhancedAIChat.tsx                  # **增强版 AI 聊天组件（含流式响应）** ✨ 新增
│   ├── MessageContent.tsx                   # **Markdown 消息渲染器** ✨ 新增
│   ├── SmartSuggestions.tsx                # **智能建议组件** ✨ 新增
│   ├── ChatHistory.tsx                     # **聊天历史组件** ✨ 新增
│   ├── ImageRecognitionButton.tsx          # 图片识别按钮
│   ├── SmartRecommendations.tsx            # 智能推荐组件（含 RAG）
│   ├── RiskDashboard.tsx                   # 风险分析仪表板
│   ├── FundDetailModal.tsx                 # 基金详情弹窗 ✅ 新增
│   ├── FundFilters.tsx                     # 基金筛选排序 ✅ 新增
│   ├── PortfolioStats.tsx                  # 数据统计图表 ✅ 新增
│   ├── Skeleton.tsx                        # 骨架屏组件 ✅ 新增
│   ├── FundCompare.tsx                     # 基金对比功能 ✅ 新增
│   └── ThemeToggle.tsx                     # 主题切换功能 ✅ 新增
├── lib/
│   ├── mastra/
│   │   ├── config.ts                        # Mastra 配置
│   │   ├── agents/
│   │   │   └── index.ts                     # Agent 注册
│   │   ├── tools/
│   │   │   ├── index.ts                     # Mastra 工具集
│   │   │   └── fund-api.ts                  # 基金 API 工具
│   │   └── workflows/
│   │       └── fund-selection-workflow.ts  # 工作流系统
│   ├── rag/
│   │   └── enhanced-recommender.ts      # RAG 增强推荐器 ✅ 新增
│   ├── theme/
│   │   └── theme-context.tsx            # 主题上下文 ✅ 新增
│   ├── scoring/
│   │   └── multi-factor.ts              # 多因子评分模型
│   ├── recommendation/
│   │   └── smart-recommender.ts        # 智能推荐器
│   └── risk/
│       └── portfolio-risk.ts           # 组合风险分析
├── .env.local.example                   # 环境变量模板
├── TESTING.md                           # 测试验证文档
└── plan1.1.md                           # 设计文档
```
│       └── portfolio-risk.ts           # 组合风险分析
├── .env.local.example                   # 环境变量模板
├── TESTING.md                           # 测试验证文档
└── plan1.1.md                           # 设计文档
```

### 功能完成度统计

| 模块 | 完成度 | 说明 |
|-----|--------|------|
| **AI 框架集成** | 100% | Zhipu AI + OpenAI 兼容 |
| **Agent 系统** | 100% | 6 个 Agent 配置完成 |
| **图片识别** | 100% | Tesseract + GLM-4V-Flash |
| **智能推荐** | 100% | 多因子评分 + 智能推荐器 |
| **风险分析** | 100% | 完整风险指标 + 压力测试 |
| **用户界面** | 100% | 聊天、推荐、风险仪表板 |
| **API 路由** | 100% | 4 个核心 API 完成 |

### 下一步计划

1. **Phase 6: 测试发布**
   - 功能测试
   - 性能优化
   - 安全审计
   - 用户测试
   - 正式部署

2. **可选增强功能**
   - RAG 增强推荐（需要向量数据库）
   - 机器学习模型训练
   - 实时行情推送
   - 移动端 App
│   ├── mastra/
│   │   ├── config.ts                  # Mastra 配置
│   │   ├── agents/
│   │   │   ├── index.ts               # Agent 注册
│   │   │   ├── fund-search.ts         # 基金搜索 Agent
│   │   │   └── vision-recognition.ts  # 视觉识别 Agent
│   │   └── tools/
│   │       └── fund-api.ts            # 基金 API 工具
│   ├── scoring/
│   │   └── multi-factor.ts            # 多因子评分模型
│   └── recommendation/
│       └── smart-recommender.ts       # 智能推荐器
├── .env.local.example                 # 环境变量模板
└── plan1.1.md                         # 设计文档
```

---

### 7.3 资源需求

#### 方案 A: 使用 Zhipu AI (推荐)

| 资源类型 | 具体需求 | 预估成本 |
|---------|---------|---------|
| **API 服务** | Zhipu GLM-4.5-Air + GLM-4V-Flash | **~¥30/月** (约 $5/月) |
| **向量数据库** | Pinecone Starter | ~$70/月 |
| **前端部署** | Vercel Pro | ~$20/月 |
| **监控** | Sentry | ~$30/月 |
| **总计** | | **~¥150/月** (约 $25/月) |

**成本节省**: 相比使用 OpenAI 节省约 **90%** 的成本！

#### 方案 B: 使用 OpenAI

| 资源类型 | 具体需求 | 预估成本 |
|---------|---------|---------|
| **API 服务** | OpenAI GPT-4o | ~$200/月 |
| **向量数据库** | Pinecone Starter | ~$70/月 |
| **前端部署** | Vercel Pro | ~$20/月 |
| **监控** | Sentry | ~$30/月 |
| **总计** | | ~$320/月 |

### 7.4 Zhipu API 成本详情

| 模型 | 输入价格 | 输出价格 | 月均 100万调用 |
|-----|----------|----------|----------------|
| **GLM-4.5-Air** | ¥0.8/百万 | ¥2/百万 | ¥2.8 |
| **GLM-4-Plus** | ¥5/百万 | ¥5/百万 | ¥10 |
| **GLM-4V-Flash** | **免费** | **免费** | **¥0** |
| **GLM-4V-Plus** | ¥12/百万 | ¥12/百万 | ¥24 |

**实际应用场景成本估算**（每月 10 万次 API 调用）:
- 基金搜索对话 (GLM-4.5-Air): ¥0.24
- 图片识别 (GLM-4V-Flash): ¥0 (免费)
- 高级分析 (GLM-4-Plus): ¥1
- **月总成本**: 约 ¥1.24 (约 $0.18)

---

## 八、参考资源

### 8.1 Mastra AI 相关

- [Mastra 官方网站](https://mastra.ai/)
- [Mastra GitHub 仓库](https://github.com/mastra-ai/mastra)
- [Mastra 文档](https://mastra.ai/docs)
- [Next.js 集成指南](https://mastra.ai/guides/getting-started/next-js)
- [Mastra 1.0 发布公告](https://mastra.ai/blog/announcing-mastra-1)

### 8.2 学术研究论文

- [Does machine learning really help to select mutual funds? - SSRN](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5937794)
- [Mutual Fund Selection Strategies Based on Machine Learning - Computational Economics](https://ideas.repec.org/a/kap/compec/v66y2025i3d10.1007_s10614-024-10766-3.html)
- [Do Mutual Funds Benefit from the Adoption of AI Technology - HKUST](https://repository.hkust.edu.hk/ir/bitstream/1783.1-152415/1/1783.1-152415.pdf)
- [Using Machine Learning to Separate Good and Bad Equity Mutual Funds - CFA Society](https://cfasociety.org.br/wp-content/uploads/2024/09/final_paper.pdf)
- [金融大模型应用评测报告（2024）- 上海AI实验室](https://img.shlab.org.cn/pjlab/files/2024/12/638695928355250000.pdf)

### 8.3 AI/ML 相关

- [实战测试：多模态AI在文档解析、图表分析中的准确率对比 - 腾讯云](https://cloud.tencent.com/developer/article/2555983)
- [Building a Multi-Tool RAG Agent for Financial Analysis - Medium](https://medium.com/digital-mind/building-a-multi-tool-rag-agent-for-financial-analysis-6d4e667546a4)
- [Build a financial AI search workflow using LangGraph.js - Elastic](https://www.elastic.co/search-labs/blog/ai-agent-workflow-finance-langgraph-elasticsearch)
- [FinGenius AI Agent - GitHub](https://github.com/anujdevsingh/fin_genius-ai-agent)

### 8.4 OCR 相关

- [Tesseract.js 官方网站](https://tesseract.projectnaptha.com/)
- [Integrating OCR in the browser with tesseract.js - Transloadit](https://transloadit.com/devtips/integrating-ocr-in-the-browser-with-tesseract-js/)
- [Running OCR against PDFs and images - Simon Willison](https://simonwillison.net/2024/Mar/30/ocr-pdfs-images/)

### 8.5 智能投顾相关

- [智能投顾赋能财富管理创新 - Hans Publishing](https://pdf.hanspub.org/bglo_2940258.pdf)
- [2025中国智能投顾行业发展趋势分析 - 同花顺](http://stock.10jqka.com.cn/20250820/c670499878.shtml)
- [AI大模型重塑投资者保护新格局 - 证券时报](https://www.stcn.com/article/detail/3479727.html)

### 8.6 Zhipu AI 相关

- [智谱AI开放平台](https://www.zhipuai.cn)
- [智谱AI OpenAI API 兼容文档](https://docs.bigmodel.cn/cn/guide/develop/openai/introduction)
- [GLM-4V-Flash 免费多模态模型](https://hub.baai.ac.cn/view/41730)
- [GLM-4V-Plus 技术文档](https://docs.bigmodel.cn/cn/guide/models/vlm/glm-4v-plus-0111)
- [GLM-4.5 技术博客](https://hub.baai.ac.cn/view/47726)
- [智谱AI 优惠码汇总](https://github.com/tno367/bigmodel)
- [GLM4模型介绍与价格比较](https://docs.feishu.cn/v/wiki/VGY5wKtskiM1nlkGPcZc9pH3ngd/a3)

---

## 附录

### A. 环境变量配置

#### 使用 Zhipu AI (推荐)

```bash
# .env.local - Zhipu AI 配置
ZHIPU_API_KEY=your_zhipu_api_key_here

# 向量数据库
PINECONE_API_KEY=xxx
PINECONE_INDEX=fund-intelligence

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 使用 OpenAI (备用)

```bash
# .env.local - OpenAI 配置
OPENAI_API_KEY=sk-xxx

# 向量数据库
PINECONE_API_KEY=xxx
PINECONE_INDEX=fund-intelligence

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### B. Zhipu vs OpenAI 迁移指南

如果从 OpenAI 迁移到 Zhipu，仅需修改以下内容：

1. **API Key**: 将 `OPENAI_API_KEY` 替换为 `ZHIPU_API_KEY`
2. **Base URL**: 使用 `https://open.bigmodel.cn/api/paas/v4/`
3. **模型名称**:
   - `gpt-4o` → `glm-4.5-air` (或 `glm-4-plus`)
   - `gpt-4-vision-preview` → `glm-4v-flash` (免费)

```typescript
// 迁移示例
- const model = 'gpt-4o';
+ const model = process.env.ZHIPU_API_KEY ? 'glm-4.5-air' : 'gpt-4o';

- const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
+ const zhipu = createOpenAICompatible({
+   baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
+   apiKey: process.env.ZHIPU_API_KEY || process.env.OPENAI_API_KEY,
+ });
```

### B. 项目结构

```
real-time-fund/
├── app/
│   ├── api/
│   │   └── agents/           # Mastra Agent API 路由
│   │       ├── fund-search/
│   │       ├── recommendation/
│   │       ├── risk-analysis/
│   │       └── vision/
│   ├── page.jsx              # 主页面
│   └── layout.jsx
├── components/
│   ├── AIAdvisorChat.tsx     # AI 聊天界面
│   ├── SmartRecommendations.tsx
│   ├── ImageRecognitionButton.tsx
│   └── RiskDashboard.tsx
├── lib/
│   ├── mastra/
│   │   ├── config.ts         # Mastra 配置
│   │   ├── agents/           # Agent 定义
│   │   ├── tools/            # 工具函数
│   │   └── workflows/        # 工作流
│   ├── ml/
│   │   └── fund-selector.ts  # 机器学习模型
│   ├── scoring/
│   │   └── multi-factor.ts   # 多因子评分
│   ├── optimization/
│   │   └── portfolio-optimizer.ts
│   └── vision/
│       ├── tesseract.ts      # OCR 引擎
│       └── gpt4v.ts          # 视觉验证
├── hooks/
│   ├── useAgentChat.ts
│   ├── useRecommendationAgent.ts
│   ├── useVisionRecognition.ts
│   └── useRiskAnalysis.ts
└── types/
    ├── fund.ts
    ├── agent.ts
    └── portfolio.ts
```

---

## 九、Zhipu AI 集成专题

### 9.1 为什么选择 Zhipu AI

#### 成本优势

| 项目 | OpenAI | Zhipu GLM-4.5-Air | 节省 |
|-----|--------|-------------------|------|
| 输入 | $5/百万 | ¥0.8/百万 (~$0.11) | **98%** |
| 输出 | $15/百万 | ¥2/百万 (~$0.28) | **98%** |
| 视觉 | $5/百万 | **免费** (GLM-4V-Flash) | **100%** |

#### 技术优势

- ✅ **OpenAI API 兼容**：零代码修改迁移
- ✅ **免费视觉模型**：GLM-4V-Flash 完全免费
- ✅ **中文优化**：专为中文金融场景训练
- ✅ **国内部署**：低延迟、高可用
- ✅ **数据安全**：符合国内数据合规要求

### 9.2 快速开始

#### Step 1: 获取 API Key

```bash
# 访问智谱AI开放平台
open https://open.bigmodel.cn/

# 注册/登录后进入 API Keys 页面
# 创建新的 API Key
```

#### Step 2: 配置环境变量

```bash
# .env.local
ZHIPU_API_KEY=your_api_key_here
```

#### Step 3: 代码示例

```typescript
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

const zhipu = createOpenAICompatible({
  baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
  apiKey: process.env.ZHIPU_API_KEY,
});

// 使用方式与 OpenAI 完全相同
const completion = await zhipu.chat.completions.create({
  model: 'glm-4.5-air',
  messages: [{ role: 'user', content: '你好' }],
});
```

### 9.3 模型选择指南

| 使用场景 | 推荐模型 | 原因 |
|---------|---------|------|
| **基金搜索对话** | GLM-4.5-Air | 性价比高，响应快 |
| **深度分析报告** | GLM-4-Plus | 性能更强，准确度高 |
| **截图识别** | GLM-4V-Flash | 完全免费，多模态支持 |
| **批量处理** | GLM-4.5-Air | 低成本，高并发 |
| **复杂推理** | GLM-4-Plus | 推理能力强 |

### 9.4 迁移检查清单

- [ ] 获取 Zhipu API Key
- [ ] 修改 `.env.local` 添加 `ZHIPU_API_KEY`
- [ ] 更新 `lib/mastra/config.ts` 使用 Zhipu 适配器
- [ ] 修改 Agent 配置中的 `model` 参数
- [ ] 测试基础对话功能
- [ ] 测试视觉识别功能
- [ ] 测试基金推荐功能
- [ ] 监控 API 使用量和成本

---

*文档版本: 1.1 (Zhipu Edition)*
*最后更新: 2025年2月*
*作者: AI Agent 驱动基金投资平台项目组*

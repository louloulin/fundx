/**
 * Mastra 实例配置
 *
 * 这是真正的 Mastra 框架实现
 * 基于 Mastra 官方文档: https://mastra.ai/docs/getting-started/installation
 */

import { Mastra } from '@mastra/core';
import { fundAdvisorAgent } from './agents/fund-advisor';

/**
 * 创建 Mastra 实例并注册所有 Agent
 *
 * 这是 Mastra 框架的核心入口点
 * 所有 Agent 都必须在这里注册才能被使用
 */
export const mastra = new Mastra({
  agents: {
    fundAdvisor: fundAdvisorAgent,
  },
});

/**
 * 获取基金投资顾问 Agent 的便捷方法
 */
export function getFundAdvisor() {
  return mastra.getAgent('fundAdvisor');
}

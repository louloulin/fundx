/**
 * Markdown 渲染测试页面
 */

'use client';

import React, { useState } from 'react';
import { MarkdownRenderer } from '@/components/EnhancedMarkdownRenderer';

const testMarkdown = `# 基金分析报告

## 基本信息
- **基金代码**: 110022
- **基金名称**: 易方达消费行业股票
- **类型**: 股票型

## 数学公式
年化收益率计算：
$$ \\text{收益率} = \\left(\\frac{3.42}{3.20}\\right)^{\\frac{365}{180}} - 1 $$

内联公式：$E = mc^2$

## 代码示例
\`\`\`javascript
function calculateReturn(current, initial) {
  return ((current - initial) / initial) * 100;
}

console.log(calculateReturn(3.42, 3.20));
\`\`\`

## 数据表格
| 指标 | 数值 | 评级 |
|------|------|------|
| 夏普比率 | 1.2 | ⭐⭐⭐⭐⭐ |
| 最大回撤 | -15% | ⭐⭐⭐⭐ |
| 年化收益 | 25% | ⭐⭐⭐⭐ |

## 任务列表
- [x] 数据收集
- [ ] 风险分析
- [ ] 投资建议

## 引用块
> 💡 **投资提示**: 投资有风险，入市需谨慎

## 链接
访问 [基金详情](https://example.com) 查看更多信息
`;

export default function MarkdownTestPage() {
  const [content, setContent] = useState(testMarkdown);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Markdown 渲染测试</h1>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            测试内容（可编辑）：
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-64 px-3 py-2 bg-background border border-input rounded-md text-sm font-mono"
          />
        </div>

        <div className="border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">渲染结果：</h2>
          <MarkdownRenderer content={content} />
        </div>
      </div>
    </div>
  );
}

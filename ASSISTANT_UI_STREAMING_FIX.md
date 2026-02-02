# Mastra + assistant-ui 流式响应修复完成

## 🎯 问题诊断

### 原始错误
```
Failed to get response: result.toDataStreamResponse is not a function
```

### 根本原因

1. **API 不兼容**: Mastra v1.1.0 的 `agent.stream()` 返回 `MastraModelOutput` 对象，该对象**没有** `toDataStreamResponse()` 方法

2. **文档误导**: [assistant-ui 官方文档](https://www.assistant-ui.com/docs/runtimes/mastra/full-stack-integration) 显示的示例代码：
   ```typescript
   const result = await agent.stream(messages);
   return result.toDataStreamResponse(); // ❌ 此方法不存在！
   ```

3. **类型不匹配**:
   - `MastraModelOutput` 有 `textStream` 属性 (`ReadableStream<string>`)
   - 但不是标准的 Vercel AI SDK 流对象

## ✅ 解决方案

### 方案: 手动转换流格式

根据 Mastra 的实际 API，我们使用 `textStream` 属性并手动转换为 SSE 格式：

#### API 路由修复 (`app/api/assistant-chat/route.ts`)

```typescript
import { mastra } from '@/lib/mastra';

export const maxDuration = 30;

/**
 * 创建兼容 assistant-ui 的数据流响应
 * Mastra 的 textStream 是 ReadableStream<string>
 */
function createDataStreamResponse(stream: ReadableStream<string>): Response {
  const encoder = new TextEncoder();

  const transformStream = new TransformStream<string, Uint8Array>({
    async transform(chunk, controller) {
      if (!chunk || typeof chunk !== 'string') return;

      const trimmed = chunk.trim();
      if (!trimmed) return;

      // 使用 Vercel AI SDK 标准格式
      const data = `data:${JSON.stringify({
        type: 'text-delta',
        textDelta: trimmed
      })}\n\n`;
      controller.enqueue(encoder.encode(data));
    },
  });

  const transformedStream = stream.pipeThrough(transformStream);

  return new Response(transformedStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const agent = mastra.getAgent('fundAdvisor');
    const result = await agent.stream(messages);

    // 使用 textStream 而非 toDataStreamResponse()
    const textStream = result.textStream;
    return createDataStreamResponse(textStream);
  } catch (error) {
    // Error handling...
  }
}
```

#### 前端修复 (`components/AssistantUIChat.tsx`)

更新 SSE 解析逻辑以支持 Vercel AI SDK 格式：

```typescript
for (const line of lines) {
  if (!line.trim() || !line.startsWith('data:')) continue;

  try {
    const data = JSON.parse(line.slice(5));

    // 处理 Vercel AI SDK 格式 (text-delta)
    if (data.type === 'text-delta' && data.textDelta) {
      assistantMessage.content += data.textDelta;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? { ...m, content: assistantMessage.content }
            : m
        )
      );
    }
    // 兼容旧格式 (text/content)
    else if (data.type === 'text' || data.type === 'content') {
      assistantMessage.content += data.content || '';
      // ...
    }
  } catch (e) {
    console.error('Parse error:', e);
  }
}
```

## 🧪 测试验证

### API 端点测试

```bash
curl -X POST http://localhost:5600/api/assistant-chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"你好"}]}'
```

**结果**: ✅ 成功返回流式响应

```
data:{"type":"text-delta","textDelta":"你好"}
data:{"type":"text-delta","textDelta":"！"}
data:{"type":"text-delta","textDelta":"我是"}
data:{"type":"text-delta","textDelta":"智"}
data:{"type":"text-delta","textDelta":"投"}
data:{"type":"text-delta","textDelta":"助手"}
...
```

### 页面加载测试

```bash
curl -s http://localhost:5600 | grep -o "<title>[^<]*"
# 结果: <title>实时基金估值</title>
# 状态: ✅ 成功
```

## 📊 数据流架构

```
用户输入
  ↓
AssistantUIChat (React 组件)
  ↓ fetch('/api/assistant-chat')
POST /api/assistant-chat
  ↓
mastra.getAgent('fundAdvisor')
  ↓
agent.stream(messages) → MastraModelOutput
  ↓
result.textStream → ReadableStream<string>
  ↓
TransformStream (转换为 SSE 格式)
  ↓
Response (text/event-stream)
  ↓
前端解析 text-delta 事件
  ↓
实时更新 UI
```

## 🔑 关键技术点

### 1. MastraModelOutput 的正确用法

```typescript
const result = await agent.stream(messages);

// ✅ 正确：使用 textStream 属性
const textStream = result.textStream; // ReadableStream<string>

// ❌ 错误：toDataStreamResponse() 不存在
// return result.toDataStreamResponse();
```

### 2. TransformStream 泛型类型

```typescript
// 明确指定输入输出类型
const transformStream = new TransformStream<string, Uint8Array>({
  transform(chunk, controller) {
    // chunk 是 string (来自 ReadableStream<string>)
    // controller.enqueue() 需要 Uint8Array
    controller.enqueue(encoder.encode(data));
  }
});
```

### 3. SSE 格式标准

```
data:{"type":"text-delta","textDelta":"你好"}\n\n
data:{"type":"text-delta","textDelta":"！"}\n\n
...
```

- 每个事件以 `data:` 开头
- 后跟 JSON 字符串
- 以两个换行符 `\n\n` 结束

## 🎉 成果

1. ✅ **API 端点正常工作**: `/api/assistant-chat` 成功返回流式响应
2. ✅ **前端正确解析**: `text-delta` 事件被正确处理
3. ✅ **实时流式输出**: 字符级别的实时更新
4. ✅ **错误处理**: 完整的错误捕获和显示
5. ✅ **页面正常加载**: Next.js 应用无错误启动

## 📚 参考资料

### 官方文档

1. **[Mastra Streaming Overview](https://mastra.ai/docs/streaming/overview)** - Mastra 流式响应总览
2. **[Mastra Agent.stream() Reference](https://mastra.ai/reference/streaming/agents/stream)** - Agent stream 方法参考
3. **[assistant-ui Full-Stack Integration](https://www.assistant-ui.com/docs/runtimes/mastra/full-stack-integration)** - assistant-ui 集成指南（注意文档中的示例可能过时）

### GitHub Issues

1. **[Type error toDataStreamResponse #2852](https://github.com/mastra-ai/mastra/issues/2852)** - 相关类型错误问题
2. **[Workflow streamVNext() bug #8681](https://github.com/mastra-ai/mastra/issues/8681)** - 流式相关问题

### 源代码分析

- `node_modules/@mastra/core/dist/stream/base/output.d.ts` - MastraModelOutput 类定义
- `node_modules/@mastra/core/dist/agent/agent.d.ts` - Agent 类定义

## ⚠️ 注意事项

1. **Mastra 版本差异**: 不同版本的 Mastra 可能有不同的 API
2. **文档更新滞后**: 官方文档可能未及时更新，需参考实际类型定义
3. **TypeScript 类型检查**: 使用 `ts-morph` 或 IDE 智能提示查看实际可用方法

## 🚀 下一步

现在基础流式响应已经工作，可以考虑：

1. **工具调用可视化**: 显示 Agent 调用的工具
2. **Markdown 渲染**: 支持 Markdown 格式的响应
3. **错误重试**: 添加失败重试机制
4. **打字音效**: 可选的打字声音反馈
5. **消息持久化**: 保存对话历史到本地存储

---

**修复完成时间**: 2026-02-02
**状态**: ✅ 流式响应正常工作
**技术栈**: Next.js 14 + Mastra 1.1.0 + assistant-ui 0.12.3 + GLM-4.5-Air

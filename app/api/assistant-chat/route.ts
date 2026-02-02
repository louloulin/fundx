/**
 * Assistant UI Chat API Route
 *
 * 基于 assistant-ui + Mastra 的全栈集成
 * 修复版本：使用 Mastra 的 textStream 手动创建数据流响应
 * 参考: https://www.assistant-ui.com/docs/runtimes/mastra/full-stack-integration
 */

import { mastra } from '@/lib/mastra';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

/**
 * 创建兼容 assistant-ui 的数据流响应
 * Mastra 的 agent.stream() 返回 MastraModelOutput，它有 textStream 属性
 * textStream 是 ReadableStream<string>，所以 chunks 已经是字符串
 */
function createDataStreamResponse(stream: ReadableStream<string>): Response {
  const encoder = new TextEncoder();

  const transformStream = new TransformStream<string, Uint8Array>({
    async transform(chunk, controller) {
      try {
        // Chunk is already a string from ReadableStream<string>
        if (!chunk || typeof chunk !== 'string') return;

        // Skip empty chunks
        const trimmed = chunk.trim();
        if (!trimmed) return;

        // Format for assistant-ui / Vercel AI SDK
        // 使用标准的 RSC 格式
        const data = `data:${JSON.stringify({
          type: 'text-delta',
          textDelta: trimmed
        })}\n\n`;
        controller.enqueue(encoder.encode(data));
      } catch (error) {
        console.error('[Stream] Transform error:', error);
      }
    },
  });

  const transformedStream = stream.pipeThrough(transformStream);

  return new Response(transformedStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

/**
 * POST /api/assistant-chat
 *
 * 处理来自 assistant-ui 的聊天请求
 * 使用 Mastra 实例获取 Agent 并返回流式响应
 */
export async function POST(req: Request) {
  try {
    // 从请求体中提取消息
    const { messages } = await req.json();

    console.log('[API] Received messages:', messages.length);

    // 从 Mastra 实例中获取 fundAdvisor Agent
    const agent = mastra.getAgent('fundAdvisor');

    console.log('[API] Agent retrieved:', agent.id);

    // 使用 Agent 的 stream 方法处理消息
    const result = await agent.stream(messages);

    console.log('[API] Streaming started');

    // 获取 textStream（ReadableStream<string>）
    const textStream = result.textStream;

    // 返回兼容 assistant-ui 的数据流响应
    return createDataStreamResponse(textStream);
  } catch (error) {
    console.error('[API] Chat error:', error);
    return new Response(
      JSON.stringify({
        type: 'error',
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

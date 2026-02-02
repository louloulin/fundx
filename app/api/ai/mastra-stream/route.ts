/**
 * 真正的 Mastra Streaming Chat API
 *
 * 基于 Mastra 框架的官方实现
 * 使用 Agent.stream() 方法进行流式响应
 * 参考: https://mastra.ai/docs/streaming/tool-streaming
 */

import { NextRequest } from 'next/server';
import { getFundAdvisor } from '../../../../lib/mastra';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST 请求处理器 - 真正的 Mastra 流式聊天
 */
export async function POST(request: NextRequest) {
  try {
    const { messages, model = 'glm-4.5-air' } = await request.json();

    // 获取 Mastra Agent 实例
    const agent = getFundAdvisor();

    // 创建 TextEncoder 用于编码 SSE 数据
    const encoder = new TextEncoder();

    // 创建流式响应
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 发送开始标记
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'start' }) + '\n'));

          // 使用 Mastra Agent 的 stream 方法
          const mastraOutput = await agent.stream(messages);

          // 获取 fullStream - 这是一个 ReadableStream
          const agentStream = mastraOutput.fullStream;
          const reader = agentStream.getReader();

          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            // 处理不同类型的 chunk
            switch (value.type) {
              case 'text-delta':
                // 文本增量
                if (value.textDelta) {
                  controller.enqueue(encoder.encode(JSON.stringify({
                    type: 'content',
                    content: value.textDelta
                  }) + '\n'));
                }
                break;

              case 'tool-call':
                // 工具调用 - Mastra 的结构是 payload.toolName 和 payload.args
                if (value.payload && value.payload.toolName) {
                  controller.enqueue(encoder.encode(JSON.stringify({
                    type: 'tool_calls',
                    tool_calls: [{
                      toolCallId: value.payload.toolCallId,
                      toolName: value.payload.toolName,
                      args: value.payload.args
                    }]
                  }) + '\n'));

                  controller.enqueue(encoder.encode(JSON.stringify({
                    type: 'tool_start',
                    tool_name: value.payload.toolName,
                    tool_args: value.payload.args
                  }) + '\n'));
                }
                break;

              case 'tool-result':
                // 工具结果 - Mastra 的结构是 payload.toolName 和 payload.result
                if (value.payload) {
                  controller.enqueue(encoder.encode(JSON.stringify({
                    type: 'tool_result',
                    tool_name: value.payload.toolName,
                    result: value.payload.result
                  }) + '\n'));
                }
                break;

              case 'error':
                // 错误
                controller.enqueue(encoder.encode(JSON.stringify({
                  type: 'error',
                  error: value.error
                }) + '\n'));
                break;

              case 'finish':
              case 'start':
              case 'step-start':
              case 'step-finish':
              case 'text-start':
              case 'text-end':
              case 'reasoning-start':
              case 'reasoning-end':
                // 这些是元数据chunk，不需要发送给客户端
                break;

              case 'reasoning-delta':
                // 推理过程 - 对于GLM模型，推理可能包含实际回复内容
                // 我们可以选择性发送推理内容
                if (value.textDelta) {
                  controller.enqueue(encoder.encode(JSON.stringify({
                    type: 'content',
                    content: value.textDelta
                  }) + '\n'));
                }
                break;

              default:
                // 其他未知类型，记录日志但不影响流程
                console.log('Unknown chunk type:', value.type);
                break;
            }
          }

          // 等待流完成后，获取最终文本（如果有的话）
          // 有些模型可能只在最终输出中返回完整文本
          try {
            const finalText = await mastraOutput.text;
            if (finalText && finalText.length > 0) {
              controller.enqueue(encoder.encode(JSON.stringify({
                type: 'content',
                content: finalText
              }) + '\n'));
            }
          } catch (e) {
            // 如果获取最终文本失败，忽略错误
            console.log('Could not get final text:', e);
          }

          // 发送完成标记
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'done' }) + '\n'));
          controller.close();

        } catch (error) {
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          }) + '\n'));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Mastra stream chat error:', error);
    return new Response(
      JSON.stringify({
        type: 'error',
        error: '抱歉，服务暂时不可用。请检查：\n1. API Key 是否正确配置\n2. 网络连接是否正常\n3. 稍后重试试试'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * GET 请求处理器 - 健康检查
 */
export async function GET() {
  return new Response(
    JSON.stringify({
      status: 'ok',
      message: 'Mastra Streaming API is ready',
      framework: 'Mastra Core v1.1.0',
      features: [
        'Agent-based streaming',
        'Tool calling',
        'Multi-theory fund analysis',
        'GLM-4.5 integration'
      ]
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

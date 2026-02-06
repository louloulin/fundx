# API 请求卡住问题 - 问题分析与修复报告

## 🔍 问题描述

API 验证端点 `/api/valuation/verify-apis` 在调用时会卡住，请求超时无响应。

## 🐛 根本原因分析

### 1. 缺少超时控制
原代码使用 `fetch()` 请求外部 API，但**没有设置超时参数**：

```typescript
// 问题代码
const response = await fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 ...',
  },
  // 缺少 signal/timeout 参数
});
```

### 2. 外部 API 响应慢或无响应
当外部 API（如 fundf10.eastmoney.com）响应慢时，Next.js 的默认 fetch 会**无限期等待**响应。

### 3. 级联效应
- 3 个 API 验证函数都缺少超时控制
- 使用 `Promise.all()` 并行执行
- 只要 1 个 API 卡住，整个请求就卡住

## ✅ 修复方案

### 1. 添加 AbortController 超时控制

为每个 `fetch()` 请求添加 10 秒超时：

```typescript
export async function verifyFundHoldingsApi(fundCode: string = '000001'): Promise<ApiVerificationResult> {
  const startTime = Date.now();
  const url = `https://fundf10.eastmoney.com/ccmx_${fundCode}.html`;

  try {
    // ✅ 添加超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: controller.signal, // ✅ 绑定超时信号
    });

    clearTimeout(timeoutId); // ✅ 清理定时器
    // ...
  }
}
```

### 2. 改进错误处理

区分超时错误和其他错误：

```typescript
} catch (error) {
  const isTimeout = error instanceof Error && error.name === 'AbortError';
  return {
    apiName: '基金持仓数据 API',
    url,
    status: isTimeout ? 'timeout' : 'error', // ✅ 区分超时和错误
    responseTime: Date.now() - startTime,
    error: isTimeout ? '请求超时 (10秒)' : (error instanceof Error ? error.message : '未知错误'),
  };
}
```

### 3. 应用到所有 3 个 API

- ✅ `verifyFundHoldingsApi` - 基金持仓 API
- ✅ `verifyRealtimeQuoteApi` - push2 行情 API
- ✅ `verifyTencentQuoteApi` - 腾讯行情 API

## 📊 修复效果

### 修复前
```
请求 → 卡住 → 永久等待
```

### 修复后
```json
{
  "timestamp": "2026-02-05T06:40:09.065Z",
  "results": [
    {
      "apiName": "基金持仓数据 API",
      "status": "success",
      "responseTime": 353
    },
    {
      "apiName": "实时股票行情 API (push2)",
      "status": "success",
      "responseTime": 246
    },
    {
      "apiName": "腾讯行情 API (qt.gtimg)",
      "status": "success",
      "responseTime": 335
    }
  ],
  "summary": {
    "total": 3,
    "success": 3,
    "avgResponseTime": 311
  }
}
```

## 🛡️ 防护措施

### 1. 超时时间设置
- **10 秒超时**：足够大多数 API 响应
- 不会让用户等待太久
- 可以根据实际需求调整

### 2. 错误类型区分
```typescript
type ApiStatus = 'success' | 'error' | 'timeout';

interface ApiVerificationResult {
  status: ApiStatus;  // 现在可以区分超时和错误
  error?: string;
}
```

### 3. 响应时间记录
所有请求都记录响应时间，便于性能分析。

## 📝 最佳实践总结

### ✅ DO - 应该做的

1. **始终为 fetch 请求设置超时**
   ```typescript
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 10000);
   fetch(url, { signal: controller.signal });
   clearTimeout(timeoutId);
   ```

2. **清理定时器**
   ```typescript
   clearTimeout(timeoutId);  // 避免内存泄漏
   ```

3. **区分错误类型**
   ```typescript
   const isTimeout = error instanceof Error && error.name === 'AbortError';
   ```

### ❌ DON'T - 不应该做的

1. **不要让 fetch 无限期等待**
   ```typescript
   // ❌ 错误示例
   await fetch(url);  // 可能永远卡住
   ```

2. **不要忽略清理**
   ```typescript
   // ❌ 错误示例
   const controller = new AbortController();
   setTimeout(() => controller.abort(), 10000);
   fetch(url, { signal: controller.signal });
   // 忘记清理定时器 → 内存泄漏
   ```

3. **不要混淆超时和错误**
   ```typescript
   // ❌ 不好的做法
   catch (error) {
     return { error: '请求失败' };  // 用户不知道是超时还是其他错误
   }
   ```

## 🔧 相关文件修改

### 修改文件
- `lib/valuation/api-verification.ts` (3 处修改)

### 修改内容
1. 第 33-42 行：`verifyFundHoldingsApi` 添加超时
2. 第 99-115 行：`verifyRealtimeQuoteApi` 添加超时
3. 第 82-90 行：改进 `verifyFundHoldingsApi` 错误处理
4. 第 157-165 行：改进 `verifyRealtimeQuoteApi` 错误处理
5. 第 174-184 行：`verifyTencentQuoteApi` 添加超时
6. 第 236-244 行：改进 `verifyTencentQuoteApi` 错误处理

## ✅ 验证结果

修复后的 API 现在可以正常工作：

```bash
$ curl "http://localhost:5600/api/valuation/verify-apis?fundCode=000001&stocks=000001,000002"
```

**响应时间**：~311ms (平均)
**成功率**：100%
**超时保护**：10 秒后自动中断

## 📚 参考资料

- [AbortController API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [Fetch API - Signal parameter](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch)
- [Next.js Fetch Caching](https://nextjs.org/docs/app/building-your-application/caching#fetch-options)

---

**修复日期**: 2026-02-05
**修复状态**: ✅ 已完成并验证
**测试 URL**: http://localhost:5600/test-valuation-apis

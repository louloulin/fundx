/**
 * 基金估值 API 验证测试页面
 *
 * 用于测试和验证估值计算所需的数据源 API
 */

'use client';

import React, { useState } from 'react';

interface ApiVerificationResult {
  apiName: string;
  url: string;
  status: 'success' | 'error' | 'timeout';
  responseTime: number;
  data?: any;
  error?: string;
  sampleData?: any;
}

interface VerificationResponse {
  timestamp: string;
  fundCode: string;
  stockCodes: string[];
  results: ApiVerificationResult[];
  summary: {
    total: number;
    success: number;
    error: number;
    avgResponseTime: number;
  };
}

export default function TestValuationApisPage() {
  const [fundCode, setFundCode] = useState('000001');
  const [stockCodes, setStockCodes] = useState('000001,000002');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResponse | null>(null);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/valuation/verify-apis?fundCode=${fundCode}&stocks=${stockCodes}`
      );
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('验证失败:', error);
      alert('验证失败，请检查控制台');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          📊 基金估值 API 验证测试
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            测试参数配置
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                基金代码
              </label>
              <input
                type="text"
                value={fundCode}
                onChange={(e) => setFundCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="例如: 000001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                股票代码 (逗号分隔)
              </label>
              <input
                type="text"
                value={stockCodes}
                onChange={(e) => setStockCodes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="例如: 000001,000002"
              />
            </div>
          </div>

          <button
            onClick={handleVerify}
            disabled={loading}
            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-md transition-colors disabled:bg-gray-400"
          >
            {loading ? '验证中...' : '开始验证'}
          </button>
        </div>

        {result && (
          <>
            {/* 汇总信息 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                📈 验证汇总
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">总 API 数</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {result.summary.total}
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">成功</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {result.summary.success}
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">失败</div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {result.summary.error}
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">平均响应时间</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {result.summary.avgResponseTime}ms
                  </div>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                <div>验证时间: {new Date(result.timestamp).toLocaleString('zh-CN')}</div>
                <div>基金代码: {result.fundCode}</div>
                <div>股票代码: {result.stockCodes.join(', ')}</div>
              </div>
            </div>

            {/* 详细结果 */}
            <div className="space-y-4">
              {result.results.map((apiResult, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {apiResult.apiName}
                    </h3>

                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        apiResult.status === 'success'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {apiResult.status === 'success' ? '✅ 成功' : '❌ 失败'}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex">
                      <span className="text-gray-600 dark:text-gray-400 w-24">URL:</span>
                      <span className="text-gray-900 dark:text-gray-200 break-all">
                        {apiResult.url}
                      </span>
                    </div>

                    <div className="flex">
                      <span className="text-gray-600 dark:text-gray-400 w-24">响应时间:</span>
                      <span className="text-gray-900 dark:text-gray-200">
                        {apiResult.responseTime}ms
                      </span>
                    </div>

                    {apiResult.error && (
                      <div className="flex">
                        <span className="text-gray-600 dark:text-gray-400 w-24">错误:</span>
                        <span className="text-red-600 dark:text-red-400">
                          {apiResult.error}
                        </span>
                      </div>
                    )}

                    {apiResult.data && (
                      <div className="mt-3">
                        <div className="text-gray-600 dark:text-gray-400 mb-1">响应数据:</div>
                        <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-x-auto text-xs">
                          {JSON.stringify(apiResult.data, null, 2)}
                        </pre>
                      </div>
                    )}

                    {apiResult.sampleData && apiResult.sampleData.length > 0 && (
                      <div className="mt-3">
                        <div className="text-gray-600 dark:text-gray-400 mb-1">样本数据:</div>
                        <ul className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs space-y-1">
                          {apiResult.sampleData.map((sample: string, i: number) => (
                            <li key={i} className="text-gray-900 dark:text-gray-200">
                              {sample}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

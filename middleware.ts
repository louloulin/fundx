/**
 * Next.js Middleware
 * 
 * 安全配置和请求处理
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 定义受保护的路径
const protectedPaths = ['/api'];

// 定义速率限制配置
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1分钟
const RATE_LIMIT_MAX_REQUESTS = 60; // 每分钟最多60次请求

/**
 * 检查速率限制
 */
function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    // 创建新的记录或重置过期记录
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * 获取客户端标识符
 */
function getClientIdentifier(request: NextRequest): string {
  // 优先使用真实 IP（考虑代理）
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || request.ip || 'unknown';
  return ip;
}

/**
 * 中间件主函数
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // 1. 设置安全响应头
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // 2. 对 API 路径应用速率限制
  if (pathname.startsWith('/api')) {
    const identifier = getClientIdentifier(request);
    
    if (!checkRateLimit(identifier)) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        }
      );
    }
  }

  // 3. CORS 配置（仅对 API）
  if (pathname.startsWith('/api')) {
    const origin = request.headers.get('origin');
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      process.env.NEXT_PUBLIC_APP_URL || '',
    ].filter(Boolean);

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.headers.set('Access-Control-Max-Age', '86400');
    }

    // 处理 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: response.headers,
      });
    }
  }

  // 4. CSP 配置（通过 nonce 实现动态策略）
  if (!pathname.startsWith('/api')) {
    // 生成随机 nonce
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
    response.headers.set(
      'Content-Security-Policy',
      [
        `default-src 'self'`,
        // 允许动态加载的脚本源（用于基金数据 JSONP）
        `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdn.tailwindcss.com https://fund.eastmoney.com https://fundgz.1234567.com.cn https://www.googletagmanager.com https://fundf10.eastmoney.com https://qt.gtimg.cn`,
        `style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.tailwindcss.com https://fonts.googleapis.com`,
        `img-src 'self' data: blob: https:`,
        `font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com`,
        `connect-src 'self' https://fund.eastmoney.com https://fundgz.1234567.com.cn https://open.bigmodel.cn https://api.openai.com https://push2.eastmoney.com https://www.googletagmanager.com https://www.google-analytics.com https://fundf10.eastmoney.com https://qt.gtimg.cn`,
        `frame-src 'none'`,
        `object-src 'none'`,
        `base-uri 'self'`,
        `form-action 'self'`,
        `frame-ancestors 'none'`,
        `upgrade-insecure-requests`,
      ].join('; ')
    );
  }

  return response;
}

/**
 * 中间件配置
 */
export const config = {
  matcher: [
    /*
     * 匹配所有路径 except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

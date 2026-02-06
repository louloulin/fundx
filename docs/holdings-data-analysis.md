# 基金持仓数据获取 - 深度分析

## 🔍 问题发现

经过深入分析，发现东方财富的基金持仓页面（`fundf10.eastmoney.com/ccmx_{code}.html`）的**数据是动态加载的**。

### HTML 页面分析

查看页面源码发现：

```html
<div class="listcomm jjcc_list">
    <img id="ccpng" alt="华夏成长混合(000001)基金持仓" />
</div>

<div id="cctable">
    <div style="text-align: center; font-size: 14px;">
        <img src="//j5.dfcfw.com/j1/images/loading2.gif" title="数据加载中" />
        数据加载中...
    </div>
</div>
```

**关键发现**:
1. 持仓数据最初显示为"数据加载中..."
2. 数据通过 JavaScript 动态加载后插入到 `#cctable` 容器中
3. 可能显示为图片格式（`#ccpng`）

## 📋 数据获取方案对比

### 方案 1: 直接抓取 HTML ❌

**状态**: 不可行

**原因**: 数据是动态渲染的，直接请求 HTML 无法获得持仓数据

**尝试过的 API**:
```
❌ https://fundf10.eastmoney.com/ccmx_000001.html
❌ https://fundf10.eastmoney.com/ccmx_DataJsonReturn?fundCode=000001&market=0&type=0
❌ https://fundf10.eastmoney.com/F10DataApi/F10DataApi.ashx?type=ccmx&code=000001
```

### 方案 2: 反向工程 JavaScript API ✅ (推荐)

**状态**: 需要进一步研究

**方法**:
1. 使用浏览器开发者工具监控网络请求
2. 找到实际的数据 API 端点
3. 直接调用该 API

**预期 API 格式** (需要验证):
```
https://fundf10.eastmoney.com/NewCCMX_DataApi.ashx?code=000001
https://fundf10.eastmoney.com/api/f10/ccmx?code=000001
```

### 方案 3: 使用开源库 (akshare) ✅

**状态**: 推荐作为临时方案

**安装**:
```bash
pnpm add axios
```

**参考 akshare 实现**:
```python
# akshare 基金持仓获取函数
def fund_holdings_em(symbol="000001", year="2023", quarter="4"):
    url = "http://fundf10.eastmoney.com/F10DataApi/F10DataApi.aspx"
    params = {
        "type": "ccmx",
        "code": symbol,
        "year": year,
        "quarter": quarter,
    }
    # ...
```

### 方案 4: 使用第三方数据服务 ✅ (备选)

**可选数据源**:
1. **Tushare** - 需要积分，数据质量高
2. **AKShare** - 免费，数据来自东方财富
3. **JoinQuant** - 付费，专业数据
4. **自建爬虫** - 使用 Puppeteer/Playwright 渲染页面

## 🎯 推荐实施方案

### 短期方案 (1-2 天)

**使用 akshare 数据格式，通过 axios 调用东方财富旧 API**

```typescript
// lib/valuation/holdings-fetcher.ts
import axios from 'axios';

export async function fetchFundHoldings(fundCode: string, year?: string, quarter?: string) {
  const url = 'http://fundf10.eastmoney.com/F10DataApi/F10DataApi.aspx';
  const params = {
    type: 'ccmx',
    code: fundCode,
    year: year || new Date().getFullYear().toString(),
    quarter: quarter || '4',
  };

  const response = await axios.get(url, { params });
  // 解析返回的数据...
}
```

### 中期方案 (3-5 天)

**研究 akshare 和其他开源项目，找到正确的 API 端点**

参考项目：
- https://github.com/akfamily/akshare
- https://github.com/LeekHub/leek-fund
- https://github.com/piginzoo/fund_analysis

### 长期方案 (1-2 周)

**建立多数据源容错系统**

1. 主数据源：东方财富 API
2. 备用数据源：腾讯财经 API
3. 本地缓存：SQLite/Redis
4. 数据更新：每日定时任务

## 📊 开源项目 API 研究结果

### LeekHub/leek-fund

**语言**: Python
**数据源**: 东方财富
**特点**:
- 使用 `requests` 直接请求 HTML
- 使用正则表达式解析数据
- 支持基金净值、持仓等信息

**相关代码**:
```python
# fund_ff.py
def get_fund_holdings(code):
    url = f"http://fundf10.eastmoney.com/ccmx_{code}.html"
    # 使用正则表达式解析
```

### piginzoo/fund_analysis

**语言**: Python
**数据源**: akshare
**特点**:
- 使用 akshare 获取数据
- 完整的基金分析框架
- 支持持仓分析、估值计算

### akshare

**基金持仓相关函数**:
```python
import akshare as ak

# 获取基金持仓
ak.fund_portfolio_hold_em(symbol="000001", year="2023", quarter="4")

# 获取基金净值
ak.fund_open_fund_info_em(symbol="000001", indicator="单位净值")
```

## 🚀 下一步行动

1. ✅ **已修复腾讯 API 解析问题** - 使用 `~` 分隔符
2. ⏳ **研究 akshare 源码** - 找到东方财富 API 的正确调用方式
3. ⏳ **实现持仓数据获取** - 基于研究的 API 格式
4. ⏳ **实现估值计算引擎** - 基于持仓和实时行情

## 🔗 参考链接

- [akshare GitHub](https://github.com/akfamily/akshare)
- [akshare 基金持仓文档](https://akshare.akfamily.xyz/data/fund/fund.html)
- [LeekHub/leek-fund](https://github.com/LeekHub/leek-fund)
- [piginzoo/fund_analysis](https://github.com/piginzoo/fund_analysis)

---

**更新时间**: 2026-02-05
**状态**: 研究中
**下一步**: 研究 akshare 源码，找到正确的 API 端点

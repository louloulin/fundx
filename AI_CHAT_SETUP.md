# AI Chat 功能配置指南

## 🚀 快速开始

### 问题：AI Chat 显示 401 错误

这是因为缺少 API 密钥配置。按照以下步骤配置即可启用 AI Chat 功能。

---

## 📋 配置步骤

### 方式 1: 使用 Zhipu AI (智谱AI) - **推荐** ⭐

**优势**：
- ✅ 成本仅为 OpenAI 的 5%
- ✅ GLM-4V-Flash 视觉模型完全免费
- ✅ 中文优化，更适合国内用户
- ✅ 国内服务器，低延迟

#### 步骤：

1. **注册账号**
   - 访问：https://open.bigmodel.cn/
   - 点击右上角"注册"或"登录"
   - 使用手机号或邮箱完成注册

2. **获取 API Key**
   - 登录后，点击右上角头像
   - 选择"API Keys"
   - 点击"创建新的 API Key"
   - 复制生成的 API Key（格式类似：`abcd1234.efg567hijk890lmn`）

3. **配置环境变量**

   编辑项目根目录的 `.env.local` 文件：

   ```bash
   # 将 your_zhipu_api_key_here 替换为你的实际 API Key
   ZHIPU_API_KEY=abcd1234.efg567hijk890lmn
   ```

4. **重启开发服务器**
   ```bash
   # 停止当前服务器 (Ctrl+C)
   # 重新启动
   npm run dev
   ```

5. **测试 AI Chat**
   - 访问 http://localhost:5600/
   - 点击右下角的蓝色聊天按钮
   - 输入问题测试

---

### 方式 2: 使用 OpenAI (备选)

如果已有 OpenAI API Key，可以直接使用。

#### 步骤：

1. **编辑 `.env.local` 文件**
   ```bash
   # 注释掉或删除 Zhipu 配置
   # ZHIPU_API_KEY=your_zhipu_api_key_here

   # 取消注释 OpenAI 配置
   OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

2. **重启服务器**
   ```bash
   npm run dev
   ```

---

## 🔍 验证配置

配置完成后，可以通过以下方式验证：

### 1. 检查服务器日志

启动服务器时，如果没有看到以下警告，说明配置成功：
```
No API key configured for Zhipu or OpenAI
```

### 2. 测试 API

访问以下 URL 测试 API 是否正常：
- http://localhost:5600/api/ai/chat
- http://localhost:5600/api/ai/agent-chat

### 3. 在浏览器中测试

1. 打开 http://localhost:5600/
2. 点击右下角的聊天按钮（💬）
3. 输入测试问题：
   - "你好"
   - "帮我推荐一些基金"

---

## 💰 成本说明

### Zhipu AI 定价（推荐）

| 模型 | 输入价格 | 输出价格 | 月估算（10万次调用）|
|-----|----------|----------|---------------------|
| GLM-4.5-Air | ¥0.8/百万 | ¥2/百万 | ¥2.8 (约 $0.40) |
| GLM-4-Plus | ¥5/百万 | ¥5/百万 | ¥10 (约 $1.40) |
| GLM-4V-Flash | **免费** | **免费** | **¥0** |

**实际使用场景成本**（每月 10 万次调用）：
- 基金搜索对话: ¥0.24
- 图片识别: ¥0 (免费)
- 智能推荐: ¥0.24
- 高级分析: ¥1
- **月总成本**: 约 ¥1.5 (约 $0.21)

### OpenAI 定价（对比）

| 模型 | 输入价格 | 输出价格 | 月估算（10万次调用）|
|-----|----------|----------|---------------------|
| GPT-4o | $5/百万 | $15/百万 | $20 (约 ¥145) |

**使用 Zhipu AI 可节省约 95% 的成本！**

---

## ❓ 常见问题

### Q1: 配置后仍然显示 401 错误？

**解决方法**：
1. 确认 API Key 格式正确（Zhipu Key 包含点号）
2. 确认没有多余的空格或引号
3. 重启开发服务器（`npm run dev`）
4. 清除浏览器缓存

### Q2: API Key 在哪里安全存储？

- ✅ `.env.local` 文件不会被提交到 Git（已在 .gitignore 中）
- ✅ 只在本地开发环境使用
- ⚠️ 生产环境需要在部署平台配置环境变量

### Q3: 免费额度是多少？

**Zhipu AI 新用户福利**：
- 注册即送免费 Tokens
- GLM-4V-Flash 视觉模型完全免费
- 足够测试和小规模使用

### Q4: 如何查看 API 使用量？

登录 Zhipu AI 控制台查看：
- https://open.bigmodel.cn/usercenter/apikeys
- 可以查看调用量和费用明细

---

## 📚 相关资源

- [Zhipu AI 开放平台](https://open.bigmodel.cn/)
- [Zhipu AI 文档](https://open.bigmodel.cn/dev/api)
- [定价说明](https://open.bigmodel.cn/pricing)
- [plan1.1.md - 完整实施计划](./plan1.1.md)

---

## 🎉 下一步

配置完成后，你可以：

1. ✅ 使用 AI Chat 进行基金咨询
2. ✅ 使用图片识别添加基金（完全免费）
3. ✅ 获取智能推荐
4. ✅ 分析持仓风险

---

**需要帮助？**
- 检查 [plan1.1.md](./plan1.1.md) 了解更多功能
- 查看 [TESTING.md](./TESTING.md) 了解测试方法
- 访问项目 Issues 报告问题

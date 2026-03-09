# 内卷地狱 (Involution Hell) - Vercel 降本与 Java 后端迁移方案

基于当前的 Vercel 用量数据，项目面临严重的免费额度超限问题，主要集中在以下几个指标：

- **ISR Reads/Writes (219K / 50K)**: 静态增量生成的读写频次极高。
- **Function Invocations (147K)** & **Edge Requests (124K)**: 无服务函数调用量巨大。
- **Fluid Active CPU (5h 14m)**: 流式处理（如 AI 对话生成）占用了大量计算时间。

为了降低 Vercel 上的消耗，提升系统的响应能力和工程可维护性，建议将**高频次请求**和**长耗时（流式计算）**的后端 API 迁移至独立部署的 Java 服务（如基于 Spring Boot），而让 Next.js 专注于前端 UI 渲染、文档展示与静态文件服务。

---

## 1. 迁移对象分析

通过分析项目结构（`app/api/`），以下模块是消耗 Vercel 计算资源的重灾区，建议优先迁移：

### 🎯 优先级一：AI 引擎层 (高 CPU 消耗、长连接)
- **`/api/chat`**: 涉及大模型调用、流式（Stream）响应和数据库读写（持久化对话历史）。由于流式响应耗时通常较长，直接导致 Vercel 的 Active CPU 时长激增。
- **`/api/suggestions`**: 同样依赖外部模型调用，虽然是短文本生成，但调用频次随用户交互增加而增加。

### 🎯 优先级二：高频数据写入层 (高 Function Invocations)
- **`/api/analytics`**: 埋点/统计功能。这种纯写入的轻量级操作如果留在 Next.js，会在高并发时迅速耗尽 Serverless 的调用额度。

### 🎯 优先级三：重计算或外部依赖层 (视未来扩展而定)
- **`/api/upload`**: R2 预签名 URL 的生成逻辑，目前耗时较短，但如果未来加入图片压缩/鉴黄等处理，也应剥离。

> **提示：** 用户认证（Auth.js `/api/auth`）因与 Next.js 前端结合紧密且存在会话机制，短期内建议保留在 Next.js 端。

---

## 2. 架构对比流程图

### 📉 迁移前：全栈在 Vercel (当前架构)

```mermaid
graph TD
    Client[浏览器/用户] -->|页面访问/ISR| NextJS_UI[Next.js App Router UI]
    Client -->|AI 对话/建议| API_Chat[/api/chat, /api/suggestions]
    Client -->|用户打点| API_Analytics[/api/analytics]
    Client -->|文件上传| API_Upload[/api/upload]

    subgraph Vercel Serverless 环境
        NextJS_UI
        API_Chat
        API_Analytics
        API_Upload
    end

    API_Chat -->|调用| LLM[大语言模型 API]
    API_Chat -->|读写| DB[(PostgreSQL / Prisma)]
    API_Analytics -->|写入| DB
    API_Upload -->|请求| R2[Cloudflare R2]
    NextJS_UI -->|读取缓存/生成| DB
```

### 📈 迁移后：BFF + 独立 Java 后端架构

```mermaid
graph TD
    Client[浏览器/用户] -->|页面访问/ISR| NextJS_UI[Next.js App Router UI]

    %% 重定向请求到独立后端
    Client -->|AI 对话/建议| Java_Backend[独立 Java 服务 - Spring Boot]
    Client -->|用户打点| Java_Backend
    Client -->|业务 API| Java_Backend

    subgraph Vercel (纯展示与 BFF)
        NextJS_UI
        API_Auth[/api/auth - NextAuth]
    end

    subgraph 独立服务器 (如 阿里云/腾讯云 ECS)
        Java_Backend
    end

    %% Java 后端的外部依赖
    Java_Backend -->|调用| LLM[大语言模型 API]
    Java_Backend -->|读写| DB[(PostgreSQL)]

    %% Auth 和文档仍需少量 DB 交互
    API_Auth -->|读写| DB
    NextJS_UI -.->|必要时读取| DB
```

---

## 3. 迁移执行计划 (分阶段渐进式)

### 第一阶段：基础设施建设与高频写操作剥离
**目标**：搭建 Java 后端框架，缓解 `Function Invocations` 压力。
1. **搭建 Spring Boot 项目**：引入 WebFlux (支持响应式与流处理)、Spring Data JPA (或 MyBatis Plus) 等基础依赖。
2. **连接现有数据库**：配置数据源，确保 Java 能正确访问当前的 PostgreSQL 实例。
3. **迁移 `/api/analytics`**：
   - 在 Java 中实现 Analytics Controller。
   - 可引入消息队列（如 Redis 队列、RabbitMQ）或本地 Buffer，实现打点事件的**异步批量入库**，极大提高性能。
   - 修改前端请求，将 `fetch('/api/analytics')` 指向新后端的域名。

### 第二阶段：AI 与流式处理核心剥离 (降本关键)
**目标**：大幅降低 Vercel 的 `Fluid Active CPU` 消耗。
1. **迁移 AI 大模型调用**：
   - 使用 Spring AI 或 Java 原生 HTTP Client 实现对接不同 Provider (InternLM, OpenAI, GLM 等)。
2. **实现 Server-Sent Events (SSE) / 流式响应**：
   - 将原 Next.js AI SDK 的逻辑（`streamText`）用 Java WebFlux/SseEmitter 重写。
3. **迁移上下文提取与聊天记录保存**：
   - 前端不再传递全部 MDX 上下文，而是通过 API 将 `slug` 发给 Java。Java 端通过网络请求读取前端静态页面的文本，或共享存储。
   - 对话结束后，在 Java 层执行异步数据库保存逻辑。

### 第三阶段：全量测试与灰度发布
1. **CORS 配置**：确保 Java 服务允许来自 `involutionhell.com` 域名的跨域请求。
2. **鉴权透传**：如果 Java 后端的接口需要登录权限，Next.js 需将用户的 Session Token / JWT 通过请求头传递给 Java 后端进行校验。
3. **监控与告警**：在 Java 服务上部署简易监控，观察数据库连接池与内存消耗，确保服务稳定。

## 4. 预期收益
- **成本断崖式下降**：Vercel 账单预计回归到免费层额度内，因为计算密集型和高频次的 API 全部移出。
- **数据库连接更稳定**：Vercel Serverless 函数会频繁创建/销毁数据库连接（即使有连接池缓存），而 Java 常驻进程拥有成熟的连接池管理（如 HikariCP），能有效保护数据库。
- **系统弹性更好**：未来若遇到突发流量，可以独立扩容 Java 服务，而前端文档始终享受 Vercel 的全球边缘缓存优势。

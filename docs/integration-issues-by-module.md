# 前端联调问题归档

本文档整理本项目在接入 `Agno OS + CopilotKit + AG-UI + adapter + sqlite-runner` 过程中遇到的问题、判断路径、解决思路和最终方案。  
目标不是记录零散报错，而是沉淀模块边界，避免后续继续在错误抽象上打补丁。

---

## 1. 总体架构结论

当前可维护的边界是：

- `Agno OS` 是核心执行后端
- 前端通过 `CopilotKit runtime v2` 与本地 `adapter` 交互
- `adapter` 再把请求转发到 Agno 的 `/{agents|teams}/{id}/agui`
- `sqlite-runner` 负责 thread 历史事件流持久化与 `connect()` 回放
- `session sidebar` 不能再由前端本地伪造，必须与 `sqlite` 同源

当前统一后的职责分工：

- `CopilotKit`：聊天 UI、消息流消费、运行时路由
- `adapter`：runtime 路由层、agent 选路、session 元数据管理
- `sqlite-runner`：历史消息事件流持久化
- `session_meta`：用户侧 session 列表元数据

---

## 2. Runtime / Adapter 模块

### 2.1 Single-endpoint 与 Multi-route 认知冲突

**问题现象**

- 一度出现：
  - `POST /agui -> 404`
  - `/agui/info`
  - `/agui/agent/:id/run`
  - `/agui/threads`
- 前端和 adapter 请求形态不一致

**原因**

- `CopilotKit` 当前运行时有两套路径模型：
  - `single-endpoint /agui`
  - `multi-route runtime`
- 当前项目实际接入的是 `runtime v2`，adapter 侧使用了 `createCopilotExpressHandler`
- 因此前端若强制 `useSingleEndpoint=true`，会与 adapter 当前实现不匹配

**解决思路**

- 明确前端与 adapter 必须使用同一套 contract
- 不再把 `Agno 原生 /agui` 和 `CopilotKit runtime v2` 视为同一协议面

**最终方案**

- 采用 `CopilotKit runtime v2 multi-route`
- 前端使用：
  - `/agui/info`
  - `/agui/agent/:agentId/run`
  - `/agui/agent/:agentId/connect`
- adapter 内部再转发到 Agno 原生 `/{agents|teams}/{id}/agui`

**当前状态**

- 已落地

---

### 2.2 Agent 选路来源不一致

**问题现象**

- body 中传了 `forwardedProps.agent_id`
- 但 adapter 实际仍可能命中默认 agent

**原因**

- 早期 adapter 只依赖 `x-agent-id / x-agent-kind`
- 前端业务语义和 transport header 出现双真相源

**解决思路**

- 选路必须只有一个主来源
- 业务层语义应优先于兼容 header

**最终方案**

- `adapter` 优先读取 `forwardedProps.agent_id / agent_kind`
- `x-agent-id / x-agent-kind` 仅作为兼容兜底
- 若 header 与 payload 冲突，adapter 输出 warning

**当前状态**

- 已落地

---

### 2.3 `/api/config` 500

**问题现象**

- 浏览器请求 `http://localhost:5173/api/config`
- 返回 `500`

**原因**

- 路由本身没错
- `vite` 只是把 `/api` 代理到 adapter
- 真正问题通常是：
  - adapter 未启动
  - `4000` 上不是当前正确实例

**解决思路**

- 优先检查 `http://localhost:4000/health`
- 再检查 `http://localhost:4000/api/config`
- 区分“路由定义错误”和“代理上游失败”

**最终方案**

- 保留 `/api/config`
- 明确依赖 adapter 存活

**当前状态**

- 设计正确
- 若再次 500，应先查 adapter 进程而不是前端路由

---

## 3. 认证 / Token 模块

### 3.1 Secret key 误填前端环境变量

**问题现象**

- 浏览器报：
  - `Forbidden use of secret API key in browser`

**原因**

- 把 `sb_secret_*` 填进了 `VITE_SUPABASE_ANON_KEY`
- 前端 `VITE_*` 环境变量会暴露到浏览器

**解决思路**

- 前端只能使用 `anon/publishable key`
- 服务端密钥必须留在后端

**最终方案**

- 前端使用 `VITE_SUPABASE_ANON_KEY=publishable/anon key`
- 后端保留 `SUPABASE_JWT_SECRET`

**当前状态**

- 已明确

---

### 3.2 `Token 格式不正确`

**问题现象**

- adapter 日志显示 auth 已透传
- 后端返回：
  - `401 {"detail":"Token 格式不正确"}`

**原因**

- 应用层 auth 代码要求收到的是三段式 JWT
- 早期前端存在 header 组装不统一风险

**解决思路**

- 统一所有出站认证头逻辑
- 避免：
  - `Bearer Bearer xxx`
  - 空格污染
  - 混用原始 token 与 header 字符串

**最终方案**

- 新增统一 header 规范化函数
- 所有请求统一走：
  - 空值不发
  - 裸 token 自动补 `Bearer `
  - 已带 `Bearer ` 保持原样

**当前状态**

- 已落地

---

### 3.3 登录态维持机制

**问题现象**

- 需要确认登录态是否写 cookie
- 需要确认 JWT 如何维持

**原因**

- 当前是标准 SPA + Supabase session 模式
- 不是自定义 cookie auth

**解决思路**

- 前端不自己实现 cookie auth
- 由 `supabase-js` 负责 session 恢复与 token 刷新

**最终方案**

- `persistSession: true`
- `autoRefreshToken: true`
- 请求时从 session 取 `access_token`
- 通过 `Authorization: Bearer ...` 发给后端

**当前状态**

- 已采用

---

### 3.4 登录回调后 URL 暴露 token

**问题现象**

- 登录后地址栏携带 auth 参数或 token 痕迹

**原因**

- `supabase-js` 会从 URL 中恢复 session
- 若不主动清理，认证参数会留在地址栏

**解决思路**

- session 恢复完成后立即清理 URL

**最终方案**

- 新增 URL 清理逻辑
- 使用 `history.replaceState` 去掉认证参数

**当前状态**

- 已落地

---

## 4. Session / Sidebar 模块

### 4.1 旧方案：session 列表不来自 sqlite

**问题现象**

- 历史消息由 `sqlite-runner` 回放
- 但左侧 session 列表来自前端自己的本地状态

**原因**

- 早期实现中：
  - `sessionsAtom` 使用 `atomWithStorage`
  - sidebar 直接渲染本地存储
- 导致双真相源：
  - sqlite 管消息历史
  - localStorage 管 session 元数据

**解决思路**

- session 列表必须和 sqlite 同源
- 不能继续由前端自己“编造” sidebar

**最终方案**

- adapter 新增 `session_meta` 表
- 前端 sidebar 改为读取 adapter API

**当前状态**

- 已开始切换到 sqlite 同源

---

### 4.2 session 与 agent 脱节

**问题现象**

- 历史 session 属于 agent C
- 但发送消息时可能仍走 agent A

**原因**

- 当前 agent 早期主要由 `selectedAgentIdAtom` 决定
- 而不是由当前 session 绑定的 `agentId / agentKind` 决定

**解决思路**

- 当前 session 必须成为 thread 与 agent 的绑定中心
- 当前 agent 应优先从当前 session 推导

**最终方案**

- `currentAgentAtom` 优先读取当前 session 的 `agentId / agentKind`
- session 切换时同步更新当前 agent

**当前状态**

- 已落地

---

### 4.3 切 agent 自动建 session

**问题现象**

- 切到新 agent 时，尚未发送消息就创建了 session

**原因**

- 早期把“切 agent”和“显式新会话”混成了同一条创建链路

**解决思路**

- 区分两种语义：
  - 切 agent：不立即建 session
  - 点新会话：立即建 session

**最终方案**

- 切 agent 仅切当前目标 agent，清空当前 thread 选择
- 首次发送前由 `prepareSessionForSend()` 显式创建 session
- “新会话”按钮仍然立即创建 session

**当前状态**

- 已落地

---

### 4.4 切 session 后标题串改

**问题现象**

- 从 A session 切到 B session
- B 的标题被 A 的内容覆盖

**原因**

- 切换期间内存中仍残留 A 的消息
- 标题同步逻辑把旧消息写到了新 session

**解决思路**

- 切换 session 时先清空当前内存消息
- 同时禁止“切换中的临时状态”触发标题回写

**最终方案**

- session 切换时清空内存消息
- 增加切换保护，避免旧消息污染新 session 标题
- 后续进一步统一为 adapter/sqlite 侧的 `session_meta.title`

**当前状态**

- 已部分解决
- 最终应以 adapter `session_meta` 为准，不再由前端根据消息本地回写标题

---

### 4.5 新会话按钮沿用旧 session

**问题现象**

- 点击“新会话”后没有真正生成新 session
- 后续消息仍沿用旧 thread

**原因**

- 之前把“新会话”也改成了延迟创建

**解决思路**

- 恢复“新会话”的显式创建语义

**最终方案**

- “新会话”按钮调用 `prepareSession` 立即写入 adapter/sqlite
- 然后切到新的 `threadId`

**当前状态**

- 已修正

---

## 5. sqlite-runner / Session 元数据模块

### 5.1 仅有 runner 不足以支撑 sidebar

**问题现象**

- `sqlite-runner` 能回放历史
- 但 sidebar 需要：
  - title
  - agent 归属
  - 排序时间
  - 重命名
  - 删除

**原因**

- `sqlite-runner` 原始表只有：
  - `agent_runs`
  - `run_state`
- 没有面向用户的 session 元数据表

**解决思路**

- 不要强行从 `agent_runs.events` 现场拼完整 session 列表
- 单独补一层受控元数据表

**最终方案**

- adapter 新增 `session_meta`
  - `thread_id`
  - `title`
  - `title_source`
  - `agent_id`
  - `agent_kind`
  - `created_at`
  - `updated_at`

**当前状态**

- 已落地

---

### 5.2 sidebar 从 sqlite 读取

**问题现象**

- 需要让 sidebar 真正基于 sqlite

**解决思路**

- adapter 提供会话元数据 API
- 前端改为读取 adapter，而不是本地 localStorage

**最终方案**

- adapter 新增：
  - `GET /api/sessions`
  - `POST /api/sessions/prepare`
  - `PATCH /api/sessions/:threadId`
  - `DELETE /api/sessions/:threadId`
- 前端 `sessionsAtom` 改成普通内存 atom
- sidebar 初始数据从 adapter 获取

**当前状态**

- 已落地基础结构

---

### 5.3 删除 session 是否联动删除 sqlite 数据

**问题现象**

- 需要确认删除是否真正删干净

**解决思路**

- 删除必须同时删除：
  - `session_meta`
  - `run_state`
  - `agent_runs`

**最终方案**

- `DELETE /api/sessions/:threadId` 中联动删除三张表的数据

**当前状态**

- 已按代码实现
- 建议后续做一次实际回归验证，确认删除后不会被 bootstrap 重新扫回

---

## 6. 消息恢复 / 历史回放模块

### 6.1 历史消息恢复“不生效”

**问题现象**

- session 切换后历史消息未恢复，或恢复不稳定

**原因**

- 不是 `sqlite-runner` 没接
- 而是前端 thread/session/agent 绑定早期不稳定
- 再加上 session 列表曾经不与 sqlite 同源

**解决思路**

- 统一 thread/session/agent 三者绑定
- sidebar 与 sqlite 同源
- 切 session 时清空旧内存消息，再让 `connect()` 回放

**最终方案**

- 当前方向已经切到：
  - `currentSessionId -> threadId`
  - session 列表走 adapter/sqlite
  - 切 session 时清理旧消息

**当前状态**

- 仍需联调验证
- 这是当前最关键的回归风险点之一

---

## 7. 消息渲染 / 工具调用 / 时间线模块

### 7.1 助手消息未完全流式渲染

**问题现象**

- 工具调用没有实时显示
- 聊天气泡只出现一个小黑点

**原因**

- 早期自定义 `AssistantBubble` 裁掉了 `CopilotKit` 的部分默认能力
- 又没有补自己的工具状态渲染

**解决思路**

- 不再依赖默认黑点 UI
- 自己显式渲染工具状态卡片

**最终方案**

- `AssistantBubble` 中对 `message.toolCalls` 进行显式渲染
- 显示：
  - 工具名
  - `calling...`
  - `completed`

**当前状态**

- 已落地基础版
- 后续可继续补工具结果摘要

---

### 7.2 时间线缺少具体文本内容

**问题现象**

- 时间线只显示开始/结束，不显示实际增量文本

**原因**

- 早期事件摘要器只处理阶段事件
- 没处理：
  - `TEXT_MESSAGE_CONTENT`
  - `REASONING_MESSAGE_CONTENT`

**解决思路**

- 直接把内容型事件纳入 timeline 摘要

**最终方案**

- `aguiEvent.ts` 补充上述两类事件摘要

**当前状态**

- 已落地

---

### 7.3 时间线暴露内部 ID

**问题现象**

- 时间线展示 `runId / messageId / threadId / toolCallId` 一类 UUID

**原因**

- 早期把内部协议字段直接塞进了用户 UI

**解决思路**

- 用户只应看到业务语义，不应看到内部运行标识

**最终方案**

- 去掉时间线中的：
  - `runId`
  - `threadId`
  - `messageId`
  - `toolCallId`
- 保留可理解文本：
  - “运行开始”
  - “工具调用: xxx”
  - “回复内容”
  - “推理内容”

**当前状态**

- 已落地

---

### 7.4 文件上传能力

**问题现象**

- 聊天输入区原本没有有效文件上传

**原因**

- 早期只接了知识库上传
- 聊天输入区未使用 `CopilotKit` 附件能力

**解决思路**

- 优先复用 `CopilotKit` 附件机制，而不是继续走参考项目的 JSON hack

**最终方案**

- 输入区接入 `attachments`
- 用户消息支持附件展示

**当前状态**

- 前端已接入
- 但 Agno 后端当前默认只消费文本 part，附件后端消费仍待完善

---

## 8. 布局 / UX 模块

### 8.1 左侧栏被挡住，内部不可滚动

**问题现象**

- session 列表被 agent 卡片区挤出视图

**原因**

- 早期只有最底部 sessions 区自身可滚
- 整个中段不是统一滚动容器

**解决思路**

- 左栏中段整体滚动，顶部账户区固定

**最终方案**

- “对话/知识库 + agent + sessions” 共用一个滚动容器

**当前状态**

- 已落地

---

### 8.2 默认打开工作台而不是登录页

**问题现象**

- 未登录访问根路由仍进入工作台

**解决思路**

- 根路由按登录态重定向

**最终方案**

- 新增首页跳转页与受保护布局
- 未登录时优先到 `/login`

**当前状态**

- 已落地

---

### 8.3 知识库不应占据聊天页右侧

**问题现象**

- 聊天主区被左右两栏挤压

**解决思路**

- 知识库应拆到单独子路由

**最终方案**

- 新增 `/knowledge`
- 聊天页只保留 sidebar + 主内容

**当前状态**

- 已落地

---

## 9. 后端对齐 / Agno 兼容模块

### 9.1 Agno 原生接口与 CopilotKit runtime 并不等价

**问题现象**

- 一度错误地认为 `CopilotKit 最新 runtime contract` 可以直接等同于 `Agno 原生 AGUI`

**原因**

- Agno 原生对外接口是其自身 AGUI 面
- CopilotKit runtime v2 还有自己的 `/info /run /connect /threads` 路由层

**解决思路**

- adapter 必须承担 runtime 路由层职责
- 不能把两者混成一个接口面

**最终方案**

- adapter 作为中间层
- Agno 只做最终执行后端

**当前状态**

- 已确认

---

## 10. 当前仍需重点关注的风险

### 10.1 Session 列表与历史回放的一致性

当前虽然已经把 sidebar 列表开始切到 adapter/sqlite，但以下行为仍需要联调确认：

- 首次发送时，`prepareSession -> run` 的先后是否稳定
- 切 session 后，`connect()` 是否总能正确回放
- 删除 session 后，是否还能被历史 run bootstrap 回来

### 10.2 标题更新策略

当前标题来源已经开始转向 `session_meta`，但仍需确认：

- 自动标题是否只在首次有效用户消息后更新
- 手动重命名后是否不会被自动标题覆盖

### 10.3 附件后端消费

当前聊天前端已支持附件输入和渲染，但 Agno 后端默认只提取文本 part。  
如果要真正让 agent 处理文件，需要后端把 AG-UI 附件 part 映射到执行输入。

---

## 11. 推荐的后续工作顺序

1. 先验证 adapter `/api/sessions` 与 sqlite 数据一致性
2. 验证首次发送、切 session、删除 session 三条核心链路
3. 收掉标题更新的边界条件
4. 再继续做附件后端消费与更细的工具调用 UI

---

## 12. 本次重构的核心教训

### 不要再把 session 列表和消息历史拆成两套真相源

之前最大的问题不是某一条报错，而是：

- 消息历史在 sqlite
- session 列表在前端 localStorage

这会导致：

- 切换逻辑复杂
- 标题串改
- agent 归属错乱
- 历史恢复时序问题放大

后续应坚持：

- `thread/session/agent` 的核心归属由 adapter/sqlite 决定
- 前端只做当前激活态和 UI 消费层


# PRD: Visual Call Flow Designer

## Problem Statement

运营人员无法自主配置呼入/呼出的通话流程。每次需要新的 IVR 菜单、条件路由、或座席分配逻辑，都要开发人员修改 Java 代码、重新部署。这导致：(1) 业务响应慢，改一个 IVR 提示音要排期；(2) 代码里堆积大量相似但略有不同的 call handler，难以维护；(3) 非技术人员无法参与流程设计。

## Solution

提供一个可视化拖拽画布（Vue Flow），运营人员可以在浏览器里拖拽节点、连线、配置参数，构建呼叫流程图（Flow）。每个 Flow 绑定一个被叫号码（DID）。FreeSWITCH 呼入时，Java 后端通过 ESL 实时执行该 Flow：逐节点发命令（播放语音、收按键、转座席、调 API 等），根据条件分支走不同路径。

## User Stories

### Flow 管理

1. As an 运营管理员, I want to 创建一个新的 Flow 并绑定到一个 DID 号码, so that 呼入该号码的电话走我配置的流程
2. As an 运营管理员, I want to 在画布上拖拽节点并用连线连接它们, so that 我可以可视化地定义通话流程
3. As an 运营管理员, I want to 保存 Flow 为草稿, so that 我可以随时继续编辑而不会影响线上
4. As an 运营管理员, I want to 发布 Flow 使其生效, so that 新的呼入电话会走这个版本
5. As an 运营管理员, I want to 查看 Flow 的版本历史, so that 我可以追溯每次修改
6. As an 运营管理员, I want to 回滚到某个历史版本, so that 出问题时可以快速恢复
7. As an 运营管理员, I want to 复制一个已有 Flow 作为新 Flow 的起点, so that 相似流程不用从零开始
8. As an 运营管理员, I want to 删除一个未绑定的 Flow, so that 可以清理废弃的流程配置
9. As an 运营管理员, I want to 在 DID 管理页面看到每个号码绑定的 Flow 名称和版本, so that 一目了然哪些号码在跑什么流程

### Start / End 节点

10. As an 运营管理员, I want to 每个 Flow 自动有一个 Start 节点作为入口, so that 我不需要手动创建入口
11. As an 运营管理员, I want to 拖入 End 节点表示流程正常结束, so that 通话在指定步骤后挂断

### Playback 节点

12. As an 运营管理员, I want to 配置 Playback 节点播放一个上传的音频文件, so that 呼入者听到固定录音
13. As an 运营管理员, I want to 配置 Playback 节点播放 TTS 文字转语音, so that 不用录音就能生成语音提示
14. As an 运营管理员, I want to 在 Playback 节点中混合使用音频文件和 TTS, so that 固定部分用录音、动态部分用 TTS

### CollectDTMF 节点

15. As an 运营管理员, I want to 配置 CollectDTMF 节点播放提示音并等待用户按键, so that 构建 IVR 菜单
16. As an 运营管理员, I want to 设置 CollectDTMF 的最大按键数和超时时间, so that 控制用户输入行为
17. As an 运营管理员, I want to 配置超时后的重试次数和重试提示音, so that 用户没按键时给多次机会
18. As an 运营管理员, I want to 配置按键错误（无效输入）的提示音和重试, so that 用户按错时有引导

### Condition 节点

19. As an 运营管理员, I want to 配置 Condition 节点基于 DTMF 按键值走不同分支, so that IVR 菜单"按1转人工，按2查余额"能生效
20. As an 运营管理员, I want to 配置 Condition 节点基于时间条件（工作/非工作时间）走不同分支, so that 下班后走语音信箱
21. As an 运营管理员, I want to 配置 Condition 节点基于通道变量（caller_id 等）走不同分支, so that 根据来电号码做区分
22. As an 运营管理员, I want to 配置 Condition 节点基于 Flow 变量走不同分支, so that HTTP API 返回的结果能影响路由
23. As an 运营管理员, I want to 在 Condition 节点上配置多条出边，每条带一个条件表达式, so that 复杂的分流逻辑能可视化表达
24. As an 运营管理员, I want to 为 Condition 节点设置一条默认分支（else）, so that 所有条件都不匹配时有兜底路径

### Bridge 节点

25. As an 运营管理员, I want to 配置 Bridge 节点指定一个座席组, so that 通话转接到该组的空闲座席
26. As an 运营管理员, I want to 配置 Bridge 节点的优先级字段, so that VIP 客户可以走优先队列
27. As an 运营管理员, I want to 配置 Bridge 超时（无空闲座席时的行为）, so that 久等后有备选处理（转语音信箱或挂机）
28. As an 运营管理员, I want to 配置 Bridge 失败后的后续节点, so that 转接失败时有降级方案

### SetVariable 节点

29. As an 运营管理员, I want to 配置 SetVariable 节点设置一个 Flow 变量名和值, so that 后续 Condition 可以基于此变量做判断
30. As an 运营管理员, I want to 在 SetVariable 中引用通道变量作为值来源, so that 可以把来电号码存成 Flow 变量

### HTTPRequest 节点

31. As an 运营管理员, I want to 配置 HTTPRequest 节点调用一个外部 HTTP API, so that 流程中可以查询外部系统
32. As an 运营管理员, I want to 在 HTTPRequest 节点中配置 URL、method、headers、body, so that 灵活对接各种 API
33. As an 运营管理员, I want to 在 HTTPRequest 节点中用 Flow 变量作为请求参数（如把来电号码传给 API）, so that 请求内容是动态的
34. As an 运营管理员, I want to 在 HTTPRequest 节点中配置响应字段映射（如 `data.isVip → is_vip`）, so that API 返回的数据能存成 Flow 变量
35. As an 运营管理员, I want to 配置 HTTPRequest 超时时间和失败后的处理（走指定节点或挂机）, so that API 不可用时通话不会卡住

### Record 节点

36. As an 运营管理员, I want to 配置 Record 节点开始录音, so that 通话过程被记录下来用于质检

### Hangup 节点

37. As an 运营管理员, I want to 配置 Hangup 节点在流程中途挂机, so that 无效来电或异常情况可以主动终止

### Transfer 节点

38. As an 运营管理员, I want to 配置 Transfer 节点将通话转到另一个 Flow, so that 公共子流程（如身份验证）可以复用

### 运行时与监控

39. As an 运营管理员, I want to 在 Flow 详情页看到当前有多少通电话正在执行该 Flow, so that 了解负载情况
40. As an 运营管理员, I want to 查看某个通话走过的节点路径日志, so that 排查问题时知道电话走了哪条分支
41. As an 运营管理员, I want to 在画布上看到每个节点的执行统计（经过次数、成功率）, so that 优化流程设计
42. As an 运营管理员, I want to 在编辑画布时校验 Flow 完整性（所有节点可达、无悬空连线、必填字段齐全）, so that 发布前发现配置错误

### 权限

43. As an 系统管理员, I want to 通过现有权限体系控制 Flow 管理的页面和按钮权限, so that 只有授权人员能修改生产流程

## Implementation Decisions

### Modules to Build

**FlowEngine** (deep module) — 核心。接口：`execute(callUUID, flowVersionId)` 和 `cancel(callUUID)`。内部负责：加载 JSON graph、从 Start 节点开始、按 FlowEdge 调度到下一节点、每个节点委托给对应 NodeExecutor、维护 FlowSession 状态、处理异常和超时。每个呼入电话在一个独立线程中运行。

**NodeExecutor** (per type, 11 个) — 统一接口：`execute(session, nodeConfig) → String nextNodeId`。每种节点类型一个实现：PlaybackExecutor、CollectDTMFExecutor、BridgeExecutor、ConditionExecutor、SetVariableExecutor、RecordExecutor、HangupExecutor、TransferExecutor、HTTPRequestExecutor。Start/End 节点逻辑简单，由 FlowEngine 内联处理。新增节点类型只需实现此接口，不改 Engine。

**FlowRepository** (deep module) — Flow + FlowVersion 的 CRUD。接口：`getActiveByDID(didNumber)`, `createFlow(name, did)`, `saveDraft(flowId, jsonDefinition)`, `publish(flowId, draftVersionId)`, `rollback(flowId, targetVersionId)`, `listVersions(flowId)`。内部处理版本号自增、活跃版本切换、JSON 校验。

**FlowSession** (数据对象) — 运行时状态：当前 nodeId、Map<String, Object> variables、callUUID、执行历史。可序列化为 JSON 用于调试日志。

**FlowEditor** (前端模块) — Vue Flow 画布 + 11 种自定义 Vue 组件节点。封装：拖拽交互、连线校验、节点配置表单、序列化/反序列化为后端 JSON schema、保存/发布/回滚操作。

### Modules to Modify

**gt-call (FreeSWITCH ESL 集成)** — 修改呼入事件处理逻辑：收到 `CHANNEL_PARK` 事件时，从通道变量取 dest_number，查 FlowRepository.getActiveByDID()，如果找到 Flow 则启动 FlowEngine.execute()。如果没找到，走现有默认处理逻辑。

**gt-system** — 新增 DID 号码管理 API（或复用现有线路管理），增加 DID → Flow 绑定字段。新增座席组查询 API（供 Bridge 节点配置时选择）。

**gt-common** — 可能需要增加 Flow 相关的 Result 类型、异常定义。

### Schema Changes

**flow 表** — id, flow_name, did_number (unique), active_version_id (FK), status (draft/published/archived), created_at, updated_at

**flow_version 表** — id, flow_id (FK), version_number, definition (JSON: nodes + edges), published_at, published_by, status (draft/published)

JSON definition 结构：

```
{
  nodes: [
    { id, type, position: {x, y}, config: { ... per-type config ... } }
  ],
  edges: [
    { id, sourceNodeId, targetNodeId, condition: { field, operator, value } }
  ]
}
```

### API Contracts

- `POST /flow` — 创建 Flow
- `PUT /flow/{id}/draft` — 保存草稿 JSON
- `POST /flow/{id}/publish` — 发布当前草稿
- `POST /flow/{id}/rollback` — 回滚到指定版本
- `GET /flow/list` — Flow 列表（分页）
- `GET /flow/{id}/versions` — 版本历史
- `GET /flow/{id}/stats` — 执行统计
- `GET /flow/active-by-did/{didNumber}` — 内部 API，供 gt-call 查询
- `POST /flow/{id}/simulate` — 模拟执行（传入变量，返回路径预览）

### Architectural Decisions

- **执行模型**：ESL 实时控制。每通电话一个线程，同步发命令等回调。
- **存储**：JSON definition 存 flow_version 表，版本化管理。运行时一次 IO 加载整个 graph。
- **触发**：按 DID 绑定。呼入时 CHANNEL_PARK 事件 → 查 DID → 找 Flow → 执行。
- **前端画布**：Vue Flow 库，自定义节点渲染用 Vue 组件。
- **节点扩展**：新增节点类型 = 实现 NodeExecutor 接口 + 前端注册一个 Vue 组件。零改动 FlowEngine。

## Testing Decisions

### 什么是好测试

测试 external behavior（给定配置和输入，FlowEngine 产生正确的 ESL 命令序列），不测 implementation details（不测内部状态机转换、不测线程调度）。

### 要测的 Modules

**FlowEngine** — 用 mock EslClient 测试：
- 线性流程：Start → Playback → End，验证发出正确的 playback 命令后正常结束
- 条件分支：Start → CollectDTMF → Condition(按1/按2) → 不同 Playback → End，验证 DTMF="1" 和 "2" 走不同路径
- HTTPRequest + Condition：验证 API 调用后变量设置正确，Condition 基于变量走正确分支
- Bridge 超时：验证无座席时走到超时分支
- 异常处理：HTTPRequest 超时、节点配置缺失，验证走到错误处理分支而非崩溃

**NodeExecutor (per type)** — 单元测试，验证：
- PlaybackExecutor：音频文件模式生成正确 playback 命令，TTS 模式调用 TTS 服务
- CollectDTMFExecutor：配置了 maxDigits=1, timeout=5s 时发出正确的 play_and_get_digits 命令
- ConditionExecutor：各种条件组合（DTMF = "1"、时间在工作时间内、变量 isVip = true）
- HTTPRequestExecutor：配置了 URL + field mappings，mock HTTP 响应后变量表正确更新
- BridgeExecutor：指定座席组 + 优先级时生成正确的 callcenter bridge 命令

**FlowRepository** — 集成测试（StarRocks），验证：
- 创建 Flow → 保存草稿 → 发布 → DID 查询返回正确版本
- 多版本：发布 v1 → 修改保存 v2 → 回滚到 v1 → 查询返回 v1
- 并发发布冲突处理

### Prior Art

项目中已有的集成测试模式：`gt-analyse/src/test/js/sql-aggregation-test.js` — Node.js 脚本调 HTTP API + 直连 DB 验证。FlowEngine 的测试可用类似模式：mock ESL client 或启动 gt-call 后调 API 触发。

## Out of Scope

- **呼出流程编排** — 第一版仅支持呼入。呼出场景（预测式外呼、预览式外呼的 Flow 编排）后续版本。
- **拖拽时的实况预览** — 不做通话过程中在画布上高亮当前节点。仅做事后日志查看。
- **复杂表达式语言** — Condition 节点用简单的 field + operator + value，不做脚本引擎。
- **A/B 测试** — 同一个 DID 不支持按比例分流到不同 Flow。
- **跨 FS 集群** — 单 FS 实例场景，不考虑多集群 Flow 同步。
- **WebSocket 实时状态推送** — 通话执行日志用事后查询，不做实时推送。
- **音频文件在线编辑** — Playback 节点的音频文件只支持上传，不做在线录制或拼接。

## Further Notes

- 现有 FreeSWITCH ESL client 在 gt-call 模块的 `org.freeswitch.esl.client` 包下，是完整的 inbound ESL 实现，可直接复用。
- 座席组（AgentGroup）概念已在 gt-system 中存在，Bridge 节点配置时通过 Feign 调 gt-system 查询可用座席组列表。
- TTS 使用阿里云语音服务（项目已有阿里云 ASR 集成），同一 SDK 通常同时提供 TTS 能力。
- Flow 的 JSON definition schema 需要严格版本管理，因为前端编辑器和后端执行引擎都依赖它。建议 schema 变更走 ADR。
- CollectDTMF 节点产出的 DTMF 值自动存入 FlowSession.variables（key: `dtmf`），无需额外 SetVariable。

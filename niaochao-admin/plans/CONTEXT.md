# Backend Context — gt-niaochao

Java Spring Cloud microservices for the Niaochao outbound call management platform.

## Glossary

### Flow
可配置的呼叫流程图。由 FlowNode 和 FlowEdge 组成的有向无环图。一个 Flow 绑定一个 DID 号码，呼入时按被叫号码查找并执行对应 Flow。

**存储方式：** JSON + 版本历史。`flow_version` 表存 JSON definition，`flow` 表记录当前活跃版本。发布新版本 = 新增一行，回滚 = 切版本指针。

**执行模型：** Java 后端通过 ESL (Event Socket Library) 实时控制 FreeSWITCH。每通电话一个线程，逐步走节点，发 ESL 命令，等事件回调，推进到下一节点。

**触发方式：** 按被叫号码 (DID) 绑定。呼入时 dest_number → 查 flow 表 → 加载 JSON → 执行。

### FlowNode
Flow 中的一个执行步骤。每种节点类型有不同行为和配置。

**节点类型：**

| 类型 | 作用 |
|------|------|
| Start | 入口节点，自动创建，不可删 |
| End | 流程终止，正常结束 |
| Playback | 播放语音。支持两种模式：上传音频文件 或 文字转语音 (TTS，通过阿里云) |
| CollectDTMF | 放音 + 收集按键输入。产出 DTMF 值供后续 Condition 判断 |
| Bridge | 转接座席。指定座席组（技能组），映射到 FS callcenter queue。支持优先级字段 |
| Condition | 条件分支。数据源：DTMF 按键值、通道变量、时间条件、Flow 变量 |
| SetVariable | 设置 Flow 变量，供后续节点引用 |
| Record | 录音 |
| Hangup | 挂机，可在流程中途触发 |
| Transfer | 将通话转到另一个 Flow |
| HTTPRequest | 调外部 HTTP API。响应通过手动字段映射（如 `data.isVip → is_vip`）存为 Flow 变量 |

### FlowEdge
Flow 中两个 FlowNode 之间的连线。对于 Condition 节点，每条 Edge 带一个条件表达式（如 `dtmf = "1"`），运行时按条件选择分支。

### FlowSession
运行时概念。每通进入 Flow 的电话产生一个 FlowSession，记录：当前所在节点、Flow 变量快照、通话 UUID。线程内同步推进。

### DID
被叫号码。Flow 的入口路由键。一个 DID 绑定一个 Flow 的某个版本。

## Relationships

- DID → Flow (1:1, 一个号码绑定一个 Flow 的当前活跃版本)
- Flow → FlowVersion (1:N, 一个 Flow 有多个历史版本)
- FlowVersion → FlowNode + FlowEdge (1:N, 包含在 JSON definition 内)
- FlowSession → FlowVersion (N:1, 运行时绑定到具体版本)
- Bridge 节点 → AgentGroup (引用现有座席组概念)
- Transfer 节点 → Flow (引用另一个 Flow)

## Decisions

- **执行引擎**：每通电话一个线程，同步 ESL 命令。并发量几十~几百通，OS 线程足够。
- **前端画布**：Vue Flow (vue-flow)，Vue 3 原生组件，自定义节点用 Vue 组件渲染。
- **Playback**：同时支持音频文件上传和 TTS 文字转语音。
- **HTTP 响应映射**：手动配置字段映射，不用表达式语言。

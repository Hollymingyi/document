# SetVariable + HTTPRequest Nodes

Label: `ready-for-agent`

## What to build

实现 Flow 的动态数据能力：设置变量和调用外部 API，使流程能基于运行时数据做决策。

1. **SetVariable 节点（前端 + 后端）**: 配置表单——变量名、值来源（固定值 / 引用通道变量 / 引用已有 Flow 变量）。SetVariableExecutor 将值写入 FlowSession.variables。
2. **HTTPRequest 节点（前端）**: 配置表单——URL、HTTP method（GET/POST）、请求 headers（key-value 列表）、请求 body（支持引用 Flow 变量作为模板参数，如 `${caller_id}`）、超时时间（秒）、响应字段映射列表（JSON path → Flow 变量名，如 `data.isVip → is_vip`）、失败时后续节点。
3. **HTTPRequest 节点（后端）**: HTTPRequestExecutor 用 Java HttpClient 发请求，解析 JSON 响应，按字段映射规则写入 FlowSession.variables。支持在 URL/headers/body 中用 `${varName}` 语法引用 Flow 变量。超时或异常时走失败出边。
4. **与 Condition 联动**: HTTPRequest 设的变量可被后续 Condition 节点引用，实现"查 API → 根据结果走不同分支"。
5. **测试**: mock HTTP 测试——API 返回 `{"data":{"isVip":true}}`，映射后 `is_vip=true`，Condition 走 VIP 分支。API 超时走失败分支。

## Acceptance criteria

- [ ] SetVariable 节点可设置 Flow 变量（固定值或引用通道变量）
- [ ] HTTPRequest 节点可配置 URL、method、headers、body
- [ ] HTTPRequest 支持 `${varName}` 引用 Flow 变量作为请求参数
- [ ] HTTPRequest 响应字段映射正确写入 FlowSession.variables
- [ ] HTTPRequest 超时或失败时走指定失败节点
- [ ] SetVariable + HTTPRequest + Condition 联动测试通过

## Blocked by

- Issue 03: FlowEngine Core + ESL Integration

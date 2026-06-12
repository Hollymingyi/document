# Flow Validation + Execution Logging

Label: `ready-for-agent`

## What to build

实现画布校验和通话执行日志，让运营能排查"这通电话走了哪条路径"。

1. **画布实时校验（前端）**: 编辑时实时检测——未连接的节点标红、缺少 End 节点标黄、Start 出边缺失标红。保存前运行完整校验，不通过则弹窗列出具体问题。
2. **发布前校验（后端）**: `POST /flow/{id}/validate` — 深度校验 JSON definition：所有节点可达（从 Start 出发 DFS）、所有非 End 节点有出边、Playback 有音频或 TTS 内容、Bridge 有座席组、HTTPRequest 有 URL。返回校验结果列表（pass/warn/error）。
3. **执行日志（后端）**: FlowEngine 执行每经过一个节点，写入 `flow_execution_log` 表——flow_session_id, call_uuid, node_id, node_type, entered_at, exited_at, variables_snapshot (JSON), result。通话结束后整条路径可查。
4. **日志查看（前端）**: 通话详情页（或录音列表页）增加"流程日志"标签。展示该通话走过的节点路径（按时间排序），每个节点展示名称、进入时间、退出时间、当时的变量快照。
5. **测试**: 集成测试——执行一个带条件分支的 Flow，验证 flow_execution_log 记录了正确的节点路径和变量值。

## Acceptance criteria

- [ ] 画布编辑时未连接节点标红、缺少 End 节点标黄
- [ ] 保存/发布前校验不通过时列出具体问题
- [ ] 后端校验 API 返回结构化的校验结果
- [ ] 每通电话执行后 flow_execution_log 记录完整节点路径
- [ ] 前端可查看某通电话的流程执行日志
- [ ] 日志包含每步的变量快照

## Blocked by

- Issue 03: FlowEngine Core + ESL Integration

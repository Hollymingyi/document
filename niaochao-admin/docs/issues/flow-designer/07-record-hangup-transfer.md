# Record + Hangup + Transfer Nodes

Label: `ready-for-agent`

## What to build

实现三种辅助节点：录音、挂机、转流程。

1. **Record 节点（前端 + 后端）**: 配置表单——录音文件名前缀（可选，默认自动生成）。RecordExecutor 通过 ESL 发 `uuid_record` 命令开始录音。录音在通话结束或到达下一个 Record 节点时自动停止。
2. **Hangup 节点（前端 + 后端）**: 配置表单——挂机原因（可选文本，记入日志）。HangupExecutor 通过 ESL 发 `uuid_kill` 命令挂断通话。FlowEngine 收到 null nextNodeId 时结束。
3. **Transfer 节点（前端 + 后端）**: 配置表单——目标 Flow 选择（下拉列表，从 Flow 列表 API 加载当前已发布的 Flow）。TransferExecutor 加载目标 Flow 的活跃版本 JSON definition，创建新 FlowSession，在当前线程中继续执行目标 Flow（不产生新线程，保留原通话上下文）。
4. **测试**: mock ESL 测试——Record 发出正确录音命令、Hangup 挂断通话、Transfer 跳转到目标 Flow 继续执行。

## Acceptance criteria

- [ ] Record 节点可配置，执行时通过 ESL 开始录音
- [ ] Hangup 节点执行时挂断通话
- [ ] Transfer 节点可选择目标 Flow，执行时跳转到目标 Flow 继续运行
- [ ] Transfer 后 Flow 变量保留（新 Flow 可读取之前的变量）
- [ ] 三种节点的单元测试通过

## Blocked by

- Issue 03: FlowEngine Core + ESL Integration

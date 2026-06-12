# Bridge Node (座席转接)

Label: `ready-for-agent`

## What to build

实现通话转接到座席组的能力。

1. **Bridge 节点（前端）**: 配置表单包含——座席组选择（下拉列表，从 gt-system AgentGroup API 加载）、优先级（普通/高/紧急）、超时时间（秒）、无空闲座席时的后续节点选择（从画布节点列表中选择）。
2. **Bridge 节点（后端）**: BridgeExecutor 通过 ESL 发 `callcenter` bridge 命令，将通话转接到 FS callcenter queue（队列名 = 座席组标识）。优先级映射为 queue priority 参数。等待 bridge 结果事件——成功则走成功出边，超时则走超时出边，失败则走失败出边。
3. **座席组 API 集成**: BridgeExecutor 启动前通过 Feign 调 gt-system 获取座席组信息（FS queue 名、当前在线座席数），用于校验和日志。
4. **测试**: mock ESL 测试——Bridge 成功转接、Bridge 超时走备选节点、Bridge 失败（无座席）走失败节点。

## Acceptance criteria

- [ ] Bridge 节点可在画布上拖入、配置座席组、连线
- [ ] 座席组下拉列表从 gt-system API 动态加载
- [ ] Bridge 执行时通话正确转接到指定座席组的 FS callcenter queue
- [ ] Bridge 超时后走到配置的超时后续节点
- [ ] Bridge 失败（无可用座席）走到失败节点
- [ ] 单元测试覆盖：成功转接、超时、失败三种路径

## Blocked by

- Issue 03: FlowEngine Core + ESL Integration

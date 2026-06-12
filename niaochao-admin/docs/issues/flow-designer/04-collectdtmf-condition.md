# CollectDTMF + Condition Nodes

Label: `ready-for-agent`

## What to build

实现 IVR 菜单核心能力：收按键 + 条件分支。从此用户可以构建"按1转人工，按2查余额"类流程。

1. **CollectDTMF 节点（前端）**: 配置表单包含——提示音（音频/TTS）、最大按键数、超时时间（秒）、最大重试次数、超时提示音、输入错误提示音。产出 DTMF 值自动存入 FlowSession.variables（key: `dtmf`）。
2. **CollectDTMF 节点（后端）**: CollectDTMFExecutor 通过 ESL 发 `play_and_get_digits` 命令，解析返回的 DTMF 值写入 session.variables。
3. **Condition 节点（前端）**: 配置多条出边条件。每条条件包含：字段来源（DTMF / 通道变量 / 时间 / Flow 变量）、比较操作符（= / != / contains / > / <）、值。一条出边标记为"默认"（else）。画布上 Condition 节点显示条件摘要标签。
4. **Condition 节点（后端）**: ConditionExecutor 遍历出边条件，按优先级逐条评估。匹配则返回该边 targetNodeId。都不匹配则走默认边。时间条件支持：工作时间（周一至周五 9:00-18:00）、自定义时间段。
5. **测试**: mock ESL 测试——CollectDTMF 返回 "1"，Condition `dtmf = "1"` 走分支 A；返回 "2" 走分支 B；超时走默认分支。

## Acceptance criteria

- [ ] CollectDTMF 节点可在画布上拖入、配置、连线
- [ ] CollectDTMF 执行后 DTMF 值存入 FlowSession.variables
- [ ] Condition 节点支持基于 DTMF、通道变量、时间、Flow 变量的条件判断
- [ ] Condition 出边在画布上显示条件标签
- [ ] 所有条件不匹配时走默认（else）分支
- [ ] 时间条件（工作时间/非工作时间）正确判断
- [ ] 单元测试覆盖：DTMF 分支、时间分支、默认分支

## Blocked by

- Issue 03: FlowEngine Core + ESL Integration

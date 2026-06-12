# Execution Stats + Monitoring

Label: `ready-for-agent`

## What to build

实现 Flow 执行统计和实时监控，让运营了解流程运行状况。

1. **节点执行统计（后端）**: 聚合 flow_execution_log 数据。API：`GET /flow/{id}/stats` — 返回每个节点的：经过次数、平均停留时长、成功率（正常退出 vs 异常退出）。API：`GET /flow/{id}/active-calls` — 返回当前正在执行的通话数及简要信息（call_uuid, 进入时间, 当前节点）。
2. **Flow 概览统计**: Flow 列表页每行展示：总执行次数、今日执行次数、当前活跃通话数。
3. **画布热力图（前端）**: Flow 详情页画布模式下，节点背景色深浅表示经过频率。鼠标悬停显示具体统计数字。
4. **测试**: 插入测试 execution_log 数据，验证统计 API 返回正确数值。

## Acceptance criteria

- [ ] Flow 列表页展示总执行次数和当前活跃通话数
- [ ] 节点统计 API 返回每个节点的经过次数和平均停留时长
- [ ] 活跃通话 API 返回当前正在执行的通话列表
- [ ] 画布热力图模式下节点颜色深浅反映经过频率

## Blocked by

- Issue 09: Flow Validation + Execution Logging

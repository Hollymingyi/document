# API 端到端回归验证

Label: `ready-for-agent`

## What to build

启动 gt-analyse 服务，通过 HTTP 调用任务统计相关的 API 端点，验证 SQL 聚合重构后返回数据格式和数值正确。

验证的 API：

1. `GET /qcTask/detail/{taskId}` — 返回的统计字段（totalCount、successCount、failCount、avgScore 等）格式正确
2. `GET /qcTask/hitRate/{taskId}` — 返回命中率列表，每项包含 scoreItemName、direction、maxScore、hitCount、hitRate
3. `GET /qcTask/scoreDistribution/{taskId}` — 返回 4 个分数区间及其计数

使用 curl 或 Node.js http 脚本，配合运行中的 dev 数据库（StarRocks 47.102.138.5:9030）。可以先插入测试数据，调用 API，验证响应，再清理测试数据。

## Acceptance criteria

- [ ] detail API 返回 200，统计字段类型和格式正确（数字类型、非 null）
- [ ] hitRate API 返回 200，列表中每项结构完整，hitRate 为百分比数值（0-100）
- [ ] scoreDistribution API 返回 200，4 个区间按固定顺序返回
- [ ] 对已有真实数据的 task，API 返回值与重构前一致（可对比 git stash 前后）

## Blocked by

- Issue 01: refreshStats SQL 聚合集成测试
- Issue 02: getHitRateTable SQL 聚合集成测试
- Issue 03: getScoreDistribution SQL 聚合集成测试

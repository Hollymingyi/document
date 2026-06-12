# getHitRateTable SQL 聚合集成测试

Label: `ready-for-agent`

## What to build

为 `getHitRateTable` 方法编写集成测试，验证 JOIN + GROUP BY 聚合查询正确计算每个评分项的命中率。

测试场景：

1. **无已完成记录** — 所有 scoreItem 的 hitCount=0，hitRate=0
2. **有已完成记录但无命中** — hitCount=0，hitRate=0
3. **单条命中** — 一个 scoreItem 命中 1 条记录，hitCount=1，hitRate 正确
4. **多条命中跨 scoreItem** — 不同 scoreItem 各有不同数量的命中记录
5. **同一 scoreItem 多次命中同一 record** — hitCount 去重，只计 1 次
6. **hit=0 的记录不纳入统计** — 未命中的 hit 不影响 hitCount

## Acceptance criteria

- [ ] 无已完成记录时返回全零列表，长度等于 scoreItem 数量
- [ ] hitCount 是去重后的 record 数（同一 record 同一 scoreItem 多次命中只计 1 次）
- [ ] hitRate = hitCount * 100 / totalCompleted，精度 2 位小数
- [ ] scoreItem 名称、方向、满分值从评分卡配置正确映射
- [ ] 任务不存在时抛出 BusinessException

## Blocked by

None - can start immediately.

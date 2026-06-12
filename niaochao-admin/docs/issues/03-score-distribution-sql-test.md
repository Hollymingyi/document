# getScoreDistribution SQL 聚合集成测试

Label: `ready-for-agent`

## What to build

为 `getScoreDistribution` 方法编写集成测试，验证 `SUM(CASE WHEN)` 聚合查询正确统计 4 个分数区间的记录数。

测试场景：

1. **无已完成记录** — 4 个区间均为 0
2. **全部满分** — 所有已完成记录 totalScore=100，r4=N，其余为 0
3. **全部不及格** — 所有 totalScore<60，r1=N，其余为 0
4. **混合分布** — 各区间都有记录，验证每个区间计数正确
5. **边界值** — totalScore=60 归入 r2（60-80），=80 归入 r3（80-100），=100 归入 r4（=100）
6. **totalScore 为 null** — 不计入任何区间

## Acceptance criteria

- [ ] 无已完成记录时返回 4 个区间均为 0
- [ ] 区间边界值正确：60 归入 60-80，80 归入 80-100，100 归入 =100
- [ ] totalScore 为 null 的记录不纳入任何区间
- [ ] 返回顺序固定："< 60", "60 - 80", "80 - 100", "= 100"
- [ ] 各区间计数之和等于 totalScore 非 null 的已完成记录总数

## Blocked by

None - can start immediately.

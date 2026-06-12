# refreshStats SQL 聚合集成测试

Label: `ready-for-agent`

## What to build

为 `refreshStats` 方法编写集成测试，验证 SQL 聚合查询在以下场景中返回正确的统计数据：

1. **空任务**（0 条录音）— 所有计数为 0，avgScore 为 0
2. **纯失败任务** — totalCount = failCount，successCount = 0
3. **混合状态任务** — 包含待处理、ASR 中、已完成、失败等各种状态的录音，验证每个状态计数正确
4. **已完成录音** — 验证 avgScore、lowScoreCount（低于阈值）、reviewCount（reviewStatus 为 null 或 0）、avgDuration（processingStartAt/EndAt 之差）、correctionCount（hasManualCorrection=1）均正确

测试通过 mapper 直接调用 `selectStatusCounts`、`selectAvgScore`、`selectLowScoreCount`、`selectReviewCount`、`selectAvgProcessingDuration`、`selectCorrectionCount` 并断言返回值。然后调用 `refreshStats` 并查询 QcTask 验证持久化的统计字段。

## Acceptance criteria

- [ ] 空任务场景：refreshStats 不报错，所有统计字段为 0 或 null
- [ ] 纯失败任务：totalCount 和 failCount 匹配，successCount = 0
- [ ] 混合状态任务：各状态计数与 SQL `GROUP BY status` 结果一致
- [ ] avgScore 与手动计算的平均值一致（精度到小数点后 2 位）
- [ ] lowScoreCount 正确反映低于评分卡阈值的记录数
- [ ] reviewCount 仅统计 status=5 且 reviewStatus 为 null 或 0 的记录
- [ ] avgDuration 为已完成且有 processingStartAt/EndAt 记录的平均秒数
- [ ] correctionCount 仅统计 hasManualCorrection=1 的记录

## Blocked by

None - can start immediately.

# PRD: QcTask 统计方法 SQL 聚合重构

## Problem Statement

质检任务（QcTask）下的录音记录数量可能达到上万条。`QcTaskServiceImpl` 的三个统计方法（刷新统计、命中率表、分数分布）将所有录音记录全量加载到 Java 堆内存中进行遍历计算，导致大任务下内存占用过高，多个 `@Async` 线程并发触发时可能 OOM。

## Solution

将三个方法中的 Java 内存遍历替换为 SQL 聚合查询，只返回计算结果，不再加载任何 record 或 hit 对象到内存。

## User Stories

1. As a 运维人员, I want 大任务（10万+录音）的统计刷新不会导致 OOM, so that 服务保持稳定
2. As a 质检主管, I want 查看任务命中率表时响应快速, so that 我不需要等待大量数据的内存计算
3. As a 质检主管, I want 查看分数分布时响应快速, so that 我可以及时了解团队质检情况
4. As a 系统, I want refreshStats 通过 SQL 聚合计算统计数据, so that 内存使用与任务大小无关
5. As a 开发者, I want 统计查询的 SQL 执行计划可控, so that 我可以通过索引优化性能

## Implementation Decisions

- **QcRecordMapper 新增 5 个聚合方法**: `selectStatusCounts`（GROUP BY status）、`selectAvgProcessingDuration`（TIMESTAMPDIFF + AVG）、`selectReviewCount`、`selectCorrectionCount`、`selectScoreDistribution`（SUM CASE WHEN 分区间）
- **QcRecordHitMapper 新增 2 个聚合方法**: `selectHitCountsByTask`（JOIN qc_record + GROUP BY score_item_id + COUNT DISTINCT record_id）、`selectCompletedCountByTask`
- **refreshStats**: 从 `selectList` + Java 遍历改为调用 6 个 SQL 聚合方法，保留原有日志输出格式
- **getHitRateTable**: 从加载 recordIds + 加载 hits + Java 分组改为一条 JOIN 聚合查询，返回 `Map<Long, Integer>` (scoreItemId → hitCount)
- **getScoreDistribution**: 从加载所有 record + Java 遍历改为一条 `SUM(CASE WHEN)` 查询返回 4 个区间计数
- 已有的 `selectAvgScore` 和 `selectLowScoreCount` 继续复用，不重复添加
- `@Select` 注解风格与现有 mapper 保持一致
- `TIMESTAMPDIFF(SECOND, ...)` 用于计算处理时长平均值，兼容 StarRocks

## Testing Decisions

- SQL 聚合方法的正确性可通过集成测试验证：插入已知数据 → 调用 mapper 方法 → 断言返回值
- `refreshStats` 的端到端行为可通过 API 测试验证：创建任务 + 录音 → 调用 refreshStats → 查询任务统计 → 断言数值正确
- codebase 中已有 `QcRuleMatcherTest`（12 个单元测试）作为测试风格的 prior art
- 重点测试场景：空任务（0 条录音）、只有失败记录的任务、混合状态任务、大分数量任务

## Out of Scope

- QcRecordProcessJob `inFlight` Set 的改造（已确认安全，finally 保证清理）
- QcRequestContext ThreadLocal 泄漏防护（已确认 Spring 拦截器契约保证清理）
- Feign 客户端超时配置（内网环境 + 有 fallback factory，优先级低）
- processRecord 整体超时保护（ASR SDK 自带超时）
- 音频文件 `readFile` 的流式改造（多数文件几 MB，可接受）
- 数据库索引优化（后续可按需添加）

## Further Notes

- 本次改动同时清理了 `QcRecordHit` 和 `ChronoUnit` 两个不再使用的 import
- `selectAvgProcessingDuration` 使用子查询先计算每条 record 的时长再做 AVG，避免被 NULL 值干扰
- `selectHitCountsByTask` 使用 INNER JOIN 确保只统计已完成（status=5）record 的命中数据

# Backend: Rerun 查询支持跨评分卡任务 + 重跑后更新 scorecardId

**Repo**: `sunbin/gt-niaochao`
**Labels**: `ready-for-agent`
**Type**: AFK
**Blocked by**: None - can start immediately

## What to build

修改 `QcRerunServiceImpl` 三个方法，使得指定 `taskIds` 时重跑不再限定录音的 `scorecardId`，并更新重跑后录音的评分卡归属。

**核心行为**：当用户选了任务时，按 `taskIds + 日期 + status=5` 查录音（不再限定 scorecardId）；没选任务时，行为不变（按 scorecardId 过滤）。

**重跑后数据更新**：录音的 `scorecardId` 更新为当前评分卡 ID，`taskId` 保留原值。

## Acceptance criteria

- [ ] `preview()`: completedRecords 和 failedRecords 查询中，`scorecardId` 条件改为 `eq(CollUtil.isEmpty(dto.getTaskIds()), scorecardId, dto.getScorecardId())`
- [ ] `doRerun()`: 分页查询录音时，`scorecardId` 条件同上
- [ ] `rerunSingleRecord()`: 更新记录前设置 `record.setScorecardId(scorecard.getId())`
- [ ] 未选任务时，重跑行为与现有一致（按 scorecardId 过滤），回归验证
- [ ] 选任务后，重跑按 taskIds 查录音，不限 scorecardId，录音 scorecardId 被更新为当前评分卡

## Parent

PRD: [2026-06-11-scorecard-rerun-task-by-customer](../docs/prds/2026-06-11-scorecard-rerun-task-by-customer.md)

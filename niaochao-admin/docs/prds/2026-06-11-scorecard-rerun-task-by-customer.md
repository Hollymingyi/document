# PRD: 评分卡规则重跑 — 指定任务按客户维度查询

## Problem Statement

评分卡规则重跑弹窗中的"指定任务"下拉框，当前只查询**当前评分卡**关联的任务。用户在使用时面临两个问题：

1. **新建评分卡无任务可选**：评分卡刚创建时还没有任务，无法通过指定任务来精确控制重跑范围
2. **跨评分卡重跑不方便**：客户可能有多个评分卡，用户想用评分卡 A 的规则去重跑评分卡 B 的任务下的录音，当前下拉框不支持选择其他评分卡的任务

## Solution

将"指定任务"下拉框的查询维度从**评分卡**改为**客户**：
- 下拉框展示当前评分卡所属客户下的**所有常规任务**（按日期倒序，默认加载 100 条）
- 支持输入关键字远程搜索任务
- 选中任务后，重跑时按 `taskIds` 查录音，不再限定 `scorecardId`
- 重跑完成后，录音的 `scorecardId` 更新为当前评分卡 ID，`taskId` 保留原值

## User Stories

1. As a 质检管理员, I want to select tasks from any scorecard under the same customer in the rerun modal, so that I can use a newly created scorecard's rules to re-evaluate recordings from older tasks
2. As a 质检管理员, I want the task dropdown to show all regular tasks for the customer by default, so that I don't have to switch between scorecard pages to find the task I need
3. As a 质检管理员, I want to search tasks by name or batch number in the dropdown, so that I can quickly find a specific task among many
4. As a 质检管理员, I want the rerun to use the current scorecard's rules even when the task originally belongs to a different scorecard, so that the re-evaluation uses the latest scoring criteria
5. As a 质检管理员, I want the rerun preview to accurately reflect the scope when tasks are selected, so that I know how many recordings will be affected before confirming
6. As a 质检管理员, I want the date range and task selection to work as AND conditions, so that I can precisely control the rerun scope
7. As a 质检管理员, I want the rerun behavior unchanged when no tasks are selected (still filter by scorecardId), so that existing workflows are not disrupted

## Implementation Decisions

### Modules

| Module | Repository | Type |
|--------|-----------|------|
| 评分卡列表页重跑弹窗 | frontend (`sunbin/my-project`) | Modify |
| QcRerunServiceImpl | backend (`sunbin/gt-niaochao`) | Modify |

### Frontend: 评分卡列表页重跑弹窗

- **位置**：评分卡列表页（`index.vue`）的"评分卡规则重跑"弹窗，**不修改**详情页（`detail.vue`）和任务列表页的重跑
- **任务加载**：弹窗打开时调用 `GET /qcTask/list?customerId={当前评分卡的客户ID}&taskType=regular&pageSize=100`，后端已按 `createdAt DESC` 排序
- **远程搜索**：用户在任务下拉框输入关键字时触发 `@search` 事件，带 `keyword` 参数重新请求任务列表；清空搜索词时恢复默认 100 条
- **客户端过滤保留**：保留现有 `filter-option` 用于本地快速过滤已加载的任务
- **提交参数不变**：`taskIds` 已存在于 `QcRerunParams` 类型中，前端已传递，无需改动
- **任务类型限制**：仅查询 `taskType='regular'`（常规任务），不包含重跑任务

### Backend: QcRerunServiceImpl

- **查询条件变更**：`preview()` 和 `doRerun()` 中的 `scorecardId` 过滤条件改为仅在 `taskIds` 为空时生效

  ```
  改前: .eq(scorecardId, dto.getScorecardId())
  改后: .eq(CollUtil.isEmpty(dto.getTaskIds()), scorecardId, dto.getScorecardId())
  ```

- **跑后更新**：`rerunSingleRecord()` 中新增 `record.setScorecardId(scorecard.getId())`，将录音的评分卡 ID 更新为当前评分卡
- **taskId 保留**：录音的 `taskId` 不做修改，保留原值

### API Contracts

无新增或变更 API。现有接口已支持所需参数：

- `POST /qcRerun/preview` — `QcRerunDTO.taskIds` 已存在
- `POST /qcRerun/trigger` — `QcRerunDTO.taskIds` 已存在
- `GET /qcTask/list` — `QcTaskQueryDTO.customerId` 和 `taskType` 已存在

### Behavior Matrix

| 是否选任务 | 录音查询条件 | 重跑后 scorecardId | 重跑后 taskId |
|-----------|-------------|-------------------|--------------|
| 未选 | scorecardId + 日期 + status=5 | 不变（本来就是当前评分卡） | 不变 |
| 已选 | taskIds + 日期 + status=5 | 更新为当前评分卡 ID | 保留原值 |

### Interaction: 日期范围 + 任务选择

两个筛选条件是 **AND 交集**关系。日期范围必填，任务选择选填（留空 = 不限任务）。

## Testing Decisions

- **测试类型**：只测试外部行为，不测试实现细节
- **优先测试后端**：`QcRerunServiceImpl` 的查询逻辑变更（有 taskIds 时不按 scorecardId 过滤、重跑后 scorecardId 更新）是核心风险点
- **测试参考**：`gt-niaochao/gt-analyse/src/test/java/com/gt/analyse/QcTaskRerunTest.java`
- **前端**：任务下拉框的查询参数变更可通过 Playwright E2E 测试覆盖

## Out of Scope

- 评分卡详情页（`detail.vue`）的重跑弹窗：保持现有行为不变
- 任务列表页（`offline-qc/task-list`）的重跑功能：保持现有行为不变
- 任务下拉框单选改多选：已支持多选，无需改动
- 评分卡表单页：无改动

## Further Notes

- 重跑后 `scorecardId` 更新，导致原 task 的统计（`refreshStats`）可能减少该录音的计数，这是预期行为
- 重跑操作有 Redis 分布式锁保护（`qc:rerun:lock:{scorecardId}`），同一评分卡不可并发重跑
- Webhook 推送（事件类型 = rerun）行为不变，重跑后每个录音仍触发推送

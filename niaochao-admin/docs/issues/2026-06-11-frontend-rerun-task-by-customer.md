# Frontend: 重跑弹窗任务下拉框改为按客户查询 + 远程搜索

**Repo**: `sunbin/my-project`
**Labels**: `ready-for-agent`
**Type**: AFK
**Blocked by**: None - can start immediately (API 已支持所需参数)

## What to build

修改评分卡列表页（`index.vue`）"评分卡规则重跑"弹窗中的任务下拉框，查询维度从评分卡改为客户，并支持远程搜索。

**任务加载**：弹窗打开时查询 `GET /qcTask/list?customerId={当前评分卡的客户ID}&taskType=regular&pageSize=100`

**远程搜索**：用户在下拉框输入关键字时触发 `@search` 事件，带 `keyword` 参数重新请求；清空搜索词时恢复默认 100 条。保留 `filter-option` 用于本地过滤。

**不修改**：详情页 `detail.vue` 的重跑弹窗、任务列表页的重跑。

## Acceptance criteria

- [ ] `openRerunModal()`: 任务查询参数从 `{ scorecardId: record.id, pageSize: 200 }` 改为 `{ customerId: record.customerId, taskType: 'regular', pageSize: 100 }`
- [ ] 新增 `handleRerunTaskSearch(keyword)` 函数：有 keyword 时远程搜索，无 keyword 时恢复默认 100 条
- [ ] `<a-select>` 新增 `@search="handleRerunTaskSearch"` 属性
- [ ] 下拉框打开时默认显示该客户下最近的 100 个常规任务
- [ ] 输入关键字后下拉框显示远程搜索结果
- [ ] 清空关键字后恢复默认列表
- [ ] 不选任务时重跑行为不变（仍按 scorecardId 过滤）

## Parent

PRD: [2026-06-11-scorecard-rerun-task-by-customer](../docs/prds/2026-06-11-scorecard-rerun-task-by-customer.md)

# Version Management + Publish/Rollback

Label: `ready-for-agent`

## What to build

实现 Flow 的版本管理能力：发布草稿使其生效、查看版本历史、回滚到历史版本。

1. **发布机制（后端）**: `POST /flow/{id}/publish` — 将当前 draft 版本的 status 改为 published，更新 flow 表的 active_version_id 指向该版本。发布前校验 JSON definition 完整性（Start 唯一、End 存在、无悬空连线、必填字段齐全）。
2. **版本历史（后端）**: `GET /flow/{id}/versions` — 返回该 Flow 的所有版本列表（版本号、发布时间、发布人、状态）。
3. **回滚（后端）**: `POST /flow/{id}/rollback?targetVersionId=xxx` — 将 flow 表的 active_version_id 指向目标版本。不删除中间版本。
4. **前端 UI**: Flow 详情页增加"版本历史"标签页，展示版本列表（版本号、发布时间、发布人），每行有"回滚到此版本"按钮。画布编辑页顶部增加"发布"按钮（点击后校验 → 确认弹窗 → 发布成功提示）。Flow 列表页显示当前版本号。
5. **DID 绑定**: 发布时校验 DID 唯一性（一个 DID 只能绑定一个 Flow）。Flow 绑定 DID 后，其他 Flow 不能使用相同 DID。

## Acceptance criteria

- [ ] 保存草稿后点击"发布"，草稿变为活跃版本
- [ ] 发布前校验 Flow 完整性，校验失败给出具体错误提示
- [ ] 版本历史页面展示所有版本
- [ ] 回滚后新呼入电话走回滚后的版本（而非最新版本）
- [ ] DID 唯一性校验：同一 DID 不能绑定两个 Flow
- [ ] 发布/回滚操作记录操作人和时间

## Blocked by

- Issue 01: Schema + Flow CRUD API + Flow List Page
- Issue 02: Canvas Shell + Start/End/Playback + Save Draft

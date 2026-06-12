# Schema + Flow CRUD API + Flow List Page

Label: `ready-for-agent`

## What to build

创建 Flow 的数据模型和基础管理能力，end-to-end 穿过三层：

1. **Schema**: `flow` 表（flow_name, did_number, active_version_id, status）和 `flow_version` 表（flow_id, version_number, definition JSON, published_at, status）。在 StarRocks 上建表。
2. **Backend API**（gt-call 或新模块）: Flow 的 CRUD — 创建 Flow（绑定 DID）、保存草稿（写入 flow_version draft）、获取 Flow 列表（分页）、删除 Flow（仅允许未发布状态）、按 DID 查询活跃版本（内部 API，供后续 FlowEngine 调用）。
3. **Frontend Page**（my-project/nestify-admin）: 离线质检菜单下新增"流程管理"页面。列表展示 Flow 名称、绑定 DID、当前版本、状态。支持创建、删除操作。点击创建跳转到画布编辑页（此 issue 只做路由占位，画布在 issue 02 实现）。

JSON definition schema 初版定义（nodes 数组 + edges 数组），此 issue 只存不解析。

## Acceptance criteria

- [ ] flow 和 flow_version 表在 StarRocks 上创建成功
- [ ] `POST /flow` 创建 Flow，返回 flowId
- [ ] `PUT /flow/{id}/draft` 保存草稿 JSON 到 flow_version
- [ ] `GET /flow/list` 分页返回 Flow 列表
- [ ] `DELETE /flow/{id}` 删除未发布的 Flow
- [ ] `GET /flow/active-by-did/{didNumber}` 按 DID 查询当前活跃版本的 definition JSON
- [ ] 前端流程管理列表页展示 Flow 列表，支持创建和删除
- [ ] 新页面已加入路由、菜单、权限配置（参照 CLAUDE.md 中 4+ files checklist）

## Blocked by

None - can start immediately.

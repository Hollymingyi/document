# Permissions Integration

Label: `ready-for-agent`

## What to build

将 Flow 管理页面接入现有权限体系，控制页面和按钮级别权限。

1. **页面权限**: 流程管理页面加入 `src/utils/pagePermission.ts`（pageKey: `flow-management`）和 `src/utils/menu.ts`（menuKey → permissionKey 映射）。路由 meta 增加 `pageKey: 'flow-management'`。
2. **按钮权限**: 在 `src/utils/permission.ts` 的 `pageButtonPermissions` 中配置 Flow 管理页面的按钮权限：创建 Flow、编辑 Flow、发布 Flow、回滚 Flow、删除 Flow。
3. **后端权限**: Flow API 接口增加权限校验注解（参照现有 gt-system 的权限模式），确保前端权限和后端权限一致。
4. **前端 v-permission**: 流程管理页面的创建、发布、回滚、删除按钮使用 `v-permission` 指令控制可见性。

## Acceptance criteria

- [ ] 无权限用户看不到"流程管理"菜单项
- [ ] 无权限用户直接访问 URL 被路由守卫拦截
- [ ] 创建/发布/回滚/删除按钮根据权限显示或隐藏
- [ ] 后端 API 同步校验权限，拒绝未授权请求

## Blocked by

- Issue 01: Schema + Flow CRUD API + Flow List Page
- Issue 02: Canvas Shell + Start/End/Playback + Save Draft

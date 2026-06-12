# Canvas Shell + Start/End/Playback Nodes + Save Draft

Label: `ready-for-agent`

## What to build

搭建 Vue Flow 画布编辑器，实现最基础的三种节点，完成"画图 → 保存 → 加载"闭环。

1. **Vue Flow 画布集成**: 安装 `@vue-flow/core` + `@vue-flow/background` + `@vue-flow/controls`。创建 FlowEditor 组件，支持拖拽节点到画布、连线、删除节点/边。
2. **三种自定义节点 Vue 组件**:
   - **StartNode**: 绿色圆形，自动创建在画布上，不可删除。无配置表单。
   - **EndNode**: 红色圆形，可拖入多个。无配置表单。
   - **PlaybackNode**: 矩形卡片，配置表单包含：播放模式（音频文件/TTS）、音频文件选择（上传组件）、TTS 文字输入。
3. **序列化/反序列化**: 画布状态 ↔ JSON definition（nodes + edges 数组）。每个 node 包含 id, type, position, config。每条 edge 包含 id, sourceNodeId, targetNodeId。
4. **保存/加载**: 保存按钮调用 `PUT /flow/{id}/draft`。加载时调用 `GET /flow/{id}` 拿到 draft definition，反序列化到画布。
5. **校验**: 保存前检查——必须有且仅有一个 Start 节点、至少一个 End 节点、所有节点有连线。

## Acceptance criteria

- [ ] Vue Flow 画布渲染正常，可拖拽移动节点
- [ ] Start/End/Playback 三种节点可从侧边栏拖入画布
- [ ] 节点之间可连线、可删除连线
- [ ] Playback 节点点击后弹出配置表单，支持音频文件和 TTS 两种模式
- [ ] 保存按钮将画布序列化为 JSON 并调用 API 保存草稿
- [ ] 刷新页面后从 API 加载草稿，画布恢复到保存时的状态
- [ ] 保存前校验：Start 唯一、End 存在、无悬空节点

## Blocked by

- Issue 01: Schema + Flow CRUD API + Flow List Page

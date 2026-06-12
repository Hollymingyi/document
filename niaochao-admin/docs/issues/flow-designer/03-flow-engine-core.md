# FlowEngine Core + ESL Integration (Linear Flow)

Label: `ready-for-agent`

## What to build

实现 FlowEngine，让一个最简单的线性 Flow（Start → Playback → End）能在真实通话中运行。

1. **FlowEngine**: 核心执行器。接口：`execute(callUUID, flowVersionId)` 和 `cancel(callUUID)`。从 flow_version 加载 JSON definition，从 Start 节点开始，按 FlowEdge 找下一个节点，委托给对应 NodeExecutor 执行，循环直到 End 节点。
2. **FlowSession**: 运行时状态对象。记录当前 nodeId、Flow 变量表（Map<String, Object>）、callUUID、已走过的节点路径。每通电话一个 FlowSession，绑定到线程。
3. **NodeExecutor 接口**: `String execute(FlowSession session, Map<String, Object> nodeConfig, EslClient eslClient)` — 返回 nextNodeId。引擎根据出边找到下一个节点 ID。
4. **StartNodeExecutor**: 直接返回第一个出边的 targetNodeId。
5. **EndNodeExecutor**: 返回 null，引擎识别后结束。
6. **PlaybackNodeExecutor**: 读取 nodeConfig 中的播放模式（file/tts）和内容，通过 ESL 发 `uuid_broadcast` 或 `uuid_media` 命令播放，等待 `PLAYBACK_START` / `PLAYBACK_STOP` 事件确认完成后返回 nextNodeId。
7. **ESL 集成**: 修改 gt-call 的呼入事件处理。收到 `CHANNEL_PARK` 时，从通道变量取 dest_number → 调 `FlowRepository.getActiveByDID()` → 找到 Flow 则 `new Thread(() -> flowEngine.execute(uuid, versionId)).start()`。未找到则走现有默认逻辑。
8. **测试**: 用 mock EslClient 测试 FlowEngine 的线性执行路径——验证 Playback 节点发了正确的 ESL 命令、End 节点后引擎正常退出。

## Acceptance criteria

- [ ] FlowEngine 能加载 JSON definition 并从 Start 走到 End
- [ ] PlaybackNodeExecutor 通过 ESL 播放音频文件
- [ ] PlaybackNodeExecutor 通过 ESL + 阿里云 TTS 播放文字
- [ ] 呼入电话到绑定了 Flow 的 DID 时，自动触发 FlowEngine 执行
- [ ] 呼入电话到未绑定 Flow 的 DID 时，走原有默认处理逻辑
- [ ] FlowEngine 线性流程单元测试通过（mock ESL）
- [ ] 通话结束后 FlowSession 路径日志打印到应用日志

## Blocked by

- Issue 01: Schema + Flow CRUD API + Flow List Page

# PRD: 单声道录音说话人分离（阿里云录音文件识别 v4.0 集成）

**Triage Label:** `ready-for-agent`
**Repo:** `sunbin/gt-niaochao`

---

## Problem Statement

离线质检系统（gt-analyse）在处理双声道录音时，能通过物理声道拆分准确识别坐席和客户。但单声道录音（channelMode=2）只能依赖正则表达式匹配来猜测角色——准确率低，且只能将匹配到的句子标记为坐席，其余全部标为客户，无法真正区分两个说话人。

客户上传的录音中有大量单声道文件，质检结果中角色识别错误导致评分偏差。

## Solution

接入阿里云录音文件识别 API v4.0（`filetrans.cn-shanghai.aliyuncs.com`）。该 API 在转写单声道录音时自动执行说话人分离，返回的每句话自带 ChannelId（0 或 1），效果等同于双声道拆分。

单声道文件上传后，ASR 引擎自动路由到该 API，后续的角色分配和规则匹配流程与双声道完全一致，无需任何额外配置。

## User Stories

### 核心流程

1. As a 质检管理员, I want 单声道录音上传后自动识别出坐席和客户各自的发言, so that 质检评分基于正确的角色归属
2. As a 质检管理员, I want 单声道录音的角色识别准确率接近双声道水平, so that 我不需要为单声道录音维护复杂的正则规则
3. As a 质检管理员, I want 上传的单声道录音自动走说话人分离流程，无需手动干预, so that 我的日常工作流不变
4. As a 系统, I want 自动检测录音声道数并路由到对应的 ASR 接口, so that 单声道走 FileTrans API、双声道走流式 ASR

### 评分卡配置

5. As a 质检管理员, I want 评分卡的 channelMode 选项从三个（双声道/单声道正则/不分角色）简化为两个（按声道分角色/不分角色）, so that 配置更简洁不易混淆
6. As a 质检管理员, I want channelMode=1（按声道分角色）同时适用于单声道和双声道录音, so that 同一张评分卡能处理两种录音类型
7. As a 质检管理员, I want 通过 leftChannelRole/rightChannelRole 配置单声道录音中哪个说话人是坐席, so that 应对不同业务场景（外呼/呼入）

### 文件访问与安全

8. As a 运维人员, I want 录音文件通过 gt-analyse 的静态资源映射对外提供 HTTP 访问, so that 阿里云 API 能回调下载文件
9. As a 运维人员, I want 录音文件的 HTTP 访问受 IP 白名单保护, so that 录音文件不会被未授权访问
10. As a 运维人员, I want 录音文件访问路径通过网关路由，加入网关白名单跳过 JWT 认证, so that 阿里云 API 无需 token 即可下载文件

### 兼容性

11. As a 质检管理员, I want 现有的双声道录音处理流程不受影响, so that 已有的质检任务继续正常工作
12. As a 质检管理员, I want channelMode=3（不分角色）继续可用, so that 不需要区分角色的评分卡不受影响

## Implementation Decisions

### ASR 路由策略

- `QcAsrServiceImpl.transcribe()` 中根据 `channels` 参数路由：`channels == 1` → 委托给 `QcAsrFileTransClient`，否则走原有的 stream/file 模式
- `QcAsrFileTransClient` 封装阿里云录音文件识别 API v4.0 的异步调用（submit task → poll result → parse response）
- 路由逻辑对 `AsrStage` 透明，`AsrStage` 代码无变化

### channelMode 简化

- **channelMode=2（单声道正则识别）废弃**，`AsrStage` 不再有 `channelMode==2 → STATUS_ROLE_RECOGNITION` 分支
- `RoleRecognitionStage` 保留代码但不再被引擎调用
- channelMode=1（按 ChannelId 分角色）适用于单声道和双声道，复用 `assignRolesByChannel()` 方法
- channelMode=3（不分角色）保持不变

### 说话人角色映射

- 复用 scorecard 的 `leftChannelRole` / `rightChannelRole` 字段
- ChannelId 0 → leftChannelRole（默认=坐席），ChannelId 1 → rightChannelRole（默认=客户）
- `assignRolesByChannel()` 方法无需修改

### 文件访问链路

- gt-analyse 的 `WebMvcConfig` 新增静态资源映射：`/records-audio/**` → 存储根目录（`qc.storage.root-path`）
- `AudioAccessFilter`（Servlet Filter）对 `/records-audio/**` 路径做 IP 白名单校验，白名单为空或 `*` 时不限制
- gt-gateway 白名单新增 `/analyse/records-audio/**`，跳过 JWT 认证
- 阿里云 API 通过 `https://{domain}/analyse/records-audio/{relative_path}` 访问文件

### URL 构建

- `QcAsrFileTransClient.buildFileUrl()` 逻辑：
  - 如果 `recordingUrl` 以 `http://` 或 `https://` 开头 → 直接使用（API 上传场景）
  - 否则从本地路径剥离 `rootPath` 前缀，拼接 `public-url-base`（pageUpload 场景）
- `public-url-base` 配置为 `https://{domain}/analyse/records-audio`，通过 Nacos 管理

### 配置项（Nacos）

```yaml
qc:
  storage:
    root-path: /data/upload/records
    public-url-base: https://{domain}/analyse/records-audio
  file-trans:
    timeout-seconds: 600
    poll-interval-seconds: 10
  audio-access:
    allowed-ips:
      - "*"  # 后续替换为阿里云真实 IP 段
```

### Build 变更

- pom.xml 新增 `com.aliyuncs:aliyun-java-sdk-core:3.7.1` 和 `org.json:json:20170516` 依赖

### API 调用参数

- 版本：v4.0（自动说话人分离）
- 参数：`appkey`、`file_link`、`enable_words=true`、`auto_split=true`、`download_method=curl`
- 不设置 `speaker_num` 和 `supervise_type`（v4.0 默认行为）

### 新增/修改的 Modules

| Module | 操作 | 说明 |
|--------|------|------|
| QcStorageProperties | 新增 | Nacos 配置映射：storage/file-trans/audio-access |
| QcAsrFileTransClient | 新增 | 阿里云录音文件识别 v4.0 客户端 |
| AudioAccessFilter | 新增 | IP 白名单过滤器 |
| QcAsrServiceImpl | 修改 | 新增 channels==1 路由到 FileTransClient |
| WebMvcConfig | 修改 | 新增 /records-audio/** 静态资源映射 |
| AsrStage | 修改 | 移除 channelMode==2 分支 |
| pom.xml | 修改 | 新增 SDK 依赖 |

## Testing Decisions

### 好测试的标准

- 测试外部行为（API 调用 → 返回结果），不测试内部实现（轮询间隔、线程模型）
- Mock 阿里云 API 响应，不依赖真实外部服务

### 测试范围

- **QcAsrFileTransClient**：重点测试
  - buildFileUrl() 路径拼接：本地路径 → URL、已经是 URL → 原样返回、双斜杠处理
  - parseResult()：v4.0 响应 JSON → AsrTranscribeResult 映射、空结果、错误响应
  - submitTask() / pollResult()：用 Mock Server 模拟阿里云 API 的 submit/poll 流程
- **QcAsrServiceImpl 路由**：验证 channels=1 走 FileTransClient、channels=2 走原有逻辑
- **AudioAccessFilter**：白名单匹配、通配符、非 /records-audio/ 路径放行

### Prior Art

- 现有测试 `QcAsrStereoFlowTest`、`QcAsrFullFlowTest` 已有构造 QcAsrServiceImpl 的模式

## Out of Scope

- 前端评分卡 channelMode 选项的 UI 调整（需在前端仓库另建 issue）
- 现有 channelMode=2 的数据库数据迁移（建议用 SQL 脚本统一改为 1）
- 阿里云真实 IP 白名单配置（需运维确认 IP 段）
- nginx 侧的具体代理配置
- gt-call 模块的 ASR 流程（独立的 Spring Boot 应用，不在本次范围）
- pyannote.audio 本地 Python 方案（已被阿里云 API 方案取代）

## Further Notes

- 阿里云录音文件识别 API v4.0 的说话人分离是默认行为，无需额外参数或付费功能
- API 是异步的（submit + poll），56 秒录音处理约 65 秒，timeout 默认 600 秒
- 已用真实单声道录音（single.mp3）端到端测试通过：21 句话正确识别，ChannelId 0/1 分离正常，角色分配正常，质检评分 100 分
- `aliyun-java-sdk-core:3.7.1` 不在阿里云 Maven 镜像中，需从 Maven Central 获取或预安装到本地仓库

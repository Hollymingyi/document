# Issues: 单声道录音说话人分离 & 账单统计改造

---

## Issue 1: Backend: 阿里云 FileTrans API 集成与单声道 ASR 路由

**Label:** `ready-for-agent`

### Parent

None

### What to build

集成阿里云录音文件识别 API v4.0，实现单声道录音的说话人分离。新增 `QcAsrFileTransClient` 封装异步 submit+poll 调用，在 `QcAsrServiceImpl.transcribe()` 中根据 `channels == 1` 路由到该客户端。阿里云 API v4.0 默认做说话人分离，返回 ChannelId 0/1，无需额外参数。

新增 `QcStorageProperties` 配置类，从 Nacos 读取 `qc.storage.public-url-base`（文件公网 URL 前缀）、`qc.file-trans.timeout-seconds`（轮询超时）等配置。

对于 pageUpload 上传的本地文件，`QcAsrFileTransClient.buildFileUrl()` 从本地路径剥离存储根目录前缀，拼接 `public-url-base` 生成阿里云可访问的 URL。对于 API upload 传入的 URL，直接使用。

### Acceptance criteria

- [ ] 单声道录音（recordingChannels=1）自动路由到 FileTrans API
- [ ] 双声道录音仍走原有 stream/flash 模式
- [ ] 本地路径正确拼接为公网 URL（无双斜杠）
- [ ] 已经是 http/https 开头的 URL 直接透传
- [ ] 轮询超时可配置，默认 600 秒
- [ ] 返回的 Sentences 正确映射为 AsrTranscribeResult（ChannelId、text、beginTime、endTime）

### Blocked by

None - can start immediately

---

## Issue 2: Backend: channelMode 简化（移除正则角色识别模式）

**Label:** `ready-for-agent`

### Parent

None

### What to build

移除 `channelMode=2`（单声道正则识别角色）分支。`AsrStage` 不再判断 `channelMode==2 → STATUS_ROLE_RECOGNITION`，统一走 `assignRolesByChannel()` 分配角色（channelMode=1）或跳过角色分配（channelMode=3）。

单声道录音经 FileTrans API 返回 ChannelId 0/1 后，复用 scorecard 的 `leftChannelRole` / `rightChannelRole` 配置映射角色，`assignRolesByChannel()` 方法无需修改。

### Acceptance criteria

- [ ] AsrStage 不再有 channelMode==2 分支
- [ ] channelMode=1 同时适用于单声道和双声道
- [ ] channelMode=3（不分角色）保持不变
- [ ] RoleRecognitionStage 保留但不再被引擎调用

### Blocked by

None - can start immediately

---

## Issue 3: Backend: 录音文件 HTTP 访问与 IP 白名单

**Label:** `ready-for-agent`

### Parent

None

### What to build

在 gt-analyse 新增静态资源映射和 IP 白名单，供阿里云 API 回调下载录音文件。

`WebMvcConfig` 新增 `/records-audio/**` → 存储根目录的静态资源映射。新增 `AudioAccessFilter`（Servlet Filter），对 `/records-audio/**` 路径校验客户端 IP 是否在白名单内。白名单为空或包含 `*` 时不限制。

gt-gateway Nacos 配置中白名单新增 `/analyse/records-audio/**`，跳过 JWT 认证。

### Acceptance criteria

- [ ] `/records-audio/{relativePath}` 返回对应的录音文件
- [ ] 非 `/records-audio/` 路径不受影响
- [ ] IP 白名单为空时允许所有访问
- [ ] IP 白名单含 `*` 时允许所有访问
- [ ] IP 不在白名单时返回 403
- [ ] 网关白名单放行 `/analyse/records-audio/**`

### Blocked by

None - can start immediately

---

## Issue 4: Frontend: channelMode 下拉选项简化

**Label:** `ready-for-agent`

### Parent

None

### What to build

前端评分卡编辑页面的 channelMode 下拉选项从三个（1=双声道/2=单声道正则/3=不分角色）改为两个（1=按声道分角色/3=不分角色）。移除 channelMode=2 选项。对应更新权限和类型定义。

### Acceptance criteria

- [ ] 下拉只有两个选项：按声道分角色、不分角色
- [ ] 已有 channelMode=2 的评分卡编辑时默认选中"按声道分角色"
- [ ] 新建评分卡默认选中"按声道分角色"

### Blocked by

None - can start immediately

---

## Issue 5: Database: channelMode=2 数据迁移

**Label:** `ready-for-agent`

### Parent

None

### What to build

编写 SQL 脚本将现有 `qc_scorecard` 表中 `channel_mode = 2` 的记录更新为 `channel_mode = 1`（按声道分角色）。同时清除 `role_rule_regex` 字段（不再使用）。

### Acceptance criteria

- [ ] 所有 channel_mode=2 的评分卡改为 channel_mode=1
- [ ] role_rule_regex 字段清空
- [ ] 无 channel_mode=2 的记录残留

### Blocked by

None - can start immediately

---

## Issue 6: Backend: 新增模块单元测试

**Label:** `ready-for-agent`

### Parent

None

### What to build

为本次新增的模块补充单元测试：
- `QcAsrFileTransClient.buildFileUrl()`：本地路径→URL、已是URL→原样返回、双斜杠处理、rootPath 不匹配时降级
- `QcAsrFileTransClient.parseResult()`：v4.0 响应 JSON→AsrTranscribeResult、空结果、错误响应
- `QcAsrServiceImpl` 路由：channels=1 走 FileTransClient、channels=2 走原有逻辑
- `AudioAccessFilter`：白名单匹配、通配符 `*`、非 `/records-audio/` 路径放行

### Acceptance criteria

- [ ] buildFileUrl 各分支有覆盖
- [ ] parseResult 正常/空/错误场景有覆盖
- [ ] channels=1 和 channels=2 路由验证
- [ ] AudioAccessFilter 白名单/通配符/非目标路径验证

### Blocked by

- Issue #1
- Issue #3

---

## Issue 7: Server: 部署 pyannote 环境 & 新版 gt-analyse

**Label:** `ready-for-human`

### Parent

None

### What to build

在测试服务器（47.102.138.5）部署新版 gt-analyse jar 包。确认 Nacos 配置中 `qc.storage.public-url-base` 指向正确的公网地址，`qc.audio-access.allowed-ips` 配置为阿里云 API 真实 IP 段（先用 `*` 测试，后续硬化）。

执行 `install-pyannote.sh` 安装脚本（如需 Python pyannote 方案作为备选）。

验证端到端流程：上传单声道录音 → ASR 转写 → 说话人分离 → 角色分配 → 规则匹配 → 评分。

### Acceptance criteria

- [ ] gt-analyse 新版 jar 部署成功
- [ ] Nacos 配置正确
- [ ] 单声道录音端到端流程跑通
- [ ] 双声道录音流程不受影响

### Blocked by

- Issue #1
- Issue #2
- Issue #3

---

## Issue 8: Backend: 账单统计字段扩充 & 统计生成逻辑改造

**Label:** `ready-for-agent`

### Parent

None

### What to build

改造 `qc_daily_stat` 表和统计生成逻辑，补齐原型图要求的字段。

**新增字段：**
- `record_total`：录音总数（所有状态）
- `asr_success_count`：ASR 转写成功数（status=5）
- `asr_fail_count`：ASR 转写失败数（failure_stage=2）
- `billing_units`：计费单元数（逐条录音向上取整到分钟，再求和）

**修改逻辑：**
- `record_count` 改为统计所有状态录音（原来只统计 status=5）
- `billing_units` 计算方式：`SUM(CEIL(recording_duration / 60.0))` 对每条录音单独取整再求和
- `total_minutes` 保持不变（聚合后取整，用于展示"录音总时长"）
- **不再生成 statType=3** 的汇总记录
- 列表接口不再按 statType 区分，固定返回 statType=1 的明细数据

### Acceptance criteria

- [ ] qc_daily_stat 表新增 record_total、asr_success_count、asr_fail_count、billing_units 列
- [ ] 统计生成 SQL 正确计算各字段
- [ ] billing_units = 逐条 ceil 再求和（非聚合后 ceil）
- [ ] 不再生成 statType=3 记录
- [ ] 列表接口返回新字段

### Blocked by

None - can start immediately

---

## Issue 9: Backend: 账单列表接口改造 & 合计行

**Label:** `ready-for-agent`

### Parent

None

### What to build

改造 `/qcDailyStat/list` 接口，返回完整的 10 列数据（日期、租户、评分卡、录音总数、成功、失败、录音总时长、计费单元数、单价、金额），并在响应中增加 `totalAmount` 字段用于前端显示合计行。

数据格式要求：纯数字，不带字符/单位。单价保留 2 位小数。金额保留 2 位小数。

移除 statType 参数（不再区分 type1/type3），固定返回明细数据。

### Acceptance criteria

- [ ] 返回 10 列数据，列名与原型图一致
- [ ] 所有数值字段不带字符/单位
- [ ] 单价 2 位小数，金额 2 位小数
- [ ] 响应包含 totalAmount（所有匹配记录的金额总和，不仅当前页）
- [ ] 不再支持 statType=3 查询

### Blocked by

- Issue #8

---

## Issue 10: Backend: 账单统计导出 Excel

**Label:** `ready-for-agent`

### Parent

None

### What to build

新增 `GET /qcDailyStat/export` 接口，导出账单统计列表为 Excel 文件。

列与前端表格一致（10 列），最后一行为合计行（金额列求和）。日期范围至多 6 个月，前端限制选择器 + 后端校验超限返回错误。

使用 Apache POI 或 EasyExcel 生成 Excel。

### Acceptance criteria

- [ ] 导出的 Excel 包含 10 列，列名与表格一致
- [ ] 最后一行为合计行
- [ ] 日期范围超过 6 个月时后端返回错误提示
- [ ] 文件名包含日期范围信息
- [ ] 单价 2 位小数，金额 2 位小数

### Blocked by

- Issue #9

---

## Issue 11: Backend: 账单对账接口

**Label:** `ready-for-agent`

### Parent

None

### What to build

新增对账接口 `GET /qcDailyStat/reconcile`，返回指定日期范围的逐日汇总数据，用于和手工账单比对。

接收日期范围参数，从 `qc_daily_stat` 按 `stat_date` 分组查询，返回每天的：录音总数、成功数、失败数、计费单元数、金额。同时支持重新触发指定日期范围的统计生成。

### Acceptance criteria

- [ ] 接口返回指定日期范围的逐日汇总
- [ ] 包含每日的录音总数、成功、失败、计费单元数、金额
- [ ] 支持按客户筛选
- [ ] 可触发重新生成指定日期的统计数据

### Blocked by

- Issue #8

---

## Issue 12: Frontend: 质检明细页改造

**Label:** `ready-for-agent`

### Parent

None

### What to build

改造 `/offline-qc/stat` 页面：
- Tab "通话量明细" 改名 "质检明细"
- 移除 "通话量总计" Tab
- 表格列改为 10 列：日期、租户、评分卡、录音总数、成功、失败、录音总时长、计费单元数、单价、金额
- 所有数值纯数字，不带字符/单位
- 单价保留 2 位小数
- 表格最下方显示合计行（金额求和，来自后端 totalAmount）

### Acceptance criteria

- [ ] Tab 名为"质检明细"，无第二个 Tab
- [ ] 表格 10 列与原型图一致
- [ ] 数值不带"分钟"、¥ 等字符
- [ ] 单价 2 位小数
- [ ] 底部合计行显示金额总和

### Blocked by

- Issue #9

---

## Issue 13: Frontend: 账单统计导出功能

**Label:** `ready-for-agent`

### Parent

None

### What to build

在质检明细页增加"导出"按钮，调用后端 `/qcDailyStat/export` 接口下载 Excel。

日期选择器限制最多选 6 个月范围。导出时使用当前筛选条件（日期、客户、评分卡）作为参数。

### Acceptance criteria

- [ ] 页面有"导出"按钮
- [ ] 导出使用当前筛选条件
- [ ] 日期选择器限制最多 6 个月
- [ ] 导出文件自动下载

### Blocked by

- Issue #10
- Issue #12

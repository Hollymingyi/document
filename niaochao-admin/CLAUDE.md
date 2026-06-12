# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This monorepo contains the "鸟巢" (Niaochao) outbound call management platform:

- **gt-niaochao/** — Java Spring Cloud backend (microservices)
- **my-project/nestify-admin/** — Vue 3 SPA admin frontend (also published as `niaochao-admin`)
- **my-project/webrtc-workbench/** — Vue 3 + Vite agent WebRTC workbench (SIP softphone with JsSIP + ACD). See `my-project/webrtc-workbench/CLAUDE.md` for details.
- **prototype/** — Static HTML prototypes for UI reference
- **asr_demo/** — Java Maven project for ASR demo/testing

## Backend: gt-niaochao/

### Tech Stack
Java 21, Spring Boot 3.1.6, Spring Cloud 2022.0.4, Spring Cloud Alibaba 2022.0.0.0-RC2, MyBatis-Plus 3.5.3, MySQL 8, Redis, Kafka, Nacos, Knife4j (OpenAPI 3), XXL-Job, Lombok, Hutool

### Microservices

| Module | Port | Role |
|--------|------|------|
| gt-common | — | Shared library: `Result<T>` wrapper, Redis utils, MyBatis-Plus config, global exception handler, base DTOs |
| gt-gateway | 9001 | API gateway: JWT auth filter, rate limiting, route forwarding |
| gt-auth | 9000 | Authentication: login, captcha, JWT issuance, login logs |
| gt-market | 9002 | Core business: marketing tasks, call tasks, suppliers, lines, talk records, Kafka consumers, XXL-Job tasks |
| gt-system | 9003 | System management: accounts, roles, customers, agent groups, enums, operation logs |
| gt-file | 9004 | File upload/management |
| gt-analyse | 9005 | Offline QC: recording upload, ASR transcription, rule matching, scoring, manual correction, webhook integration |
| gt-call | 9008 | AI outbound call center: FreeSWITCH ESL integration, queue-based outbound, bot/agent call modes, ACD, TTS/ASR via Aliyun NLS. Uses Spring Boot 3.5.8. See `gt-niaochao/gt-call/CLAUDE.md` for full architecture |

### Key Architectural Patterns

- **Gateway auth flow**: Requests hit gt-gateway first. `JwtAuthFilter` validates Bearer tokens stored in Redis, passes `userId`/`username`/`customerCodes` headers downstream. Token auto-renews at 20-min threshold (12h TTL).
- **Inter-service calls**: gt-market and gt-analyse use OpenFeign to call gt-system. Feign clients live in the `feign/` package with fallback classes.
- **Database**: gt-analyse connects to a StarRocks instance (port 29030 on dev/test) instead of standard MySQL. **StarRocks does not support `SELECT ... FOR UPDATE`** — always use `selectById()` instead of custom `selectByIdForUpdate()` methods in gt-analyse.
- **Config management**: Each service uses `bootstrap.yml` for Nacos connection (dev/test/prod profiles via `NACOS_ACTIVE` env var, default: test). Application config stored in Nacos — local `application.yml` only disables import-check.
- **Result wrapper**: All API responses use `com.gt.common.domain.Result<T>` with `code`/`msg`/`data`. Success = 200, error = 500.
- **Package structure per service**: `controller/ → service/ → mapper/`, `domain/{dto,entity,request,response,vo}/`, `config/`, `contanst/` (typo is intentional).

### Adding a New Backend Feature (e.g., in gt-system)

1. Entity in `domain/entity/` — extends `BaseDto`, uses `@TableName`, `@TableId(type = IdType.AUTO)`
2. DTOs in `domain/dto/` — create/update/query DTOs
3. Response classes in `domain/response/`
4. Mapper interface in `mapper/` — extends `BaseMapper<Entity>`, custom methods with `@Param`
5. Mapper XML in `resources/mybatis/` — complex queries with dynamic SQL
6. Service interface in `service/` — extends `IService<Entity>`
7. Service impl in `service/impl/` — extends `ServiceImpl<Mapper, Entity>`, uses `@Transactional`, Redis for caching
8. Controller in `controller/` — `@RestController`, returns `Result<T>`, uses `@PageInfo` for pagination

### Build & Run
```bash
cd gt-niaochao
mvn clean package -DskipTests          # Build all modules
mvn clean package -pl gt-market -am    # Build gt-market + dependencies (gt-common)
mvn clean package -pl gt-analyse -am   # Build gt-analyse + dependencies (gt-common)
mvn clean package -pl gt-call -am      # Build gt-call + dependencies
java -jar gt-auth/target/gt-auth-1.0.0.jar   # Run a service directly
NACOS_ACTIVE=dev java -jar gt-analyse/target/gt-analyse-1.0.0.jar  # Run gt-analyse with dev profile
NACOS_ACTIVE=dev java -jar gt-call/target/gt-call-1.0.0.jar        # Run gt-call with dev profile
```
Requires: JDK 21, Maven. All modules are now unified on JDK 21. Services connect to remote Nacos (`47.102.138.5:8848`) in test profile. Set `NACOS_ACTIVE=dev` for local Nacos (`127.0.0.1:8848`).

**Service startup rules**:
1. Always check running processes (`wmic process where "name='java.exe'" get ProcessId,CommandLine | grep "gt-{module}"`) before starting — kill existing instances first
2. Only ONE instance per service — duplicates cause port conflicts and Feign timeouts
3. Services take ~2 minutes to start; verify with `netstat -ano | grep ":{port}"`
4. The Oracle javapath launcher creates a parent-child process pair (two PIDs) — this is normal; what matters is only one listener on the port

**Production deployment**: Use `start-all.sh` (deploys all services except gt-analyse and gt-call) or `startup-one.sh start <service>` for individual services. Deployed to `/opt/niaochao/gt-niaochao` on `47.102.138.5`.

### gt-analyse: QC Processing Pipeline

The offline quality control pipeline processes recordings through these stages (status field):
1. **1** (待处理) → **2** (ASR转写) → **3** (角色识别, only for single-channel) → **4** (质检中) → **5** (已完成) / **6** (失败)

Pipeline orchestration in `QcEngineServiceImpl.processRecord()`:
- `AsrStage` — handles status 1/2. CAS update prevents concurrent processing. On ASR success, advances to status 3 (channelMode==2) or status 4 (channelMode==1/3). On failure, sets status=6.
- `RoleRecognitionStage` — handles status 3 only. Uses regex from scorecard's `roleRuleId` to tag sentences as agent/customer. Everything not matching is customer.
- `MatchStage` — handles status 4. Runs `scoreNewRecord()` which starts at 100, deducts for negative-hits (direction=2), adds for positive-hits (direction=1). Saves hits via `HitBufferService`.

**ASR Routing** (in `QcAsrServiceImpl.transcribe()`):

| Condition | Client | Speaker Separation |
|-----------|--------|---------------------|
| channels==1 | `QcAsrFileTransClient` — FileTrans API v4.0 | API built-in diarization (needs `speaker_number` param) |
| mode="file", channels>=2 | `QcAsrFileClient` — FlashRecognizer HTTP | Auto-split by audio channel |
| mode="stream", channels>=2 | Stream `SpeechTranscriber` | Manual split: extract L/R channels from PCM |

**Critical — `ffprobe` dependency**: `AudioFileUtils.detectChannels()` uses ffprobe for non-WAV files. If ffprobe is not installed, `recording_channels` stays null → defaults to 2 in `AsrStage` → routes to FlashRecognizer (no speaker diarization) instead of FileTrans. **Install ffmpeg/ffprobe on all production servers.** Use the static build if glibc is too old:
```bash
wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
tar -xf ffmpeg-release-amd64-static.tar.xz
ln -sf /path/to/ffmpeg-*-amd64-static/ffmpeg /usr/local/bin/ffmpeg
ln -sf /path/to/ffmpeg-*-amd64-static/ffprobe /usr/local/bin/ffprobe
```

**Common bug pattern**: After modifying `record.getTranscribedText()` in memory, make sure to persist it with `record.getTranscribedText()` (not the original local variable) — otherwise in-memory changes like `speakerRole` get overwritten. Also, all `fail()` methods (AsrStage, RoleRecognitionStage, QcEngineServiceImpl.doFail) must clear `totalScore` to null to prevent stale scores from previous runs.

### gt-analyse: QC Billing/Statistics

Daily billing stats generated from `qc_record` (status=5 completed) aggregation:

- **Tables**: `qc_customer_price` (customer unit price per minute), `qc_daily_stat` (daily aggregated stats)
- **Stat types**: type=1 (通话量明细, by customer+scorecard+date), type=3 (通话量总计, by customer+date). type=2 was removed.
- **Generation**: `QcDailyStatJob` runs nightly at 21:00 via `@Scheduled(cron = "0 0 21 * * ?")`, calling `generateDailyStats(yesterday)`. Also triggerable via `POST /qcDailyStat/generate`.
- **API**: `GET /qcDailyStat/list` (paginated with date range, customerId, scorecardId, statType filters), `GET /qcDailyStat/price`, `POST /qcDailyStat/price` (set unit price per customer)
- **Data isolation**: `QcRequestContext` ThreadLocal — customer accounts only see their own stats. Internal accounts see all.
- **StarRocks BigInt precision**: `toLong()` uses `BigDecimal.toPlainString().split("\\.")[0]` → `Long.parseLong()` to avoid precision loss. Never use `((Number) val).longValue()` directly.
- **BigInt cross-system danger**: StarRocks BIGINT values (e.g. customer_id `2023391656704524699`) exceed JavaScript `Number.MAX_SAFE_INTEGER` (9e15). When querying via Node.js, always use `decimalNumbers:true` and CAST to CHAR: `SELECT DISTINCT CAST(customer_id AS CHAR) FROM ...`. The raw `number` from the driver may be rounded. When calling APIs with BIGINT params, pass as JSON **strings** — `{"customerId":"2023391656704524699"}` — never as numbers, or the backend may insert a wrong value.
- **Frontend**: `/offline-qc/stat` page ("账单统计") with date-range + customer + scorecard filters, two tabs for type 1/3


### gt-system: Script Audio File Serving

Script audio files are uploaded to `script.upload.path` (default `/data/upload/scripts/`) and served via `WebMvcConfig` at `/statics/**`. Frontend constructs the URL as `/api/gateway/system/statics/${path}` (with backslashes replaced by forward slashes). The `audioFileUrl` field in the database stores the relative path (e.g., `20260508/abc123.wav`).

## Frontend: my-project/nestify-admin/

### Tech Stack
Vue 3.4 (Composition API), TypeScript 5, Vite 4, Ant Design Vue 4, Pinia 2, Vue Router 4, Axios, ECharts 5, WaveSurfer.js, Less, Day.js

### Build & Run
```bash
cd my-project/nestify-admin
npm install
npm run dev              # Dev server → http://localhost:3000
npm run dev:pre          # Dev server with pre-production env
npm run build            # Type-check + production build
npm run type-check       # Run vue-tsc only
```

Environment files: `.env.development` (local), `.env.test`, `.env.pre`, `.env.production`. Dev mode proxies API to `localhost:9001` (gt-gateway).

### API Proxy Convention

Frontend calls `/api/gateway/{service}/...`. Vite proxy rewrites and routes:
- `/api/gateway/system/flow` → `localhost:9003` (bypasses gateway)
- `/api/gateway/system/statics` → `localhost:9003` (static files: audio, uploaded by scripts)
- `/api/gateway/*` → `localhost:9001` (gt-gateway, general rule via buildEnv proxy)

Specific service proxies in `vite.config.ts` must be placed **before** the general `/api` rule.

### Adding a New Page — Checklist (4+ files must be updated)

When adding a new page/feature, these files all need updates:

1. **Route** — `src/router/index.ts`: Add route with `meta: { title, requiresAuth: true, pageKey: 'xxx' }`
2. **Menu** — `src/config/menu.ts`: Add item to `menuConfig.items` AND add path mapping to `routeMenuMap` (for breadcrumbs)
3. **Permission mapping** — `src/utils/menu.ts`: Add menu key → permission key to `menuKeyToPermissionKeyMap`
4. **Page permission** — `src/utils/pagePermission.ts`: Add page key → permission code to `pageToPermissionMap` AND path → page key to `pathToPageKeyMap`
5. **Button permissions** — `src/utils/permission.ts`: Add page key → button permission codes to `pageButtonPermissions`
6. **(Optional) Permission tree** — `src/config/permission.ts`: Add to `systemPermissionMap` and permission tree data if it's a new permission group

### Permission System (3 layers)

- **Page-level**: Route meta `pageKey` → `pathToPageKeyMap` → `pageToPermissionMap` → router guard checks user permissions
- **Button-level**: `v-permission` directive and `usePagePermission` composable, configured in `src/utils/permission.ts` (`pageButtonPermissions`). Usage: `const { onPermissionGranted } = usePagePermission({ pageKey: 'xxx' })` then `const perms = useCheckPagePermissions('xxx')`, check `perms.edit`, `perms.enable`, etc.
- **Field-level**: `useFieldPermissions` composable controls table column visibility

### HTTP Client (`src/utils/http.ts`)

- Auto-injects Bearer token from user store
- Duplicate request cancellation (1-second debounce window)
- 401/403 auto-logout with redirect to login
- FormData detection for file uploads
- **Password**: Frontend sends MD5-hashed passwords (`encryptMD5()` from `src/utils/md5.ts`). Backend stores MD5 uppercase and compares directly.

### BigInt Precision Handling

Backend uses BIGINT auto-increment IDs (e.g., `2052257744275464194`) that exceed `Number.MAX_SAFE_INTEGER`. A regex-based safe parser in `src/utils/http.ts` quotes 16+ digit integers before `JSON.parse`, converting them to strings:

```
SAFE_INT_RE = /:\s*(-?\d{16,})\b/g
// :2052257744275464194 → :"2052257744275464194"
```

All ID fields in frontend types are `number | string`. When sending IDs back to the backend, they are passed as strings in the URL/query params — the backend accepts both.

**Do not use `json-bigint`** — it caused Vue rendering errors ("Cannot convert object to primitive value"). The regex approach works reliably.

### Frontend Conventions

- **Views**: Complex pages use `vue/` subdirectory for sub-components: `views/{feature}/{page}/vue/Component.vue`
- **Page layout**: Pages use `PageLayout` component for consistent header/content layout with permission denied handling
- **Tables**: Use `ResizableTable` component for draggable column resizing
- **API modules**: `src/api/{module}/index.ts` (functions) + `type.ts` (interfaces)
- **Composables**: `src/composables/` — `usePagePermission`, `useFieldPermissions`, `useActionColumn`
- **Directives**: `v-permission` for element visibility control based on permissions
- **Global Less**: Variables auto-imported via `@import "@/assets/css/variable.less"`
- **Audio proxy**: `/audio-proxy` → `https://record.qinxiatech.com:17779`
- **Date formatting**: Use dayjs throughout
- **QC detail page**: `views/offline-qc/record-detail/index.vue` is a single large file (~1000+ lines). It merges `detail.scoreItems` (all scorecard items from backend) with `detail.hits` (matched rules) via `allScoreItems` computed property to show both hit and unhit items.

### Database Access (for debugging)

**Main database** (gt-system/gt-auth/gt-market/gt-file): MySQL at `47.102.138.5:13306`, database `bird-nest`, user `root`, password `guangting123`.

**Analyse database** (gt-analyse only): StarRocks at `218.94.137.178:29030`, database `market`, user `root`, password `U3RhclJvY2tzUWluWGlhMjAyNjA1IyMj`.

**Production StarRocks**: `47.117.85.102:9030`, database `market`, user `root`, password `!Q@W#E$R98765`. Use `decimalNumbers:true` with Node.js mysql2.

Use Node.js `mysql2` for queries (run from `my-project/nestify-admin/` which has the dep):
```bash
node -e "const mysql=require('mysql2/promise');(async()=>{const c=await mysql.createConnection({host:'47.102.138.5',port:13306,user:'root',password:'guangting123',database:'bird-nest',decimalNumbers:true});const [r]=await c.query('SELECT ...');console.log(r);await c.end()})()"
```
Always use `decimalNumbers:true` and `CAST(id AS CHAR)` for BigInt columns to avoid precision loss.

### Redis Access (for debugging)

Redis at `47.102.138.5:6379`, password `redis_iCYaBJ`, username `default`. Connection from Node.js via `ioredis` (available in `my-project/nestify-admin/`).

Captcha codes are stored under key `gt_check_key{uuid}` (TTL 2 min). The stored value has surrounding double quotes (Java Jackson serialization) — strip them before use.

### Nacos Config

Dev profile: `127.0.0.1:8848`. Test profile: `47.102.138.5:8848`. User/pass: `nacos/nacos`.

Fetch shared config (contains Redis/MySQL connection info):
```bash
curl "http://127.0.0.1:8848/nacos/v1/cs/configs?dataId=application-dev.yml&group=DEFAULT_GROUP&username=nacos&password=nacos"
```

### Production Environment

| Resource | Address | Credentials |
|----------|---------|-------------|
| Frontend | `http://www.nanjingguangting.com:3000` | admin / Gt123456 |
| MySQL | `qinxiatech-prod.rwlb.rds.aliyuncs.com:3306` / `bird-nest` | `bird_nest` / `birdNestGt26112` |
| StarRocks | `47.117.85.102:9030` / `market` | `root` / `!Q@W#E$R98765` |
| Deploy servers | `47.102.138.5`, `47.117.85.102` | jar dirs at `/opt/niaochao/gt-niaochao/` |

**Gateway auth header**: The production gateway expects `Authorization: Bearer <token>` (standard format). NOT `token: xxx`.

**API calls via gateway** (requires auth):
```bash
# Get token via login first (needs captcha), then:
curl -X POST "http://www.nanjingguangting.com:3000/api/gateway/analyse/qcDailyStat/generate?date=2026-06-09" \
  -H "Authorization: Bearer <token>"

# Set customer unit price (note: customerId MUST be a string to avoid BIGINT precision loss)
curl -X POST "http://www.nanjingguangting.com:3000/api/gateway/analyse/qcDailyStat/price" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"customerId":"2023391656704524699","unitPrice":0.12,"effectiveDate":"2026-05-01"}'
```

### Stores

| Store | Purpose |
|-------|---------|
| `user` | Auth state, permissions, user info, field permissions |
| `app` | Sidebar state, theme, breadcrumbs, menu selected/open keys |
| `customer` | Customer selection state |
| `globalDialog` | Shared dialog state |

### Account Lockout

Failed login attempts are tracked in-memory (30-min cache, 5 attempts max). After 5 failures, `login_lock` is set to `TRUE` in the `accounts` table and the auth service's `attemptsCache` blocks further attempts. To unlock: `UPDATE accounts SET login_lock = 0 WHERE account_name = 'xxx'` + restart gt-auth (to clear memory cache).

### Frontend Deployment

Deploy scripts live in `my-project/nestify-admin/`:

- **`deploy-test.sh`** — Deploys `dist/` + nginx config to test server (`47.117.85.102`, path `/home/guangting/admin`). Run `npm run build:test` first.
- **`deploy-prod.sh`** — Deploys to production server. Run `npm run build:prod` first.

### E2E Testing

Playwright-based E2E tests in `my-project/nestify-admin/`:

- **`e2e-full-test.cjs`** — Full E2E test suite using Playwright (login via OCR captcha, navigate pages, test CRUD operations)
- **`click-rerun.mjs`** / **`click-rerun.js`** — Rerun scripts for individual test cases
- Playwright configs live in `.playwright-cli/` directories
- Test screenshots saved to `test-screenshots/`, results to `test-results/`
- Browser auth state cached in `auth.json` (generated after first successful login)
- See Playwright login flow memory for captcha handling details

### Migration Scripts

Data migration scripts in `scripts/`:
- `migrate-515.js`, `migrate-515-fix.js`, `migrate-515-hits.js` — May 15 migration
- `migrate-525.js` — May 25 migration
- Run with Node.js from repo root, e.g.: `node scripts/migrate-525.js`

### CI/CD

- **`auto-build-gt.sh`** — Production auto-build: pulls `dev-任务重构` branch for both backend (`sunbin/gt-niaochao`) and frontend (`sunbin/my-project`), runs `mvn clean package` + `npm run build`, deploys to `/opt/niaochao/`.

## 设计约束
Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## 阿里巴巴 Java 编码规约

编写或修改 Java 代码前，必须遵循《阿里巴巴 Java 开发手册》规约。通过 `alibaba-java-manual` 插件的 skill 按需查阅对应领域的规约：

**流程**：在动手写 Java 代码之前，先调用与任务相关的 skill 加载规约，再编码。

| 场景 | 需调用的 Skill |
|------|---------------|
| 编写任何 Java 代码 | `alibaba-java-manual:java-coding-convention` |
| 数据库 / SQL 相关 | `alibaba-java-manual:db-mysql-standards` |
| 架构 / 模块设计 | `alibaba-java-manual:software-design-standards` |
| 工程结构 / 依赖管理 | `alibaba-java-manual:java-project-standards` |
| 异常处理 / 日志 | `alibaba-java-manual:exception-logging-standards` |
| 安全相关（鉴权、注入、脱敏） | `alibaba-java-manual:code-security-review` |
| 单元测试 | `alibaba-java-manual:unit-testing-standards` |

**重点关注**（根据本项目特点）：
- **并发处理**：gt-call 是事件驱动多线程架构（ESL 事件线程 + 调度器线程 + 异步线程池），singleton bean 中的可变状态必须用 `volatile`、`synchronized`、`Atomic*` 或 `ConcurrentHashMap` 正确保护。编写涉及共享状态的代码前，必须先调用 `alibaba-java-manual:java-coding-convention` 加载 `references/concurrency-convention.md`。
- **集合处理**：`ConcurrentHashMap` 的复合操作（check-then-act）不保证原子性，需要用 `compute`/`merge` 或外部锁。
- **异常处理**：不捕获 `Exception` 基类，不忽略异常，catch 块中必须有处理逻辑或日志。

## Agent skills

### Issue tracker

Issues tracked in self-hosted GitLab (47.117.85.102:3001). Backend repo: `sunbin/gt-niaochao`, frontend repo: `sunbin/my-project`. Uses `glab` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Multi-context layout. `CONTEXT-MAP.md` at repo root points to per-context `CONTEXT.md` files. See `docs/agents/domain.md`.


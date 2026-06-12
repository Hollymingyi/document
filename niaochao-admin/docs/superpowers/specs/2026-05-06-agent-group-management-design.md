# 坐席组管理功能设计

## 1. 概述

在鸟巢营销平台"账号权限"子系统下新增坐席组管理功能，包含坐席组 CRUD、坐席账号管理（N:M 挂载）、组员管理、批量导入、操作日志等完整功能。

### 核心业务规则
- 一个坐席组只绑 1 客户，同一客户可被多个坐席组绑定（客户:坐席组 = 1:N）
- 绑定客户创建后不可修改（保护历史数据归属）
- 一个坐席账号可挂多个坐席组（N:M），每组独立配置坐席/组长角色
- 每组至少 1 名启用组长（不能全部移除）
- 分机号全局递增，不回收复用
- 坐席组不做物理删除，只做禁用
- 不区分"主组长"，多组长按加入时间排序

### 技术决策
- 后端服务：gt-system（复用现有账号/角色/客户体系）
- 坐席账号复用 `accounts` 表（accountType=agent），专有字段外置 `agent_account_ext` 扩展表
- 前端：Vue 3 + Ant Design Vue，遵循现有项目模式

## 2. 数据库设计

### 2.1 新增表

#### agent_groups（坐席组）

```sql
CREATE TABLE agent_groups (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(50)  NOT NULL COMMENT '坐席组名称，全局唯一',
  group_code      VARCHAR(30)  NOT NULL COMMENT '坐席组ID，格式 AG-yyyyMMdd-NNN',
  customer_code   VARCHAR(30)  NOT NULL COMMENT '绑定客户编码，1:1，不可改',
  status          TINYINT      NOT NULL DEFAULT 1 COMMENT '1=启用 0=禁用',
  remark          VARCHAR(200) DEFAULT NULL COMMENT '备注',
  delete_flag     TINYINT      NOT NULL DEFAULT 1 COMMENT '1=正常 2=删除（软删）',
  create_by       VARCHAR(50)  DEFAULT NULL,
  create_time     DATETIME     DEFAULT NULL,
  update_by       VARCHAR(50)  DEFAULT NULL,
  update_time     DATETIME     DEFAULT NULL,
  UNIQUE KEY uk_name (name),
  UNIQUE KEY uk_group_code (group_code),
  KEY idx_customer_code (customer_code),
  KEY idx_status (status)
) COMMENT '坐席组';
```

#### agent_account_ext（坐席账号扩展，1:1 关联 accounts）

```sql
CREATE TABLE agent_account_ext (
  id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
  account_id          BIGINT       NOT NULL COMMENT '关联 accounts.id',
  extension_number    INT          NOT NULL COMMENT '分机号，全局递增，自动分配',
  ext_assigned_time   DATETIME     DEFAULT NULL COMMENT '分机号分配时间',
  create_by           VARCHAR(50)  DEFAULT NULL,
  create_time         DATETIME     DEFAULT NULL,
  update_by           VARCHAR(50)  DEFAULT NULL,
  update_time         DATETIME     DEFAULT NULL,
  UNIQUE KEY uk_account_id (account_id),
  UNIQUE KEY uk_extension_number (extension_number)
) COMMENT '坐席账号扩展';
```

#### agent_group_members（坐席组成员，N:M 关系）

```sql
CREATE TABLE agent_group_members (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  group_id        BIGINT       NOT NULL COMMENT '关联 agent_groups.id',
  account_id      BIGINT       NOT NULL COMMENT '关联 accounts.id',
  roles           VARCHAR(30)  NOT NULL DEFAULT 'agent' COMMENT '本组角色：agent=坐席, leader=组长，逗号分隔可叠加如 leader,agent',
  status          TINYINT      NOT NULL DEFAULT 1 COMMENT '1=生效 0=移出',
  join_time       DATETIME     DEFAULT NULL COMMENT '加入时间',
  create_by       VARCHAR(50)  DEFAULT NULL,
  create_time     DATETIME     DEFAULT NULL,
  update_by       VARCHAR(50)  DEFAULT NULL,
  update_time     DATETIME     DEFAULT NULL,
  UNIQUE KEY uk_group_account (group_id, account_id),
  KEY idx_account_id (account_id),
  KEY idx_group_status (group_id, status)
) COMMENT '坐席组成员';
```

### 2.2 现有表变更

#### operation_logs 新增字段

```sql
ALTER TABLE operation_logs
  ADD COLUMN target_group_id    BIGINT       DEFAULT NULL COMMENT '关联坐席组ID',
  ADD COLUMN target_account_id  BIGINT       DEFAULT NULL COMMENT '关联被操作账号ID',
  ADD COLUMN operator_role      VARCHAR(100) DEFAULT NULL COMMENT '操作人角色上下文',
  ADD INDEX idx_target_group_id (target_group_id),
  ADD INDEX idx_target_account_id (target_account_id);
```

## 3. API 设计

### 3.1 坐席组 CRUD

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/agent-group/create` | 新建坐席组 |
| POST | `/agent-group/update` | 编辑坐席组（名称、备注；客户不可改） |
| GET | `/agent-group/query` | 分页查询列表 |
| GET | `/agent-group/detail/{id}` | 坐席组详情（含统计） |
| POST | `/agent-group/changeStatus` | 启用/禁用坐席组 |

**query 参数**：keyword（名称/ID）、customerCode、status、createTimeStart、createTimeEnd、pageNum、pageSize、sortField（createTime/memberCount）、sortOrder（asc/desc）

**query 返回**：每行含 memberCount（启用数）、disabledMemberCount（禁用数）、totalMemberCount、leaderSummary（组长头像+姓名列表）、customerName、customerStatus

**changeStatus 禁用时**：清除组内所有成员 Redis Token（复用 AccountServiceImpl forceLogout 逻辑）

**groupCode 生成规则**：`AG-yyyyMMdd-NNN`，查询当日 `SELECT MAX(CAST(SUBSTRING(group_code, -3) AS UNSIGNED)) FROM agent_groups WHERE group_code LIKE 'AG-{date}%'` +1

### 3.2 组员管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/agent-group/members` | 查询组内成员列表 |
| POST | `/agent-group/addMember` | 添加组员（邀请已有账号入组） |
| POST | `/agent-group/removeMember` | 移出本组 |
| POST | `/agent-group/updateMemberRoles` | 修改成员角色 |

**members 参数**：groupId、keyword（账号/姓名/分机号）、role（leader/agent/both）、status、pageNum、pageSize

**removeMember 校验**：不能移除本组最后一个启用组长

**updateMemberRoles 校验**：至少保留 1 个角色；取消组长时校验不能成为最后一个启用组长

### 3.3 坐席账号管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/agent-account/create` | 新增坐席账号 |
| POST | `/agent-account/update` | 编辑账号信息 |
| POST | `/agent-account/changeStatus` | 启用/停用账号 |
| POST | `/agent-account/resetPassword` | 重置密码 |
| GET | `/agent-account/detail/{id}` | 账号详情 |
| GET | `/agent-account/query` | 全局坐席账号列表 |
| POST | `/agent-account/batchImport` | 批量导入 |
| GET | `/agent-account/batchTemplate` | 下载批量导入模板 |
| POST | `/agent-account/mountGroups` | 管理挂载关系（diff 提交） |

**create 流程**：校验账号唯一 → 插入 accounts（accountType=agent）→ 分配分机号（max+1，唯一约束防并发，重试 3 次）→ 插入 agent_account_ext → 插入 agent_group_members → 记录日志 → 返回含密码

**changeStatus 停用时**：清除所有 Token → 影响所有挂载组 → 记录日志（含影响组数 N）

**resetPassword**：支持系统生成（12 位强密码）和手动设置（8-20 位，含大小写+数字），返回新密码，清除 Token，记录日志（不记录密码内容）

**batchImport**：解析 Excel → 逐行校验（账号唯一、角色合法）→ 批量插入 → 返回成功/失败明细。每行字段：账号（必填）、真实姓名（必填）、角色（必填，值域：坐席/组长/坐席|组长）、初始密码（选填）

**mountGroups**：diff 提交 — 传入 accountId + 新增挂载列表 [{groupId, roles}] + 移除列表 [groupId] + 角色变更列表 [{groupId, roles}]

### 3.4 操作日志

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/agent-group/logs` | 坐席组操作日志 |
| GET | `/agent-account/logs/{id}` | 账号相关操作日志 |

**logs 参数**：groupId、actionTypes（多选）、operatorName（模糊）、beginTime、endTime、keyword（匹配 actionDetail）、pageNum、pageSize

**账号详情联动**：账号详情抽屉内嵌操作日志，按 targetAccountId 过滤最近 10 条，底部"查看完整日志"跳转到坐席组日志 Tab 并自动按该账号筛选

### 3.5 操作类型枚举

| actionType | 详情模板 | 标签色 |
|------------|----------|--------|
| CREATE_GROUP | 创建坐席组「{name}」，绑定客户「{customer}」 | 绿 |
| EDIT_GROUP | 修改{字段名}：「{old}」→「{new}」 | 蓝 |
| ENABLE_GROUP | 启用坐席组（影响 N 个账号登录） | 绿 |
| DISABLE_GROUP | 禁用坐席组（影响 N 个账号登录） | 橙 |
| CREATE_ACCOUNT | 新增账号「{account}」（{realname}），角色：{role} | 绿 |
| BATCH_IMPORT | 批量上传账号 N 条，成功 X 条 / 失败 Y 条 | 蓝 |
| EDIT_ACCOUNT | 编辑账号「{account}」：{字段名}「{old}」→「{new}」 | 蓝 |
| ENABLE_ACCOUNT | 启用账号「{account}」（{realname}）（影响 N 个挂载坐席组） | 绿 |
| DISABLE_ACCOUNT | 停用账号「{account}」（{realname}）（影响 N 个挂载坐席组） | 橙 |
| RESET_PASSWORD | 重置账号「{account}」密码（方式：系统生成 / 手动设置） | 蓝 |
| SET_LEADER | 给「{account}（{realname}）」添加「组长」角色（在 {group}） | 紫 |
| REMOVE_LEADER | 移除「{account}（{realname}）」的「组长」角色（在 {group}） | 紫 |
| SET_AGENT | 给「{account}（{realname}）」添加「坐席」角色（在 {group}） | 紫 |
| REMOVE_AGENT | 移除「{account}（{realname}）」的「坐席」角色（在 {group}） | 紫 |
| MOUNT_GROUP | 将账号「{account}（{realname}）」挂载到坐席组「{group}」（角色：{role}） | 紫 |
| UNMOUNT_GROUP | 将账号「{account}（{realname}）」从坐席组「{group}」移出 | 橙 |
| ASSIGN_EXTENSION | 系统自动分配分机号 {ext} 给「{account}」 | 金 |

### 3.6 操作日志隐私与安全

- 密码内容不入库，重置密码日志仅记录方式和动作
- 日志创建后任何角色不可修改/删除
- 系统操作统一以 operatorId=NULL、operatorRole=system 入库
- 操作人列显示：账号名 + 角色后缀（admin / 组长（在 {group}）/ 坐席（在 {group}）/ 系统）
- 常规日志保留 365 天，CREATE_GROUP / DISABLE_GROUP / BATCH_IMPORT / RESET_PASSWORD 长期保留

## 4. 后端 Java 结构

### 4.1 gt-system 新增包

```
com.gt.system
├── controller/
│   ├── AgentGroupController.java
│   └── AgentAccountController.java
├── service/
│   ├── AgentGroupService.java
│   ├── AgentAccountService.java
│   └── impl/
│       ├── AgentGroupServiceImpl.java
│       └── AgentAccountServiceImpl.java
├── mapper/
│   ├── AgentGroupMapper.java
│   ├── AgentAccountExtMapper.java
│   └── AgentGroupMemberMapper.java
├── domain/
│   ├── entity/
│   │   ├── AgentGroup.java
│   │   ├── AgentAccountExt.java
│   │   └── AgentGroupMember.java
│   ├── dto/
│   │   ├── AgentGroupCreateDTO.java
│   │   ├── AgentGroupUpdateDTO.java
│   │   ├── AgentGroupQueryDTO.java
│   │   ├── AgentMemberAddDTO.java
│   │   ├── AgentMemberRoleUpdateDTO.java
│   │   ├── AgentAccountCreateDTO.java
│   │   ├── AgentAccountUpdateDTO.java
│   │   ├── AgentAccountQueryDTO.java
│   │   ├── AgentAccountMountDTO.java
│   │   └── AgentBatchImportDTO.java
│   └── response/
│       ├── AgentGroupQueryResponse.java
│       ├── AgentGroupDetailResponse.java
│       ├── AgentMemberResponse.java
│       ├── AgentAccountQueryResponse.java
│       ├── AgentAccountDetailResponse.java
│       └── AgentBatchImportResult.java
```

### 4.2 关键服务逻辑

**AgentGroupServiceImpl**：
- create：校验名称唯一 → 生成 groupCode → 插入 → 记录 CREATE_GROUP 日志
- query：分页 + 客户权限过滤 + 关联查询客户名/组长/人数统计
- changeStatus：禁用时清除组内所有成员 Token → 记录 ENABLE_GROUP/DISABLE_GROUP 日志
- addMember：校验账号存在且 accountType=agent → 校验不重复挂载 → 插入 member → 记录 MOUNT_GROUP 日志
- removeMember：校验不能移除最后一个启用组长 → 软删 → 记录 UNMOUNT_GROUP 日志
- updateMemberRoles：修改 roles → 校验至少 1 个角色 + 组长数 → 记录 SET_LEADER/REMOVE_LEADER 等日志

**AgentAccountServiceImpl**：
- create：校验 → 插入 accounts → 分配分机号 → 插入 ext → 插入 members → 记录 CREATE_ACCOUNT + ASSIGN_EXTENSION 日志
- resetPassword：重置 → 清除 Token → 记录 RESET_PASSWORD 日志（不记录密码内容）
- changeStatus：停用 → 清除 Token → 记录 ENABLE_ACCOUNT/DISABLE_ACCOUNT 日志（含影响组数 N）
- batchImport：解析 Excel → 校验 → 批量插入 → 记录 BATCH_IMPORT 日志
- mountGroups：diff 提交 → 新增/移除/修改角色 → 记录 MOUNT_GROUP/UNMOUNT_GROUP/SET_LEADER 等日志

## 5. 前端架构

### 5.1 路由

| 路径 | 组件 | 说明 |
|------|------|------|
| `/account/agent-group` | `views/account/agent-group/index.vue` | 坐席组列表 |
| `/account/agent-group/detail/:id` | `views/account/agent-group/detail.vue` | 坐席组详情 |
| `/account/agent-account` | `views/account/agent-account/index.vue` | 坐席账号全局管理页 |

### 5.2 组件结构

```
src/views/account/agent-group/
├── index.vue
├── detail.vue
├── vue/
│   ├── GroupDrawer.vue           # 新建/编辑坐席组抽屉
│   ├── MemberTable.vue           # 组员表格
│   ├── AddMemberDropdown.vue     # 添加组员下拉菜单
│   ├── InviteAccountModal.vue    # 邀请已有账号入组弹窗
│   └── GroupLogTable.vue         # 操作日志表格

src/views/account/agent-account/
├── index.vue
├── vue/
│   ├── AccountDrawer.vue         # 新增/编辑账号抽屉
│   ├── AccountDetailDrawer.vue   # 账号详情抽屉
│   ├── MountGroupDrawer.vue      # 管理坐席组挂载抽屉
│   ├── BatchUploadDrawer.vue     # 批量上传抽屉
│   ├── PwdRevealModal.vue        # 密码一次性展示弹窗
│   ├── ResetPwdModal.vue         # 重置密码弹窗
│   └── CrossGroupConfirmModal.vue # 跨组影响二次确认弹窗
```

### 5.3 API 模块

```
src/api/agent-group/
├── index.ts
└── type.ts

src/api/agent-account/
├── index.ts
└── type.ts
```

### 5.4 权限配置

在 `src/config/permission.ts` 的 account_permission 节点下新增：

```
agent_group (坐席组管理)
  ├── agent_group_view       # 查看
  ├── agent_group_add        # 新建
  ├── agent_group_edit       # 编辑
  ├── agent_group_enable     # 启用/禁用
  ├── agent_member_manage    # 组员管理
  ├── agent_account_manage   # 坐席账号管理
  └── agent_batch_import     # 批量导入
```

pagePermission.ts 新增映射：
- agent-group → agent_group
- agent-account → agent_account_manage

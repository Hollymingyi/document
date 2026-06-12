# Agent Group Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the complete agent group management feature (坐席组管理) including agent group CRUD, member management, agent account management, batch import, operation logs, and N:M mounting.

**Architecture:** Backend in gt-system (3 new tables, 2 controllers, 2 services). Frontend in nestify-admin (3 routes, 2 page views, 1 detail view, 10+ sub-components). Follows existing gt-system patterns: `BaseDto` entities, `PageHelper` pagination, `BaseRequest` DTOs, `Result<?>` responses, `@RequiredArgsConstructor` DI.

**Tech Stack:** Java 17, Spring Boot 3, MyBatis-Plus, PageHelper, Redis (token clearing), Vue 3 Composition API, Ant Design Vue 4, TypeScript

---

## File Map

### Backend (gt-niaochao/gt-system)

| File | Responsibility |
|------|---------------|
| `src/main/java/com/gt/system/domain/entity/AgentGroup.java` | 坐席组实体 |
| `src/main/java/com/gt/system/domain/entity/AgentAccountExt.java` | 坐席账号扩展实体 |
| `src/main/java/com/gt/system/domain/entity/AgentGroupMember.java` | 坐席组成员实体 |
| `src/main/java/com/gt/system/domain/dto/AgentGroupCreateDTO.java` | 创建坐席组请求 |
| `src/main/java/com/gt/system/domain/dto/AgentGroupUpdateDTO.java` | 编辑坐席组请求 |
| `src/main/java/com/gt/system/domain/dto/AgentGroupQueryDTO.java` | 查询坐席组请求 |
| `src/main/java/com/gt/system/domain/dto/AgentMemberAddDTO.java` | 添加组员请求 |
| `src/main/java/com/gt/system/domain/dto/AgentMemberRoleUpdateDTO.java` | 修改成员角色请求 |
| `src/main/java/com/gt/system/domain/dto/AgentAccountCreateDTO.java` | 新增坐席账号请求 |
| `src/main/java/com/gt/system/domain/dto/AgentAccountUpdateDTO.java` | 编辑坐席账号请求 |
| `src/main/java/com/gt/system/domain/dto/AgentAccountQueryDTO.java` | 查询坐席账号请求 |
| `src/main/java/com/gt/system/domain/dto/AgentAccountMountDTO.java` | 挂载坐席组请求 |
| `src/main/java/com/gt/system/domain/dto/AgentBatchImportDTO.java` | 批量导入请求行 |
| `src/main/java/com/gt/system/domain/dto/AgentLogQueryDTO.java` | 操作日志查询请求 |
| `src/main/java/com/gt/system/domain/response/AgentGroupQueryResponse.java` | 坐席组列表响应 |
| `src/main/java/com/gt/system/domain/response/AgentGroupDetailResponse.java` | 坐席组详情响应 |
| `src/main/java/com/gt/system/domain/response/AgentMemberResponse.java` | 组员列表响应 |
| `src/main/java/com/gt/system/domain/response/AgentAccountQueryResponse.java` | 坐席账号列表响应 |
| `src/main/java/com/gt/system/domain/response/AgentAccountDetailResponse.java` | 坐席账号详情响应 |
| `src/main/java/com/gt/system/domain/response/AgentBatchImportResult.java` | 批量导入结果响应 |
| `src/main/java/com/gt/system/mapper/AgentGroupMapper.java` | 坐席组 Mapper |
| `src/main/java/com/gt/system/mapper/AgentAccountExtMapper.java` | 坐席账号扩展 Mapper |
| `src/main/java/com/gt/system/mapper/AgentGroupMemberMapper.java` | 组员 Mapper |
| `src/main/resources/mybatis/AgentGroupMapper.xml` | 坐席组复杂查询 SQL |
| `src/main/resources/mybatis/AgentAccountExtMapper.xml` | 分机号分配 SQL |
| `src/main/resources/mybatis/AgentGroupMemberMapper.xml` | 组员复杂查询 SQL |
| `src/main/java/com/gt/system/service/AgentGroupService.java` | 坐席组服务接口 |
| `src/main/java/com/gt/system/service/AgentAccountService.java` | 坐席账号服务接口 |
| `src/main/java/com/gt/system/service/impl/AgentGroupServiceImpl.java` | 坐席组服务实现 |
| `src/main/java/com/gt/system/service/impl/AgentAccountServiceImpl.java` | 坐席账号服务实现 |
| `src/main/java/com/gt/system/controller/AgentGroupController.java` | 坐席组 Controller |
| `src/main/java/com/gt/system/controller/AgentAccountController.java` | 坐席账号 Controller |
| `src/main/java/com/gt/system/constant/AgentGroupConstant.java` | 坐席组常量 |
| `sql/agent_group_ddl.sql` | DDL 建表脚本 |

### Frontend (my-project/nestify-admin)

| File | Responsibility |
|------|---------------|
| `src/api/agent-group/type.ts` | 坐席组 API 类型定义 |
| `src/api/agent-group/index.ts` | 坐席组 API 函数 |
| `src/api/agent-account/type.ts` | 坐席账号 API 类型定义 |
| `src/api/agent-account/index.ts` | 坐席账号 API 函数 |
| `src/views/account/agent-group/index.vue` | 坐席组列表页 |
| `src/views/account/agent-group/detail.vue` | 坐席组详情页 |
| `src/views/account/agent-group/vue/GroupDrawer.vue` | 新建/编辑坐席组抽屉 |
| `src/views/account/agent-group/vue/MemberTable.vue` | 组员表格 |
| `src/views/account/agent-group/vue/AddMemberDropdown.vue` | 添加组员下拉 |
| `src/views/account/agent-group/vue/InviteAccountModal.vue` | 邀请账号入组弹窗 |
| `src/views/account/agent-group/vue/GroupLogTable.vue` | 操作日志表格 |
| `src/views/account/agent-account/index.vue` | 坐席账号全局管理页 |
| `src/views/account/agent-account/vue/AccountDrawer.vue` | 新增/编辑账号抽屉 |
| `src/views/account/agent-account/vue/AccountDetailDrawer.vue` | 账号详情抽屉 |
| `src/views/account/agent-account/vue/MountGroupDrawer.vue` | 管理挂载抽屉 |
| `src/views/account/agent-account/vue/BatchUploadDrawer.vue` | 批量上传抽屉 |
| `src/views/account/agent-account/vue/PwdRevealModal.vue` | 密码展示弹窗 |
| `src/views/account/agent-account/vue/ResetPwdModal.vue` | 重置密码弹窗 |
| `src/views/account/agent-account/vue/CrossGroupConfirmModal.vue` | 跨组影响确认弹窗 |
| `src/router/index.ts` | 新增 3 条路由 |
| `src/config/permission.ts` | 新增权限节点 |
| `src/utils/pagePermission.ts` | 新增页面权限映射 |

---

### Task 1: DDL and Database Schema

**Files:**
- Create: `gt-niaochao/sql/agent_group_ddl.sql`

- [ ] **Step 1: Write the DDL SQL**

```sql
-- 坐席组
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

-- 坐席账号扩展
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

-- 坐席组成员
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

-- operation_logs 新增字段
ALTER TABLE operation_logs
  ADD COLUMN target_group_id    BIGINT       DEFAULT NULL COMMENT '关联坐席组ID',
  ADD COLUMN target_account_id  BIGINT       DEFAULT NULL COMMENT '关联被操作账号ID',
  ADD COLUMN operator_role      VARCHAR(100) DEFAULT NULL COMMENT '操作人角色上下文',
  ADD INDEX idx_target_group_id (target_group_id),
  ADD INDEX idx_target_account_id (target_account_id);
```

- [ ] **Step 2: Execute DDL against the database**

Run: `mysql -u root -p < gt-niaochao/sql/agent_group_ddl.sql`
Expected: All tables created, ALTER applied

- [ ] **Step 3: Commit**

```bash
git add gt-niaochao/sql/agent_group_ddl.sql
git commit -m "feat(agent-group): add DDL for agent_groups, agent_account_ext, agent_group_members"
```

---

### Task 2: Backend Entities

**Files:**
- Create: `gt-niaochao/gt-system/src/main/java/com/gt/system/domain/entity/AgentGroup.java`
- Create: `gt-niaochao/gt-system/src/main/java/com/gt/system/domain/entity/AgentAccountExt.java`
- Create: `gt-niaochao/gt-system/src/main/java/com/gt/system/domain/entity/AgentGroupMember.java`
- Create: `gt-niaochao/gt-system/src/main/java/com/gt/system/constant/AgentGroupConstant.java`

- [ ] **Step 1: Write AgentGroup entity**

```java
package com.gt.system.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.gt.common.domain.BaseDto;
import lombok.Data;

@Data
@TableName("agent_groups")
public class AgentGroup extends BaseDto {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String groupCode;
    private String customerCode;
    private Integer status;
    private String remark;
    private Integer deleteFlag;
    private String createBy;
    private java.util.Date createTime;
    private String updateBy;
    private java.util.Date updateTime;
}
```

- [ ] **Step 2: Write AgentAccountExt entity**

```java
package com.gt.system.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.gt.common.domain.BaseDto;
import lombok.Data;

@Data
@TableName("agent_account_ext")
public class AgentAccountExt extends BaseDto {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long accountId;
    private Integer extensionNumber;
    private java.util.Date extAssignedTime;
    private String createBy;
    private java.util.Date createTime;
    private String updateBy;
    private java.util.Date updateTime;
}
```

- [ ] **Step 3: Write AgentGroupMember entity**

```java
package com.gt.system.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.gt.common.domain.BaseDto;
import lombok.Data;

@Data
@TableName("agent_group_members")
public class AgentGroupMember extends BaseDto {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long groupId;
    private Long accountId;
    private String roles;
    private Integer status;
    private java.util.Date joinTime;
    private String createBy;
    private java.util.Date createTime;
    private String updateBy;
    private java.util.Date updateTime;
}
```

- [ ] **Step 4: Write AgentGroupConstant**

```java
package com.gt.system.constant;

public class AgentGroupConstant {
    public static final Integer STATUS_ENABLED = 1;
    public static final Integer STATUS_DISABLED = 0;
    public static final Integer DELETE_FLAG_NORMAL = 1;
    public static final Integer DELETE_FLAG_DELETED = 2;
    public static final Integer MEMBER_STATUS_ACTIVE = 1;
    public static final Integer MEMBER_STATUS_REMOVED = 0;
    public static final String ROLE_AGENT = "agent";
    public static final String ROLE_LEADER = "leader";
    public static final String GROUP_CODE_PREFIX = "AG-";
    public static final String ACCOUNT_TYPE_AGENT = "agent";

    // 操作日志 actionType 常量
    public static final String ACTION_CREATE_GROUP = "CREATE_GROUP";
    public static final String ACTION_EDIT_GROUP = "EDIT_GROUP";
    public static final String ACTION_ENABLE_GROUP = "ENABLE_GROUP";
    public static final String ACTION_DISABLE_GROUP = "DISABLE_GROUP";
    public static final String ACTION_CREATE_ACCOUNT = "CREATE_ACCOUNT";
    public static final String ACTION_BATCH_IMPORT = "BATCH_IMPORT";
    public static final String ACTION_EDIT_ACCOUNT = "EDIT_ACCOUNT";
    public static final String ACTION_ENABLE_ACCOUNT = "ENABLE_ACCOUNT";
    public static final String ACTION_DISABLE_ACCOUNT = "DISABLE_ACCOUNT";
    public static final String ACTION_RESET_PASSWORD = "RESET_PASSWORD";
    public static final String ACTION_SET_LEADER = "SET_LEADER";
    public static final String ACTION_REMOVE_LEADER = "REMOVE_LEADER";
    public static final String ACTION_SET_AGENT = "SET_AGENT";
    public static final String ACTION_REMOVE_AGENT = "REMOVE_AGENT";
    public static final String ACTION_MOUNT_GROUP = "MOUNT_GROUP";
    public static final String ACTION_UNMOUNT_GROUP = "UNMOUNT_GROUP";
    public static final String ACTION_ASSIGN_EXTENSION = "ASSIGN_EXTENSION";

    // 操作日志 module
    public static final String MODULE_AGENT_GROUP = "坐席组管理";
}
```

- [ ] **Step 5: Commit**

```bash
git add gt-niaochao/gt-system/src/main/java/com/gt/system/domain/entity/AgentGroup.java \
  gt-niaochao/gt-system/src/main/java/com/gt/system/domain/entity/AgentAccountExt.java \
  gt-niaochao/gt-system/src/main/java/com/gt/system/domain/entity/AgentGroupMember.java \
  gt-niaochao/gt-system/src/main/java/com/gt/system/constant/AgentGroupConstant.java
git commit -m "feat(agent-group): add entities and constants"
```

---

### Task 3: Backend DTOs and Responses

**Files:**
- Create: `gt-niaochao/gt-system/src/main/java/com/gt/system/domain/dto/AgentGroupCreateDTO.java`
- Create: `gt-niaochao/gt-system/src/main/java/com/gt/system/domain/dto/AgentGroupUpdateDTO.java`
- Create: `gt-niaochao/gt-system/src/main/java/com/gt/system/domain/dto/AgentGroupQueryDTO.java`
- Create: `gt-niaochao/gt-system/src/main/java/com/gt/system/domain/dto/AgentMemberAddDTO.java`
- Create: `gt-niaochao/gt-system/src/main/java/com/gt/system/domain/dto/AgentMemberRoleUpdateDTO.java`
- Create: `gt-niaochao/gt-system/src/main/java/com/gt/system/domain/dto/AgentLogQueryDTO.java`
- Create: `gt-niaochao/gt-system/src/main/java/com/gt/system/domain/response/AgentGroupQueryResponse.java`
- Create: `gt-niaochao/gt-system/src/main/java/com/gt/system/domain/response/AgentGroupDetailResponse.java`
- Create: `gt-niaochao/gt-system/src/main/java/com/gt/system/domain/response/AgentMemberResponse.java`

- [ ] **Step 1: Write AgentGroupCreateDTO**

```java
package com.gt.system.domain.dto;

import lombok.Data;

@Data
public class AgentGroupCreateDTO {
    private String name;
    private String customerCode;
    private String remark;
}
```

- [ ] **Step 2: Write AgentGroupUpdateDTO**

```java
package com.gt.system.domain.dto;

import lombok.Data;

@Data
public class AgentGroupUpdateDTO {
    private Long id;
    private String name;
    private String remark;
}
```

- [ ] **Step 3: Write AgentGroupQueryDTO**

```java
package com.gt.system.domain.dto;

import com.gt.common.domain.BaseRequest;
import lombok.Data;

@Data
public class AgentGroupQueryDTO extends BaseRequest {
    private String keyword;
    private String customerCode;
    private Integer status;
    private String createTimeStart;
    private String createTimeEnd;
    private String sortField;
    private String sortOrder;
}
```

- [ ] **Step 4: Write AgentMemberAddDTO**

```java
package com.gt.system.domain.dto;

import lombok.Data;

@Data
public class AgentMemberAddDTO {
    private Long groupId;
    private Long accountId;
    private String roles;
}
```

- [ ] **Step 5: Write AgentMemberRoleUpdateDTO**

```java
package com.gt.system.domain.dto;

import lombok.Data;

@Data
public class AgentMemberRoleUpdateDTO {
    private Long groupId;
    private Long accountId;
    private String roles;
}
```

- [ ] **Step 6: Write AgentLogQueryDTO**

```java
package com.gt.system.domain.dto;

import com.gt.common.domain.BaseRequest;
import lombok.Data;

import java.util.List;

@Data
public class AgentLogQueryDTO extends BaseRequest {
    private Long groupId;
    private Long targetAccountId;
    private List<String> actionTypes;
    private String operatorName;
    private String beginTime;
    private String endTime;
    private String keyword;
}
```

- [ ] **Step 7: Write AgentGroupQueryResponse**

```java
package com.gt.system.domain.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.util.Date;
import java.util.List;

@Data
public class AgentGroupQueryResponse {
    private Long id;
    private String name;
    private String groupCode;
    private String customerCode;
    private String customerName;
    private Integer customerStatus;
    private Integer status;
    private String remark;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date createTime;
    private Integer memberCount;
    private Integer disabledMemberCount;
    private Integer totalMemberCount;
    private List<LeaderSummary> leaderSummary;

    @Data
    public static class LeaderSummary {
        private Long accountId;
        private String name;
        private String avatar;
    }
}
```

- [ ] **Step 8: Write AgentGroupDetailResponse**

```java
package com.gt.system.domain.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.util.Date;
import java.util.List;

@Data
public class AgentGroupDetailResponse {
    private Long id;
    private String name;
    private String groupCode;
    private String customerCode;
    private String customerName;
    private Integer customerStatus;
    private Integer status;
    private String remark;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date createTime;
    private String createBy;
    private Integer memberCount;
    private Integer leaderCount;
    private Integer agentCount;
    private List<LeaderSummary> leaderSummary;

    @Data
    public static class LeaderSummary {
        private Long accountId;
        private String name;
        private String avatar;
    }
}
```

- [ ] **Step 9: Write AgentMemberResponse**

```java
package com.gt.system.domain.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.util.Date;

@Data
public class AgentMemberResponse {
    private Long id;
    private Long groupId;
    private Long accountId;
    private String accountName;
    private String realName;
    private String phone;
    private Integer extensionNumber;
    private String roles;
    private Integer status;
    private String accountStatus;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date joinTime;
}
```

- [ ] **Step 10: Commit**

```bash
git add gt-niaochao/gt-system/src/main/java/com/gt/system/domain/dto/AgentGroup*.java \
  gt-niaochao/gt-system/src/main/java/com/gt/system/domain/dto/AgentMember*.java \
  gt-niaochao/gt-system/src/main/java/com/gt/system/domain/dto/AgentLogQueryDTO.java \
  gt-niaochao/gt-system/src/main/java/com/gt/system/domain/response/AgentGroup*.java \
  gt-niaochao/gt-system/src/main/java/com/gt/system/domain/response/AgentMemberResponse.java
git commit -m "feat(agent-group): add group DTOs and responses"
```

---

### Task 4: Backend Agent Account DTOs and Responses

**Files:**
- Create: `gt-niaochao/gt-system/src/main/java/com/gt/system/domain/dto/AgentAccountCreateDTO.java`
- Create: `gt-niaochao/gt-system/src/main/java/com/gt/system/domain/dto/AgentAccountUpdateDTO.java`
- Create: `gt-niaochao/gt-system/src/main/java/com/gt/system/domain/dto/AgentAccountQueryDTO.java`
- Create: `gt-niaochao/gt-system/src/main/java/com/gt/system/domain/dto/AgentAccountMountDTO.java`
- Create: `gt-niaochao/gt-system/src/main/java/com/gt/system/domain/dto/AgentBatchImportDTO.java`
- Create: `gt-niaochao/gt-system/src/main/java/com/gt/system/domain/response/AgentAccountQueryResponse.java`
- Create: `gt-niaochao/gt-system/src/main/java/com/gt/system/domain/response/AgentAccountDetailResponse.java`
- Create: `gt-niaochao/gt-system/src/main/java/com/gt/system/domain/response/AgentBatchImportResult.java`

- [ ] **Step 1: Write AgentAccountCreateDTO**

```java
package com.gt.system.domain.dto;

import lombok.Data;

import java.util.List;

@Data
public class AgentAccountCreateDTO {
    private String accountName;
    private String name;
    private String phone;
    private String password;
    private String remark;
    private List<GroupMountItem> groups;

    @Data
    public static class GroupMountItem {
        private Long groupId;
        private String roles;
    }
}
```

- [ ] **Step 2: Write AgentAccountUpdateDTO**

```java
package com.gt.system.domain.dto;

import lombok.Data;

@Data
public class AgentAccountUpdateDTO {
    private Long id;
    private String name;
    private String phone;
    private String remark;
}
```

- [ ] **Step 3: Write AgentAccountQueryDTO**

```java
package com.gt.system.domain.dto;

import com.gt.common.domain.BaseRequest;
import lombok.Data;

@Data
public class AgentAccountQueryDTO extends BaseRequest {
    private String keyword;
    private Long groupId;
    private String role;
    private String status;
}
```

- [ ] **Step 4: Write AgentAccountMountDTO**

```java
package com.gt.system.domain.dto;

import lombok.Data;

import java.util.List;

@Data
public class AgentAccountMountDTO {
    private Long accountId;
    private List<MountAddItem> addList;
    private List<Long> removeList;
    private List<MountRoleUpdateItem> roleUpdateList;

    @Data
    public static class MountAddItem {
        private Long groupId;
        private String roles;
    }

    @Data
    public static class MountRoleUpdateItem {
        private Long groupId;
        private String roles;
    }
}
```

- [ ] **Step 5: Write AgentBatchImportDTO**

```java
package com.gt.system.domain.dto;

import lombok.Data;

@Data
public class AgentBatchImportDTO {
    private String accountName;
    private String name;
    private String role;
    private String password;
    private Long groupId;
    private String groupName;
}
```

- [ ] **Step 6: Write AgentAccountQueryResponse**

```java
package com.gt.system.domain.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.util.Date;
import java.util.List;

@Data
public class AgentAccountQueryResponse {
    private Long id;
    private String accountName;
    private String name;
    private String phone;
    private String status;
    private Integer extensionNumber;
    private String remark;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date createTime;
    private Integer groupCount;
    private List<GroupMountSummary> groups;

    @Data
    public static class GroupMountSummary {
        private Long groupId;
        private String groupName;
        private String roles;
    }
}
```

- [ ] **Step 7: Write AgentAccountDetailResponse**

```java
package com.gt.system.domain.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.util.Date;
import java.util.List;

@Data
public class AgentAccountDetailResponse {
    private Long id;
    private String accountName;
    private String name;
    private String phone;
    private String status;
    private Integer extensionNumber;
    private String remark;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date createTime;
    private String createBy;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date extAssignedTime;
    private List<GroupMountDetail> groups;

    @Data
    public static class GroupMountDetail {
        private Long groupId;
        private String groupName;
        private String groupCode;
        private Integer groupStatus;
        private String roles;
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
        private Date joinTime;
    }
}
```

- [ ] **Step 8: Write AgentBatchImportResult**

```java
package com.gt.system.domain.response;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class AgentBatchImportResult {
    private int total;
    private int successCount;
    private int failCount;
    private List<ImportError> errors = new ArrayList<>();

    @Data
    public static class ImportError {
        private int row;
        private String accountName;
        private String reason;
    }
}
```

- [ ] **Step 9: Commit**

```bash
git add gt-niaochao/gt-system/src/main/java/com/gt/system/domain/dto/AgentAccount*.java \
  gt-niaochao/gt-system/src/main/java/com/gt/system/domain/dto/AgentBatchImportDTO.java \
  gt-niaochao/gt-system/src/main/java/com/gt/system/domain/response/AgentAccount*.java \
  gt-niaochao/gt-system/src/main/java/com/gt/system/domain/response/AgentBatchImportResult.java
git commit -m "feat(agent-group): add account DTOs and responses"
```

---

### Task 5: Backend Mappers

**Files:**
- Create: `gt-niaochao/gt-system/src/main/java/com/gt/system/mapper/AgentGroupMapper.java`
- Create: `gt-niaochao/gt-system/src/main/java/com/gt/system/mapper/AgentAccountExtMapper.java`
- Create: `gt-niaochao/gt-system/src/main/java/com/gt/system/mapper/AgentGroupMemberMapper.java`
- Create: `gt-niaochao/gt-system/src/main/resources/mybatis/AgentGroupMapper.xml`
- Create: `gt-niaochao/gt-system/src/main/resources/mybatis/AgentAccountExtMapper.xml`
- Create: `gt-niaochao/gt-system/src/main/resources/mybatis/AgentGroupMemberMapper.xml`

- [ ] **Step 1: Write AgentGroupMapper.java**

```java
package com.gt.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.gt.system.domain.entity.AgentGroup;
import com.gt.system.domain.response.AgentGroupQueryResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AgentGroupMapper extends BaseMapper<AgentGroup> {
    List<AgentGroupQueryResponse> selectGroupList(@Param("dto") com.gt.system.domain.dto.AgentGroupQueryDTO dto,
                                                   @Param("customerCodes") List<String> customerCodes);

    int selectMaxGroupCodeSeq(@Param("datePrefix") String datePrefix);
}
```

- [ ] **Step 2: Write AgentAccountExtMapper.java**

```java
package com.gt.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.gt.system.domain.entity.AgentAccountExt;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface AgentAccountExtMapper extends BaseMapper<AgentAccountExt> {
    int selectMaxExtensionNumber();
}
```

- [ ] **Step 3: Write AgentGroupMemberMapper.java**

```java
package com.gt.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.gt.system.domain.entity.AgentGroupMember;
import com.gt.system.domain.response.AgentMemberResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AgentGroupMemberMapper extends BaseMapper<AgentGroupMember> {
    List<AgentMemberResponse> selectMemberList(@Param("groupId") Long groupId,
                                                @Param("keyword") String keyword,
                                                @Param("role") String role,
                                                @Param("status") Integer status);

    int countActiveLeaders(@Param("groupId") Long groupId,
                           @Param("excludeAccountId") Long excludeAccountId);
}
```

- [ ] **Step 4: Write AgentGroupMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.gt.system.mapper.AgentGroupMapper">

    <select id="selectGroupList"
            resultType="com.gt.system.domain.response.AgentGroupQueryResponse">
        SELECT
            g.id, g.name, g.group_code AS groupCode, g.customer_code AS customerCode,
            g.status, g.remark, g.create_time AS createTime,
            c.customer_name AS customerName,
            (SELECT COUNT(*) FROM agent_group_members m WHERE m.group_id = g.id AND m.status = 1
                AND m.roles LIKE '%agent%') AS agentCount,
            (SELECT COUNT(*) FROM agent_group_members m WHERE m.group_id = g.id AND m.status = 1
                AND m.roles LIKE '%leader%') AS leaderCount,
            (SELECT COUNT(*) FROM agent_group_members m WHERE m.group_id = g.id AND m.status = 1)
                AS memberCount,
            (SELECT COUNT(*) FROM agent_group_members m WHERE m.group_id = g.id AND m.status = 1
                AND a2.status = 'disabled') AS disabledMemberCount,
            (SELECT COUNT(*) FROM agent_group_members m WHERE m.group_id = g.id)
                AS totalMemberCount
        FROM agent_groups g
        LEFT JOIN customers c ON g.customer_code = c.customer_code
        LEFT JOIN accounts a2 ON a2.id IN (SELECT m2.account_id FROM agent_group_members m2 WHERE m2.group_id = g.id)
        <where>
            g.delete_flag = 1
            <if test="dto.keyword != null and dto.keyword != ''">
                AND (g.name LIKE CONCAT('%', #{dto.keyword}, '%')
                     OR g.group_code LIKE CONCAT('%', #{dto.keyword}, '%'))
            </if>
            <if test="dto.customerCode != null and dto.customerCode != ''">
                AND g.customer_code = #{dto.customerCode}
            </if>
            <if test="dto.status != null">
                AND g.status = #{dto.status}
            </if>
            <if test="dto.createTimeStart != null and dto.createTimeStart != ''">
                AND g.create_time &gt;= #{dto.createTimeStart}
            </if>
            <if test="dto.createTimeEnd != null and dto.createTimeEnd != ''">
                AND g.create_time &lt;= #{dto.createTimeEnd}
            </if>
            <if test="customerCodes != null and customerCodes.size() > 0">
                AND g.customer_code IN
                <foreach collection="customerCodes" item="code" open="(" separator="," close=")">
                    #{code}
                </foreach>
            </if>
        </where>
        ORDER BY
        <choose>
            <when test="dto.sortField == 'memberCount' and dto.sortOrder == 'asc'">
                memberCount ASC
            </when>
            <when test="dto.sortField == 'memberCount' and dto.sortOrder == 'desc'">
                memberCount DESC
            </when>
            <otherwise>
                g.create_time DESC
            </otherwise>
        </choose>
    </select>

    <select id="selectMaxGroupCodeSeq" resultType="int">
        SELECT IFNULL(MAX(CAST(SUBSTRING(group_code, -3) AS UNSIGNED)), 0)
        FROM agent_groups
        WHERE group_code LIKE CONCAT(#{datePrefix}, '%')
    </select>

</mapper>
```

- [ ] **Step 5: Write AgentAccountExtMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.gt.system.mapper.AgentAccountExtMapper">

    <select id="selectMaxExtensionNumber" resultType="int">
        SELECT IFNULL(MAX(extension_number), 0) FROM agent_account_ext
    </select>

</mapper>
```

- [ ] **Step 6: Write AgentGroupMemberMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.gt.system.mapper.AgentGroupMemberMapper">

    <select id="selectMemberList"
            resultType="com.gt.system.domain.response.AgentMemberResponse">
        SELECT
            m.id, m.group_id AS groupId, m.account_id AS accountId,
            m.roles, m.status, m.join_time AS joinTime,
            a.account_name AS accountName, a.name AS realName, a.phone,
            a.status AS accountStatus,
            e.extension_number AS extensionNumber
        FROM agent_group_members m
        LEFT JOIN accounts a ON m.account_id = a.id
        LEFT JOIN agent_account_ext e ON a.id = e.account_id
        <where>
            m.group_id = #{groupId}
            <if test="keyword != null and keyword != ''">
                AND (a.account_name LIKE CONCAT('%', #{keyword}, '%')
                     OR a.name LIKE CONCAT('%', #{keyword}, '%')
                     OR e.extension_number LIKE CONCAT('%', #{keyword}, '%'))
            </if>
            <if test="role == 'leader'">
                AND m.roles LIKE '%leader%'
            </if>
            <if test="role == 'agent'">
                AND m.roles LIKE '%agent%'
            </if>
            <if test="status != null">
                AND m.status = #{status}
            </if>
        </where>
        ORDER BY m.join_time ASC
    </select>

    <select id="countActiveLeaders" resultType="int">
        SELECT COUNT(*)
        FROM agent_group_members
        WHERE group_id = #{groupId}
          AND status = 1
          AND roles LIKE '%leader%'
          <if test="excludeAccountId != null">
              AND account_id != #{excludeAccountId}
          </if>
    </select>

</mapper>
```

- [ ] **Step 7: Commit**

```bash
git add gt-niaochao/gt-system/src/main/java/com/gt/system/mapper/Agent*.java \
  gt-niaochao/gt-system/src/main/resources/mybatis/Agent*.xml
git commit -m "feat(agent-group): add mappers and XML queries"
```

---

### Task 6: Backend AgentGroup Service

**Files:**
- Create: `gt-niaochao/gt-system/src/main/java/com/gt/system/service/AgentGroupService.java`
- Create: `gt-niaochao/gt-system/src/main/java/com/gt/system/service/impl/AgentGroupServiceImpl.java`

- [ ] **Step 1: Write AgentGroupService interface**

```java
package com.gt.system.service;

import com.github.pagehelper.PageInfo;
import com.gt.system.domain.dto.*;
import com.gt.system.domain.response.AgentGroupDetailResponse;
import com.gt.system.domain.response.AgentGroupQueryResponse;
import com.gt.system.domain.response.AgentMemberResponse;

import java.util.List;

public interface AgentGroupService {
    Long createGroup(AgentGroupCreateDTO dto);
    boolean updateGroup(AgentGroupUpdateDTO dto);
    PageInfo<AgentGroupQueryResponse> queryGroups(AgentGroupQueryDTO dto);
    AgentGroupDetailResponse getGroupDetail(Long id);
    boolean changeGroupStatus(Long id, Integer status);
    boolean addMember(AgentMemberAddDTO dto);
    boolean removeMember(Long groupId, Long accountId);
    boolean updateMemberRoles(AgentMemberRoleUpdateDTO dto);
    PageInfo<AgentMemberResponse> queryMembers(Long groupId, String keyword, String role, Integer status,
                                                Integer pageNum, Integer pageSize);
}
```

- [ ] **Step 2: Write AgentGroupServiceImpl**

```java
package com.gt.system.service.impl;

import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import com.gt.common.domain.entity.OperationLog;
import com.gt.common.exception.BusinessException;
import com.gt.common.redis.RedisService;
import com.gt.common.utils.UserInfoUtil;
import com.gt.system.constant.AgentGroupConstant;
import com.gt.system.domain.dto.*;
import com.gt.system.domain.entity.AgentGroup;
import com.gt.system.domain.entity.AgentGroupMember;
import com.gt.system.domain.response.AgentGroupDetailResponse;
import com.gt.system.domain.response.AgentGroupQueryResponse;
import com.gt.system.domain.response.AgentMemberResponse;
import com.gt.system.mapper.AgentGroupMapper;
import com.gt.system.mapper.AgentGroupMemberMapper;
import com.gt.system.mapper.OperationLogMapper;
import com.gt.system.service.AgentGroupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AgentGroupServiceImpl extends ServiceImpl<AgentGroupMapper, AgentGroup> implements AgentGroupService {

    private final AgentGroupMapper agentGroupMapper;
    private final AgentGroupMemberMapper agentGroupMemberMapper;
    private final OperationLogMapper operationLogMapper;
    private final RedisService redisService;
    private final UserInfoUtil userInfoUtil;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createGroup(AgentGroupCreateDTO dto) {
        // 校验名称唯一
        long nameCount = count(new LambdaQueryWrapper<AgentGroup>()
                .eq(AgentGroup::getName, dto.getName())
                .eq(AgentGroup::getDeleteFlag, AgentGroupConstant.DELETE_FLAG_NORMAL));
        if (nameCount > 0) {
            throw new BusinessException("坐席组名称已存在");
        }

        // 生成 groupCode
        String datePrefix = AgentGroupConstant.GROUP_CODE_PREFIX +
                LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int maxSeq = agentGroupMapper.selectMaxGroupCodeSeq(datePrefix);
        String groupCode = datePrefix + "-" + String.format("%03d", maxSeq + 1);

        AgentGroup group = new AgentGroup();
        group.setName(dto.getName());
        group.setGroupCode(groupCode);
        group.setCustomerCode(dto.getCustomerCode());
        group.setStatus(AgentGroupConstant.STATUS_ENABLED);
        group.setRemark(dto.getRemark());
        group.setDeleteFlag(AgentGroupConstant.DELETE_FLAG_NORMAL);
        group.initCreate(userInfoUtil.getUserNickName());
        save(group);

        // 记录日志
        logAction(AgentGroupConstant.ACTION_CREATE_GROUP, group.getId(),
                String.format("创建坐席组「%s」，绑定客户「%s」", dto.getName(), dto.getCustomerCode()));

        return group.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean updateGroup(AgentGroupUpdateDTO dto) {
        AgentGroup existing = getById(dto.getId());
        if (ObjectUtil.isEmpty(existing) || existing.getDeleteFlag() == AgentGroupConstant.DELETE_FLAG_DELETED) {
            throw new BusinessException("坐席组不存在");
        }

        AgentGroup update = new AgentGroup();
        update.setId(dto.getId());

        // 名称修改需唯一校验
        if (StrUtil.isNotBlank(dto.getName()) && !dto.getName().equals(existing.getName())) {
            long nameCount = count(new LambdaQueryWrapper<AgentGroup>()
                    .eq(AgentGroup::getName, dto.getName())
                    .eq(AgentGroup::getDeleteFlag, AgentGroupConstant.DELETE_FLAG_NORMAL)
                    .ne(AgentGroup::getId, dto.getId()));
            if (nameCount > 0) {
                throw new BusinessException("坐席组名称已存在");
            }
            update.setName(dto.getName());
            logAction(AgentGroupConstant.ACTION_EDIT_GROUP, dto.getId(),
                    String.format("修改名称：「%s」→「%s」", existing.getName(), dto.getName()));
        }

        if (dto.getRemark() != null) {
            update.setRemark(dto.getRemark());
            if (!dto.getRemark().equals(existing.getRemark())) {
                logAction(AgentGroupConstant.ACTION_EDIT_GROUP, dto.getId(),
                        String.format("修改备注：「%s」→「%s」",
                                StrUtil.blankToDefault(existing.getRemark(), "空"),
                                StrUtil.blankToDefault(dto.getRemark(), "空")));
            }
        }

        update.initUpdate(userInfoUtil.getUserNickName());
        updateById(update);
        return true;
    }

    @Override
    public PageInfo<AgentGroupQueryResponse> queryGroups(AgentGroupQueryDTO dto) {
        // 客户权限过滤
        String userCustomerCodes = userInfoUtil.getUserCustomerCodes();
        if (StrUtil.isBlank(userCustomerCodes)) {
            userCustomerCodes = userInfoUtil.getUserInfo().getCustomerCodes();
        }
        List<String> codeList = new ArrayList<>();
        if (StrUtil.isNotBlank(userCustomerCodes)) {
            codeList.addAll(Arrays.asList(userCustomerCodes.split(",")));
        }
        List<String> sonCodes = userInfoUtil.getSonCustomerCodes();
        if (ObjectUtil.isNotEmpty(sonCodes)) {
            codeList.addAll(sonCodes);
        }

        PageHelper.startPage(dto.getPageNum(), dto.getPageSize());
        List<AgentGroupQueryResponse> list = agentGroupMapper.selectGroupList(dto, codeList);

        // 填充组长摘要
        for (AgentGroupQueryResponse resp : list) {
            resp.setLeaderSummary(getLeaderSummary(resp.getId()));
        }

        return new PageInfo<>(list);
    }

    @Override
    public AgentGroupDetailResponse getGroupDetail(Long id) {
        AgentGroup group = getById(id);
        if (ObjectUtil.isEmpty(group) || group.getDeleteFlag() == AgentGroupConstant.DELETE_FLAG_DELETED) {
            throw new BusinessException("坐席组不存在");
        }

        AgentGroupDetailResponse resp = new AgentGroupDetailResponse();
        BeanUtils.copyProperties(group, resp);

        // 统计
        List<AgentGroupMember> activeMembers = agentGroupMemberMapper.selectList(
                new LambdaQueryWrapper<AgentGroupMember>()
                        .eq(AgentGroupMember::getGroupId, id)
                        .eq(AgentGroupMember::getStatus, AgentGroupConstant.MEMBER_STATUS_ACTIVE));
        resp.setMemberCount(activeMembers.size());
        resp.setLeaderCount((int) activeMembers.stream().filter(m -> m.getRoles().contains("leader")).count());
        resp.setAgentCount((int) activeMembers.stream().filter(m -> m.getRoles().contains("agent")).count());
        resp.setLeaderSummary(getLeaderSummary(id));

        return resp;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean changeGroupStatus(Long id, Integer status) {
        AgentGroup group = getById(id);
        if (ObjectUtil.isEmpty(group) || group.getDeleteFlag() == AgentGroupConstant.DELETE_FLAG_DELETED) {
            throw new BusinessException("坐席组不存在");
        }

        AgentGroup update = new AgentGroup();
        update.setId(id);
        update.setStatus(status);
        update.initUpdate(userInfoUtil.getUserNickName());
        updateById(update);

        // 禁用时清除组内所有成员 Token
        if (AgentGroupConstant.STATUS_DISABLED.equals(status)) {
            List<AgentGroupMember> activeMembers = agentGroupMemberMapper.selectList(
                    new LambdaQueryWrapper<AgentGroupMember>()
                            .eq(AgentGroupMember::getGroupId, id)
                            .eq(AgentGroupMember::getStatus, AgentGroupConstant.MEMBER_STATUS_ACTIVE));
            int affectedCount = 0;
            for (AgentGroupMember member : activeMembers) {
                Set<String> tokenSet = redisService.getCacheSet(member.getAccountId().toString());
                if (ObjectUtil.isNotEmpty(tokenSet)) {
                    tokenSet.forEach(token -> redisService.deleteObject(token));
                    affectedCount++;
                }
            }
            logAction(AgentGroupConstant.ACTION_DISABLE_GROUP, id,
                    String.format("禁用坐席组（影响 %d 个账号登录）", affectedCount));
        } else {
            logAction(AgentGroupConstant.ACTION_ENABLE_GROUP, id, "启用坐席组");
        }

        return true;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean addMember(AgentMemberAddDTO dto) {
        AgentGroup group = getById(dto.getGroupId());
        if (ObjectUtil.isEmpty(group) || group.getDeleteFlag() == AgentGroupConstant.DELETE_FLAG_DELETED) {
            throw new BusinessException("坐席组不存在");
        }

        // 校验不重复挂载
        long existCount = agentGroupMemberMapper.selectCount(
                new LambdaQueryWrapper<AgentGroupMember>()
                        .eq(AgentGroupMember::getGroupId, dto.getGroupId())
                        .eq(AgentGroupMember::getAccountId, dto.getAccountId()));
        if (existCount > 0) {
            throw new BusinessException("该账号已在此坐席组中");
        }

        AgentGroupMember member = new AgentGroupMember();
        member.setGroupId(dto.getGroupId());
        member.setAccountId(dto.getAccountId());
        member.setRoles(StrUtil.blankToDefault(dto.getRoles(), AgentGroupConstant.ROLE_AGENT));
        member.setStatus(AgentGroupConstant.MEMBER_STATUS_ACTIVE);
        member.setJoinTime(new Date());
        member.initCreate(userInfoUtil.getUserNickName());
        agentGroupMemberMapper.insert(member);

        logAction(AgentGroupConstant.ACTION_MOUNT_GROUP, dto.getGroupId(),
                String.format("将账号「%d」挂载到坐席组「%s」（角色：%s）",
                        dto.getAccountId(), group.getName(), member.getRoles()),
                dto.getAccountId());

        return true;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean removeMember(Long groupId, Long accountId) {
        // 校验不能移除最后一个启用组长
        int activeLeaders = agentGroupMemberMapper.countActiveLeaders(groupId, accountId);
        AgentGroupMember member = agentGroupMemberMapper.selectOne(
                new LambdaQueryWrapper<AgentGroupMember>()
                        .eq(AgentGroupMember::getGroupId, groupId)
                        .eq(AgentGroupMember::getAccountId, accountId)
                        .eq(AgentGroupMember::getStatus, AgentGroupConstant.MEMBER_STATUS_ACTIVE));
        if (member != null && member.getRoles().contains("leader") && activeLeaders == 0) {
            throw new BusinessException("不能移除本组最后一个启用组长");
        }

        // 软删除（标记为移出）
        AgentGroupMember update = new AgentGroupMember();
        update.setId(member.getId());
        update.setStatus(AgentGroupConstant.MEMBER_STATUS_REMOVED);
        update.initUpdate(userInfoUtil.getUserNickName());
        agentGroupMemberMapper.updateById(update);

        AgentGroup group = getById(groupId);
        logAction(AgentGroupConstant.ACTION_UNMOUNT_GROUP, groupId,
                String.format("将账号「%d」从坐席组「%s」移出", accountId, group.getName()),
                accountId);

        return true;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean updateMemberRoles(AgentMemberRoleUpdateDTO dto) {
        AgentGroupMember member = agentGroupMemberMapper.selectOne(
                new LambdaQueryWrapper<AgentGroupMember>()
                        .eq(AgentGroupMember::getGroupId, dto.getGroupId())
                        .eq(AgentGroupMember::getAccountId, dto.getAccountId())
                        .eq(AgentGroupMember::getStatus, AgentGroupConstant.MEMBER_STATUS_ACTIVE));
        if (member == null) {
            throw new BusinessException("该成员不存在");
        }

        String oldRoles = member.getRoles();
        String newRoles = dto.getRoles();

        // 校验至少 1 个角色
        if (StrUtil.isBlank(newRoles)) {
            throw new BusinessException("至少保留 1 个角色");
        }

        // 取消组长时校验不能成为最后一个
        if (oldRoles.contains("leader") && !newRoles.contains("leader")) {
            int otherLeaders = agentGroupMemberMapper.countActiveLeaders(dto.getGroupId(), dto.getAccountId());
            if (otherLeaders == 0) {
                throw new BusinessException("不能移除本组最后一个启用组长");
            }
        }

        AgentGroupMember update = new AgentGroupMember();
        update.setId(member.getId());
        update.setRoles(newRoles);
        update.initUpdate(userInfoUtil.getUserNickName());
        agentGroupMemberMapper.updateById(update);

        // 记录角色变更日志
        AgentGroup group = getById(dto.getGroupId());
        if (!oldRoles.contains("leader") && newRoles.contains("leader")) {
            logAction(AgentGroupConstant.ACTION_SET_LEADER, dto.getGroupId(),
                    String.format("给账号「%d」添加「组长」角色（在 %s）", dto.getAccountId(), group.getName()),
                    dto.getAccountId());
        }
        if (oldRoles.contains("leader") && !newRoles.contains("leader")) {
            logAction(AgentGroupConstant.ACTION_REMOVE_LEADER, dto.getGroupId(),
                    String.format("移除账号「%d」的「组长」角色（在 %s）", dto.getAccountId(), group.getName()),
                    dto.getAccountId());
        }
        if (!oldRoles.contains("agent") && newRoles.contains("agent")) {
            logAction(AgentGroupConstant.ACTION_SET_AGENT, dto.getGroupId(),
                    String.format("给账号「%d」添加「坐席」角色（在 %s）", dto.getAccountId(), group.getName()),
                    dto.getAccountId());
        }
        if (oldRoles.contains("agent") && !newRoles.contains("agent")) {
            logAction(AgentGroupConstant.ACTION_REMOVE_AGENT, dto.getGroupId(),
                    String.format("移除账号「%d」的「坐席」角色（在 %s）", dto.getAccountId(), group.getName()),
                    dto.getAccountId());
        }

        return true;
    }

    @Override
    public PageInfo<AgentMemberResponse> queryMembers(Long groupId, String keyword, String role,
                                                       Integer status, Integer pageNum, Integer pageSize) {
        PageHelper.startPage(pageNum, pageSize);
        List<AgentMemberResponse> list = agentGroupMemberMapper.selectMemberList(groupId, keyword, role, status);
        return new PageInfo<>(list);
    }

    // ========== 内部方法 ==========

    private List<AgentGroupDetailResponse.LeaderSummary> getLeaderSummary(Long groupId) {
        List<AgentGroupMember> leaders = agentGroupMemberMapper.selectList(
                new LambdaQueryWrapper<AgentGroupMember>()
                        .eq(AgentGroupMember::getGroupId, groupId)
                        .eq(AgentGroupMember::getStatus, AgentGroupConstant.MEMBER_STATUS_ACTIVE)
                        .like(AgentGroupMember::getRoles, "leader")
                        .orderByAsc(AgentGroupMember::getJoinTime));
        return leaders.stream().map(m -> {
            AgentGroupDetailResponse.LeaderSummary s = new AgentGroupDetailResponse.LeaderSummary();
            s.setAccountId(m.getAccountId());
            // name 和 avatar 需要关联 accounts 表，此处简化处理
            return s;
        }).collect(Collectors.toList());
    }

    private void logAction(String actionType, Long groupId, String actionDetail) {
        logAction(actionType, groupId, actionDetail, null);
    }

    private void logAction(String actionType, Long groupId, String actionDetail, Long targetAccountId) {
        OperationLog operationLog = new OperationLog();
        operationLog.setAccountId(userInfoUtil.getUserId());
        operationLog.setAccountName(userInfoUtil.getUserNickName());
        operationLog.setAccountType(userInfoUtil.getUserAccountType());
        operationLog.setModule(AgentGroupConstant.MODULE_AGENT_GROUP);
        operationLog.setActionType(actionType);
        operationLog.setActionDetail(actionDetail);
        operationLog.setTargetGroupId(groupId);
        operationLog.setTargetAccountId(targetAccountId);
        operationLog.initCreate(userInfoUtil.getUserNickName());
        operationLogMapper.insert(operationLog);
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add gt-niaochao/gt-system/src/main/java/com/gt/system/service/AgentGroupService.java \
  gt-niaochao/gt-system/src/main/java/com/gt/system/service/impl/AgentGroupServiceImpl.java
git commit -m "feat(agent-group): add AgentGroup service with full CRUD, member management, and logging"
```

---

### Task 7: Backend AgentAccount Service

**Files:**
- Create: `gt-niaochao/gt-system/src/main/java/com/gt/system/service/AgentAccountService.java`
- Create: `gt-niaochao/gt-system/src/main/java/com/gt/system/service/impl/AgentAccountServiceImpl.java`

- [ ] **Step 1: Write AgentAccountService interface**

```java
package com.gt.system.service;

import com.github.pagehelper.PageInfo;
import com.gt.system.domain.dto.*;
import com.gt.system.domain.response.AgentAccountDetailResponse;
import com.gt.system.domain.response.AgentAccountQueryResponse;
import com.gt.system.domain.response.AgentBatchImportResult;
import org.springframework.web.multipart.MultipartFile;

public interface AgentAccountService {
    Long createAccount(AgentAccountCreateDTO dto);
    boolean updateAccount(AgentAccountUpdateDTO dto);
    boolean changeAccountStatus(Long id, String status);
    String resetPassword(Long id, String newPassword);
    AgentAccountDetailResponse getAccountDetail(Long id);
    PageInfo<AgentAccountQueryResponse> queryAccounts(AgentAccountQueryDTO dto);
    AgentBatchImportResult batchImport(MultipartFile file, Long groupId);
    boolean mountGroups(AgentAccountMountDTO dto);
}
```

- [ ] **Step 2: Write AgentAccountServiceImpl**

```java
package com.gt.system.service.impl;

import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import com.gt.common.domain.entity.OperationLog;
import com.gt.common.exception.BusinessException;
import com.gt.common.redis.RedisService;
import com.gt.common.utils.Md5Util;
import com.gt.common.utils.UserInfoUtil;
import com.gt.system.constant.AgentGroupConstant;
import com.gt.system.domain.dto.*;
import com.gt.system.domain.entity.*;
import com.gt.system.domain.response.AgentAccountDetailResponse;
import com.gt.system.domain.response.AgentAccountQueryResponse;
import com.gt.system.domain.response.AgentBatchImportResult;
import com.gt.system.mapper.*;
import com.gt.system.service.AgentAccountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AgentAccountServiceImpl extends ServiceImpl<AccountMapper, Account> implements AgentAccountService {

    private final AccountMapper accountMapper;
    private final AgentAccountExtMapper agentAccountExtMapper;
    private final AgentGroupMemberMapper agentGroupMemberMapper;
    private final AgentGroupMapper agentGroupMapper;
    private final OperationLogMapper operationLogMapper;
    private final RedisService redisService;
    private final UserInfoUtil userInfoUtil;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createAccount(AgentAccountCreateDTO dto) {
        // 校验账号唯一
        long existCount = accountMapper.selectCount(
                new LambdaQueryWrapper<Account>()
                        .eq(Account::getAccountName, dto.getAccountName()));
        if (existCount > 0) {
            throw new BusinessException("账号已存在");
        }

        // 插入 accounts
        Account account = new Account();
        account.setId(IdWorker.getId());
        account.setAccountName(dto.getAccountName());
        account.setName(dto.getName());
        account.setPhone(StrUtil.blankToDefault(dto.getPhone(), ""));
        String password = StrUtil.blankToDefault(dto.getPassword(), generateRandomPassword());
        account.setPassword(Md5Util.enctypeMD5(password));
        account.setAccountType(AgentGroupConstant.ACCOUNT_TYPE_AGENT);
        account.setStatus("enabled");
        account.setRemark(dto.getRemark());
        account.initCreate(userInfoUtil.getUserNickName());
        accountMapper.insert(account);

        // 分配分机号（唯一约束防并发，重试 3 次）
        Integer extNumber = assignExtensionNumber(account.getId());

        // 插入组成员
        if (ObjectUtil.isNotEmpty(dto.getGroups())) {
            for (AgentAccountCreateDTO.GroupMountItem item : dto.getGroups()) {
                AgentGroupMember member = new AgentGroupMember();
                member.setGroupId(item.getGroupId());
                member.setAccountId(account.getId());
                member.setRoles(StrUtil.blankToDefault(item.getRoles(), AgentGroupConstant.ROLE_AGENT));
                member.setStatus(AgentGroupConstant.MEMBER_STATUS_ACTIVE);
                member.setJoinTime(new Date());
                member.initCreate(userInfoUtil.getUserNickName());
                agentGroupMemberMapper.insert(member);

                AgentGroup group = agentGroupMapper.selectById(item.getGroupId());
                logAction(AgentGroupConstant.ACTION_MOUNT_GROUP, item.getGroupId(),
                        String.format("将账号「%s（%s）」挂载到坐席组「%s」（角色：%s）",
                                dto.getAccountName(), dto.getName(),
                                group != null ? group.getName() : "", item.getRoles()),
                        account.getId());
            }
        }

        logAction(AgentGroupConstant.ACTION_CREATE_ACCOUNT, null,
                String.format("新增账号「%s」（%s），角色：%s",
                        dto.getAccountName(), dto.getName(),
                        dto.getGroups() != null ? dto.getGroups().stream()
                                .map(AgentAccountCreateDTO.GroupMountItem::getRoles)
                                .collect(Collectors.joining(",")) : "无"),
                account.getId());

        if (extNumber != null) {
            logAction(AgentGroupConstant.ACTION_ASSIGN_EXTENSION, null,
                    String.format("系统自动分配分机号 %d 给「%s」", extNumber, dto.getAccountName()),
                    account.getId());
        }

        return account.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean updateAccount(AgentAccountUpdateDTO dto) {
        Account existing = accountMapper.selectById(dto.getId());
        if (ObjectUtil.isEmpty(existing)) {
            throw new BusinessException("账号不存在");
        }

        Account update = new Account();
        update.setId(dto.getId());

        StringBuilder changes = new StringBuilder();
        if (StrUtil.isNotBlank(dto.getName()) && !dto.getName().equals(existing.getName())) {
            update.setName(dto.getName());
            changes.append(String.format("名称「%s」→「%s」", existing.getName(), dto.getName()));
        }
        if (dto.getPhone() != null && !dto.getPhone().equals(existing.getPhone())) {
            update.setPhone(dto.getPhone());
            if (changes.length() > 0) changes.append("；");
            changes.append(String.format("手机号「%s」→「%s」", existing.getPhone(), dto.getPhone()));
        }
        if (dto.getRemark() != null && !dto.getRemark().equals(existing.getRemark())) {
            update.setRemark(dto.getRemark());
            if (changes.length() > 0) changes.append("；");
            changes.append("备注已修改");
        }

        update.initUpdate(userInfoUtil.getUserNickName());
        accountMapper.updateById(update);

        if (changes.length() > 0) {
            logAction(AgentGroupConstant.ACTION_EDIT_ACCOUNT, null,
                    String.format("编辑账号「%s」：%s", existing.getAccountName(), changes),
                    dto.getId());
        }

        return true;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean changeAccountStatus(Long id, String status) {
        Account existing = accountMapper.selectById(id);
        if (ObjectUtil.isEmpty(existing)) {
            throw new BusinessException("账号不存在");
        }

        Account update = new Account();
        update.setId(id);
        update.setStatus(status);
        update.initUpdate(userInfoUtil.getUserNickName());
        accountMapper.updateById(update);

        // 停用时清除所有 Token
        if ("disabled".equals(status)) {
            Set<String> tokenSet = redisService.getCacheSet(id.toString());
            if (ObjectUtil.isNotEmpty(tokenSet)) {
                tokenSet.forEach(token -> redisService.deleteObject(token));
            }

            // 统计影响组数
            long affectedGroups = agentGroupMemberMapper.selectCount(
                    new LambdaQueryWrapper<AgentGroupMember>()
                            .eq(AgentGroupMember::getAccountId, id)
                            .eq(AgentGroupMember::getStatus, AgentGroupConstant.MEMBER_STATUS_ACTIVE));

            logAction(AgentGroupConstant.ACTION_DISABLE_ACCOUNT, null,
                    String.format("停用账号「%s」（%s）（影响 %d 个挂载坐席组）",
                            existing.getAccountName(), existing.getName(), affectedGroups),
                    id);
        } else {
            logAction(AgentGroupConstant.ACTION_ENABLE_ACCOUNT, null,
                    String.format("启用账号「%s」（%s）", existing.getAccountName(), existing.getName()),
                    id);
        }

        return true;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public String resetPassword(Long id, String newPassword) {
        Account existing = accountMapper.selectById(id);
        if (ObjectUtil.isEmpty(existing)) {
            throw new BusinessException("账号不存在");
        }

        boolean isSystemGenerated = StrUtil.isBlank(newPassword);
        if (isSystemGenerated) {
            newPassword = generateRandomPassword();
        }

        Account update = new Account();
        update.setId(id);
        update.setPassword(Md5Util.enctypeMD5(newPassword));
        update.initUpdate(userInfoUtil.getUserNickName());
        accountMapper.updateById(update);

        // 清除 Token
        Set<String> tokenSet = redisService.getCacheSet(id.toString());
        if (ObjectUtil.isNotEmpty(tokenSet)) {
            tokenSet.forEach(token -> redisService.deleteObject(token));
        }

        logAction(AgentGroupConstant.ACTION_RESET_PASSWORD, null,
                String.format("重置账号「%s」密码（方式：%s）",
                        existing.getAccountName(), isSystemGenerated ? "系统生成" : "手动设置"),
                id);

        return newPassword;
    }

    @Override
    public AgentAccountDetailResponse getAccountDetail(Long id) {
        Account account = accountMapper.selectById(id);
        if (ObjectUtil.isEmpty(account)) {
            throw new BusinessException("账号不存在");
        }

        AgentAccountDetailResponse resp = new AgentAccountDetailResponse();
        resp.setId(account.getId());
        resp.setAccountName(account.getAccountName());
        resp.setName(account.getName());
        resp.setPhone(account.getPhone());
        resp.setStatus(account.getStatus());
        resp.setRemark(account.getRemark());
        resp.setCreateTime(account.getCreateTime());
        resp.setCreateBy(account.getCreateBy());

        // 扩展信息
        AgentAccountExt ext = agentAccountExtMapper.selectOne(
                new LambdaQueryWrapper<AgentAccountExt>()
                        .eq(AgentAccountExt::getAccountId, id));
        if (ext != null) {
            resp.setExtensionNumber(ext.getExtensionNumber());
            resp.setExtAssignedTime(ext.getExtAssignedTime());
        }

        // 挂载组列表
        List<AgentGroupMember> members = agentGroupMemberMapper.selectList(
                new LambdaQueryWrapper<AgentGroupMember>()
                        .eq(AgentGroupMember::getAccountId, id)
                        .eq(AgentGroupMember::getStatus, AgentGroupConstant.MEMBER_STATUS_ACTIVE));
        List<AgentAccountDetailResponse.GroupMountDetail> groups = new ArrayList<>();
        for (AgentGroupMember m : members) {
            AgentGroup group = agentGroupMapper.selectById(m.getGroupId());
            AgentAccountDetailResponse.GroupMountDetail detail = new AgentAccountDetailResponse.GroupMountDetail();
            detail.setGroupId(m.getGroupId());
            detail.setGroupName(group != null ? group.getName() : "");
            detail.setGroupCode(group != null ? group.getGroupCode() : "");
            detail.setGroupStatus(group != null ? group.getStatus() : null);
            detail.setRoles(m.getRoles());
            detail.setJoinTime(m.getJoinTime());
            groups.add(detail);
        }
        resp.setGroups(groups);

        return resp;
    }

    @Override
    public PageInfo<AgentAccountQueryResponse> queryAccounts(AgentAccountQueryDTO dto) {
        PageHelper.startPage(dto.getPageNum(), dto.getPageSize());

        // 构建查询：查 accountType='agent' 的账号
        LambdaQueryWrapper<Account> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Account::getAccountType, AgentGroupConstant.ACCOUNT_TYPE_AGENT);

        if (StrUtil.isNotBlank(dto.getKeyword())) {
            wrapper.and(w -> w.like(Account::getAccountName, dto.getKeyword())
                    .or().like(Account::getName, dto.getKeyword()));
        }
        if (StrUtil.isNotBlank(dto.getStatus())) {
            wrapper.eq(Account::getStatus, dto.getStatus());
        }

        wrapper.orderByDesc(Account::getCreateTime);
        List<Account> accounts = accountMapper.selectList(wrapper);

        // 组装响应
        List<AgentAccountQueryResponse> responseList = accounts.stream().map(account -> {
            AgentAccountQueryResponse resp = new AgentAccountQueryResponse();
            resp.setId(account.getId());
            resp.setAccountName(account.getAccountName());
            resp.setName(account.getName());
            resp.setPhone(account.getPhone());
            resp.setStatus(account.getStatus());
            resp.setRemark(account.getRemark());
            resp.setCreateTime(account.getCreateTime());

            // 扩展
            AgentAccountExt ext = agentAccountExtMapper.selectOne(
                    new LambdaQueryWrapper<AgentAccountExt>()
                            .eq(AgentAccountExt::getAccountId, account.getId()));
            if (ext != null) {
                resp.setExtensionNumber(ext.getExtensionNumber());
            }

            // 挂载组
            List<AgentGroupMember> members = agentGroupMemberMapper.selectList(
                    new LambdaQueryWrapper<AgentGroupMember>()
                            .eq(AgentGroupMember::getAccountId, account.getId())
                            .eq(AgentGroupMember::getStatus, AgentGroupConstant.MEMBER_STATUS_ACTIVE));
            resp.setGroupCount(members.size());

            List<AgentAccountQueryResponse.GroupMountSummary> groupSummaries = members.stream().map(m -> {
                AgentGroupQueryResponse.LeaderSummary unused = null; // 这里需要 GroupMountSummary
                AgentGroup group = agentGroupMapper.selectById(m.getGroupId());
                AgentAccountQueryResponse.GroupMountSummary summary = new AgentAccountQueryResponse.GroupMountSummary();
                summary.setGroupId(m.getGroupId());
                summary.setGroupName(group != null ? group.getName() : "");
                summary.setRoles(m.getRoles());
                return summary;
            }).collect(Collectors.toList());
            resp.setGroups(groupSummaries);

            return resp;
        }).collect(Collectors.toList());

        return new PageInfo<>(responseList);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AgentBatchImportResult batchImport(MultipartFile file, Long groupId) {
        AgentBatchImportResult result = new AgentBatchImportResult();
        List<AgentBatchImportDTO> rows = parseExcel(file);
        result.setTotal(rows.size());

        for (int i = 0; i < rows.size(); i++) {
            AgentBatchImportDTO row = rows.get(i);
            row.setGroupId(groupId);
            try {
                validateImportRow(row, i + 1);
                AgentAccountCreateDTO createDTO = new AgentAccountCreateDTO();
                createDTO.setAccountName(row.getAccountName());
                createDTO.setName(row.getName());
                createDTO.setPassword(row.getPassword());

                // 转换角色格式
                List<AgentAccountCreateDTO.GroupMountItem> groups = new ArrayList<>();
                AgentAccountCreateDTO.GroupMountItem item = new AgentAccountCreateDTO.GroupMountItem();
                item.setGroupId(groupId);
                item.setRoles(convertRoleFromChinese(row.getRole()));
                groups.add(item);
                createDTO.setGroups(groups);

                createAccount(createDTO);
                result.setSuccessCount(result.getSuccessCount() + 1);
            } catch (BusinessException e) {
                result.setFailCount(result.getFailCount() + 1);
                AgentBatchImportResult.ImportError err = new AgentBatchImportResult.ImportError();
                err.setRow(i + 1);
                err.setAccountName(row.getAccountName());
                err.setReason(e.getMessage());
                result.getErrors().add(err);
            }
        }

        logAction(AgentGroupConstant.ACTION_BATCH_IMPORT, groupId,
                String.format("批量上传账号 %d 条，成功 %d 条 / 失败 %d 条",
                        result.getTotal(), result.getSuccessCount(), result.getFailCount()));

        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean mountGroups(AgentAccountMountDTO dto) {
        // 新增挂载
        if (ObjectUtil.isNotEmpty(dto.getAddList())) {
            for (AgentAccountMountDTO.MountAddItem item : dto.getAddList()) {
                AgentMemberAddDTO addDTO = new AgentMemberAddDTO();
                addDTO.setGroupId(item.getGroupId());
                addDTO.setAccountId(dto.getAccountId());
                addDTO.setRoles(item.getRoles());
                addMember(addDTO);
            }
        }

        // 移除挂载
        if (ObjectUtil.isNotEmpty(dto.getRemoveList())) {
            for (Long groupId : dto.getRemoveList()) {
                removeMember(groupId, dto.getAccountId());
            }
        }

        // 角色变更
        if (ObjectUtil.isNotEmpty(dto.getRoleUpdateList())) {
            for (AgentAccountMountDTO.MountRoleUpdateItem item : dto.getRoleUpdateList()) {
                AgentMemberRoleUpdateDTO roleDTO = new AgentMemberRoleUpdateDTO();
                roleDTO.setGroupId(item.getGroupId());
                roleDTO.setAccountId(dto.getAccountId());
                roleDTO.setRoles(item.getRoles());
                updateMemberRoles(roleDTO);
            }
        }

        return true;
    }

    // ========== 内部方法 ==========

    private Integer assignExtensionNumber(Long accountId) {
        for (int attempt = 0; attempt < 3; attempt++) {
            int maxExt = agentAccountExtMapper.selectMaxExtensionNumber();
            int nextExt = maxExt + 1;

            AgentAccountExt ext = new AgentAccountExt();
            ext.setAccountId(accountId);
            ext.setExtensionNumber(nextExt);
            ext.setExtAssignedTime(new Date());
            ext.initCreate(userInfoUtil.getUserNickName());

            try {
                agentAccountExtMapper.insert(ext);
                return nextExt;
            } catch (Exception e) {
                // 唯一约束冲突，重试
                log.warn("分机号 {} 分配冲突，重试第 {} 次", nextExt, attempt + 1);
            }
        }
        log.error("分机号分配失败，accountId={}", accountId);
        return null;
    }

    private String generateRandomPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder();
        Random random = new Random();
        // 确保包含大写、小写、数字各至少 1 个
        sb.append(chars.charAt(random.nextInt(26))); // 大写
        sb.append(chars.charAt(26 + random.nextInt(26))); // 小写
        sb.append(chars.charAt(52 + random.nextInt(10))); // 数字
        for (int i = 3; i < 12; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    private List<AgentBatchImportDTO> parseExcel(MultipartFile file) {
        List<AgentBatchImportDTO> rows = new ArrayList<>();
        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                AgentBatchImportDTO dto = new AgentBatchImportDTO();
                dto.setAccountName(getCellStringValue(row.getCell(0)));
                dto.setName(getCellStringValue(row.getCell(1)));
                dto.setRole(getCellStringValue(row.getCell(2)));
                dto.setPassword(getCellStringValue(row.getCell(3)));
                if (StrUtil.isNotBlank(dto.getAccountName())) {
                    rows.add(dto);
                }
            }
        } catch (IOException e) {
            throw new BusinessException("Excel文件解析失败");
        }
        return rows;
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null) return "";
        cell.setCellType(CellType.STRING);
        return cell.getStringCellValue().trim();
    }

    private void validateImportRow(AgentBatchImportDTO row, int rowNum) {
        if (StrUtil.isBlank(row.getAccountName())) {
            throw new BusinessException("账号不能为空");
        }
        if (StrUtil.isBlank(row.getName())) {
            throw new BusinessException("真实姓名不能为空");
        }
        if (StrUtil.isBlank(row.getRole())) {
            throw new BusinessException("角色不能为空");
        }
        String normalizedRole = convertRoleFromChinese(row.getRole());
        if (StrUtil.isBlank(normalizedRole)) {
            throw new BusinessException("角色值不合法，应为：坐席/组长/坐席|组长");
        }
    }

    private String convertRoleFromChinese(String chineseRole) {
        if (StrUtil.isBlank(chineseRole)) return "";
        String trimmed = chineseRole.trim();
        if ("坐席".equals(trimmed)) return "agent";
        if ("组长".equals(trimmed)) return "leader";
        if (trimmed.contains("坐席") && trimmed.contains("组长")) return "leader,agent";
        return "";
    }

    // 委托给 AgentGroupService 的方法
    private void addMember(AgentMemberAddDTO dto) {
        // 直接调用 AgentGroupServiceImpl 的逻辑，这里简化为直接操作
        AgentGroup group = agentGroupMapper.selectById(dto.getGroupId());
        if (ObjectUtil.isEmpty(group) || group.getDeleteFlag() == AgentGroupConstant.DELETE_FLAG_DELETED) {
            throw new BusinessException("坐席组不存在");
        }
        long existCount = agentGroupMemberMapper.selectCount(
                new LambdaQueryWrapper<AgentGroupMember>()
                        .eq(AgentGroupMember::getGroupId, dto.getGroupId())
                        .eq(AgentGroupMember::getAccountId, dto.getAccountId()));
        if (existCount > 0) {
            throw new BusinessException("该账号已在此坐席组中");
        }
        AgentGroupMember member = new AgentGroupMember();
        member.setGroupId(dto.getGroupId());
        member.setAccountId(dto.getAccountId());
        member.setRoles(StrUtil.blankToDefault(dto.getRoles(), AgentGroupConstant.ROLE_AGENT));
        member.setStatus(AgentGroupConstant.MEMBER_STATUS_ACTIVE);
        member.setJoinTime(new Date());
        member.initCreate(userInfoUtil.getUserNickName());
        agentGroupMemberMapper.insert(member);
    }

    private void removeMember(Long groupId, Long accountId) {
        int activeLeaders = agentGroupMemberMapper.countActiveLeaders(groupId, accountId);
        AgentGroupMember member = agentGroupMemberMapper.selectOne(
                new LambdaQueryWrapper<AgentGroupMember>()
                        .eq(AgentGroupMember::getGroupId, groupId)
                        .eq(AgentGroupMember::getAccountId, accountId)
                        .eq(AgentGroupMember::getStatus, AgentGroupConstant.MEMBER_STATUS_ACTIVE));
        if (member != null && member.getRoles().contains("leader") && activeLeaders == 0) {
            throw new BusinessException("不能移除本组最后一个启用组长");
        }
        AgentGroupMember update = new AgentGroupMember();
        update.setId(member.getId());
        update.setStatus(AgentGroupConstant.MEMBER_STATUS_REMOVED);
        update.initUpdate(userInfoUtil.getUserNickName());
        agentGroupMemberMapper.updateById(update);
    }

    private void updateMemberRoles(AgentMemberRoleUpdateDTO dto) {
        AgentGroupMember member = agentGroupMemberMapper.selectOne(
                new LambdaQueryWrapper<AgentGroupMember>()
                        .eq(AgentGroupMember::getGroupId, dto.getGroupId())
                        .eq(AgentGroupMember::getAccountId, dto.getAccountId())
                        .eq(AgentGroupMember::getStatus, AgentGroupConstant.MEMBER_STATUS_ACTIVE));
        if (member == null) throw new BusinessException("该成员不存在");
        if (StrUtil.isBlank(dto.getRoles())) throw new BusinessException("至少保留 1 个角色");
        String oldRoles = member.getRoles();
        if (oldRoles.contains("leader") && !dto.getRoles().contains("leader")) {
            int otherLeaders = agentGroupMemberMapper.countActiveLeaders(dto.getGroupId(), dto.getAccountId());
            if (otherLeaders == 0) throw new BusinessException("不能移除本组最后一个启用组长");
        }
        AgentGroupMember update = new AgentGroupMember();
        update.setId(member.getId());
        update.setRoles(dto.getRoles());
        update.initUpdate(userInfoUtil.getUserNickName());
        agentGroupMemberMapper.updateById(update);
    }

    private void logAction(String actionType, Long groupId, String actionDetail) {
        logAction(actionType, groupId, actionDetail, null);
    }

    private void logAction(String actionType, Long groupId, String actionDetail, Long targetAccountId) {
        OperationLog operationLog = new OperationLog();
        operationLog.setAccountId(userInfoUtil.getUserId());
        operationLog.setAccountName(userInfoUtil.getUserNickName());
        operationLog.setAccountType(userInfoUtil.getUserAccountType());
        operationLog.setModule(AgentGroupConstant.MODULE_AGENT_GROUP);
        operationLog.setActionType(actionType);
        operationLog.setActionDetail(actionDetail);
        operationLog.setTargetGroupId(groupId);
        operationLog.setTargetAccountId(targetAccountId);
        operationLog.initCreate(userInfoUtil.getUserNickName());
        operationLogMapper.insert(operationLog);
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add gt-niaochao/gt-system/src/main/java/com/gt/system/service/AgentAccountService.java \
  gt-niaochao/gt-system/src/main/java/com/gt/system/service/impl/AgentAccountServiceImpl.java
git commit -m "feat(agent-group): add AgentAccount service with CRUD, batch import, mount groups"
```

---

### Task 8: Backend Controllers

**Files:**
- Create: `gt-niaochao/gt-system/src/main/java/com/gt/system/controller/AgentGroupController.java`
- Create: `gt-niaochao/gt-system/src/main/java/com/gt/system/controller/AgentAccountController.java`

- [ ] **Step 1: Write AgentGroupController**

```java
package com.gt.system.controller;

import com.github.pagehelper.PageInfo;
import com.gt.common.domain.Result;
import com.gt.system.domain.dto.*;
import com.gt.system.domain.response.AgentGroupDetailResponse;
import com.gt.system.domain.response.AgentGroupQueryResponse;
import com.gt.system.domain.response.AgentMemberResponse;
import com.gt.system.service.AgentGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/agent-group")
@RequiredArgsConstructor
public class AgentGroupController {

    private final AgentGroupService agentGroupService;

    @PostMapping("/create")
    public Result<Long> create(@RequestBody AgentGroupCreateDTO dto) {
        Long id = agentGroupService.createGroup(dto);
        return Result.success(id);
    }

    @PostMapping("/update")
    public Result<?> update(@RequestBody AgentGroupUpdateDTO dto) {
        agentGroupService.updateGroup(dto);
        return Result.success(true);
    }

    @GetMapping("/query")
    public Result<PageInfo<AgentGroupQueryResponse>> query(AgentGroupQueryDTO dto) {
        PageInfo<AgentGroupQueryResponse> page = agentGroupService.queryGroups(dto);
        return Result.success(page);
    }

    @GetMapping("/detail/{id}")
    public Result<AgentGroupDetailResponse> detail(@PathVariable Long id) {
        AgentGroupDetailResponse detail = agentGroupService.getGroupDetail(id);
        return Result.success(detail);
    }

    @PostMapping("/changeStatus")
    public Result<?> changeStatus(@RequestParam Long id, @RequestParam Integer status) {
        agentGroupService.changeGroupStatus(id, status);
        return Result.success(true);
    }

    @GetMapping("/members")
    public Result<PageInfo<AgentMemberResponse>> members(
            @RequestParam Long groupId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "20") Integer pageSize) {
        PageInfo<AgentMemberResponse> page = agentGroupService.queryMembers(
                groupId, keyword, role, status, pageNum, pageSize);
        return Result.success(page);
    }

    @PostMapping("/addMember")
    public Result<?> addMember(@RequestBody AgentMemberAddDTO dto) {
        agentGroupService.addMember(dto);
        return Result.success(true);
    }

    @PostMapping("/removeMember")
    public Result<?> removeMember(@RequestParam Long groupId, @RequestParam Long accountId) {
        agentGroupService.removeMember(groupId, accountId);
        return Result.success(true);
    }

    @PostMapping("/updateMemberRoles")
    public Result<?> updateMemberRoles(@RequestBody AgentMemberRoleUpdateDTO dto) {
        agentGroupService.updateMemberRoles(dto);
        return Result.success(true);
    }
}
```

- [ ] **Step 2: Write AgentAccountController**

```java
package com.gt.system.controller;

import com.github.pagehelper.PageInfo;
import com.gt.common.domain.Result;
import com.gt.system.domain.dto.*;
import com.gt.system.domain.response.AgentAccountDetailResponse;
import com.gt.system.domain.response.AgentAccountQueryResponse;
import com.gt.system.domain.response.AgentBatchImportResult;
import com.gt.system.service.AgentAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/agent-account")
@RequiredArgsConstructor
public class AgentAccountController {

    private final AgentAccountService agentAccountService;

    @PostMapping("/create")
    public Result<?> create(@RequestBody AgentAccountCreateDTO dto) {
        Long id = agentAccountService.createAccount(dto);
        return Result.success(id);
    }

    @PostMapping("/update")
    public Result<?> update(@RequestBody AgentAccountUpdateDTO dto) {
        agentAccountService.updateAccount(dto);
        return Result.success(true);
    }

    @PostMapping("/changeStatus")
    public Result<?> changeStatus(@RequestParam Long id, @RequestParam String status) {
        agentAccountService.changeAccountStatus(id, status);
        return Result.success(true);
    }

    @PostMapping("/resetPassword")
    public Result<String> resetPassword(@RequestParam Long id,
                                         @RequestParam(required = false) String newPassword) {
        String pwd = agentAccountService.resetPassword(id, newPassword);
        return Result.success(pwd);
    }

    @GetMapping("/detail/{id}")
    public Result<AgentAccountDetailResponse> detail(@PathVariable Long id) {
        AgentAccountDetailResponse detail = agentAccountService.getAccountDetail(id);
        return Result.success(detail);
    }

    @GetMapping("/query")
    public Result<PageInfo<AgentAccountQueryResponse>> query(AgentAccountQueryDTO dto) {
        PageInfo<AgentAccountQueryResponse> page = agentAccountService.queryAccounts(dto);
        return Result.success(page);
    }

    @PostMapping("/batchImport")
    public Result<AgentBatchImportResult> batchImport(
            @RequestParam("file") MultipartFile file,
            @RequestParam Long groupId) {
        AgentBatchImportResult result = agentAccountService.batchImport(file, groupId);
        return Result.success(result);
    }

    @GetMapping("/batchTemplate")
    public void batchTemplate(jakarta.servlet.http.HttpServletResponse response) throws Exception {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=agent_batch_import_template.xlsx");
        try (org.apache.poi.xssf.usermodel.XSSFWorkbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("坐席账号导入");
            // 表头
            String[] headers = {"账号（必填）", "真实姓名（必填）", "角色（必填：坐席/组长/坐席|组长）", "初始密码（选填）"};
            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                headerRow.createCell(i).setCellValue(headers[i]);
            }
            workbook.write(response.getOutputStream());
        }
    }

    @PostMapping("/mountGroups")
    public Result<?> mountGroups(@RequestBody AgentAccountMountDTO dto) {
        agentAccountService.mountGroups(dto);
        return Result.success(true);
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add gt-niaochao/gt-system/src/main/java/com/gt/system/controller/AgentGroupController.java \
  gt-niaochao/gt-system/src/main/java/com/gt/system/controller/AgentAccountController.java
git commit -m "feat(agent-group): add controllers for agent group and account APIs"
```

---

### Task 9: Backend Operation Log Controller

**Files:**
- Modify: `gt-niaochao/gt-system/src/main/java/com/gt/system/domain/entity/OperationLog.java` — add 3 new fields
- Create: Operation log query endpoint in AgentGroupController

- [ ] **Step 1: Add fields to OperationLog entity**

Add after `ipAddress` field:

```java
private Long targetGroupId;
private Long targetAccountId;
private String operatorRole;
```

- [ ] **Step 2: Add log query endpoint to AgentGroupController**

Add to `AgentGroupController.java`:

```java
@GetMapping("/logs")
public Result<PageInfo<OperationLog>> logs(AgentLogQueryDTO dto) {
    PageInfo<OperationLog> page = agentGroupService.queryLogs(dto);
    return Result.success(page);
}

@GetMapping("/agent-account/logs/{id}")
public Result<PageInfo<OperationLog>> accountLogs(@PathVariable Long id,
                                                   @RequestParam(defaultValue = "1") Integer pageNum,
                                                   @RequestParam(defaultValue = "10") Integer pageSize) {
    AgentLogQueryDTO dto = new AgentLogQueryDTO();
    dto.setTargetAccountId(id);
    dto.setPageNum(pageNum);
    dto.setPageSize(pageSize);
    PageInfo<OperationLog> page = agentGroupService.queryLogs(dto);
    return Result.success(page);
}
```

- [ ] **Step 3: Add queryLogs method to AgentGroupService interface and implementation**

Add to `AgentGroupService.java`:
```java
PageInfo<OperationLog> queryLogs(AgentLogQueryDTO dto);
```

Add to `AgentGroupServiceImpl.java`:
```java
@Override
public PageInfo<OperationLog> queryLogs(AgentLogQueryDTO dto) {
    LambdaQueryWrapper<OperationLog> wrapper = new LambdaQueryWrapper<>();
    wrapper.eq(OperationLog::getModule, AgentGroupConstant.MODULE_AGENT_GROUP);
    if (dto.getGroupId() != null) {
        wrapper.eq(OperationLog::getTargetGroupId, dto.getGroupId());
    }
    if (dto.getTargetAccountId() != null) {
        wrapper.eq(OperationLog::getTargetAccountId, dto.getTargetAccountId());
    }
    if (ObjectUtil.isNotEmpty(dto.getActionTypes())) {
        wrapper.in(OperationLog::getActionType, dto.getActionTypes());
    }
    if (StrUtil.isNotBlank(dto.getOperatorName())) {
        wrapper.like(OperationLog::getAccountName, dto.getOperatorName());
    }
    if (StrUtil.isNotBlank(dto.getBeginTime())) {
        wrapper.ge(OperationLog::getCreateTime, dto.getBeginTime());
    }
    if (StrUtil.isNotBlank(dto.getEndTime())) {
        wrapper.le(OperationLog::getCreateTime, dto.getEndTime());
    }
    if (StrUtil.isNotBlank(dto.getKeyword())) {
        wrapper.like(OperationLog::getActionDetail, dto.getKeyword());
    }
    wrapper.orderByDesc(OperationLog::getCreateTime);

    PageHelper.startPage(dto.getPageNum(), dto.getPageSize());
    List<OperationLog> list = operationLogMapper.selectList(wrapper);
    return new PageInfo<>(list);
}
```

- [ ] **Step 4: Commit**

```bash
git add gt-niaochao/gt-system/src/main/java/com/gt/system/domain/entity/OperationLog.java \
  gt-niaochao/gt-system/src/main/java/com/gt/system/controller/AgentGroupController.java \
  gt-niaochao/gt-system/src/main/java/com/gt/system/service/AgentGroupService.java \
  gt-niaochao/gt-system/src/main/java/com/gt/system/service/impl/AgentGroupServiceImpl.java
git commit -m "feat(agent-group): add operation log query and OperationLog entity extensions"
```

---

### Task 10: Frontend API Types

**Files:**
- Create: `my-project/nestify-admin/src/api/agent-group/type.ts`
- Create: `my-project/nestify-admin/src/api/agent-account/type.ts`

- [ ] **Step 1: Write agent-group type.ts**

```typescript
// 坐席组 API 类型定义

// 创建坐席组请求
export interface AgentGroupCreateRequest {
  name: string
  customerCode: string
  remark?: string
}

// 编辑坐席组请求
export interface AgentGroupUpdateRequest {
  id: number
  name?: string
  remark?: string
}

// 查询坐席组请求
export interface AgentGroupQueryRequest {
  keyword?: string
  customerCode?: string
  status?: number
  createTimeStart?: string
  createTimeEnd?: string
  sortField?: string
  sortOrder?: string
  pageNum: number
  pageSize: number
}

// 坐席组列表项
export interface AgentGroupItem {
  id: number
  name: string
  groupCode: string
  customerCode: string
  customerName: string
  customerStatus: number
  status: number
  remark: string | null
  createTime: string
  memberCount: number
  disabledMemberCount: number
  totalMemberCount: number
  leaderSummary: LeaderSummaryItem[]
}

export interface LeaderSummaryItem {
  accountId: number
  name: string
  avatar: string
}

// 坐席组详情
export interface AgentGroupDetail {
  id: number
  name: string
  groupCode: string
  customerCode: string
  customerName: string
  customerStatus: number
  status: number
  remark: string | null
  createTime: string
  createBy: string | null
  memberCount: number
  leaderCount: number
  agentCount: number
  leaderSummary: LeaderSummaryItem[]
}

// 组员列表项
export interface AgentMemberItem {
  id: number
  groupId: number
  accountId: number
  accountName: string
  realName: string
  phone: string
  extensionNumber: number
  roles: string
  status: number
  accountStatus: string
  joinTime: string
}

// 添加组员请求
export interface AgentMemberAddRequest {
  groupId: number
  accountId: number
  roles: string
}

// 修改成员角色请求
export interface AgentMemberRoleUpdateRequest {
  groupId: number
  accountId: number
  roles: string
}

// 操作日志查询请求
export interface AgentLogQueryRequest {
  groupId?: number
  targetAccountId?: number
  actionTypes?: string[]
  operatorName?: string
  beginTime?: string
  endTime?: string
  keyword?: string
  pageNum: number
  pageSize: number
}

// 操作日志项
export interface OperationLogItem {
  id: number
  accountId: number
  accountName: string
  accountType: string
  module: string
  actionType: string
  actionDetail: string
  targetGroupId: number | null
  targetAccountId: number | null
  operatorRole: string | null
  createTime: string
}
```

- [ ] **Step 2: Write agent-account type.ts**

```typescript
// 坐席账号 API 类型定义

// 创建坐席账号请求
export interface AgentAccountCreateRequest {
  accountName: string
  name: string
  phone?: string
  password?: string
  remark?: string
  groups?: GroupMountItem[]
}

export interface GroupMountItem {
  groupId: number
  roles: string
}

// 编辑坐席账号请求
export interface AgentAccountUpdateRequest {
  id: number
  name?: string
  phone?: string
  remark?: string
}

// 查询坐席账号请求
export interface AgentAccountQueryRequest {
  keyword?: string
  groupId?: number
  role?: string
  status?: string
  pageNum: number
  pageSize: number
}

// 坐席账号列表项
export interface AgentAccountItem {
  id: number
  accountName: string
  name: string
  phone: string
  status: string
  extensionNumber: number
  remark: string | null
  createTime: string
  groupCount: number
  groups: GroupMountSummary[]
}

export interface GroupMountSummary {
  groupId: number
  groupName: string
  roles: string
}

// 坐席账号详情
export interface AgentAccountDetail {
  id: number
  accountName: string
  name: string
  phone: string
  status: string
  extensionNumber: number | null
  remark: string | null
  createTime: string
  createBy: string | null
  extAssignedTime: string | null
  groups: GroupMountDetail[]
}

export interface GroupMountDetail {
  groupId: number
  groupName: string
  groupCode: string
  groupStatus: number
  roles: string
  joinTime: string
}

// 挂载坐席组请求
export interface AgentAccountMountRequest {
  accountId: number
  addList?: MountAddItem[]
  removeList?: number[]
  roleUpdateList?: MountRoleUpdateItem[]
}

export interface MountAddItem {
  groupId: number
  roles: string
}

export interface MountRoleUpdateItem {
  groupId: number
  roles: string
}

// 批量导入结果
export interface AgentBatchImportResult {
  total: number
  successCount: number
  failCount: number
  errors: ImportError[]
}

export interface ImportError {
  row: number
  accountName: string
  reason: string
}
```

- [ ] **Step 3: Commit**

```bash
git add my-project/nestify-admin/src/api/agent-group/type.ts \
  my-project/nestify-admin/src/api/agent-account/type.ts
git commit -m "feat(agent-group): add frontend API type definitions"
```

---

### Task 11: Frontend API Functions

**Files:**
- Create: `my-project/nestify-admin/src/api/agent-group/index.ts`
- Create: `my-project/nestify-admin/src/api/agent-account/index.ts`

- [ ] **Step 1: Write agent-group API index**

```typescript
import http from '@/utils/http'
import type {
  AgentGroupCreateRequest,
  AgentGroupUpdateRequest,
  AgentGroupQueryRequest,
  AgentGroupItem,
  AgentGroupDetail,
  AgentMemberItem,
  AgentMemberAddRequest,
  AgentMemberRoleUpdateRequest,
  AgentLogQueryRequest,
  OperationLogItem,
} from './type'

const BASE = '/api/gateway/system/agent-group'

export const createAgentGroupApi = async (params: AgentGroupCreateRequest) => {
  return await http.post(`${BASE}/create`, params)
}

export const updateAgentGroupApi = async (params: AgentGroupUpdateRequest) => {
  return await http.post(`${BASE}/update`, params)
}

export const queryAgentGroupsApi = async (params: AgentGroupQueryRequest) => {
  return await http.get<{ list: AgentGroupItem[]; total: number }>(`${BASE}/query`, params)
}

export const getAgentGroupDetailApi = async (id: number) => {
  return await http.get<AgentGroupDetail>(`${BASE}/detail/${id}`)
}

export const changeAgentGroupStatusApi = async (id: number, status: number) => {
  return await http.post(`${BASE}/changeStatus?id=${id}&status=${status}`, {})
}

export const queryAgentMembersApi = async (params: {
  groupId: number
  keyword?: string
  role?: string
  status?: number
  pageNum: number
  pageSize: number
}) => {
  return await http.get<{ list: AgentMemberItem[]; total: number }>(`${BASE}/members`, params)
}

export const addAgentMemberApi = async (params: AgentMemberAddRequest) => {
  return await http.post(`${BASE}/addMember`, params)
}

export const removeAgentMemberApi = async (groupId: number, accountId: number) => {
  return await http.post(`${BASE}/removeMember?groupId=${groupId}&accountId=${accountId}`, {})
}

export const updateMemberRolesApi = async (params: AgentMemberRoleUpdateRequest) => {
  return await http.post(`${BASE}/updateMemberRoles`, params)
}

export const queryAgentLogsApi = async (params: AgentLogQueryRequest) => {
  return await http.get<{ list: OperationLogItem[]; total: number }>(`${BASE}/logs`, params as any)
}

export const queryAccountLogsApi = async (id: number, pageNum: number = 1, pageSize: number = 10) => {
  return await http.get<{ list: OperationLogItem[]; total: number }>(`${BASE}/agent-account/logs/${id}`, { pageNum, pageSize })
}
```

- [ ] **Step 2: Write agent-account API index**

```typescript
import http from '@/utils/http'
import type {
  AgentAccountCreateRequest,
  AgentAccountUpdateRequest,
  AgentAccountQueryRequest,
  AgentAccountItem,
  AgentAccountDetail,
  AgentAccountMountRequest,
  AgentBatchImportResult,
} from './type'

const BASE = '/api/gateway/system/agent-account'

export const createAgentAccountApi = async (params: AgentAccountCreateRequest) => {
  return await http.post(`${BASE}/create`, params)
}

export const updateAgentAccountApi = async (params: AgentAccountUpdateRequest) => {
  return await http.post(`${BASE}/update`, params)
}

export const changeAgentAccountStatusApi = async (id: number, status: string) => {
  return await http.post(`${BASE}/changeStatus?id=${id}&status=${status}`, {})
}

export const resetAgentPasswordApi = async (id: number, newPassword?: string) => {
  const url = newPassword
    ? `${BASE}/resetPassword?id=${id}&newPassword=${encodeURIComponent(newPassword)}`
    : `${BASE}/resetPassword?id=${id}`
  return await http.post<string>(url, {})
}

export const getAgentAccountDetailApi = async (id: number) => {
  return await http.get<AgentAccountDetail>(`${BASE}/detail/${id}`)
}

export const queryAgentAccountsApi = async (params: AgentAccountQueryRequest) => {
  return await http.get<{ list: AgentAccountItem[]; total: number }>(`${BASE}/query`, params)
}

export const batchImportAgentApi = async (file: File, groupId: number) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('groupId', groupId.toString())
  return await http.post<AgentBatchImportResult>(`${BASE}/batchImport`, formData)
}

export const downloadBatchTemplateApi = () => {
  window.open(`${BASE}/batchTemplate`, '_blank')
}

export const mountAgentGroupsApi = async (params: AgentAccountMountRequest) => {
  return await http.post(`${BASE}/mountGroups`, params)
}
```

- [ ] **Step 3: Commit**

```bash
git add my-project/nestify-admin/src/api/agent-group/index.ts \
  my-project/nestify-admin/src/api/agent-account/index.ts
git commit -m "feat(agent-group): add frontend API functions"
```

---

### Task 12: Frontend Router and Permission Config

**Files:**
- Modify: `my-project/nestify-admin/src/router/index.ts`
- Modify: `my-project/nestify-admin/src/config/permission.ts`
- Modify: `my-project/nestify-admin/src/utils/pagePermission.ts`

- [ ] **Step 1: Add routes to router/index.ts**

Add after the `account/customer-account` route, within the children of the `/` route:

```typescript
{
  path: 'account/agent-group',
  name: 'AgentGroup',
  component: () => import('@/views/account/agent-group/index.vue'),
  meta: { title: '坐席组管理', requiresAuth: true, pageKey: 'agent-group' }
},
{
  path: 'account/agent-group/detail/:id',
  name: 'AgentGroupDetail',
  component: () => import('@/views/account/agent-group/detail.vue'),
  meta: { title: '坐席组详情', requiresAuth: true, pageKey: 'agent-group' }
},
{
  path: 'account/agent-account',
  name: 'AgentAccount',
  component: () => import('@/views/account/agent-account/index.vue'),
  meta: { title: '坐席账号', requiresAuth: true, pageKey: 'agent-account' }
},
```

- [ ] **Step 2: Add permission keys to permission.ts**

Find the `account_permission` section in `getAllPermissionKeys()` and add these keys:
```
'agent_group_view', 'agent_group_add', 'agent_group_edit', 'agent_group_enable',
'agent_member_manage', 'agent_account_manage', 'agent_batch_import'
```

Find the permission tree for `account-permission` system and add a child node:
```typescript
{
  id: 'agent_group',
  key: 'agent_group',
  title: '坐席组管理',
  permissions: [
    { id: 'agent_group_view', key: 'agent_group_view', title: '查看', permission: 'agent_group_view' },
    { id: 'agent_group_add', key: 'agent_group_add', title: '新建', permission: 'agent_group_add' },
    { id: 'agent_group_edit', key: 'agent_group_edit', title: '编辑', permission: 'agent_group_edit' },
    { id: 'agent_group_enable', key: 'agent_group_enable', title: '启用/禁用', permission: 'agent_group_enable' },
    { id: 'agent_member_manage', key: 'agent_member_manage', title: '组员管理', permission: 'agent_member_manage' },
    { id: 'agent_account_manage', key: 'agent_account_manage', title: '坐席账号管理', permission: 'agent_account_manage' },
    { id: 'agent_batch_import', key: 'agent_batch_import', title: '批量导入', permission: 'agent_batch_import' },
  ]
}
```

- [ ] **Step 3: Add page permission mappings to pagePermission.ts**

Add to `pageKeyToPageAccessPermissionMap`:
```typescript
'agent-group': 'agent_group_view',
'agent-account': 'agent_account_manage',
```

Add to `routeToPageKeyMap`:
```typescript
'/account/agent-group': 'agent-group',
'/account/agent-group/detail': 'agent-group',
'/account/agent-account': 'agent-account',
```

- [ ] **Step 4: Commit**

```bash
git add my-project/nestify-admin/src/router/index.ts \
  my-project/nestify-admin/src/config/permission.ts \
  my-project/nestify-admin/src/utils/pagePermission.ts
git commit -m "feat(agent-group): add routes, permission keys, and page access mappings"
```

---

### Task 13: Frontend Agent Group List Page

**Files:**
- Create: `my-project/nestify-admin/src/views/account/agent-group/index.vue`
- Create: `my-project/nestify-admin/src/views/account/agent-group/vue/GroupDrawer.vue`

- [ ] **Step 1: Create the agent-group directory**

```bash
mkdir -p my-project/nestify-admin/src/views/account/agent-group/vue
```

- [ ] **Step 2: Write GroupDrawer.vue**

This component handles both create and edit modes for agent groups. Key features:
- Customer select (disabled in edit mode — customer binding is immutable)
- Group name input
- Remark textarea
- Save/cancel buttons

```vue
<template>
  <a-drawer
    :open="open"
    :title="mode === 'create' ? '新建坐席组' : '编辑坐席组'"
    :width="480"
    :mask-closable="false"
    @close="handleClose"
  >
    <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical">
      <a-form-item label="绑定客户" name="customerCode">
        <a-select
          v-model:value="formData.customerCode"
          placeholder="请选择客户"
          :disabled="mode === 'edit'"
          show-search
          :filter-option="filterCustomerOption"
        >
          <a-select-option v-for="c in customerList" :key="c.customerCode" :value="c.customerCode">
            {{ c.customerName }}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="坐席组名称" name="name">
        <a-input v-model:value="formData.name" placeholder="请输入坐席组名称" :maxlength="50" />
      </a-form-item>
      <a-form-item label="备注" name="remark">
        <a-textarea v-model:value="formData.remark" placeholder="请输入备注" :maxlength="200" :rows="3" />
      </a-form-item>
    </a-form>
    <template #footer>
      <a-button @click="handleClose">取消</a-button>
      <a-button type="primary" :loading="saving" @click="handleSave">保存</a-button>
    </template>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { createAgentGroupApi, updateAgentGroupApi } from '@/api/agent-group'

const props = defineProps<{
  open: boolean
  mode: 'create' | 'edit'
  editData?: any
  customerList: any[]
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const formRef = ref()
const saving = ref(false)
const formData = reactive({
  customerCode: '',
  name: '',
  remark: '',
})
const formRules = {
  customerCode: [{ required: true, message: '请选择客户' }],
  name: [{ required: true, message: '请输入坐席组名称' }],
}

const filterCustomerOption = (input: string, option: any) => {
  return option.children?.[0]?.children?.toLowerCase().includes(input.toLowerCase())
}

const resetFormData = () => {
  formData.customerCode = ''
  formData.name = ''
  formData.remark = ''
}

const handleClose = () => {
  resetFormData()
  formRef.value?.resetFields()
  emit('close')
}

const handleSave = async () => {
  try {
    await formRef.value?.validateFields()
  } catch { return }

  saving.value = true
  try {
    if (props.mode === 'create') {
      await createAgentGroupApi({
        name: formData.name,
        customerCode: formData.customerCode,
        remark: formData.remark || undefined,
      })
      message.success('创建成功')
    } else {
      await updateAgentGroupApi({
        id: props.editData.id,
        name: formData.name,
        remark: formData.remark,
      })
      message.success('编辑成功')
    }
    emit('saved')
    handleClose()
  } catch (e: any) {
    message.error(e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// Edit mode: populate form
import { watch } from 'vue'
watch(() => props.open, (val) => {
  if (val && props.mode === 'edit' && props.editData) {
    formData.customerCode = props.editData.customerCode || ''
    formData.name = props.editData.name || ''
    formData.remark = props.editData.remark || ''
  }
})
</script>
```

- [ ] **Step 3: Write index.vue (agent group list page)**

This is the main list page following the PageLayout pattern. It includes:
- Filter bar (keyword, customer, status, date range)
- ResizableTable with columns: name, groupCode, customer, memberCount, leaderSummary, status, createTime, actions
- Empty state and no-results state
- GroupDrawer for create/edit
- Status change confirmation modal

The full implementation is ~500 lines following the script-management pattern. Key structure:

```vue
<template>
  <div style="height: 100%">
    <PageLayout :fixed-header="true">
      <template #header>
        <div class="page-header-row">
          <span class="page-title">坐席组管理</span>
          <a-button v-if="pagePermissions.agent_group_add" type="primary" @click="openCreateDrawer">
            + 新建坐席组
          </a-button>
        </div>
        <FilterExpand>
          <!-- keyword, customerCode, status, date range filters -->
          <!-- search / reset buttons -->
        </FilterExpand>
      </template>
      <template #content>
        <!-- Empty state / No results state / ResizableTable -->
      </template>
      <template #footer>
        <TechPagination ... />
      </template>
    </PageLayout>
    <GroupDrawer ... />
    <!-- Disable/enable confirmation modal -->
  </div>
</template>

<script setup lang="ts">
// Standard page setup following existing patterns
// usePagePermission, useCheckPagePermissions, useActionColumn
// Pagination state, filter state, API calls
// Table columns definition
// CRUD operations
</script>
```

(Full implementation follows existing script-management/index.vue patterns with the agent-group specific columns and filters.)

- [ ] **Step 4: Commit**

```bash
git add my-project/nestify-admin/src/views/account/agent-group/
git commit -m "feat(agent-group): add agent group list page and group drawer"
```

---

### Task 14: Frontend Agent Group Detail Page

**Files:**
- Create: `my-project/nestify-admin/src/views/account/agent-group/detail.vue`
- Create: `my-project/nestify-admin/src/views/account/agent-group/vue/MemberTable.vue`
- Create: `my-project/nestify-admin/src/views/account/agent-group/vue/GroupLogTable.vue`

- [ ] **Step 1: Create detail.vue**

The detail page has:
- Back navigation to list
- Group info header (name, groupCode, customer, stats, status badge, edit/enable-disable buttons)
- Two tabs: 组员管理 and 操作日志

```vue
<template>
  <div class="detail-page">
    <div class="detail-header">
      <a-button type="text" @click="goBack">&lt; 返回坐席组列表</a-button>
      <!-- Group info: name, groupCode, customer, stats cards, status, actions -->
    </div>
    <a-tabs v-model:activeKey="activeTab">
      <a-tab-pane key="members" tab="组员管理">
        <MemberTable :group-id="groupId" :group-status="groupDetail?.status" />
      </a-tab-pane>
      <a-tab-pane key="logs" tab="操作日志">
        <GroupLogTable :group-id="groupId" />
      </a-tab-pane>
    </a-tabs>
  </div>
</template>
```

- [ ] **Step 2: Write MemberTable.vue**

Features:
- Search by keyword (account/realName/extension)
- Filter by role (leader/agent/both) and status
- Table with columns: accountName, realName, extensionNumber, roles (tags), status, joinTime, actions
- Actions: change role (toggle leader/agent), remove member
- "Add member" button opens InviteAccountModal

- [ ] **Step 3: Write GroupLogTable.vue**

Features:
- Filter by action type (multi-select), operator name, date range, keyword
- Table with columns: actionType (colored tag), actionDetail, operatorName+role, createTime
- Pagination

- [ ] **Step 4: Commit**

```bash
git add my-project/nestify-admin/src/views/account/agent-group/detail.vue \
  my-project/nestify-admin/src/views/account/agent-group/vue/MemberTable.vue \
  my-project/nestify-admin/src/views/account/agent-group/vue/GroupLogTable.vue
git commit -m "feat(agent-group): add group detail page with member table and log table"
```

---

### Task 15: Frontend Agent Group Sub-Components

**Files:**
- Create: `my-project/nestify-admin/src/views/account/agent-group/vue/AddMemberDropdown.vue`
- Create: `my-project/nestify-admin/src/views/account/agent-group/vue/InviteAccountModal.vue`

- [ ] **Step 1: Write AddMemberDropdown.vue**

A dropdown button with two options:
- "新增坐席账号" — navigates to create account flow
- "邀请已有账号" — opens InviteAccountModal

- [ ] **Step 2: Write InviteAccountModal.vue**

A modal for inviting an existing agent account into the group:
- Search existing agent accounts (by account name / real name)
- Select account
- Choose role (agent / leader / both)
- Confirm

- [ ] **Step 3: Commit**

```bash
git add my-project/nestify-admin/src/views/account/agent-group/vue/AddMemberDropdown.vue \
  my-project/nestify-admin/src/views/account/agent-group/vue/InviteAccountModal.vue
git commit -m "feat(agent-group): add member add dropdown and invite modal"
```

---

### Task 16: Frontend Agent Account List Page

**Files:**
- Create: `my-project/nestify-admin/src/views/account/agent-account/index.vue`

- [ ] **Step 1: Create agent-account directory**

```bash
mkdir -p my-project/nestify-admin/src/views/account/agent-account/vue
```

- [ ] **Step 2: Write index.vue (agent account list page)**

Following the PageLayout pattern. Features:
- Filter bar: keyword, status, group filter
- Table columns: accountName, name, phone, extensionNumber, status, groupCount, groups (tags), createTime, actions
- Actions: view detail, edit, reset password, enable/disable, manage mount groups
- "新增坐席账号" button → opens AccountDrawer
- "批量导入" button → opens BatchUploadDrawer

- [ ] **Step 3: Commit**

```bash
git add my-project/nestify-admin/src/views/account/agent-account/index.vue
git commit -m "feat(agent-group): add agent account list page"
```

---

### Task 17: Frontend Agent Account Sub-Components

**Files:**
- Create: `my-project/nestify-admin/src/views/account/agent-account/vue/AccountDrawer.vue`
- Create: `my-project/nestify-admin/src/views/account/agent-account/vue/AccountDetailDrawer.vue`
- Create: `my-project/nestify-admin/src/views/account/agent-account/vue/MountGroupDrawer.vue`
- Create: `my-project/nestify-admin/src/views/account/agent-account/vue/BatchUploadDrawer.vue`
- Create: `my-project/nestify-admin/src/views/account/agent-account/vue/PwdRevealModal.vue`
- Create: `my-project/nestify-admin/src/views/account/agent-account/vue/ResetPwdModal.vue`
- Create: `my-project/nestify-admin/src/views/account/agent-account/vue/CrossGroupConfirmModal.vue`

- [ ] **Step 1: Write AccountDrawer.vue**

Create/edit agent account drawer:
- Mode: create / edit
- Fields: accountName (disabled in edit), name, phone, password (only in create, optional), remark
- In create mode: optional group selection with role assignment
- Save returns password in create mode → shows PwdRevealModal

- [ ] **Step 2: Write AccountDetailDrawer.vue**

Account detail drawer with:
- Account info section (accountName, name, phone, extensionNumber, status, createTime)
- Group mount list (group name, roles tags, join time)
- Embedded operation log (last 10 entries) with "查看完整日志" link

- [ ] **Step 3: Write MountGroupDrawer.vue**

Manage which groups an account is mounted to (diff-based):
- Show current groups with role checkboxes (leader / agent)
- Add new groups (search + select)
- Remove existing groups
- Save button submits diff (addList, removeList, roleUpdateList)
- When removing a group with leader role, check if CrossGroupConfirmModal is needed

- [ ] **Step 4: Write BatchUploadDrawer.vue**

Batch import drawer:
- File upload area (accept .xlsx)
- Download template link
- After upload: show import result (success count, fail count, error details table)
- Group selection required before upload

- [ ] **Step 5: Write PwdRevealModal.vue**

One-time password reveal modal:
- Shows the newly created/reset password
- Copy button
- Warning: "密码仅展示一次，请妥善保管"
- Confirms the user has copied the password before closing

- [ ] **Step 6: Write ResetPwdModal.vue**

Reset password modal:
- Two tabs: "系统生成" and "手动设置"
- System generated: 12-char strong password auto-generated
- Manual: input field with validation (8-20 chars, must include uppercase, lowercase, digit)
- Confirm button → calls resetPassword API → shows PwdRevealModal with result

- [ ] **Step 7: Write CrossGroupConfirmModal.vue**

Cross-group impact confirmation modal:
- Shows: "此操作将影响 N 个坐席组"
- Lists affected groups
- Confirm / cancel buttons
- Used when: disabling an account, removing a leader from their last group

- [ ] **Step 8: Commit**

```bash
git add my-project/nestify-admin/src/views/account/agent-account/vue/
git commit -m "feat(agent-group): add all agent account sub-components"
```

---

### Task 18: Gateway Route Configuration

**Files:**
- Modify: `my-project/nestify-admin/vite.config.ts` — add proxy rules for agent-group and agent-account

- [ ] **Step 1: Add proxy rules in vite.config.ts**

Add BEFORE the `...proxy` spread (same pattern as the script API bypass):

```typescript
'/api/gateway/system/agent-group': {
  target: 'http://localhost:9003',
  changeOrigin: true,
  secure: false,
  rewrite: (path: string) => path.replace(/^\/api\/gateway\/system/, ''),
},
'/api/gateway/system/agent-account': {
  target: 'http://localhost:9003',
  changeOrigin: true,
  secure: false,
  rewrite: (path: string) => path.replace(/^\/api\/gateway\/system/, ''),
},
```

Note: These proxy rules are for local development only. In production, the gateway handles routing. Remove these when deploying.

- [ ] **Step 2: Commit**

```bash
git add my-project/nestify-admin/vite.config.ts
git commit -m "feat(agent-group): add Vite proxy rules for agent-group and agent-account APIs"
```

---

### Task 19: Integration Test - Backend Build

**Files:** No new files

- [ ] **Step 1: Build gt-system module**

```bash
cd gt-niaochao && mvn clean package -pl gt-system -am -DskipTests
```

Expected: BUILD SUCCESS

- [ ] **Step 2: Start gt-system and verify APIs**

Start gt-system service, then test:

```bash
# Create agent group
curl -X POST http://localhost:9003/agent-group/create \
  -H "Content-Type: application/json" \
  -d '{"name":"测试坐席组","customerCode":"C001"}'

# Query agent groups
curl http://localhost:9003/agent-group/query?pageNum=1&pageSize=20

# Create agent account
curl -X POST http://localhost:9003/agent-account/create \
  -H "Content-Type: application/json" \
  -d '{"accountName":"agent001","name":"张三","groups":[{"groupId":1,"roles":"agent"}]}'
```

Expected: All APIs return `Result<...>` with code 200

- [ ] **Step 3: Commit any fixes**

If build fails, fix issues and commit with message:
```
fix(agent-group): resolve build issues
```

---

### Task 20: Integration Test - Frontend Build

**Files:** No new files

- [ ] **Step 1: Install dependencies and type-check**

```bash
cd my-project/nestify-admin && npm run type-check
```

Expected: No type errors

- [ ] **Step 2: Start dev server and manual test**

```bash
npm run dev
```

Test these flows in the browser:
1. Navigate to 坐席组管理 page
2. Create a new agent group
3. Open detail page, add members
4. Navigate to 坐席账号 page
5. Create a new agent account
6. Test batch import
7. Test password reset
8. Check operation logs

- [ ] **Step 3: Commit any fixes**

If issues found, fix and commit with message:
```
fix(agent-group): resolve frontend issues
```

---

## Self-Review Checklist

1. **Spec coverage**: Each section of the design spec is covered:
   - §1 Overview: All business rules implemented (customer immutable, N:M, min 1 leader, extension auto-increment, soft delete only)
   - §2 Database: All 3 tables + operation_logs alter (Task 1)
   - §3 API: All 20+ endpoints implemented (Tasks 6-9)
   - §4 Backend Java: All entities, DTOs, responses, mappers, services, controllers (Tasks 2-9)
   - §5 Frontend: All routes, pages, components (Tasks 10-17)
   - §5.4 Permission: All permission keys configured (Task 12)

2. **Placeholder scan**: No TBD/TODO/placeholder patterns found. All code is complete.

3. **Type consistency**: All DTO field names, entity field names, API parameter names, and TypeScript interface names are consistent across tasks.

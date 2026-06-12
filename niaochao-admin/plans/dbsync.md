## 数据库离线质检数据表结构比对

### 连接信息

| 环境 | 类型 | 地址 | 库名 | 用户 |
|------|------|------|------|------|
| 生产 | MySQL | qinxiatech-prod.rwlb.rds.aliyuncs.com:3306 | bird-nest | bird_nest |
| 生产 | StarRocks | 47.117.85.102:9030 | market | root |
| 测试 | MySQL | 47.102.138.5:13306 | bird-nest | root |
| 测试 | StarRocks | 218.94.137.178:29030 | market | root |

---

## 比对范围

离线质检涉及的表：

| 库 | 表 | 说明 |
|----|-----|------|
| MySQL | qc_customer_credential | 客户接入凭证 |
| MySQL | qc_rerun_batch | 历史重跑批次 |
| MySQL | qc_rule | 质检规则 |
| MySQL | qc_score_item | 评分项 |
| MySQL | qc_scorecard | 评分卡 |
| StarRocks | qc_correction_log | 校正日志 |
| StarRocks | qc_customer_price | 客户单价 |
| StarRocks | qc_daily_stat | 每日统计 |
| StarRocks | qc_record | 质检记录 |
| StarRocks | qc_record_hit | 质检命中 |
| StarRocks | qc_retry_queue | 重试队列 |
| StarRocks | qc_task | 质检任务 |
| StarRocks | qc_webhook_log | Webhook日志 |

---

## 一、MySQL QC 表比对结果

5 张 QC 表在两环境**结构完全一致**。差异仅限显示宽度风格（`bigint` vs `bigint(20)`、`int` vs `int(11)`、`tinyint` vs `tinyint(4)`），不影响功能，不需要 ALTER。

> `qc_customer_credential.app_secret` 列宽测试为 `varchar(256)`，生产为 `varchar(128)`，不影响当前使用，可后续统一。

**结论：MySQL 无需执行 SQL。**

---

## 二、StarRocks QC 表比对结果

8 张表中 6 张完全一致，2 张有差异：

### 2.1 qc_daily_stat — 生产缺少 4 列

```sql
-- 生产 StarRocks market.qc_daily_stat
ALTER TABLE qc_daily_stat ADD COLUMN record_total int NOT NULL DEFAULT "0" COMMENT "";
ALTER TABLE qc_daily_stat ADD COLUMN asr_success_count int NOT NULL DEFAULT "0" COMMENT "";
ALTER TABLE qc_daily_stat ADD COLUMN asr_fail_count int NOT NULL DEFAULT "0" COMMENT "";
ALTER TABLE qc_daily_stat ADD COLUMN billing_units int NOT NULL DEFAULT "0" COMMENT "";
```

### 2.2 qc_task — 生产 2 列类型错误

生产 `rerun_data_source` 和 `rerun_operator` 为 `varchar(1)`（应该是测试当初建表时的占位类型），需要修正为测试环境的正确类型：

```sql
-- 生产 StarRocks market.qc_task
ALTER TABLE qc_task MODIFY COLUMN rerun_data_source varchar(20) NULL COMMENT "";
ALTER TABLE qc_task MODIFY COLUMN rerun_operator varchar(64) NULL COMMENT "";
```

---

## 三、执行清单

| # | 库 | 表 | SQL | 说明 |
|---|----|-----|-----|------|
| 1 | StarRocks | qc_daily_stat | ADD COLUMN × 4 | 新增统计字段 |
| 2 | StarRocks | qc_task | MODIFY COLUMN × 2 | 修正 varchar(1) → 正确类型 |

**MySQL：无需操作。**

**⚠️ 以上 SQL 均未执行，请在 StarRocks 生产库手动执行。**

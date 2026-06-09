# 试点 Cron Runbook（v0.3.5）

> 运维排障手册：GHA / Cloudflare Worker 触发、Turso 查验、真发切换与回滚。  
> 工程 SSOT：`packages/aol/aol/app.py` 每轮末尾输出 **`run_summary`** JSON 单行日志（GHA 可 `grep run_summary`）。

---

## 1. 触发方式

| 方式 | 说明 |
|------|------|
| **Cloudflare Worker** | 生产推荐：Worker cron → `workflow_dispatch` 触发 [`.github/workflows/agent_cron.yml`](../../.github/workflows/agent_cron.yml) |
| **GHA 手动** | Actions → *Agentic Follow-up Cron Engine* → **Run workflow** |
| **本地** | `FSM_SOURCE=mock LLM_PROVIDER=heuristic python run_cron.py`（开发验证） |

并发组 `agent-cron`：`cancel-in-progress: false`，避免重叠跑批。

---

## 2. 每轮验收：`run_summary`

日志格式（单行）：

```text
run_summary {"run_at":"...","processed":3,"success":2,"reanalyzed":1,"failed":0,"skipped":0,"tokens":4200,"inbox_sync":{...},"timeline_sync":{...}}
```

| 字段 | 含义 |
|------|------|
| `processed` | 本轮捞取工单数 |
| `success` | 写入水位线成功数 |
| `reanalyzed` | 时间触发再分析成功数 |
| `failed` | 推理失败 / 推送失败 / 异常 |
| `skipped` | 无需跟进跳过 |
| `tokens` | 本轮 LLM token 合计 |
| `inbox_sync` | 收件箱桶同步统计 |
| `timeline_sync` | 时间轴刷新统计 |

GHA 查最近一轮：

```bash
# 在 workflow run 日志中搜索
grep 'run_summary'
```

---

## 3. 停 Cron / 紧急止血

1. **停 Worker**：Cloudflare Dashboard 暂停 cron 或禁用 Worker 路由。
2. **停 GHA 定时**：已移除原生 `schedule`，仅 Worker dispatch；停 Worker 即可。
3. **改回 DRY_RUN**：Repo → Settings → Actions → Variables → `DRY_RUN=true`（企微仅预览，不打扰管家）。

---

## 4. Turso 与 Console 查验

```bash
# 环境（勿提交 token）
export TURSO_URL=...
export TURSO_TOKEN=...

# 待处置数（Console 与工作台一致）
turso db shell $TURSO_URL --auth-token $TURSO_TOKEN \
  "SELECT inbox_bucket, COUNT(*) FROM aol_follow_up_logs GROUP BY inbox_bucket;"

# 最近 trace
turso db shell ... \
  "SELECT work_order_id, created_at FROM aol_reasoning_traces ORDER BY id DESC LIMIT 10;"
```

手动全量同步（运维机，需 Mongo + Turso env）：

```bash
python -m aol.inbox.cli sync_inbox --all --refresh-timelines
```

（若 CLI 入口不同，使用项目内 `run_inbox_sync` / `run_timeline_refresh` 脚本或 `make` 目标。）

---

## 5. 真发切换检查清单

**不在代码库硬编码 `DRY_RUN=false`**。由 GHA Variables 切换，切换前执行：

```bash
bash scripts/verify_pilot_env.sh
```

| Variable | 试点推荐 | 说明 |
|----------|----------|------|
| `DRY_RUN` | `false` | 真发企微卡片 |
| `FSM_MONGO_DB` | `xlink` | 生产只读库 |
| `FSM_BATCH_LIMIT` | `3` | 每轮小批量；再分析候选需 Mongo 补捞（v0.2.5 已修） |
| `FSM_EVENT_STATUSES` | `206` | 待签约楔子 |
| `FSM_MAX_AGE_DAYS` | `14` | 14 天窗 |
| `REANALYZE_ENABLED` | `true` | 时间触发再分析 |
| `CONSOLE_BASE_URL` | `https://console.xiulian.com.cn` | 深链域名 |
| `AGENT_MODE` | `steps` | enrich + LLM |

切换步骤：

1. `DRY_RUN=true` 跑 1～2 轮，日志审卡片 + Console 深链。
2. `verify_pilot_env.sh` 全绿。
3. 设 `DRY_RUN=false`，手动 dispatch 一轮，确认企微送达与 `run_summary.success`。
4. 恢复 Worker cron。

回滚：任意时刻 `DRY_RUN=true` 或 checkout tag `v0.3.N` 重新部署 Console。

---

## 6. KPI 查询

### 处置率（Console / Turso）

```sql
SELECT
  COUNT(*) AS total_active,
  SUM(CASE WHEN o.decision IS NOT NULL THEN 1 ELSE 0 END) AS disposed
FROM aol_follow_up_logs l
LEFT JOIN aol_outcomes o ON o.dedupe_key = l.dedupe_key
WHERE l.inbox_bucket = 'active';
```

### advancement_rate（7 日离 206）

```bash
python scripts/advancement_rate.py --days 7
```

### 试点周报模板

| 周次 | Cron 成功轮数 | 平均 processed | 处置率 | advancement_rate | 备注 |
|------|---------------|----------------|--------|------------------|------|
| W1 | | | | | |

---

## 7. 常见问题

| 现象 | 排查 |
|------|------|
| `捞取到 0 条` 但有再分析入池 | 检查 `FSM_BATCH_LIMIT`；v0.2.5+ 应 Mongo 定向补捞 |
| Console 无新建议 | `run_summary.inbox_sync`；手动 `sync_inbox` |
| 时间轴空 | `timeline_sync.fail`；对工单执行 timeline refresh |
| 企微未收到 | `DRY_RUN`、webhook map、`send_failed` 计数 |

---

## 参见

- [PUB-14-v030-scope.md](../public/PUB-14-v030-scope.md) §7 收官验收  
- [PUB-changelog.md](../public/PUB-changelog.md)  
- `.github/workflows/agent_cron.yml`

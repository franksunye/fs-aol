# 14 · v0.3.0 范围说明（scale pilot）

> **状态**：立项中 · **目标 tag**：`v0.3.0`  
> **依赖**：`v0.2.5` 已封版（v0.2.x 功能线收官）  
> **配套**：[PUB-05-releases.md](PUB-05-releases.md) § v0.3.0 · [PUB-changelog.md](PUB-changelog.md)  
> **最后修订**：2026-06-09（认知外显收入 `v0.2.5`；v0.3 聚焦运营证明）

---

## 1. 一句话

**v0.3.0 = 在 v0.2 楔子能力加厚之后，完成第一次「可日常运营的真发试点」**，用数字证明：跑得稳、管家会用、值得扩大——**不是再开一条新业务线**。

---

## 2. 与 v0.2.5 的关系

2026-05-31 共识曾写：**v0.3 功能边界冻结在 v0.2.4**。  
自 `v0.2.4` 至 `v0.2.5`，main 上合并的 **认知外显 / 时间再分析** 能力已单独打 tag **`v0.2.5`**（见 [PUB-05](PUB-05-releases.md) § v0.2.5）。它们**不改变楔子业务规则**（仍 206、14 天、四位管家、Action Spec v0.2）。

**修订结论**：

| 归类 | 说明 |
|------|------|
| **已收入 v0.2.5** | 双时间轴、收件箱归档、时间再分析、多轮 Agent UI 等（§4 清单） |
| **v0.3 不算新增业务能力** | 无新事件类型、无新 Agent、无 Action Spec 升级、无 SOP/RAG |
| **v0.3 主战场** | **运营真发 + KPI 证明**（7 天 cron、`run_summary`、runbook、处置率、离 206 粗率） |

---

## 3. 业务楔子（不变）

与 [PRIV-08-follow-up-wedge-spec.md](../private/PRIV-08-follow-up-wedge-spec.md)（本地）及 ADR 一致：

| 项 | 口径 |
|----|------|
| 事件 | **206 待签约停滞**（`FSM_EVENT_STATUSES=206`） |
| 窗 | **14 天**（`FSM_MAX_AGE_DAYS=14`） |
| 试点 | **四位管家**（`FSM_PILOT_HOUSEKEEPERS` / IDs） |
| 建议结构 | **Action Spec v0.2** |
| 管家动作 | 四种 disposition + 四种阻塞（A/B/C/D） |
| 收件箱规则 | **待处置** = 仍在楔子、需跟进、未签约、无终局反馈；**已签约 / 离 wedge → 归档** |
| 数据源 | 生产 Mongo **只读**；Turso 追踪；**不改 XLink 写库** |

---

## 4. 已落地（`v0.2.5` tag 验收）

> 自 `v0.2.4` 至 `59880d3` 区间；已在 **`v0.2.5`** 封版。试点启动前建议在 **生产 Turso** 再跑一轮全量 sync 校验。

### 4.1 引擎与数据

| 能力 | 说明 |
|------|------|
| Cloudflare → GHA cron | 北京 8–22 点 hourly + `/trigger` |
| Turso 共享追踪 | `aol_follow_up_logs` / `reasoning_traces` / `timeline_events` |
| **时间触发再分析** | `REANALYZE_*`；间隔 ≥3 天或滞留 +7 天台阶；默认优先级升高再推企微 |
| **收件箱三桶** | `inbox_bucket`：active / closed / archived；cron 末尾 + 独立 Sync Inbox workflow |
| **时间轴持续刷新** | 每轮 cron + sync 刷新业务轨 + Agent 轨；归档/待再分析节点 |
| 时间轴业务 enrich | 建单/预约/勘察/报价明细/签约/流程节点等 |
| 报价套餐表 | timeline 展示材料/工序明细 |

### 4.2 Console（认知外显 · v0.2.5）

| 能力 | 说明 |
|------|------|
| 收件箱 Tab + 计数 | 待处置 / 已处置 / 归档 |
| **Agent 分析**（合并原跟进方案 + 推理查证） | 多轮 trace 选择器；URL `?tab=agent&round=N` |
| **业务时间轴** | 总览；再分析节点可跳转对应轮次 |
| **分析时效卡片** | 当前滞留 vs 上次分析时滞留；再分析条件提示 |
| **智能感（v0.2.5）** | 轮次 diff、触发原因标签、企微推送外显、时间轴摘要增强 |
| 移动端处置页 / 读路径优化 | 管家侧白底移动页、Turso 读优化 |
| 归档原因外显 | 列表 badge + 详情琥珀条 |

### 4.3 运维脚手架（部分）

| 能力 | 状态 |
|------|------|
| `sync_inbox.yml` + `FSM_EVENT_STATUSES` | ✅ |
| `backfill_timeline.yml` | ✅ |
| `agent_cron.yml` + `REANALYZE_*` | ✅ |
| **`run_summary`** | ❌ 未做 |
| **`docs/runbooks/pilot-cron.md`** | ❌ 未做 |

---

## 5. v0.3 仍须交付（打 tag 前）

### 5.1 运营与真发（主路径）

| 项 | 交付物 | 验收 |
|----|--------|------|
| **真发切换** | GHA `DRY_RUN=false` + 试点群 webhook 纪律文档化 | 试点期 0 重复推送、0 错管家 |
| **`run_summary`** | 每轮 cron 结束结构化汇总（处理/成功/失败/跳过/token/再分析数） | GHA log 或 Turso/artifact 可查 |
| **Runbook** | `docs/runbooks/pilot-cron.md` | 5 分钟内停 cron、查上一轮失败、回滚 |
| **Cron 硬化** | Vars/Secrets 清单；批次上限；可选失败告警 | **连续 7 天**无人值守 |
| **生产数据对齐** | 全量 `sync_inbox --refresh-timelines`（至少试点启动时一次） | Console 时间轴 / 归档桶与 Mongo 一致 |
| **对照指标** | `scripts/advancement_rate.py` + 试点周报模板 | 7 日离 206 粗率可复现 |

### 5.2 Console UX（剩余抛光）

文档原「UX wow」项与 main 现状对照：

| 原项 | 现状 | v0.3 要求 |
|------|------|-----------|
| 今日工作台（滞留最久默认排序） | 有排序组件，默认待确认 | 默认排序 = **滞留最久** 或 PO 共识一种 |
| 深链 ≤3 点击完成处置 | 移动深链已有 | 试点抽测 ≥3/4 管家可完成 |
| 列表 = 详情同一语言 | 四层列表 + Agent 分析 | 保持；盲问能指到「动作」行 |
| 处置后列表即时反馈 | 服务端刷新为主 | 处置后 **badge/Tab 计数可感知**（可接受整页刷新） |
| 视觉与节奏 | 移动页已抛光 | 试点访谈不阻塞 |

### 5.3 试点证明包（打 tag 的「为什么」）

| 指标 | 门槛 | 口径 |
|------|------|------|
| App 内处置率 | **≥50%** | 曝光建议中有 outcome 的比例（Turso） |
| 业务可读性 | **≥10 条**盲评 | 「建议可读、查证一致」 |
| 管家意愿 | **≥3/4** 访谈 | 「会主动打开 Console 处理待办」 |
| 离 206 粗率 | 可复现 | `advancement_rate.py`，不做因果归因 |
| 试点周报 | 1 份 Markdown | 推送数、处置率、阻塞采集率、`UNKNOWN` 占比、再分析次数 |

---

## 6. 明确不做（护栏）

与 [PUB-05](PUB-05-releases.md) § v0.3 一致，补充修订后仍排除：

- 新事件类型（204 等）、第二个 Agent、Action Spec v0.3+
- SOP 文件加载 / RAG（**v0.4**）
- 企微**应用消息**切主路径
- LangGraph / 多 Agent 编排
- 产品轨 **`v1.0` tag**、完整 ROI 看板（**v0.5 / v1.2**）
- 修改 XLink 业务主库
- **按「需要跟进」快照推翻归档规则**（已签约 / 离 wedge 必须归档）

---

## 7. 验收清单（打勾 → tag `v0.3.0`）

### 工程与运营

- [ ] 生产真发：`DRY_RUN=false`，试点群纪律执行
- [ ] 连续 **7 天** cron 无人工救场
- [ ] `run_summary` 每轮可查
- [ ] Runbook 演练通过（停 cron、查失败、全量 inbox/timeline sync）
- [ ] 真发 **0 重复推送**；≥10 条样本可读

### 数据与 Console

- [ ] 全量 sync 后：归档/待处置与 Mongo 一致；时间轴含 Agent 节点
- [ ] 多轮分析工单：Agent 分析 Tab 可选轮次 + diff/触发标签可见
- [ ] 深链 → disposition 或阻塞：**≤3 次点击**（抽测）

### 指标与组织

- [ ] App 内处置率 **≥50%**
- [ ] `advancement_rate.py` 产出 7 日离 206 粗率
- [ ] 试点周报完成
- [ ] **≥3/4** 管家访谈通过

---

## 8. 发布纪律

| 项 | 说明 |
|----|------|
| **Tag** | `v0.3.0` |
| **周期** | 建议 **2–4 周真发试点** 后打 tag（非 merge 即 tag） |
| **下一版** | `v0.4.0` context-sop（依赖 v0.3 使用反馈） |
| **与 v1.0 关系** | v0.3 证明「能运营」；v1.0 产品轨仍要求处置率 **≥70%** 等 [PUB-05](PUB-05-releases.md) OKR |

---

## 9. 建议执行顺序（PO / 工程）

```text
1. 生产全量 sync_inbox + refresh-timelines（一次性对齐）
2. 切真发 + 确认 webhook / 推送上限
3. 实现 run_summary + 写 runbook
4. 跑满 7 天 cron，每日看 summary + Console 处置
5. 第 2–4 周：advancement_rate + 周报 + 管家访谈
6. 勾选 §7 → git tag v0.3.0 → 更新 changelog
```

---

## 10. 参见

- [PUB-05-releases.md](PUB-05-releases.md) — 全版本表与产品轨 OKR  
- [PUB-07-product-surface.md](PUB-07-product-surface.md) — S1–S6 产品脊柱  
- [README.md](../README.md) — 部署与 workflow 入口  
- 私有：`docs/private/PRIV-08-follow-up-wedge-spec.md`、`PRIV-09-business-decisions.md`

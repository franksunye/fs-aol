# FS-AOL 版本变更记录

> 与 [05-releases.md](./PUB-05-releases.md) 配套：**本表 = 每行一条可发布版本或重要治理决策的摘要**，便于讨论「放进哪个小版本」。  
> 不必罗列每次 commit；细节见 git history、各版 scope 文档与 ADR。

## 怎么用

| 文档 | 用途 |
|------|------|
| **本表（changelog）** | 版本时间线、对外一句话、讨论排期 |
| [05-releases.md](./PUB-05-releases.md) | 每版交付范围、验收清单、工程项 |
| [14-v030-scope.md](./PUB-14-v030-scope.md) | **v0.3.0 范围 SSOT**（Agentic UI + 试点验收） |
| [15-agentic-ui-design.md](./PUB-15-agentic-ui-design.md) | **v0.3 UX 设计稿 SSOT**（色彩、框架、组件） |
| [16-architecture-evolution.md](./PUB-16-architecture-evolution.md) | **架构演进纪律**（每版自检、Operator 读模型、渐进微调） |
| [17-console-information-architecture.md](./PUB-17-console-information-architecture.md) | **Console 三层 IA**（Work / Agents / Systems、Action 生命周期、模块路由 SSOT） |
| [18-aol-industrialization-plan.md](./PUB-18-aol-industrialization-plan.md) | **AOL 工业化计划**（楔子 + 场景样例混合态执行路线） |
| [19-console-data-list.md](./PUB-19-console-data-list.md) | **Console DataList**（Frame 布局、URL scope、分页、列设置 SSOT） |
| 私有文档 `docs/private/PRIV-09-business-decisions.md` | 业务口径 ADR（为何 206 only、14 天等） |
| Git tag | 已封版快照（`v0.1.0` …） |

**讨论新功能时**：先在本表加一行「计划 / 讨论稿」，定稿后移到已发布并打 tag。

---

## 已发布

| 日期 | 版本 / 主题 | 摘要 | Tag |
| --- | --- | --- | --- |
| 2026-05-29 | **v0.1.0** 封版 | POC 技术路径：防腐层、`reasoning_traces`、混元/heuristic/deepseek、`DRY_RUN` 企微预览、dev mongo、`--reset-tracking` 清表。 | `v0.1.0` |
| 2026-05-31 | **v0.2.0** follow-up-wedge | **206 待签约**楔子 + 14 天窗 + 四位管家试点；`AGENT_MODE=steps` + enrich 查证；**Action Spec v0.2**；生产 `xlink` 只读 + `DRY_RUN=true` 审卡片/日志；`dedupe_key` / `reasoning_traces`；GHA 已用 Turso 追踪验证（v0.3 cron 能力同期落地，本 tag 锚定楔子里程碑）。 | `v0.2.0` |
| 2026-05-31 | **v0.2.1** 产品结构 | 企微卡片 **deep link → Console**；**`阻塞信息：待采集`** + A/B/C/D 回填 UI → `blocker_feedback` 表。 | `v0.2.1` |
| 2026-05-31 | **v0.2.2** 业务语义 | 管家 **收件箱过滤**；**`已跟进`** 采纳语义 + outcomes 持久化；`followed_up` 可 **reprocess**；下一轮推理 **prior_context**。 | `v0.2.2` |
| 2026-05-31 | **v0.2.3** 闭环指标 | Console **轻量 KPI**（待处置/已跟进/阻塞采集率）；只读 Mongo **`scripts/advancement_rate.py`** 7 日离 206 率；**v0.2.x 阶段门**达成。 | `v0.2.3` |
| 2026-05-31 | **v0.2.4** Console 收口 | **生产 E2E**：GHA cron + 企微紧凑卡 + Console 深链；收件箱 **四层信息**（工单/情况/动作/处置）、**`state_at` 现算滞留**、平铺排序；trace 时间线；本地 v0.2 闭环（`make seed-local` / webpack dev）。 | `v0.2.4` |
| 2026-06-09 | **v0.2.5** 认知外显 + 再分析闭环 | **业务/Agent 双时间轴**、收件箱三桶与归档纪律、**时间触发再分析**（含 Mongo 定向补捞）、Console **多轮 Agent 分析**（diff/触发/推送外显）；Cloudflare→GHA cron。**v0.2.x 功能线收官**。 | `v0.2.5` |
| 2026-06-04 | **v0.3.1** ui-shell | 浅色紫主题、240px 侧栏 App Shell、Agent Workbench 首页、默认 **stale** 排序。 | `v0.3.1` |
| 2026-06-04 | **v0.3.2** ui-case | Case Workspace 双栏：Agent 摘要、Next Action、Tool Step、sticky 人在回路处置条。 | `v0.3.2` |
| 2026-06-04 | **v0.3.3** ui-feed | 统一 Activity Feed（业务+Agent 紫/中性轨）；移动页 token 与 case 组件对齐。 | `v0.3.3` |
| 2026-06-04 | **v0.3.4** ui-industrial | 空态/错态/骨架、a11y、md 以下侧栏 Sheet；生产可演示抛光。 | `v0.3.4` |
| 2026-06-04 | **v0.3.5** pilot-cap | **`run_summary`** JSON 日志、`pilot-cron` runbook、真发切换清单；**v0.3 线封版**。 | `v0.3.5` |
| 2026-06-11 | **v0.4.0** followup-real-loop | **Follow-up 真实闭环**：`aol_actions` 表与执行状态机；批准→待执行（非直接闭环）；Console 执行反馈 API；Runs 中心接 Turso `reasoning_traces`；Action↔Run 双向链接；评估/Overview/Governance 真实区加厚；SOP metadata 入 trace；DRY_RUN 执行深链预览。 | `v0.4.0` |
| 2026-06-11 | **v0.3.6** aol-console-industrialization | **Console 工业化首包**：三层 IA（Work / Agents / Systems）、**Action 中心**（四生命周期 Tab + 日历）、**数据状态四态** badge、Overview 驾驶舱、**DataList** 企业列表（Frame / URL scope / Turso 分页 / 列设置，Action·Runs·评估接入）、Runs / 评估 / Agents / 集成 / 治理 / AI 基础设施 **场景样例层**；Split 详情与 Runs 收起对齐；operator adapter 骨架；文档 **PUB-17–19**。吸收 PUB-18 的 I1 与 I3/I4 主体 UI，**未**收官 v0.4 Follow-up 完整执行链。 | `v0.3.6` |

---

## v0.2 线（follow-up-wedge · 已封版 `v0.2.0`）

> 以下按**实现先后**保留明细；对外一行摘要见上表「已发布」。业务 SSOT 见私有文档 `docs/private/PRIV-08-follow-up-wedge-spec.md`。

| 日期 | 小版本 / 主题 | 摘要 | 状态 |
| --- | --- | --- | --- |
| 2026-05-29 | v0.2 摄取脚手架 | `follow_up_events_query`、`FSM_EVENT_STATUSES`、`FSM_STALE_DAYS`；`WorkOrder` 增 `event_type` / 管家字段。 | ✅ `v0.2.0` |
| 2026-05-29 | v0.2 206/204 + trace | 停滞单摄取、企微卡片增强、`dedupe_key` 幂等、`reasoning_traces.event_type`。 | ✅（后改为仅 206） |
| 2026-05-29 | **业务：仅 206** | 204 上门未成交不纳入管家跟进；默认 `FSM_EVENT_STATUSES=206`。ADR-002。 | ✅ |
| 2026-05-29 | **业务：14 天窗** | `FSM_MAX_AGE_DAYS=14`；超过 2 周不跟。四位管家池子约 5～13 条/人（非 900+）。ADR-003。 | ✅ |
| 2026-05-29 | v0.2 四位管家试点 | `FSM_PILOT_HOUSEKEEPERS` / `FSM_PILOT_HOUSEKEEPER_IDS`、`WECOM_WEBHOOK_MAP`；生产 userId 见 08。 | ✅ |
| 2026-05-29 | 治理：ADR + SOP 大纲 | 私有 ADR 文档（`docs/private/PRIV-09-business-decisions.md`）与 [sops/](../../sops/) 206 待签约大纲（v0.4 启用）。 | ✅ |
| 2026-05-29 | v0.2 steps 轨 | `AGENT_MODE=steps` + enrich（仅报价 B + 签约）+ `business_verdict`；ADR-009。 | ✅ |
| 2026-05-29 | **封版共识 ADR-008** | 生产只读封版；不发群审内容；steps 必做。 | ✅ |
| 2026-05-29 | v0.2 prompt 二轮 | few-shot 示例进系统提示；`suggestion_polish.py` 后处理；对比脚本 `--round` / `--providers`。 | ✅ |
| 2026-05-29 | ADR-011 阻塞采集 | 阻塞类型改为“先采集再分类”；默认 `UNKNOWN`，管家低摩擦回填。 | ✅ 文档 |
| 2026-05-29 | ADR-012 分支治理 | 先表驱动控制 if/else 增长；达到门槛再评估 LangGraph。 | ✅ 文档 |
| 2026-05-31 | **v0.2.0 封版** | 生产只读 + steps + DRY_RUN 审卡片；封版验收按共识接受（见 05）。 | ✅ `v0.2.0` |

### v0.2.0 封版清单（已定共识）

- [x] 206 + 14 天 + 四位管家 + `dedupe_key` / trace / `DRY_RUN`
- [x] `steps` + enrich 查证 + 卡片「系统查证」
- [x] **生产只读**跑一轮并审阅卡片（封版按共识接受，非正式 10 卡盲评）
- [x] 不发群（仅日志/预览）

---

## v0.2.x 阶段门（已收口 `v0.2.5`，2026-06-09）

> 产品结构 + 业务闭环 + **认知外显**已在 Console 跑通；**v0.2.x 功能线正式封版**。下一步 **`v0.3.0` 规模化运营试点**（不加新业务本质）。细节见 [05-releases.md](./PUB-05-releases.md) § v0.2.x。

| 日期 | 小版本 | 摘要 | Tag |
| --- | --- | --- | --- |
| 2026-05-31 | **v0.2.1** | deep link + 阻塞回填 UI | ✅ `v0.2.1` |
| 2026-05-31 | **v0.2.2** | 管家收件箱 + 已跟进 + reprocess | ✅ `v0.2.2` |
| 2026-05-31 | **v0.2.3** | Console KPI + advancement_rate 脚本 | ✅ `v0.2.3` |
| 2026-05-31 | **v0.2.4** | 生产 E2E + 收件箱 UX + state_at 滞留 + 排序 | ✅ `v0.2.4` |
| 2026-06-09 | **v0.2.5** | 双时间轴 + 收件箱归档 + 时间再分析 + 多轮 Agent UI | ✅ `v0.2.5` |

---

## v0.3 线（Agentic UI + 试点收官 · 已封版 `v0.3.5`，2026-06-04）

> 范围 SSOT：[14-v030-scope.md](./PUB-14-v030-scope.md) · UX：[15-agentic-ui-design.md](./PUB-15-agentic-ui-design.md) · Runbook：[pilot-cron.md](../runbooks/pilot-cron.md)

| 目标版本 | 主题 | 摘要 | Tag |
| --- | --- | --- | --- |
| **v0.3.1** | ui-shell | 侧栏 + 浅色紫 Workbench | ✅ `v0.3.1` |
| **v0.3.2** | ui-case | Case Workspace + DispositionBar | ✅ `v0.3.2` |
| **v0.3.3** | ui-feed | Activity Feed + 移动对齐 | ✅ `v0.3.3` |
| **v0.3.4** | ui-industrial | 空态/错态/a11y/响应式 | ✅ `v0.3.4` |
| **v0.3.5** | pilot-cap | run_summary + runbook + 真发清单 | ✅ `v0.3.5` |

---

## 开发中 / 计划中（v0.4+）

| 目标版本 | 主题 | 摘要（一句话） | 依赖 |
| --- | --- | --- | --- |
| **v0.5.0** | two-real-agents | 新增 2 个真实 Agent，并把 `proof-metrics` 从 Follow-up 证明包升级为多 Agent proof | `v0.4.0` |
| **v0.6.0** | engineering-hardening | 前端 / 后端 / 数据契约 / 性能 / 测试 / CI 工程硬化，达到产品与开源质量门槛 | `v0.5.0` |
| **v0.7.0** | bilingual-i18n | 支持中文和英文：Console 文案、枚举、日期数字格式、英文 Quickstart 与 sample 数据 | `v0.6.0` |
| **v0.8.0** | configurable-oss-core | 解耦、产品化、配置化，形成可开源的 AOL Core / Console alpha | `v0.7.0` |
| **v1.0.0** | console-mvp（产品轨） | 正式产品轨：试点 KPI 达标后（如 App 内处置率 ≥70%）；S1+S2 加厚 + SLO/Runbook | v0.3.5 + 试点 KPI |

---

## 治理与文档（非 SemVer 标签）

| 日期 | 主题 | 摘要 |
| --- | --- | --- |
| 2026-05-29 | 战略文档 | 01～04 vision / architecture / roadmap / domain-semantics |
| 2026-05-29 | 工程共识 | 06 LLM、07 dev E2E、xlink-data 口径 |
| 2026-05-29 | ADR-006/007 | 知识分层；Agent 展示轨与主轨并行 |
| 2026-06-09 | **PUB-16** | Operator Platform 架构演进纪律：L0/L1/L2 分层、WorkItem 读模型、每版 A1–A7 自检、v0.3～v1.0 渐进微调路线图 |
| 2026-06-10 | **PUB-17** | Console 三层信息架构 SSOT：Work / Agents / Systems、Action 生命周期（建议→待执行→闭环）、列表字段与 KPI 下钻纪律、模块路由映射 |
| 2026-06-10 | **PUB-18** | AOL 工业化打磨计划：数据状态四态、真实 Follow-up 执行链、Scenario Layer、Overview 驾驶舱、小闭环迭代 I0–I6 |
| 2026-06-10 | **PUB-19** | Console DataList 企业级列表 SSOT：Frame 内滚动、URL 命名空间、Turso 分页、列设置与 Runs/评估接入纪律 |

---

## 格式模板（新增一行时复制）

```markdown
| YYYY-MM-DD | **v0.x.y** 主题 | 一句话：用户/业务可见变化；技术关键词。 | `tag` 或 ⏳ |
```

## 参见

- [PUB-05-releases.md](./PUB-05-releases.md) · [PUB-16-architecture-evolution.md](./PUB-16-architecture-evolution.md) · [PUB-17-console-information-architecture.md](./PUB-17-console-information-architecture.md) · 私有文档 `docs/private/PRIV-08-follow-up-wedge-spec.md` · [docs/README.md](../README.md)

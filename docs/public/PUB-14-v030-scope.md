# 14 · v0.3 线范围说明（Agentic UI + scale pilot）

> **状态**：立项中 · **交付方式**：**3～5 次迭代**，每轮打 **`v0.3.N` tag**（N=1…5）  
> **依赖**：`v0.2.5` 已封版（v0.2.x 功能线收官）  
> **配套**：[PUB-05-releases.md](PUB-05-releases.md) § v0.3 · [PUB-15-agentic-ui-design.md](PUB-15-agentic-ui-design.md) · [PUB-16-architecture-evolution.md](PUB-16-architecture-evolution.md) · [PUB-changelog.md](PUB-changelog.md)  
> **最后修订**：2026-06-09（v0.3 迭代打 tag 纪律 + UX 设计稿对齐）

---

## 1. 一句话

**v0.3 线 = 在 v0.2.5 之后，用 3～5 次可发布小迭代**，把 Console 做成 **生产级 / 工业级 Agentic UI**，并完成第一次 **真发运营试点**——**不是再开一条新业务线**。

**收官 tag**：`v0.3.5`（UI 工业级 + 运营 KPI 达标）。中间每一关键迭代独立可验收、可回滚。

---

## 2. 与 v0.2.5 的关系

2026-05-31 共识曾写：**v0.3 功能边界冻结在 v0.2.4**。  
自 `v0.2.4` 至 `v0.2.5`，main 上合并的 **认知外显 / 时间再分析** 能力已单独打 tag **`v0.2.5`**（见 [PUB-05](PUB-05-releases.md) § v0.2.5）。它们**不改变楔子业务规则**（仍 206、14 天、四位管家、Action Spec v0.2）。

**修订结论**：

| 归类 | 说明 |
|------|------|
| **已收入 v0.2.5** | 双时间轴、收件箱归档、时间再分析、多轮 Agent UI 等（§4 清单） |
| **v0.3 不算新增业务能力** | 无新事件类型、无新 Agent、无 Action Spec 升级、无 SOP/RAG |
| **v0.3 主战场** | **Agentic UI 分迭代交付** + **运营真发 KPI**（收官在 `v0.3.5`） |

---

## 2.1 v0.3 迭代打 tag 纪律

与 v0.2.x「小步 tag」（`v0.2.1`…`v0.2.5`）一致：**每完成一节验收 → commit → annotated tag → changelog 一行**。

| 原则 | 说明 |
|------|------|
| **一迭代一 tag** | 不攒多周改动打一个糊 tag |
| **可独立演示** | 该 tag 下 Console 可给管家/PO 看明确增量 |
| **可回滚** | 试点出问题可 `git checkout v0.3.N` 对照 |
| **功能本质不变** | 每迭代只改呈现/动线/运营；楔子规则仍 §3 |
| **文档同步** | 打 tag 时更新 [PUB-changelog](PUB-changelog.md) + 勾选本节验收 |

### 迭代路线图（计划 5 次，可压缩为 3～4 次）

| Tag | 代号 | 主题 | 交付摘要 | 验收（打 tag 前） |
|-----|------|------|----------|-------------------|
| **`v0.3.1`** | `ui-shell` | Workbench 壳层 | [PUB-15](PUB-15-agentic-ui-design.md) 侧栏 240px + **浅色紫主题**；四卡指标；药丸筛选；列表行 Agent 徽章；默认滞留最久 | 首页 3 秒内回答「剩几单待处置」；侧栏导航可用；视觉与 design 稿一致 |
| **`v0.3.2`** | `ui-case` | Case Workspace | 案件 **双栏 + 右时间轴**；紫 Agent 摘要 + 绿 Next Action；sticky 处置条；`ToolStepCard` | 进案件无需 Tab 即见建议+查证；≤3 点击 disposition |
| **`v0.3.3`** | `ui-feed` | Activity & 移动 | 统一 Activity Feed；`/m` 与桌面 **同一紫/绿 token**；处置后 Tab 计数可感知 | 时间轴一跳 Run；移动深链视觉一致 |
| **`v0.3.4`** | `ui-industrial` | 工业级抛光 | 空态/错态/骨架；响应式断点；a11y 焦点；Turso 慢查询感知；关键路径 Lighthouse 可接受 | PO 认为「可给外部演示」；无阻断性 UI bug |
| **`v0.3.5`** | `pilot-cap` | 运营收官 | `run_summary` + runbook；真发 + **7 天 cron**；全量 sync；处置率 ≥50%；周报 + 访谈 | §7 运营 + KPI 全勾；**v0.3 线正式封版** |

> **压缩选项**：若工期紧，可将 `v0.3.4` 抛光并入 `v0.3.3`，最少 **3 tag**：`v0.3.1` shell → `v0.3.2` case → `v0.3.3` feed+抛光+`v0.3.5` 运营（跳号保留 `v0.3.4` 或直接用 `v0.3.4` 收官）。

```text
v0.2.5 ──► v0.3.1 shell ──► v0.3.2 case ──► v0.3.3 feed ──► v0.3.4 industrial ──► v0.3.5 pilot-cap
              │                │               │                  │                      │
              └ 每步可 tag、可演示、可回滚 ─────────────────────────────────────────────┘
```

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

### 5.2 Agentic UI 改造（v0.3 主交付 · Console）

> **定位**：不是做一个通用聊天框，而是把现有 **异步 Follow-up Agent** 产物，呈现成业界主流的 **「工单工作台 + Agent Run + 人在回路」** 体验（对齐 Cursor / Devin / Copilot Workspace 的**信息架构**，而非复制对话形态）。  
> **视觉与框架 SSOT**：[PUB-15-agentic-ui-design.md](PUB-15-agentic-ui-design.md)（浅色卡片 + **紫色 Agent 品牌** + 左侧导航；见 `docs/assets/agentic-ui-panorama.png`）。

#### 设计原则

| 原则 | 说明 |
|------|------|
| **Case-first，非 Chat-first** | 以工单为案件单元；Agent 输出是「Run 结果」，不是消息流 |
| **Run 可感知** | 每一轮分析 = 一次 Agent Run（状态、触发原因、耗时、工具步骤） |
| **人在回路前置** | 处置条常驻可见；建议 = Agent 提案，管家 = 审批者 |
| **证据可点击** | 查证步骤、业务时间轴、建议字段同一语义链 |
| **不加业务本质** | 仍用 Turso 存量 trace/timeline/outcome；**不**在 v0.3 做 UI 内触发新推理 |

#### 信息架构（目标态）

```text
┌─ S1 Agent Workbench（/）────────────────────────────────────┐
│ 今日待办 · Agent 活动摘要 · 队列（按滞留/优先级）              │
│ 行内：工单事实 | Agent 状态徽章 | 建议摘要 | 处置 CTA        │
└────────────────────────────────────────────────────────────┘
          ↓ 进入案件
┌─ Case Workspace（/suggestions/[key]）──────────────────────┐
│ [sticky] 人在回路：同意 / 已跟进 / 修改 / 拒绝 + 阻塞采集    │
├──────────────────┬─────────────────────────────────────────┤
│ 左：业务上下文    │ 右：Agent Run 面板                       │
│ · 工单头          │ · Run 选择器（轮次 = Run #N）            │
│ · 迷你时间轴      │ · 建议卡（Agent 提案样式）               │
│ · 滞留/触发标签   │ · Tool steps（enrich/LLM，可展开 I/O）   │
│                  │ · 轮次 diff / 推送外显                    │
└──────────────────┴─────────────────────────────────────────┘
          或全宽 Activity Feed 视图（业务 + Agent 事件合并，可筛 lane）
```

#### 分期交付 ↔ 版本 tag

| 波次 | Tag | 交付物 | 主要改动文件（参考） |
|------|-----|--------|----------------------|
| **UI-1** | **`v0.3.1`** | **PUB-15** 侧栏 240px + 浅色紫主题；四卡指标 + 药丸筛选；列表 Agent 徽章；默认滞留最久 | `globals.css`, `layout.tsx`, `app/page.tsx`, `components/workbench/` |
| **UI-2** | **`v0.3.2`** | 紫 Agent 摘要 + 绿 Next Action；双栏 + 右栏时间轴；`ToolStepCard`；sticky 处置条 | `app/suggestions/[key]/page.tsx`, `agent-analysis-panel.tsx`, `trace-view.tsx` |
| **UI-3** | **`v0.3.3`** | Activity Feed；移动 `/m` 同一 token；乐观处置 + Tab 计数 | `plan-timeline-section.tsx`, `app/m/*` |
| **UI-4** | **`v0.3.4`** | 空态/错态/骨架/a11y/性能；工业级可演示 | 横切各 route + `loading.tsx` / `error.tsx` |
| **Ops** | **`v0.3.5`** | run_summary、runbook、真发 7 天、KPI 包 | 引擎 + GHA + `docs/runbooks/` |

#### Agentic UI 验收（打 tag 前）

- [ ] 管家 **3 秒内**在首页回答：「今天 Agent 帮我处理了多少、我还剩几单」
- [ ] 进入案件后 **无需切 Tab** 即可同时看到：工单事实、最新 Agent 建议、查证步骤
- [ ] 多轮 Run：轮次选择器 + diff + 触发原因 **一屏可读**
- [ ] 时间轴/Feed 中 Agent 节点可 **一跳** 到对应 Run
- [ ] 移动深链路径视觉与桌面 **同一 Agent 语言**（非两套产品）
- [ ] **≤3 次点击** 完成 disposition 或阻塞采集（抽测 ≥3/4 管家）

#### 明确不做（v0.3 UI 护栏）

- UI 内 **对话输入框** / 自由 prompt Agent（v0.4+ 再评估）
- **SSE 实时流式**推理（引擎仍为 cron 批处理；v0.3 用 Run 卡片 + 骨架屏模拟节奏感）
- 新 trace schema / 新工具类型 / 第二个 Agent
- 完整 S5 Studio、S4 ROI 看板

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

## 7. 验收清单（打勾 → tag `v0.3.5` · v0.3 线收官）

### 工程与运营

- [ ] 生产真发：`DRY_RUN=false`，试点群纪律执行
- [ ] 连续 **7 天** cron 无人工救场
- [ ] `run_summary` 每轮可查
- [ ] Runbook 演练通过（停 cron、查失败、全量 inbox/timeline sync）
- [ ] 真发 **0 重复推送**；≥10 条样本可读

### Agentic UI（Console）

- [ ] §5.2 **UI-1～UI-3** 交付完成（Workbench + Case Workspace + Activity Feed）
- [ ] §5.2 Agentic UI 验收清单 **6 项**打勾
- [ ] 全量 sync 后：归档/待处置与 Mongo 一致

### 数据与 Console（数据一致性）

- [ ] 时间轴含 Agent 节点；Feed 可跳转 Run 轮次
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
| **中间 tag** | `v0.3.1` … `v0.3.4` — 每迭代验收后立即打（见 §2.1） |
| **收官 tag** | **`v0.3.5`** — UI 工业级 + 运营 KPI 全勾 |
| **周期** | UI 迭代建议各 **3–7 天**；真发试点 **2–4 周**（可与 `v0.3.3` 后期并行） |
| **下一版** | `v0.4.0` context-sop（依赖 v0.3.5 使用反馈） |
| **与 v1.0 关系** | v0.3.5 证明「能运营 + 像主流 Agent 产品」；v1.0 仍要求处置率 **≥70%** 等 [PUB-05](PUB-05-releases.md) OKR |

---

## 9. 建议执行顺序（PO / 工程）

```text
1. tag v0.3.1 — UI-1 Workbench 壳层 + 浅色紫主题
2. tag v0.3.2 — UI-2 Case Workspace + Tool Step
3. tag v0.3.3 — UI-3 Activity Feed + 移动对齐
4. tag v0.3.4 — 工业级抛光（可与 3 合并）
5. 生产全量 sync + 切真发 + run_summary + runbook（可与 3/4 并行）
6. 跑满 7 天 cron + advancement_rate + 周报 + 访谈
7. tag v0.3.5 — 勾选 §7 → 更新 changelog → v0.3 线封版
```

---

## 10. 参见

- [PUB-05-releases.md](PUB-05-releases.md) — 全版本表与产品轨 OKR  
- [PUB-07-product-surface.md](PUB-07-product-surface.md) — S1–S6 产品脊柱  
- [PUB-15-agentic-ui-design.md](PUB-15-agentic-ui-design.md) — **UX 设计稿**色彩/框架/组件映射  
- [README.md](../README.md) — 部署与 workflow 入口  
- 私有：`docs/private/PRIV-08-follow-up-wedge-spec.md`、`PRIV-09-business-decisions.md`

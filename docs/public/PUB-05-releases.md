# 05 · 版本规划（产品化迭代 → Live）

> **Scope 起点**：Follow-up（工单 → 认知/建议 → 人工采纳 → 执行），并沿 **FS-COS** 愿景扩展（见 [PUB-01-vision.md](PUB-01-vision.md)）。
> **交付纪律**：每个正式版本必须 **完整闭环、可独立验证、可发布、且产品化**
> （有 tag、有验收清单、有回滚方式、**有 UI/UE/UX**），禁止「半个功能」或「脚本即版本」。
>
> 与 [PUB-03-roadmap.md](PUB-03-roadmap.md) 的关系：03 是平台演进 **Phase 1→5**（文中保留 Stage 0→3 对照）；本文是 **工程可执行版本切分**。  
> 产品化纪律与产品脊柱（S1–S6）见 [PUB-07-product-surface.md](PUB-07-product-surface.md)。  
> **版本摘要时间线**：[PUB-changelog.md](PUB-changelog.md)（对齐 business_3.0 的 `docs/changelog.md`）。

## 两轨纪律（POC 轨 vs 产品轨）

> 我们要的是**通用 / 可开源 / 可云服务**的产品，「项目/脚本」不可作为正式交付。

- **POC 轨**：`poc-xxx`，headless 可，验技术与效果，**不进 SemVer 版本表**。
- **产品轨**：`vX.Y`，必须产品化（UI 表面 + UX 流程 + 可感知 KPI），方可打 tag。
- **当前定位**：`cron + 企微卡片 + DRY_RUN` = **`poc-followup` 引擎**；**`v0.2.x`** = Stage 0 **最小闭环产品**（引擎 + Console：S1+S2+轻量指标）；**`v1.0` tag** = v0.2.x 闭环与试点 KPI 证明后的**产品轨正式版**（见 [PUB-07](PUB-07-product-surface.md) §1）。
- 企微/短信降级为**通知渠道**（把人拉回 Console 处置），不再是产品本体。

> 详见 [PUB-07-product-surface.md](PUB-07-product-surface.md) §1 两轨、§3 产品化 Definition of Done。

## 版本总览（两轨）

> 阶段对应见 [PUB-03-roadmap.md](PUB-03-roadmap.md)：
> **Phase 1** Follow-up 楔子 · **Phase 2** Cognitive Layer · **Phase 3** Decision Engine · **Phase 4** Agent 执行 · **Phase 5** Connector/SDK 开源（旧 Stage 0→3 见 PUB-03 对照表）。

### A. POC / 引擎轨（headless，喂给产品轨，不单独对外发布）

| 标记 | 代号 | 内容 | 状态 | 喂给 |
|------|------|------|------|------|
| `poc-followup` | scaffold + wedge | 防腐层 + trace + 混元/启发式 + steps enrich + 企微预览（原 v0.1/v0.2） | **`v0.1.0` + `v0.2.0` 已 tag** | v1.0 |
| `poc-cron` | pilot-cron | GHA 定时 + Turso 追踪 + 批量稳定性（原 v0.3） | 规划 | v1.0 / v1.2 |
| `poc-context` | context-sop | 上下文补全 + SOP v1（原 v0.4） | 规划 | v1.3+ |

> 引擎能力仍然重要，但它们是**产品的后端**，不再作为「面向用户的版本」。

### B. 产品轨（每个都产品化：UI + UX + 可感知 KPI）

| 版本 | 代号 | 产品一句话 | 新增产品脊柱 | 对应 Stage |
|------|------|------------|--------------|------------|
| **v1.0** | console-mvp | 在产品内**看见并处置** Follow-up 建议 | S1 + S2 | Stage 0→1 |
| **v1.1** | trust | 让用户**信任**：查证/推理轨可见 | S3 | Stage 1 |
| **v1.2** | proof | 让管理层**看见 ROI**：产品内看板/周报 | S4 | Stage 1 |
| **v1.3** | qualification | 复用外壳上线**第二个 Agent** | S1/S2 多 Agent 化 | Stage 1 |
| **v1.4** | estimate | 报价类 Agent 产品化 | 报价审批卡片 | Stage 1 |
| **v1.5** | flow | Agent 间编排**可见可干预** | S5 雏形 | Stage 1→2 |
| **v2.0** | studio | 用户在 UI 内**配置** Agent/规则/SOP | S5 完整 | Stage 2 |
| **v2.1** | self-host | 可独立部署的**产品**（非脚本） | onboarding UX | Stage 2 |
| **v2.2** | oss-core | 开源「**带 Console 的可运行产品**」 | 开源版 Console | Stage 3 |
| **v3.0** | cloud-saas | 托管**多租户**产品 | S6 | Stage 3 |
| **v3.1** | marketplace | 第三方 Agent **可上架** | 市场页 + 安装流 | Stage 3 |

```mermaid
flowchart LR
    p["poc-followup<br/>(引擎)"] --> v10["v1.0<br/>Console MVP"]
    v10 --> v12["v1.2<br/>ROI 看板"]
    v12 --> v15["v1.5<br/>多 Agent + Flow"]
    v15 --> v20["v2.0<br/>Studio"]
    v20 --> v22["v2.2<br/>OSS 产品"]
    v22 --> v30["v3.0<br/>Cloud SaaS"]
```

---

## 横切策略（全版本有效）

### 数据：真实优先，mock 降级

| 环境 | `FSM_SOURCE` | 库 |
|------|--------------|-----|
| **v0.2 起默认** | `mongo` | dev `xlinkdemo`（只读） |
| 试点 / Live | `mongo` | dev → prod `xlink` 分阶段切换 |
| 仅 CI 离线 | `mock` | 无网跑结构测试，**不作为封版路径** |

### LLM：免费为主，付费验证（见 [06-llm-providers.md](PUB-06-llm-providers.md)）

| `LLM_PROVIDER` | 用途 |
|----------------|------|
| **heuristic** | 走通非 LLM 链路（捞取、trace、企微预览），零 API 成本 |
| **hunyuan**（默认） | 腾讯混元 Lite，对齐 stockwise 免费档 |
| **deepseek** | 抽样对比质量；业务演示时再开 |

**纪律**：日常开发与 cron 用混元；DeepSeek 只用于「每周 N 单对照样本」，不作为默认成本模型。

---

## 产品轨 OKR/KPI 总表

> 每个产品版本 = 一个可证伪的 KPI + 一块新增 UI + 明确 Scope 护栏。
> KPI 阈值（X/N/%）待各版立项时拍定，先固定**指标口径**。

| 版本 | O（目标） | KR / KPI（可感知 / 被使用 / ROI） | 新增 UI | Scope 护栏（明确不做） | 闭环定义 |
|------|----------|-----------------------------------|---------|------------------------|----------|
| **v1.0** console-mvp | 让人在产品内看见并处置 Follow-up 建议 | App 内处置率 ≥70%（非靠翻群）；审批时延中位数 < N 分 | S1 总览 + S2 收件箱/审批 | 不做多 Agent、不做配置 UI | 管家在 Web 内完成「看→处置」 |
| **v1.1** trust | 让用户信任建议 | 查证可见率 100%；「看得懂为什么」满意度达标 | S3 推理/查证轨 | 不改推理算法本身 | 每条建议可溯源到证据 |
| **v1.2** proof | 让管理层看见 ROI | 1 个核心指标可视化；周报产品内生成且被引用 | S4 ROI 看板 | 不做精确归因 | 1 份管理层认可的看板/周报 |
| **v1.3** qualification | 第二个 Agent 复用外壳 | UI 组件复用率 ≥80%；线索分级准确率达标 | S1/S2 多 Agent 视图 | 不做跨 Agent 编排 | 第二个 Agent 在同 Console 可用 |
| **v1.4** estimate | 报价类 Agent 产品化 | 报价时间 −X%；草稿采纳率达标 | 报价审批专用卡片 | 不自动发客户 | 报价草稿在产品内生成+审批 |
| **v1.5** flow | Agent 间编排可见 | 1 条端到端链路 UI 可视化 + 可干预 | S5 流程视图雏形 | 仅顺序流，不做并行/回滚 | 链路在产品内可看可停 |
| **v2.0** studio | 用户可自配置 | 非工程人员能在 UI 改一条规则/话术并生效 | S5 完整 Studio | 不开放任意代码执行 | 配置项产品内自助生效 |
| **v2.1** self-host | 输出可部署产品 | 外部用 mock 数据 1 天内装好并见 Console | 安装/onboarding UX | 不含云计费 | 自托管实例可运行 |
| **v2.2** oss-core | 开源带 Console 的产品 | 外部可运行实例数；stars/贡献者达阈值 | 开源版 Console | Industry Pack 不开源 | 第三方 48h 跑通同链路 |
| **v3.0** cloud-saas | 托管多租户产品 | 首批 N 租户；onboarding 转化；隔离+计费跑通 | S6 Tenant Admin | 不做无限定制 | 租户自助开通并使用 |
| **v3.1** marketplace | 生态扩张 | 上架 Agent 数；调用量 / GMV | 市场页 + 安装流 | 不自营所有 Agent | 第三方 Agent 可上架运行 |

> **双轴自检**（每版立项前）：能力轴推进了哪一格（被动→主动 / 单点→多点 / 内聚→可复用）？
> 商业轴 KPI 是内部 ROI、外部采用、还是收入？**三者不在同一版本混用。**

---

> **以下为引擎/能力明细（多属 POC/引擎轨）**：描述后端能力、验收与运维硬化。
> 产品轨的 UI/UX 验收以上文「产品轨 OKR/KPI 总表」与 [PUB-07-product-surface.md](PUB-07-product-surface.md) 为准；
> 这些引擎能力作为对应产品版本的后端被消费。

---

## v0.1 · scaffold（已发布 `v0.1.0`） — POC/引擎轨

**目标**：证明 **Event → Reasoning → Trace → Outbound → 幂等** 技术路径可跑通，零侵入 XLink。

### 已交付

| 能力 | 说明 |
|------|------|
| 领域防腐层 | `domain.py`：`serviceAppointment` → `WorkOrder` |
| 摄取 | `FSM_SOURCE=mongo`（dev）/ `mock`（CI） |
| 推理 | `heuristic` / `hunyuan` / `deepseek`；trace 全量落库 |
| 执行 | 企微 Markdown；**默认 `DRY_RUN=true` 预览** |
| E2E | `--reset-tracking` 清表（保留 db 文件，GUI 可刷新） |
| 文档 | `05`–`07`、`xlink-data` |

### 已知边界（v0.2 要解决）

- 事件源仅 `status=403` 已完工，与业务主战场 **206 待签约** 不匹配。
- 无管家维度路由（`exts.supervisorId`）。
- 输出为扁平建议，尚无 **Action Spec + Approval** 契约。

---

## v0.2.x · 最小闭环产品（Stage 0 原型）

**阶段目标（v0.2.1 → v0.2.5）**：**产品结构补齐 + 认知外显**，再进入 **`v0.3` 线**（Agentic UI + 运营试点）。
`v0.2.x` = 引擎楔子（`v0.2.0`）+ Console 最小表面（S1 总览 + S2 收件箱/处置 + 轻量闭环指标），仍是 Stage 0，不是产品轨 `v1.0`。

| 小版本 | 主题 | 状态 |
|--------|------|------|
| **v0.2.0** | engine wedge（206 + steps + 生产只读 DRY_RUN） | ✅ `v0.2.0` |
| **v0.2.1** | 产品结构缺口（卡片 → Console、阻塞回填） | ✅ `v0.2.1` |
| **v0.2.2** | 业务语义（管家收件箱、已跟进、outcomes 可读） | ✅ `v0.2.2` |
| **v0.2.3** | 闭环指标（Console 轻量 KPI + 7 日离 206 率脚本） | ✅ `v0.2.3` |
| **v0.2.4** | Console 收口（生产 E2E + 收件箱 UX + state_at + 排序） | ✅ `v0.2.4` |
| **v0.2.5** | 认知外显 + 时间再分析闭环（双时间轴、收件箱归档、多轮 Agent UI） | ✅ `v0.2.5` |

### v0.3 线 · Agentic UI + pilot（迭代打 tag）

| 小版本 | 主题 | 状态 |
|--------|------|------|
| **v0.3.1** | `ui-shell` — Workbench 壳层 + 浅色紫主题 | ⏳ |
| **v0.3.2** | `ui-case` — Case Workspace + Tool Step | ⏳ |
| **v0.3.3** | `ui-feed` — Activity Feed + 移动对齐 | ⏳ |
| **v0.3.4** | `ui-industrial` — 工业级抛光 | ⏳ |
| **v0.3.5** | `pilot-cap` — 真发运营 + KPI 收官 | ⏳ |

> **产品轨 `v1.0` tag 纪律**：在 v0.2.x 闭环被证明且试点 KPI 达标（如 App 内处置率 ≥70%）后再打；见 [PUB-07-product-surface.md](PUB-07-product-surface.md) §1。

---

## v0.2.0 · follow-up-wedge（已发布 `v0.2.0`，2026-05-31）

**目标**：对齐研讨 **Follow-up Skill** 切口（Trusted Execution + Harness）——在 **wait → follow-up** 主战场产生可审批建议，
用四位管家（刘沐泽、李小军、刘清瑞、李俊达）**生产只读**数据验证 ROI。

> **封版说明**：`v0.2.0` 锚定楔子里程碑（206 + steps + Action Spec v0.2 + 试点管家 + 生产只读 DRY_RUN）。
> 同期 main 上已落地 **Turso 追踪 + GHA cron**（原 `poc-cron` / 旧 v0.3 工程项），**不并入 `v0.2.0` tag 语义**；`v0.3.0` 另打 tag，聚焦**闭环成立后的规模化试点**（真发企微、cron 硬化、run_summary、runbook），而非「第一个 Console」。

**规格 SSOT**：私有文档 `docs/private/PRIV-08-follow-up-wedge-spec.md`（含 **§6 v0.2.0 封版共识**）

### v0.2.0 封版共识（已定）

| # | 项 | 决定 |
|---|-----|------|
| 1 | 数据 | **生产 `xlink` 只读**；dev 仅开发调试 |
| 2 | 企微 | **不发群**；`DRY_RUN=true` 审阅卡片/日志 |
| 3 | Agent | **`AGENT_MODE=steps` 必做**；enrich 产出 **业务查证**（仅报价 B + 签约）并展示在卡片与 trace |

### 交付范围

| 原语 | 本版 |
|------|------|
| Event Ingestion | P0：**仅 `206` 待签约** 停滞 SLA；204 不纳入；归属 `exts.supervisorId` |
| Reasoning | 混元默认；prompt 含 **状态 + 停留天数**；仍只读 Mongo |
| Action Spec | 扩展 `FollowUpSuggestion` → 含 `event_type`、`stale_days`、`housekeeper_id` |
| Execution | 企微卡片按管家分送（试点）；仍为 **approval 前 suggestion** |
| 可观测 | trace 增加 `event_type`；水位线按 `(event_type, work_order_id)` |

### v0.2 验收清单（打勾即 tag `v0.2.0`）

**工程（dev 可先验）**

- [x] dev 只读：能捞到 **206** 工单（204 已排除；14 天窗）
- [x] 管家路由：卡片带归属管家 / 状态 / 停留天数 / 事件类型
- [x] `dedupe_key` 幂等；`reasoning_traces.event_type` + `steps_json`
- [x] `LLM_PROVIDER=hunyuan` + `DRY_RUN` 预览；`--reset-tracking`
- [x] 文档：08 / 09 / sops 大纲
- [x] `AGENT_MODE=steps` + enrich（仅报价 B、签约、`business_verdict`）
- [x] 卡片含 **系统查证** 行（steps 模式）

**封版（必须生产只读）** — `v0.2.0` 已验收（2026-05-31）

- [x] **生产 `xlink`**：`FSM_EVENT_STATUSES=206` + `FSM_MAX_AGE_DAYS=14` + 四位管家，能捞取并推理
- [x] **`AGENT_MODE=steps`**：日志/卡片中 **查证结论** 与建议一致（已签约不单催签等）
- [x] **不发群**：仅 `DRY_RUN=true` 审阅卡片/日志（封版按共识接受，非正式 ≥10 卡盲评）
- [x] ADR-008 与本节共识已写入 changelog（见 [PUB-changelog.md](PUB-changelog.md) `v0.2.0`）

### v0.2.1 · 产品结构缺口（已发布 `v0.2.1`，2026-05-31）

**目标**：补齐「从通知回到 Console 处置」与阻塞上下文采集的**最小产品结构**；不扩业务语义。

**交付范围**：

| 项 | 说明 |
|----|------|
| 卡片深链 | 企微/预览卡片可 **deep link 进 Console** 对应工单/建议 |
| 阻塞展示 | 卡片默认 **`阻塞信息：待采集`**（未知不伪造） |
| 阻塞回填 UI | 最小回填：`A价格/B时机/C方案/D无响应 + 一句话`；先落 `reasoning_traces`（或等价轻量表），**不改 XLink 主库** |

**验收清单（打勾即 tag `v0.2.1`）**：

- [x] 卡片 → Console 深链：试点管家能从卡片一键打开对应处置页
- [x] 卡片含 **`阻塞信息：待采集`**；无回填时为 `UNKNOWN`
- [x] 5 条样本：管家 **≤10 秒** 完成回填；字段写入 trace 且下一轮推理可读
- [x] 无回填时不伪造阻塞结论

---

### v0.2.2 · 业务语义（已发布 `v0.2.2`，2026-05-31）

**目标**：让管家在 Console 内完成 **筛选 → 处置 → 采纳信号**，且 outcomes 可供下一轮推理消费。

**交付范围**：

| 项 | 说明 |
|----|------|
| 管家收件箱 | Console **按管家过滤**（试点四位 + 待处置状态） |
| 已跟进语义 | **`已跟进`** 采纳/处置状态入库（轻量 outcomes），对齐 ADR-011 采集纪律 |
| 推理可读 | outcomes / 阻塞回填可被 **下一轮 cron/推理** 读取并体现在建议中 |

**验收清单（打勾即 tag `v0.2.2`）**：

- [x] 管家登录/选择后，收件箱仅见本人（或试点池）相关建议
- [x] 「已跟进」可在产品内标记且持久化；trace/outcomes 可查询
- [x] 至少 3 条样本：标记已跟进后，下一轮建议体现 prior outcome（非重复空催）

---

### v0.2.3 · 闭环指标（已发布 `v0.2.3`，2026-05-31）

**目标**：在 Console 内**可感知**闭环是否成立；运维侧只读脚本支撑 7 日业务对照。

**交付范围**：

| 项 | 说明 |
|----|------|
| Console 轻量 KPI | 如：待处置数、已跟进占比、阻塞采集率（`UNKNOWN` 占比） |
| 7 日离 206 率 | **只读 Mongo** 脚本 `scripts/advancement_rate.py`（dev/prod 分环境），输出 7 天内离开 206 的粗率，供试点评审 |
| 文档 | 指标口径写入 05/07；脚本用法见下 |

**脚本用法**（仓库根目录，与 `run_cron` 相同 env）：

```bash
python scripts/advancement_rate.py
python scripts/advancement_rate.py --limit 50 --window-days 7
```

**验收清单（打勾即 tag `v0.2.3`）**：

- [x] Console 一屏可见 ≥2 个闭环相关指标（有埋点/可查）
- [x] 只读脚本在 dev 或生产只读账号下可跑通并产出可复现数字
- [x] v0.2.x 阶段门：业务方认可「可在 Console 完成看→处置→记 outcome」闭环演示

---

### v0.2.4 · Console 收口（已发布 `v0.2.4`，2026-05-31）

**目标**：在 v0.2.3 阶段门基础上，完成 **生产 E2E** 与 **Console 收件箱可用性** 收口。

**交付范围**：

| 项 | 说明 |
|----|------|
| 生产 E2E | GHA cron（北京 08:00–22:00  hourly）+ Turso 追踪 + 企微紧凑卡 + Console 深链（`CONSOLE_BASE_URL`） |
| Console 认证 | 详情/阻塞 API 公开；列表需登录；试点管家 URL/cookie 筛选 |
| 收件箱 UX | 四层信息（工单 / 情况 / 动作 / 处置）；紧凑行布局；平铺排序（最新 / 管家 / 滞留 / 优先级 / 处置） |
| 滞留口径 | `follow_up_logs.state_at` 入库工单 `updateTime`；Console **展示时现算**滞留天数 |
| Trace | 查证结论 + 竖向时间线 + 折叠调试信息 |
| 本地闭环 | `make seed-local` + webpack dev + 共用 `data/agent_loop_tracking.db` |
| 预备 | 企微应用消息模块（`wecom_app.py`，v0.3 部署路径） |

**验收清单（打勾即 tag `v0.2.4`）**：

- [x] GHA cron 手动/定时跑通：引擎写 Turso、企微 webhook 可达、Console 深链可开
- [x] 收件箱可扫读：无横向滚动；工单事实与建议时间分离；滞留随日历递增
- [x] 排序与管家筛选可组合（URL 持久化）
- [x] v0.2.4 收口共识：产品方认可 Console + 通知链路可日常预览

---

### v0.2.5 · 认知外显 + 再分析闭环（已发布 `v0.2.5`，2026-06-09）

**目标**：在 v0.2.4 运营链路之上，让管家与 PO **看见 Agent 多次工作**与业务进展，并完成 **时间触发再分析**端到端闭环。**v0.2.x 功能线收官**；后续增量转入 v0.3 运营试点（不加楔子业务本质）。

**交付范围**：

| 项 | 说明 |
|----|------|
| 业务时间轴 | Mongo 里程碑（建单/预约/勘察/报价/签约等）→ Turso `timeline_events` → Console「业务时间轴」Tab |
| Agent 时间轴 | inbox / stale_snapshot / reanalyze_pending / reanalysis 等节点；每轮 cron + sync 持续刷新 |
| 收件箱三桶 | `inbox_bucket`：待处置 / 已处置 / 归档；**已签约、离 wedge → 归档**（待处置 = 仍在 206 楔子且需跟进） |
| 时间触发再分析 | `REANALYZE_*`：间隔 ≥3 天或滞留台阶 +7 天；优先级升高再推企微 |
| 再分析补捞 | 对入池 `dedupe_key` 按 `work_order_id` **定向 Mongo 补捞**，不受 `FSM_BATCH_LIMIT` 漏捞 |
| Console Agent 分析 | 多轮 trace 选择器（`?tab=agent&round=N`）；轮次 diff、触发标签、推送外显、分析时效卡片 |
| 运维 | Cloudflare Worker → GHA `agent_cron`；`sync_inbox` / `backfill_timeline` workflows |
| 移动端 | 管家处置白底移动页、Turso 读路径优化 |

**验收清单（打勾即 tag `v0.2.5`）**：

- [x] 时间触发再分析：Turso 判定入池 + Mongo 补捞 + 写入第二轮 trace（含 `reanalyzed_no_push`）
- [x] Console 可选多轮 Agent 分析，业务时间轴可跳转对应轮次
- [x] 收件箱归档规则与 Mongo wedge 一致（signed / left_wedge / agent_no_follow）
- [x] PO 确认：v0.2 楔子功能无继续发散项，可冻结功能面进入 v0.3 运营证明

---

### agent-steps（v0.2.0 主验收轨）

见私有文档 `docs/private/PRIV-10-agent-steps-demo.md`。**封版必须用 `steps`**；`oneshot` 保留作对照/降级。

### 本地运行参考

```bash
cp .env.example .env
pip install -r requirements.txt
python run_cron.py --reset-tracking
```

---

## v0.3 线 · Agentic UI + scale pilot（`v0.3.1` … `v0.3.5`）

> **范围 SSOT**：[PUB-14-v030-scope.md](PUB-14-v030-scope.md) · **视觉 SSOT**：[PUB-15-agentic-ui-design.md](PUB-15-agentic-ui-design.md)  
> **交付纪律**：**3～5 次迭代**，每完成关键一步打 **`v0.3.N` tag**；收官 **`v0.3.5`**。

**目标**：在 **`v0.2.5` 封版** 之后，用可回滚的小版本把 Console 做成 **工业级 Agentic UI**，并完成第一次 **真发运营试点**。

> **纪律（PO 共识 2026-05-31，2026-06-09 修订 UI 轴）**  
> - **功能本质不增加**：仍为 206 + 四位管家 + Action Spec v0.2 + 四种阻塞 + 四种 disposition。  
> - **增量在三轴**：① **Agentic UI**（工单工作台 + Agent Run 视图 + Activity Feed）；② 运营可观测 + 真发纪律；③ 处置动线与视觉统一（非新表/新推理 API）。  
> - **先行工程已在 `v0.2.5`**：双时间轴、多轮分析、再分析闭环；v0.3 **不重做引擎**，只升级 Console 呈现与动线。  
> - **Agentic UI SSOT**：[PUB-14-v030-scope.md](PUB-14-v030-scope.md) §5.2。

### 有价值的目标（v0.3 要证明什么）

| 维度 | 目标 |
|------|------|
| **可运营** | 连续 **7 天** cron 无需盯笔记本；任意一天可回答「昨晚处理了多少、失败原因」 |
| **可信任** | 真发 **0 重复推送**、0 错管家；≥10 条样本业务盲评「建议可读、查证一致」 |
| **被使用** | 曝光建议的 **App 内处置率 ≥50%**（v1.0 目标 70% 留后）；≥3/4 试点管家表示「会主动打开 Console」 |
| **有信号** | `scripts/advancement_rate.py` 产出 **7 日离 206 粗率** 作对照（不做因果归因） |

---

### A. 运营与真发（引擎 + GHA）

| 项 | 说明 |
|----|------|
| **`run_summary`** | 每轮 cron 结束：处理数 / 成功 / 失败 / 跳过 / token；Turso 或 GHA artifact 可查 |
| **Runbook** | `docs/runbooks/pilot-cron.md`：手动触发、停 cron、查 Turso/trace、回滚 tag、切换 prod 只读账号 |
| **Cron 硬化** | Secrets/Vars 文档化；`FSM_BATCH_LIMIT` / 时段 / 失败告警；连续 7 天无人值守 |
| **真发纪律** | 试点群 webhook；**每日/每轮推送上限**；`dedupe_key` + `followed_up` 再入池在试点规模复验 |
| **对照脚本** | 试点期跑 `advancement_rate.py`，与 Console 处置率并列评审 |

### B. Agentic UI（按 tag 交付）

| Tag | 说明 |
|-----|------|
| **`v0.3.1`** | Workbench 壳层：侧栏、浅色紫主题、四卡指标、列表徽章 |
| **`v0.3.2`** | Case Workspace：双栏、Agent 摘要/Next Action、Tool Step、sticky 处置 |
| **`v0.3.3`** | Activity Feed + 移动视觉统一 |
| **`v0.3.4`** | 工业级抛光：空态/错态/a11y/性能 |
| **`v0.3.5`** | 含 §A 运营收官 + §7 KPI（v0.3 线封版） |

### C. 明确不做（scope 护栏）

- 新事件类型（204 等）、新 Agent、Action Spec 升级
- SOP 文件加载 / RAG（**v0.4**）
- 企微**应用消息**切主路径（webhook + 深链已够用；`wecom_app.py` 仅预备）
- LangGraph / 复杂编排（ADR-012）
- 产品轨 `v1.0` tag、完整 ROI 看板（**v0.5 / v1.2**）
- 改 XLink 业务主库

---

### 验收清单（打勾即 tag `v0.3.0`）

**运营**

- [ ] 连续 **7 天** cron 无人工干预；`run_summary` 可查
- [ ] Runbook 可用：5 分钟内可停 cron、查上一轮失败原因
- [ ] 真发试点：**0 重复推送**；≥10 条样本「可读、查证一致」

**使用与指标**

- [ ] 曝光建议 **App 内处置率 ≥50%**（Turso outcomes 可算）
- [ ] `advancement_rate.py` 产出可复现的 7 日离 206 粗率（dev 或 prod 只读）
- [ ] 试点周报（可 Markdown）：推送数、处置率、阻塞采集率、`UNKNOWN` 占比

**UX（体验门禁，不加功能）**

- [ ] 深链 → 完成一次 disposition 或阻塞回填：**≤3 次点击**
- [ ] ≥**3/4** 试点管家访谈：「会主动打开 Console 处理待办」
- [ ] 盲问「这单为什么要跟、该做什么」——能指到 **动作** 行，无需读全文

---

### 发布

- **Tag**：`v0.3.0`
- **周期**：建议 2–4 周真发试点后再打 tag（非「代码合并即 tag」）
- **下一版**：`v0.4.0` followup-real-loop（打穿真实 Follow-up 楔子）

---

## v0.4 · followup-real-loop（建议 2–3 周）

**目标**：把 Follow-up 这个真实楔子打穿。
v0.4 不是继续铺页面，而是证明一个真实 Agent 能在企业业务流里稳定完成：

```text
业务对象 -> Agent 判断 -> 人审 -> Action 生成 -> 执行分发 -> 状态回流 -> Run 追踪 -> Evaluation 复盘 -> Governance 约束
```

**产品判断**：若 Follow-up 不能闭环，其他 Agent 都只是样例；若 Follow-up 闭环成立，AOL 才有可复制的产品内核。

### 交付范围

| 链路 | 本版必须打穿 |
|------|----------------|
| Business Object | Follow-up 绑定真实工单 / 商机 / 报价 / 合同上下文，关键字段可追溯 |
| Decision | Agent 判断有版本、上下文快照、规则 / 模型依据，能回看为什么触发 |
| Human Review | 人审支持批准、修改、拒绝、阻塞原因；审批记录进入 audit |
| Action | 审核后生成正式 Action，进入待执行 / 已执行 / 异常 / 闭环生命周期 |
| Execution | 至少打通一个真实或半自动执行分发通道；未接入写回必须明确标注 |
| Feedback | 执行状态、终端反馈、阻塞信息能回流到 Action / Outcome |
| Trace | Action 与 Run 双向链接；Run 展示触发、上下文、工具、模型、产出 |
| Evaluation | 真实 Follow-up 样本形成准确率、采纳率、修改率、完成率、延迟、成本 |
| Governance | Follow-up 审批策略、权限、动作边界、审计记录产品内可见 |

### 工程项

1. 固化 Follow-up `Run -> Suggestion -> Review -> Action -> Outcome` 数据契约。
2. Action 写入与状态机收口：待审核、待执行、已闭环、异常、存档。
3. 补齐 Follow-up 上下文快照：工单、报价、合同、workflowNode、阻塞类型。
4. SOP v1 接入真实判断链：作为 Decision 的上下文输入，不作为孤立 prompt 优化。
5. Run trace 加厚：模型/规则版本、上下文来源、Action 产出、补跑/异常标记。
6. Evaluation 只先吃 Follow-up 真实样本；ROI / 业务价值全部标 `估算`。
7. Governance 首先服务 Follow-up：审批矩阵、动作权限、审计日志、未接入防误触。

### 明确不做

- 不新增第二个真实 Agent。
- 不做通用 Agent Studio / 任意配置化。
- 不追求精确 ROI 归因；先保证真实链路和可复盘指标。
- 不把未接入执行写回伪装成已生产闭环。

### 发布与验证

- **发布**：tag `v0.4.0`；Follow-up 试点用户切到新闭环，保留回滚路径。
- **验证**：
  - 随机抽样 ≥20 条 Follow-up Action，均可追溯到 Run、上下文、审批与结果。
  - App 内处置率、采纳率、修改率、拒绝率、完成率能按统一口径产出。
  - 试点用户能在产品内回答「为什么触发、谁批准、现在执行到哪、结果如何」。
  - 未接入能力全部标注为 `未接入` 或 `场景样例`，无误触发风险。

---

## v0.5 · two-real-agents（建议 3–4 周）

**目标**：新增 2 个真实 Agent，验证 AOL 不是 Follow-up 专用实现，而是可复制的运营层。

**产品判断**：v0.5 的价值不在“多两个页面”，而在证明 v0.4 的 Action 生命周期、Run trace、Evaluation、Governance 可以跨 Agent 复用。

### 交付范围

| 能力 | 本版要求 |
|------|----------|
| Agent 选择 | 从场景样例中选 2 个具备真实数据源和真实使用人的 Agent |
| Definition | 每个 Agent 有业务对象、触发条件、上下文、输出 Action、审批规则 |
| Reuse | 复用 v0.4 的 Action 生命周期、Run trace、Evaluation、Governance |
| Data | 真实数据优先；缺口字段允许 `估算` / `未接入`，但必须标注 |
| UX | Agents / Overview / Action / Runs / Evaluation 可按 Agent 过滤和下钻 |
| Proof | 每个 Agent 至少跑通一个可验收的小闭环，不要求达到 Follow-up 深度 |

### 工程项

1. 抽出 Agent Definition 最小结构：`agent_id`、业务对象、触发器、Action 类型、审批策略。
2. 将 Follow-up 特有字段从通用 Action / Run / Eval 组件中剥离。
3. 为新增 Agent 接入真实数据读取、上下文快照、Run trace 与 Action 生成。
4. Evaluation 支持按 Agent 对比：准确率、采纳率、完成率、成本、延迟。
5. Governance 支持 Agent 级审批策略与动作权限。

### 明确不做

- 不做全量低代码 Studio。
- 不开放外部开发者插件。
- 不强求两个新 Agent 都达到 Follow-up 的深闭环，只要求真实小闭环。

### 发布与验证

- **发布**：tag `v0.5.0`；3 个真实 Agent（Follow-up + 2）在同一 AOL Console 内运行。
- **验证**：
  - 2 个新增 Agent 均有真实业务对象、真实上下文、真实人审或执行反馈。
  - 至少 70% 通用 UI / 数据结构不需要为新增 Agent 重写。
  - 管理者能在 Evaluation 中比较 3 个 Agent 的运行质量。

---

## v0.6 · engineering-hardening（建议 3–4 周）

**目标**：从代码 / 工程角度把 AOL 提升到可产品化、可维护、可开源的质量标准。
v0.6 不追求新增业务能力，重点是让前端、后端、数据契约、性能、测试、CI、配置边界达到外部开发者和企业客户可接受的工程水位。

### 前端工程标准

| 维度 | 要求 |
|------|------|
| 架构 | 页面层、业务组件、通用组件、数据加载、URL state 边界清晰 |
| 设计系统 | Badge / Table / Form / Split Layout / Empty / Error / Loading 组件稳定复用 |
| 性能 | 关键列表分页 / 虚拟化或分块加载；首屏无不必要客户端 hydration |
| 可访问性 | 键盘导航、焦点态、aria、对比度、移动端布局进入封版检查 |
| 稳定性 | 主路由无阻断 console error；错误态和空态不依赖 mock 假成功 |

### 后端 / 数据工程标准

| 维度 | 要求 |
|------|------|
| 数据契约 | Agent / Run / Action / Outcome / Evaluation / Governance schema 版本化 |
| Adapter | XLink / mock / sample adapter 解耦，真实业务字段不泄漏到 AOL Core |
| 状态机 | Action 生命周期、Run 状态、Evaluation 样本状态有统一枚举和迁移策略 |
| 可观测 | 关键 API / jobs / agent runs 有结构化日志、错误分类、trace id |
| 安全 | secrets、PII 脱敏、只读账号、危险动作开关进入工程检查清单 |

### 质量门槛

| 门槛 | 要求 |
|------|------|
| TypeScript | `tsc --noEmit` 必须通过；关键类型不得用 `any` 绕过 |
| Lint | 新增代码无 eslint error；逐步清理既有 React Compiler / hooks 规则问题 |
| Test | 核心纯函数、状态机、数据 adapter、关键 UI smoke 有自动化覆盖 |
| Build | 本地和 CI build 可复现；示例数据环境可一键启动 |
| Docs | 架构、贡献、环境变量、数据状态、开发调试文档齐全 |

### 抽象对象

| 对象 | 说明 |
|------|------|
| Agent Definition | Agent 身份、职责、触发条件、输入/输出、上线状态 |
| Business Object Schema | 工单、商机、报价、合同等业务对象的字段映射 |
| Trigger Policy | 何时触发 Agent、频率、幂等、水位线 |
| Context Builder | 从业务系统构造上下文快照 |
| Decision Policy | 规则 / 模型 / SOP / 阈值组合 |
| Human Review Policy | 哪些动作需要人审、谁审批、如何留痕 |
| Action Type | Action schema、状态机、执行目标、反馈字段 |
| Execution Adapter | CRM / FSM / 企微 / Webhook 等执行通道 |
| Run Trace | 触发、上下文、工具、模型、产出、错误、补跑 |
| Evaluation Dataset | 真实样本、人工反馈、版本对比、回归评估 |
| Governance Policy | 权限、预算、模型路由、脱敏、审计、发布流程 |

### 发布与验证

- **发布**：tag `v0.6.0`；作为工程硬化 / OSS readiness 版本。
- **验证**：
  - `tsc --noEmit`、build、核心测试、关键 smoke 全部通过。
  - 新增一个 sample Agent 不需要修改核心状态机和通用 UI。
  - 删除或隔离 XLink 私有假设后，sample 数据仍能跑通 Console 主链路。

---

## v0.7 · bilingual-i18n（建议 2 周）

**目标**：支持中文和英文，为开源、海外开发者、英文文档与未来 Cloud SaaS 做准备。

### 交付范围

| 能力 | 要求 |
|------|------|
| Locale | 支持 `zh-CN` / `en-US`，URL、cookie 或用户设置可切换 |
| Copy | Console 所有用户可见文案抽取到 message catalog，不在组件里硬编码 |
| Data labels | 状态、枚举、Agent 类型、Action 生命周期、错误码可国际化 |
| Dates / Numbers | 日期、金额、百分比、时区、复数规则按 locale 格式化 |
| Docs | README、Quickstart、核心概念、示例 Agent 至少提供英文版本 |
| Samples | sample 数据避免中文业务强绑定，保留中文行业包作为可选示例 |

### 明确不做

- 不做多租户语言偏好管理。
- 不要求私有业务 SOP 全量英文翻译。
- 不为了翻译牺牲中文试点体验；中文仍是当前行业落地默认语言。

### 发布与验证

- **发布**：tag `v0.7.0`。
- **验证**：
  - 主要路由可在中文 / 英文之间切换，无布局溢出。
  - 新增文案必须经过 message catalog。
  - 英文 Quickstart 能让外部开发者用 sample 数据跑起产品。

---

## v0.8 · configurable-oss-core（建议 2–3 周）

**目标**：在 v0.6 工程硬化和 v0.7 i18n 之后，发布可开源的 AOL Core / Console alpha。

### 开源边界

| 开源 | 不开源 / 示例化 |
|------|----------------|
| AOL Core 数据模型、状态机、Console 基础壳、mock adapter、示例 Agent | 客户真实数据、私有行业规则、XLink 凭证、生产 SOP 细节 |

### 发布与验证

- **发布**：tag `v0.8.0`；可作为 OSS preview / alpha。
- **验证**：
  - 新增一个 mock/sample Agent 不需要改核心代码，只改配置和 adapter。
  - 第三方可用样例数据在本地跑通 Console、Run、Action、Evaluation。
  - README、安装、示例数据、边界说明完整；真实 Industry Pack 可保持私有。

---

## 引擎能力：live 硬化（并入产品轨 v1.x 后端）

> 原 `v1.0 live-phase1`。现作为产品轨 v1.0–v1.2 的**生产硬化能力**，不再单列为面向用户的版本。

**目标**：生产 Cron、SLO、告警、权限与合规收口（支撑产品 Live）。

### 交付范围

| 维度 | 标准 |
|------|------|
| 数据 | prod `xlink` 只读；口径与私有文档 `docs/private/PRIV-xlink-data.md` 签字确认 |
| 运行 | GitHub Actions 或等价调度；Turso 追踪；Secrets 轮换流程 |
| 可靠性 | 单轮失败不影响下轮；LLM/企微失败有告警（邮件/企微运维群） |
| 安全 | 密钥不进库；日志脱敏 phone；只读账号最小权限 |
| 文档 | Runbook、架构图、on-call 一页纸 |

### SLO 建议（首期）

- Cron 成功率 ≥ 99%（排除上游 Mongo 不可用）。
- 单工单端到端 P95 &lt; 60s（含 LLM）。
- 重复推送率 = 0（幂等）。

### 发布与验证

- **发布**：tag `v1.0.0`；生产群（非仅试点）或分城市分群路由。
- **验证**：
  - 连续 30 天无 P0 事故。
  - 业务方签字「Stage 1 可常态化运行」。

**首个 Live 定义**：黑盒、企微为主、人类采纳；**不承诺**产品内审批与自动写 CRM。

---

## 引擎/平台能力：Stage 2（Product → Platform：AOL Core 成型）

> 以下能力支撑产品轨 v1.1–v2.x；产品形态与 UI 验收以产品轨总表为准。

**Action Spec 协议（支撑 v1.1 trust / v2.0 studio）**

- `FollowUpSuggestion` → 强类型 **Action Spec**（`action_type` / `ui_component` / `payload`）。
- 审批结果 webhook 回写 `suggestion_outcomes`；JSON Schema 校验 + `spec_version`。
- **验证**：mock Spec 可独立 JSON 校验；至少 2 种 `action_type` 端到端。

**确定性执行（支撑 v2.x）**

- 审批后确定性执行（企微发客户草稿 / CRM 字段更新经 Guardrails API）。
- Event Ingestion 改消费 **ERM 领域读模型**，删除直连 Mongo 的影子路径。
- SOP 向量检索（可选 RAG）上线。
- **验证**：单客服跟进吞吐量提升可量化；漏跟率下降。

---

## 引擎/平台能力：Phase 5（开放生态：Connector + SDK）

> 支撑产品轨 v2.2 oss-connectors / v3.0 cloud-saas 等；战略修订见 [PUB-03-roadmap.md](PUB-03-roadmap.md) Phase 5。
> **开源**：Connector Layer、Event Schema、Agent SDK。**不先开源**：Cognitive Graph、Ontology、Decision Intelligence、Kernel Runtime。

- 防水业务 → `bindings/xlink-wpf.yaml` + SOP 包（Industry Pack，不开源）。
- **Connector + Event Schema（开源）**：FSM / Sheets / 消息等接入与标准事件命名。
- **Agent SDK（开源）**：`agent.execute(context)`；Generative UI 组件库可独立 npm 包。
- **闭源护城河**：认知层、决策引擎、行业 Ontology、Hosted FS-COS。
- Agent Marketplace **非终局叙事**（执行型 Agent 趋于 commodity）。

**验证**：第三方仓库用 mock Connector 48h 内跑通摄取 → 建议 → 审批链路。

---

## 迭代节奏建议

| Stage | 轨道 / 版本 | 日历（参考） | 决策门 |
|------|------------|--------------|--------|
| Stage 0 闭环 | POC `poc-followup` 封版 | 本周 | 生产只读 + steps E2E + trace |
| Stage 0→1 试点 | POC `poc-cron` → `poc-context` | 第 2–5 周 | GHA cron + 提质（SOP/上下文） |
| **Stage 0→1 产品起点** | **产品 v1.0 console-mvp** | 第 6–9 周 | **首块可见产品：S1+S2 + 安全/运维签字** |
| Stage 1 信任/证明 | 产品 v1.1 → v1.2 | 第 10–14 周 | 查证可见 + ROI 看板被引用 |
| Stage 1→2 多 Agent/编排 | 产品 v1.3 → v1.5 | 第 15–24 周 | 复用率达标 + 编排可见可干预 |
| Stage 2 平台化 | 产品 v2.0 → v2.1 | 半年+ | UI 内可配置 + 可自托管 |
| Stage 3 开源/云 | 产品 v2.2 → v3.1 | Year 1+ | 闭环指标成立 + Core 与 Pack 边界清晰 |

**决策门纪律**：未达上一版验收清单，**不启动下一版开发**（可并行写文档与运维准备）。

---

## 每版通用「可发布」检查单

复制到每个 PR / Release Notes：

1. **闭环**：Event → Reasoning → Trace → Outbound → 水位线 全路径可演示。
2. **可验证**：开发路径 `DRY_RUN=true`（真数据+真 LLM+企微预览）；试点/Live 再单独验真发。
3. **可回滚**：上一 tag 可一键恢复；Cron 可 disable。
4. **可观测**：能回答「昨晚 3 点为什么没推？」（trace + run_summary）。
5. **领域纪律**：系统码只出现在 `domain.py`（或 binding 配置）。
6. **文档**：README + 本文件该版本节 + Runbook 变更。
7. **产品化达标（仅产品轨 `vX.Y`）**：UI 表面 + UX 流程齐全；用户能在产品内回答该版本对应
   产品脊柱（S1–S6）的核心问题；可感知 KPI 有埋点。见 [PUB-07-product-surface.md](PUB-07-product-surface.md)。

---

## 参见

- [PUB-01-vision.md](PUB-01-vision.md) · [PUB-02-architecture.md](PUB-02-architecture.md) · [PUB-03-roadmap.md](PUB-03-roadmap.md)
- [PUB-04-domain-semantics.md](PUB-04-domain-semantics.md) · [PUB-07-product-surface.md](PUB-07-product-surface.md) · 私有文档 `docs/private/PRIV-xlink-data.md`

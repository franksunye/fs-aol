# 21 · v0.4.1 Live Surface（Follow-up 真实数据接活）

> **状态**：生效中 · **依赖**：[PUB-05](PUB-05-releases.md) §v0.4.1 · [PUB-20](PUB-20-action-contract.md) · [PUB-17](PUB-17-console-information-architecture.md)

## 1. 目标

用 **Turso 真实试点数据** 穿过 Console mock 壳，证明 Follow-up UX 可落地；mock 降级为「多 Agent / 企业治理样例区」，并诚实标注 `DataState`。

## 2. 模块 DataState 目标

| 模块 | 主路径 | 样例区 |
|------|--------|--------|
| Action 中心 / Runs | `live` | — |
| 日历 | `live`（有 action）/ 空态 | 多 Agent 样例（可选折叠） |
| 评估 Follow-up KPI | `live` / `mixed` | 多 Agent 对比表 `scenario` |
| 总览 | `live` / `mixed` | Agent 舰队非 Follow-up `scenario` |
| 集成 | Follow-up 三连接器 `live` | 其余 `scenario` |
| Agent 设置 / 模型策略 | 运行时配置 `live`（可编辑，v0.4.2+） | 目标态编排/发布 `scenario` |
| 治理 | Follow-up 规则 + 审计 feed `live` | 企业矩阵 `scenario` |
| AI 基础设施 | 当前 provider `live` | 其余 `scenario` |

## 3. 统一口径

| 指标 | 定义 | 来源 |
|------|------|------|
| 待审核 | `inbox_bucket=active` 条数 | `follow_up_logs` |
| 待执行 | `aol_actions` 非终态 + execution 桶 | `actions` + inbox |
| 已闭环 | `inbox_bucket=closed` | `follow_up_logs` |
| 采纳率 | `(approved+modified+followed_up) / discovered` | outcomes + logs |
| 完成率 | `actions.status=completed` / 已生成 actions | `actions` |

## 4. 引擎运行时镜像

- 表：`aol_engine_runtime_snapshots`（脱敏 JSON，每轮 cron 追加）
- Console：`getLatestEngineRuntimeSnapshot()` / `GET /api/engine/runtime-config`
- **不含** secret、webhook URL、Mongo 连接串

## 5. v0.4.1 验收清单

- [ ] Follow-up 主路径（Action / Runs / Calendar / 评估 KPI）无 scenario 混入
- [ ] Action 中心、总览、评估数字同源
- [ ] 日历展示真实 `aol_actions` due
- [ ] 集成/Agent 设置与 engine snapshot 一致（`run_at` 新鲜）
- [ ] mock 区均有 badge
- [ ] `node scripts/v041-live-surface-audit.mjs` 通过（本地 ≥4，试点 ≥20）
- [ ] `pnpm build` 通过

## 6. UX 债记录（实施中追加）

| 项 | 说明 | 状态 |
|----|------|------|
| seed vs .env.local DB 路径 | `e2e-v041-local.sh` 对齐 | 待验证 |
| 小样本评估置信度 | 脚注「试点样本量小」 | 待验证 |

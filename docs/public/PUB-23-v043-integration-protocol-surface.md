# 23 · v0.4.3 Integration Protocol Surface

> **状态**：生效中 · **依赖**：[PUB-05](PUB-05-releases.md) §v0.4.3 · [PUB-04](PUB-04-domain-semantics.md) · [PUB-22](PUB-22-v042-runtime-config-plane.md)

## 1. 目标

将 XLink FSM 防腐层从写死的 `domain.py` 提取为 **Integration Binding**（`contracts/integration-bindings/xlink-fsm.v1.json`），并在 Console 以企业级集成工作台呈现：

- **连接 / 摄取**：可编辑（`runtime_config`）
- **集成协议**：对象映射、字段、码表、事件规则 — 只读可见
- **同步健康**：来自 `engine_runtime_snapshots.run_summary_json`
- **样例转换**：原始 `serviceAppointment` → `WorkOrder`

**不做**：写回业务系统、`binding_overrides` 可编辑（v0.4.4）。

## 2. Binding 契约

| 路径 | 说明 |
|------|------|
| `contracts/integration-bindings/schema.json` | JSON Schema |
| `contracts/integration-bindings/xlink-fsm.v1.json` | XLink FSM SSOT |
| `packages/aol/aol/integration/binding.py` | 加载与校验 |
| `packages/aol/aol/integration/mapper.py` | `map_record()` 原语：direct / lookup / coalesce / source_ref |

引擎 `work_order_from_sa()` 委托 `map_record()`；parity 测试防漂移。

## 3. Console API

| 端点 | 说明 |
|------|------|
| `GET /api/integrations/fsm` | binding + runtime 合并视图 + sync health |
| `POST /api/integrations/fsm/sample-transform` | Mongo 1 条或内置样例 → WorkOrder |

## 4. UI（`/integrations`）

**已接入（live）**：

- `FsmIntegrationWorkspace` — Tab：连接 / 摄取策略 / 集成协议 / 同步健康
- `WecomLiveCard` · `TursoBootstrapCard`
- Agent 设置 FSM 字段 → `FsmConfigMirrorCard` 只读 + 链到集成页

**目标态样例（scenario）**：mock 三栏折叠保留。

Deep link：`/integrations?integration=xlink-fsm&tab=protocol`

## 5. 验收

```bash
# Python binding parity
.venv/bin/python -m pytest packages/aol/tests/test_binding_mapper.py -q

# Console E2E
bash scripts/e2e-v043-integration-protocol.sh

pnpm build
```

- [ ] `map_record` 与 mock SA 记录 parity
- [ ] FSM 工作台四 Tab 可保存连接/摄取
- [ ] 集成协议 Tab 展示 binding + 样例转换
- [ ] Agent 设置无 FSM 双编辑
- [ ] 同步健康来自真实 cron 快照

## 6. v0.4.4 预留

- `runtime_config.binding_overrides` — 码表 / 字段路径 patch
- 协议 Tab 内编辑入口 + revision 回滚

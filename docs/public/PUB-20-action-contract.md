# 20 · Action 执行契约（v0.4）

> **状态**：生效中 · **依赖**：[PUB-04](PUB-04-domain-semantics.md) · [PUB-16](PUB-16-architecture-evolution.md) · [PUB-05](PUB-05-releases.md) §v0.4

## 1. 定位

`aol_actions` 表承载 **人审批准后的可执行 Action**，区别于：

| 概念 | 存储 | 含义 |
|------|------|------|
| Suggestion / WorkItem | `follow_up_logs` | Agent 产出建议 |
| Run | `reasoning_traces` | 推理与工具调用 trace |
| Review disposition | `suggestion_outcomes` | 人审决策记录 |
| **Action** | `actions` | 批准/修改后进入待执行队列 |

## 2. 状态机

```text
pending_dispatch → in_progress → completed
                ↘ rejected / timeout / no_feedback
```

| status | 含义 |
|--------|------|
| `pending_dispatch` | 已批准，待管家执行 |
| `in_progress` | 管家已开始处理 |
| `completed` | 执行完成并反馈 |
| `rejected` | 执行侧拒绝/无法完成 |
| `timeout` | SLA 超时 |
| `no_feedback` | 无终端回写 |

## 3. 与 inbox_bucket 关系

| Review decision | inbox_bucket | Action |
|-----------------|--------------|--------|
| `approved` / `modified` | `execution` | 创建 `pending_dispatch` |
| `rejected` / `followed_up` | `closed` | 无 |
| Action `completed` | `closed` | 更新 completed_at |

历史数据：`approved` 且已 `closed` 的行标记为 **legacy_closed**，不回填 Action。

## 4. 关联键

- `dedupe_key`：与 `follow_up_logs` 主键一致
- `trace_id`：关联 `reasoning_traces.id`（批准时最新 trace）
- `review_outcome_id`：关联 `suggestion_outcomes.id`

## 5. 执行通道（v0.4）

批准 → 待执行 Tab → 企微 DRY_RUN 深链预览 → 管家在 Console 标记完成 + `terminal_feedback`。

CRM / FSM 写回标 **未接入**。

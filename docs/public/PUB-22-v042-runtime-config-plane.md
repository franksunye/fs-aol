# 22 · v0.4.2 Runtime Config Plane（Console 控制面）

> **状态**：生效中 · **依赖**：[PUB-05](PUB-05-releases.md) §v0.4.2 · [PUB-21](PUB-21-v041-live-surface.md)

## 1. 目标

将 **已运行的 Follow-up 能力**（LLM、FSM、集成密钥、触发规则）从 env/GHA 迁入 **Turso `runtime_config`**，由 Console 读写；mock 保留为目标态示意。

## 2. Bootstrap vs Runtime

| Bootstrap（仅 env） | Runtime（Turso + Console） |
|---------------------|----------------------------|
| `TURSO_URL` / `TURSO_TOKEN` | `llm_provider` / `llm_model` |
| `AOL_CONFIG_ENCRYPTION_KEY` | API keys（加密列） |
| `TRACKING_SOURCE` / `AOL_TABLE_PREFIX` | `fsm_mongo_url` / `fsm_mongo_db` |
| `LIBSQL_URL`（Console） | `fsm_event_statuses`、pilot、`dry_run` |
| `CONFIG_FALLBACK_ENV=true`（应急） | 企微 webhook / 应用凭证 |

## 3. 表结构

- `aol_runtime_config`：active 配置（scope=`follow_up`）
- `aol_runtime_config_revisions`：版本历史 + 回滚

密钥：`secrets_ciphertext` + `secrets_nonce`（AES-256-GCM，与引擎/Python 共用格式）。

## 4. API

| 端点 | 说明 |
|------|------|
| `GET/PUT /api/runtime/config` | 非敏感配置 |
| `PUT /api/runtime/secrets` | 密钥（掩码返回） |
| `POST /api/runtime/config/rollback` | 回滚 |
| `POST /api/runtime/test/{llm,mongo,wecom}` | 连接测试 |

## 5. 迁移

```bash
cd apps/console
AOL_CONFIG_ENCRYPTION_KEY=$(openssl rand -base64 32) \
LIBSQL_URL=file:../../data/agent_loop_tracking.db \
node scripts/migrate-env-to-runtime-config.mjs
```

## 6. 验收

见 [PUB-05](PUB-05-releases.md) §v0.4.2。

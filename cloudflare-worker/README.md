# FS-AOL Cloudflare Scheduler

用 Cloudflare Workers Cron 稳定触发 GitHub Actions `agent_cron.yml`（`workflow_dispatch`），替代不可靠的 GHA 原生 `schedule`。

模式对齐 [sales-reward-hub/cloudflare-worker](https://github.com/franksunye/sales-reward-hub/tree/main/cloudflare-worker)。

**已部署**：`https://fs-aol-scheduler.sunye.workers.dev`

## 架构

```
Cloudflare Cron (UTC 0–14 每小时)
        │
        ▼
  worker.js  ──POST──►  GitHub API workflow_dispatch
                              │
                              ▼
                    .github/workflows/agent_cron.yml
                              │
                              ▼
                         run_cron.py
```

## 部署

```bash
cd cloudflare-worker
npm i -g wrangler   # 或 npx wrangler
wrangler login
wrangler deploy
```

## Cloudflare Dashboard 配置

| 名称 | 类型 | 说明 |
|------|------|------|
| `GITHUB_TOKEN` | Secret | GitHub PAT（`workflow` + `repo`） |
| `TRIGGER_SECRET` | Secret | 可选；手动 `/trigger` 鉴权 |
| `GITHUB_OWNER` | Var | 默认 `franksunye`（wrangler.toml） |
| `GITHUB_REPO` | Var | 默认 `fs-aol` |

## 手动触发

```bash
# 状态
curl https://fs-aol-scheduler.sunye.workers.dev/status

# 立即跑一轮（需 TRIGGER_SECRET，见 Cloudflare Dashboard Secrets）
curl "https://fs-aol-scheduler.sunye.workers.dev/trigger?secret=YOUR_TRIGGER_SECRET"
```

## 排期

| 时区 | 窗口 |
|------|------|
| 北京 | 08:00 – 22:00，每小时整点 |
| UTC cron | `0 0-14 * * *` |

Cron 心跳内会再校验北京时间，非窗口内跳过（手动 `/trigger` 不受限）。

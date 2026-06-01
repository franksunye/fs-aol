# Console 读路径性能基线

## 跑基线

```bash
# 本地 sqlite（data/agent_loop_tracking.db 或 LIBSQL_URL）
make bench-console

# 生产 Turso（与管家移动端同库）
export $(grep -E '^LIBSQL_' apps/console/.env.local.turso.bak | xargs)
make bench-console-turso
```

## 指标说明

| 指标 | 含义 |
|------|------|
| `mobileFirstPaint` | **管家首屏 DB 时间**：旧路径 = detail+trace；新路径 = 仅 detail（`/m/s/`） |
| `trace` | 查证轨 payload；新路径懒加载且不含 prompt |
| `listInbox` | 收件箱列表读路径 |

## 结果文件

- `baseline.json` — 本地库样例
- `baseline-turso.json` — 优化前 SQL 模式（脚本内 legacy 分支）
- `optimized-turso.json` — 优化后（单条 JOIN + 列表 IN + trace lite）

对比看 `comparison.mobileFirstPaintMs` 与 `traceBytes`。

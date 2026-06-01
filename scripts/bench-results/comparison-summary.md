# Console 移动处置页性能对比（2026-06-01）

## 环境

- 库：Turso `xlink-xlink.aws-ap-northeast-1`（与生产 Console 相同）
- 样本：`STALE_SIGN_PENDING:5973042966711386893`
- 迭代：8 次取平均

## 基线（优化前行为，脚本 `bench-read-path` legacy 分支）

| 指标 | ms | bytes |
|------|-----|-------|
| getSuggestion（全表扫 outcomes/blockers） | 984 | 2928 |
| getTrace 首屏（SELECT *） | 742 | 10075 |
| **旧详情页 DB 合计（串行）** | **≈1726** | — |
| 收件箱 LIMIT 500 + 全表 join | 698 | 905 |

来源：`baseline-turso.json`

## 优化后（已落地代码 + `bench-lib-integration`）

| 指标 | ms | bytes |
|------|-----|-------|
| getSuggestion（单条 JOIN，1× RTT） | **508** | — |
| getTraceLite（懒加载，用户点开查证 Tab） | 611 | 5097 |
| **移动处置页 `/m/s/` 首屏 DB** | **508** | — |
| trace payload vs 全量 | — | **-54%** |

来源：`optimized-turso-lib.json`

## 改进幅度（管家首屏）

| 对比 | 结果 |
|------|------|
| 旧详情页 DB（984+742）→ 新移动页（508） | **约 -70%** |
| 同代码下详情若仍串行拉 trace（508+611） | **约 -58%**（相对旧串行 trace 路径） |
| 查证轨 payload | **-54%**（懒加载 + 列裁剪） |
| 收件箱 payload（LIMIT 30 + IN keys） | **约 -99%** bytes（见 baseline-turso comparison） |

## 已实施改动

- `getSuggestion`：单 SQL JOIN，去掉全表扫
- `listSuggestions`：LIMIT 默认 100；outcomes/blockers 按页内 keys IN 查询
- `/m/s/[key]`：移动处置页 + `loading.tsx` 骨架
- 企微深链 → `/m/s/`；`/suggestions/[key]` trace 改懒加载 API
- `scripts/bench-read-path.ts` / `bench-lib-integration.ts`

## 复现

```bash
export $(grep -E '^LIBSQL_' apps/console/.env.local.turso.bak | xargs)
cd apps/console && npx tsx scripts/bench-lib-integration.ts --save=optimized-turso-lib --iterations=8
```

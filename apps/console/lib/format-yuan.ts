export function formatYuanCompact(n: number): string {
  if (n >= 10_000) {
    const wan = n / 10_000;
    return wan >= 100
      ? `¥${Math.round(n).toLocaleString("zh-CN")}`
      : `¥${wan % 1 === 0 ? wan : wan.toFixed(1)}万`;
  }
  return `¥${Math.round(n).toLocaleString("zh-CN")}`;
}

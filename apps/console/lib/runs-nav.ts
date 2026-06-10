export const RUNS_HOME_PATH = "/runs";

export function runDetailHref(runId: string, hk?: string): string {
  const q = new URLSearchParams();
  q.set("run", runId);
  if (hk) q.set("hk", hk);
  return `${RUNS_HOME_PATH}?${q.toString()}`;
}

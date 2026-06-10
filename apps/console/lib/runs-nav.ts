import { EVALUATION_HOME_PATH } from "./evaluation-mock";

export const RUNS_HOME_PATH = "/runs";

export function runDetailHref(runId: string, hk?: string): string {
  const q = new URLSearchParams();
  q.set("run", runId);
  if (hk) q.set("hk", hk);
  return `${RUNS_HOME_PATH}?${q.toString()}`;
}

export function runsFilterHref(
  patch: Partial<{
    quick: string;
    agent: string;
    status: string;
    model: string;
    q: string;
    run: string;
  }>,
  hk?: string
): string {
  const params = new URLSearchParams();
  if (patch.quick && patch.quick !== "all") params.set("rquick", patch.quick);
  if (patch.agent && patch.agent !== "all") params.set("ragent", patch.agent);
  if (patch.status && patch.status !== "all") params.set("rstatus", patch.status);
  if (patch.model && patch.model !== "all") params.set("rmodel", patch.model);
  if (patch.q) params.set("rq", patch.q);
  if (patch.run) params.set("run", patch.run);
  if (hk) params.set("hk", hk);
  const s = params.toString();
  return s ? `${RUNS_HOME_PATH}?${s}` : RUNS_HOME_PATH;
}

export function runsAgentFilterHref(agentId: string, hk?: string): string {
  return runsFilterHref({ agent: agentId }, hk);
}

export function runsEvaluationHref(agentId: string, hk?: string): string {
  const q = new URLSearchParams();
  q.set("eagent", agentId);
  if (hk) q.set("hk", hk);
  const s = q.toString();
  return s ? `${EVALUATION_HOME_PATH}?${s}` : EVALUATION_HOME_PATH;
}

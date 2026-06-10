export type ActionCenterPrimaryKpiKey =
  | "pendingReview"
  | "actionsGenerated"
  | "dispatched"
  | "feedback"
  | "timeoutAnomaly";

export type ActionCenterPrimaryKpi = {
  key: ActionCenterPrimaryKpiKey;
  label: string;
  value: number;
  delta: number;
  upIsGood: boolean;
};

export function primaryKpiHref(
  key: ActionCenterPrimaryKpiKey,
  hk?: string
): string {
  const q = new URLSearchParams();
  if (hk) q.set("hk", hk);

  switch (key) {
    case "pendingReview":
      return hk ? `/?hk=${encodeURIComponent(hk)}` : "/";
    case "actionsGenerated":
      q.set("tab", "execution");
      break;
    case "dispatched":
      q.set("tab", "execution");
      q.set("astatus", "dispatched");
      q.set("aquick", "all");
      break;
    case "feedback":
      q.set("tab", "execution");
      q.set("astatus", "completed");
      q.set("aquick", "all");
      break;
    case "timeoutAnomaly":
      q.set("tab", "execution");
      q.set("aquick", "overdue");
      break;
  }
  return `/?${q.toString()}`;
}

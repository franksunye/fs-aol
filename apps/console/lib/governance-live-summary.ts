import { TABLE_OUTCOMES } from "./db";
import { countInboxBuckets } from "./tracking/inbox";
import { scalarNumber, query } from "./data/client";

export type GovernanceLiveSummary = {
  activeInbox: number;
  closedInbox: number;
  outcomeCount: number;
};

export async function loadGovernanceLiveSummary(): Promise<GovernanceLiveSummary> {
  const [buckets, outcomes] = await Promise.all([
    countInboxBuckets(),
    query(`SELECT COUNT(*) AS c FROM ${TABLE_OUTCOMES}`),
  ]);
  return {
    activeInbox: buckets.active,
    closedInbox: buckets.closed,
    outcomeCount: scalarNumber(outcomes),
  };
}

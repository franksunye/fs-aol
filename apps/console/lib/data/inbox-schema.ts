import { ensureSchema } from "../db";
import { logsHasInboxColumns } from "../logs-schema";
import { migrateInboxColumns } from "../migrate-inbox-columns";

let inboxColumnsReady: boolean | null = null;

/** 进程级缓存：inbox_bucket 等列是否已迁移就绪。 */
export async function ensureInboxColumnsReady(): Promise<boolean> {
  if (inboxColumnsReady !== null) return inboxColumnsReady;
  await ensureSchema();
  if (await logsHasInboxColumns()) {
    inboxColumnsReady = true;
    return true;
  }
  await migrateInboxColumns();
  inboxColumnsReady = await logsHasInboxColumns();
  return inboxColumnsReady;
}

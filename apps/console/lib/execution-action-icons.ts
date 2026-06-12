import type { LucideIcon } from "lucide-react";
import {
  ClipboardCheck,
  FileSearch,
  MessageSquare,
  Phone,
  RefreshCw,
} from "lucide-react";

export const EXECUTION_ACTION_ICON_KEYS = [
  "clipboard-check",
  "phone",
  "message-square",
  "refresh-cw",
  "file-search",
] as const;

export type ExecutionActionIconKey = (typeof EXECUTION_ACTION_ICON_KEYS)[number];

const ICONS: Record<ExecutionActionIconKey, LucideIcon> = {
  "clipboard-check": ClipboardCheck,
  phone: Phone,
  "message-square": MessageSquare,
  "refresh-cw": RefreshCw,
  "file-search": FileSearch,
};

export function resolveExecutionActionIcon(
  key: ExecutionActionIconKey | undefined
): LucideIcon {
  return key ? ICONS[key] ?? ClipboardCheck : ClipboardCheck;
}

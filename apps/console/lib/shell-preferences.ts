/** 左侧导航收起状态（SSR cookie + 客户端同步） */
export const SIDEBAR_COLLAPSED_COOKIE = "aol_console_sidebar_collapsed";

const SIDEBAR_COLLAPSED_STORAGE = SIDEBAR_COLLAPSED_COOKIE;

export function isSidebarCollapsed(value: string | undefined | null): boolean {
  return value === "1";
}

export function sidebarCollapsedCookieValue(collapsed: boolean): "0" | "1" {
  return collapsed ? "1" : "0";
}

/** 客户端持久化：cookie 供 SSR，localStorage 兼容旧会话 */
export function persistSidebarCollapsed(collapsed: boolean): void {
  const v = sidebarCollapsedCookieValue(collapsed);
  try {
    document.cookie = `${SIDEBAR_COLLAPSED_COOKIE}=${v}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE, v);
  } catch {
    /* ignore */
  }
}

/** 首次访问：将仅有 localStorage 的旧偏好写入 cookie */
export function migrateSidebarCollapsedFromStorage(): boolean | null {
  try {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE);
    if (stored !== "0" && stored !== "1") return null;
    document.cookie = `${SIDEBAR_COLLAPSED_COOKIE}=${stored}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    return stored === "1";
  } catch {
    return null;
  }
}

/** 分栏 / 侧栏内滚动区域统一样式 */
export const shellScrollClass =
  "shell-scroll min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-gutter:stable]";

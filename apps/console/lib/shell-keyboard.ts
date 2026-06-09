/** 侧栏收起快捷键标签（展示用） */
export function sidebarToggleShortcutLabel(): string {
  if (typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)) {
    return "⌘B";
  }
  return "Ctrl+B";
}

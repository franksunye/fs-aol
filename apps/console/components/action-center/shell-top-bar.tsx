"use client";

export function ShellTopBar() {
  return (
    <div className="bg-background hidden shrink-0 items-center justify-end border-b border-border px-4 py-2 md:flex">
      <p className="text-muted-foreground shrink-0 text-[11px]">
        <kbd className="bg-muted rounded px-1 font-mono">j</kbd>
        <kbd className="bg-muted mx-0.5 rounded px-1 font-mono">k</kbd>
        切换 ·
        <kbd className="bg-muted mx-1 rounded px-1 font-mono">Enter</kbd>
        打开
      </p>
    </div>
  );
}

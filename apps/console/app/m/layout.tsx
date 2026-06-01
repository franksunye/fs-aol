import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "跟进行动 · 处置",
  description: "FS-AOL 移动处置页",
};

/** 移动 WebView：避免缩放跳动，背景立即铺色减少白屏 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0a",
};

/**
 * 移动处置面：系统字体、窄屏。
 * 顶栏为静态 HTML，不等待 Turso，随 layout 首包流出。
 */
export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background text-foreground mx-auto min-h-dvh w-full max-w-lg font-sans antialiased">
      <header className="border-border/60 bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 border-b px-4 py-2.5 backdrop-blur">
        <p className="text-muted-foreground text-center text-xs font-medium tracking-wide">
          跟进行动 · 处置
        </p>
      </header>
      {children}
    </div>
  );
}

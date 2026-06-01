import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "跟进行动 · 处置",
  description: "FS-AOL 移动处置页",
};

/** 移动处置面：系统字体、窄屏、少依赖 */
export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto min-h-full w-full max-w-lg font-sans antialiased">
      {children}
    </div>
  );
}

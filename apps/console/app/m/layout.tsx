import type { Metadata, Viewport } from "next";
import "./mobile-theme.css";
import { MobileHeader } from "@/components/mobile/mobile-header";

export const metadata: Metadata = {
  title: "跟进行动 · 反馈",
  description: "Agent Console 移动反馈页",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
};

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="mobile-light mx-auto min-h-dvh w-full max-w-lg bg-background font-sans text-foreground antialiased"
      style={{
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <MobileHeader />
      <div className="px-3 pt-3">{children}</div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { BrandMark } from "@/components/brand-mark";
import { OVERVIEW_HOME_PATH } from "@/lib/overview-nav";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || OVERVIEW_HOME_PATH;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        setError("用户名或密码错误");
        return;
      }
      router.push(from);
      router.refresh();
    } catch {
      setError("登录失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm p-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <BrandMark className="size-10" letterClassName="text-lg" />
          <div>
            <h1 className="text-lg font-semibold">Agent Console</h1>
            <p className="text-muted-foreground text-sm">
              登录后进入 Agent 运营驾驶舱
            </p>
            <p className="text-muted-foreground/80 mt-0.5 text-xs">
              Agent Ops · Agent Operations Layer
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">用户名</Label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:outline-none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">密码</Label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        <Button type="submit" disabled={loading}>
          {loading ? "登录中…" : "登录"}
        </Button>
      </form>
    </Card>
  );
}

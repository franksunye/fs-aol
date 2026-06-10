"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function ActionReviewListKeyboard({
  itemHrefs,
  selectedKey,
  enabled = true,
  children,
}: {
  itemHrefs: { id: string; href: string }[];
  selectedKey: string | null;
  enabled?: boolean;
  children: (opts: { keyboardIndex: number }) => React.ReactNode;
}) {
  const router = useRouter();
  const [keyboardIndex, setKeyboardIndex] = useState(() => {
    const idx = itemHrefs.findIndex((x) => x.id === selectedKey);
    return idx >= 0 ? idx : 0;
  });

  useEffect(() => {
    const idx = itemHrefs.findIndex((x) => x.id === selectedKey);
    if (idx >= 0) setKeyboardIndex(idx);
  }, [selectedKey, itemHrefs]);

  const navigateToIndex = useCallback(
    (index: number) => {
      const item = itemHrefs[index];
      if (!item) return;
      setKeyboardIndex(index);
      router.push(item.href, { scroll: false });
    },
    [itemHrefs, router]
  );

  useEffect(() => {
    if (!enabled || itemHrefs.length === 0) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement | null)?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "j" || e.key === "J") {
        e.preventDefault();
        const next = Math.min(keyboardIndex + 1, itemHrefs.length - 1);
        navigateToIndex(next);
        return;
      }
      if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        const prev = Math.max(keyboardIndex - 1, 0);
        navigateToIndex(prev);
        return;
      }
      if (e.key === "Enter" && keyboardIndex >= 0) {
        const item = itemHrefs[keyboardIndex];
        if (item && item.id !== selectedKey) {
          e.preventDefault();
          router.push(item.href, { scroll: false });
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    enabled,
    itemHrefs,
    keyboardIndex,
    navigateToIndex,
    router,
    selectedKey,
  ]);

  return <>{children({ keyboardIndex })}</>;
}

"use client";

import type { WorkItem } from "@/lib/operator-model";
import type { ActionReviewSortKey } from "@/lib/action-review-sorting";
import type { ActionReviewListContext } from "@/lib/action-center-nav";
import { suggestionDetailHref } from "@/lib/action-center-nav";
import { ActionReviewListKeyboard } from "./action-review-list-keyboard";
import { ActionReviewTable } from "./action-review-table";

export function ActionReviewList({
  items,
  listContext,
  selectedKey,
  sortKey,
}: {
  items: WorkItem[];
  listContext?: ActionReviewListContext;
  selectedKey: string | null;
  sortKey: ActionReviewSortKey;
}) {
  const itemHrefs = items.map((item) => ({
    id: item.id,
    href: suggestionDetailHref(item.id, listContext),
  }));

  return (
    <ActionReviewListKeyboard
      itemHrefs={itemHrefs}
      selectedKey={selectedKey}
      enabled={items.length > 0}
    >
      {({ keyboardIndex }) => (
        <ActionReviewTable
          items={items}
          listContext={listContext}
          selectedKey={selectedKey}
          sortKey={sortKey}
          keyboardIndex={keyboardIndex}
        />
      )}
    </ActionReviewListKeyboard>
  );
}

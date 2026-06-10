"use client";

import type { WorkItem } from "@/lib/operator-model";
import type { SuggestionSortKey } from "@/lib/suggestion-sorting";
import type { WorkbenchListContext } from "@/lib/workbench-nav";
import { suggestionDetailHref } from "@/lib/workbench-nav";
import { WorkbenchListKeyboard } from "./workbench-list-keyboard";
import { ActionTable } from "./action-table";

export function OpportunityList({
  items,
  listContext,
  selectedKey,
  sortKey,
}: {
  items: WorkItem[];
  listContext?: WorkbenchListContext;
  selectedKey: string | null;
  sortKey: SuggestionSortKey;
}) {
  const itemHrefs = items.map((item) => ({
    id: item.id,
    href: suggestionDetailHref(item.id, listContext),
  }));

  return (
    <WorkbenchListKeyboard
      itemHrefs={itemHrefs}
      selectedKey={selectedKey}
      enabled={items.length > 0}
    >
      {({ keyboardIndex }) => (
        <ActionTable
          items={items}
          listContext={listContext}
          selectedKey={selectedKey}
          sortKey={sortKey}
          keyboardIndex={keyboardIndex}
        />
      )}
    </WorkbenchListKeyboard>
  );
}

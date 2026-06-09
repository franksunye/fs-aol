"use client";

import type { WorkItem } from "@/lib/operator-model";
import type { WorkbenchListContext } from "@/lib/workbench-nav";
import { suggestionDetailHref } from "@/lib/workbench-nav";
import { WorkbenchListKeyboard } from "./workbench-list-keyboard";
import { OpportunityTable } from "./opportunity-table";

export function OpportunityList({
  items,
  listContext,
  selectedKey,
}: {
  items: WorkItem[];
  listContext?: WorkbenchListContext;
  selectedKey: string | null;
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
        <OpportunityTable
          items={items}
          listContext={listContext}
          selectedKey={selectedKey}
          keyboardIndex={keyboardIndex}
        />
      )}
    </WorkbenchListKeyboard>
  );
}

import assert from "node:assert/strict";
import { loadBinding } from "./load";
import {
  mergeWorkbenchDisplay,
  resolveFacets,
  resolveRelatedObject,
  WORKBENCH_FACET_SAMPLE_ROW,
} from "./workbench-display";

function testMergeDefaults() {
  const binding = loadBinding("xlink-fsm");
  const merged = mergeWorkbenchDisplay(binding, {});
  assert.ok(merged);
  assert.ok(merged!.enabledFacetIds.includes("quote_amount"));
}

function testResolveQuoteAmount() {
  const binding = loadBinding("xlink-fsm");
  const merged = mergeWorkbenchDisplay(binding, null)!;
  const related = resolveRelatedObject(merged, WORKBENCH_FACET_SAMPLE_ROW);
  assert.equal(related.id, "GD2026064004");
  assert.equal(related.type, "工单");
  assert.ok(related.facets.some((f) => f.label === "合同金额" && f.value.includes("¥")));
}

function testOverridesDisable() {
  const binding = loadBinding("xlink-fsm");
  const key = `${binding.id}@${binding.version}`;
  const merged = mergeWorkbenchDisplay(binding, {
    [key]: { workbench_display: { enabled_facets: [] } },
  })!;
  const facets = resolveFacets(merged, WORKBENCH_FACET_SAMPLE_ROW);
  assert.equal(facets.length, 0);
}

testMergeDefaults();
testResolveQuoteAmount();
testOverridesDisable();
console.log("workbench-display.test.ts OK");

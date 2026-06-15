import assert from "node:assert/strict";
import { formatTimelineSummary } from "./timeline";

function testRewritesLegacyMongoStatus() {
  assert.equal(
    formatTimelineSummary(
      "已离开跟进楔子（非待签约等触发状态） · Mongo status 204"
    ),
    "已离开跟进楔子（非待签约等触发状态） · 当前状态：上门跟进"
  );
  assert.equal(
    formatTimelineSummary("Mongo status 300"),
    "当前状态：现场服务"
  );
}

function testLeavesModernSummaryUntouched() {
  const modern = "已离开跟进楔子（非待签约等触发状态） · 当前状态：现场服务";
  assert.equal(formatTimelineSummary(modern), modern);
}

testRewritesLegacyMongoStatus();
testLeavesModernSummaryUntouched();
console.log("timeline-summary.test.ts ok");

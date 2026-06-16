import assert from "node:assert/strict";
import { extractBusinessFacts } from "./business-facts";
import type { TimelineEvent } from "./timeline";

function quoteEvent(summary: string, amount = "10000 元"): TimelineEvent {
  return {
    id: 1,
    workOrderId: "wo1",
    dedupeKey: "k1",
    lane: "business",
    kind: "quote",
    at: "",
    atMs: 1000,
    title: "报价",
    summary,
    refId: "44325",
    survey: null,
    appointment: null,
    quote: {
      fields: [
        { label: "报价金额", value: amount },
        { label: "支付状态", value: "已付首付款" },
        { label: "方案套餐", value: "X2-P-热施工" },
        { label: "维修部位", value: "屋面、无保护平屋面" },
      ],
      lines: [],
    },
    traceRound: null,
  };
}

function testExtractFromTimelineQuote() {
  const facts = extractBusinessFacts([
    quoteEvent("10000元 · 已付首付款 · X2-P-热施工"),
  ]);
  assert.equal(facts.source, "timeline");
  assert.equal(facts.quoteAmountYuan, 10000);
  assert.equal(facts.quotePayState, "已付首付款");
  assert.equal(facts.repairParts, "屋面、无保护平屋面");
  assert.match(facts.headline ?? "", /¥1万/);
}

function testIgnoresAgentLane() {
  const agentEnrich: TimelineEvent = {
    ...quoteEvent("120000元 · 未支付"),
    id: 2,
    lane: "agent",
    kind: "enrich",
    title: "系统查证",
    atMs: 2000,
    quote: null,
  };
  const facts = extractBusinessFacts([
    agentEnrich,
    quoteEvent("10000元 · 已付首付款 · X2-P-热施工"),
  ]);
  assert.equal(facts.quoteAmountYuan, 10000);
}

function testLiveVerdictFallback() {
  const facts = extractBusinessFacts([], "已有生效签约（10000元）");
  assert.equal(facts.source, "live_verdict");
  assert.match(facts.headline ?? "", /10000/);
}

testExtractFromTimelineQuote();
testIgnoresAgentLane();
testLiveVerdictFallback();
console.log("business-facts.test.ts ok");

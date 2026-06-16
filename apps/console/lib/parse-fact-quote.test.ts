import assert from "node:assert/strict";
import { parseFactQuoteAmountYuan } from "./parse-fact-quote";

assert.equal(
  parseFactQuoteAmountYuan("已有生效签约（，10000元）→ 不宜硬催"),
  10000
);
assert.equal(
  parseFactQuoteAmountYuan("已正式报价 40653元（屋面）→ 可推进签约"),
  40653
);
assert.equal(parseFactQuoteAmountYuan(""), null);

console.log("parse-fact-quote.test.ts ok");

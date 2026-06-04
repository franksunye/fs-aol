"""报价项目明细解析单测。"""

from __future__ import annotations

import json
import unittest
from unittest.mock import MagicMock

from aol.context.quote_products import parse_bj_quote_row, quote_line_to_payload


class _FakeCodes:
    def label(self, code_id):
        m = {"p1": "屋面", "5": "桶"}
        return m.get(str(code_id or ""), "")


class QuoteProductsTests(unittest.TestCase):
    def test_parses_package_materials_and_procedures(self) -> None:
        item = {
            "repairParts": ["p1"],
            "constructionLocation": "大面",
            "totalAmount": 12000,
            "projPackages": {
                "data": [
                    {
                        "name": "屋面防水套餐",
                        "skuCode": "FX-WM",
                        "number": 1,
                        "totalAmount": 12000,
                        "materialList": [
                            {
                                "number": 2,
                                "material": {
                                    "name": "测试材料A",
                                    "spec": "20",
                                    "price": 100,
                                    "totalAmount": 200,
                                },
                            }
                        ],
                        "procedureList": [
                            {
                                "procedure": {
                                    "name": "开槽工序",
                                    "desc": "说明文字",
                                    "number": 10,
                                    "guideUnitPrice": 35,
                                }
                            }
                        ],
                    }
                ]
            },
        }
        row = parse_bj_quote_row(item, _FakeCodes())
        self.assertEqual(len(row["packages"]), 1)
        items = row["packages"][0]["items"]
        self.assertEqual(len(items), 2)
        cats = {i["category"] for i in items}
        self.assertIn("材料", cats)
        self.assertIn("工序", cats)
        payload = quote_line_to_payload(row)
        self.assertEqual(len(payload["packages"][0]["items"]), 2)


if __name__ == "__main__":
    unittest.main()

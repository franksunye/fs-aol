"""bjProducts.orderList / projPackages 项目明细解析（材料、工序、措施）。"""

from __future__ import annotations

from typing import Any, Dict, List, TYPE_CHECKING

if TYPE_CHECKING:
    from .enrich import _CodeCache


def _money(val: Any) -> float | None:
    if val is None:
        return None
    try:
        return float(val)
    except (TypeError, ValueError):
        return None


def _money_str(val: Any) -> str:
    m = _money(val)
    return f"{m:.2f}".rstrip("0").rstrip(".") if m is not None else ""


def _qty_str(val: Any) -> str:
    if val is None or val == "":
        return ""
    if isinstance(val, float) and val == int(val):
        return str(int(val))
    return str(val).strip()


def _spec_text(row: Dict[str, Any], codes: "_CodeCache") -> str:
    spec = str(row.get("spec") or "").strip()
    spec_unit = codes.label(row.get("specUnit")) if row.get("specUnit") else ""
    parts = [p for p in (spec, spec_unit) if p]
    return " ".join(parts) if parts else ""


def _unit_label(row: Dict[str, Any], codes: "_CodeCache") -> str:
    for key in ("unit", "materialUnit", "guideUnit"):
        label = codes.label(row.get(key))
        if label and label != str(row.get(key) or ""):
            return label
    return str(row.get("unit") or row.get("materialUnit") or "").strip()


def _detail_item(
    *,
    category: str,
    name: str,
    spec: str = "",
    quantity: str = "",
    unit: str = "",
    unit_price: str = "",
    amount: str = "",
    note: str = "",
) -> Dict[str, str]:
    return {
        "category": category or "—",
        "name": name or "—",
        "spec": spec or "—",
        "quantity": quantity or "—",
        "unit": unit or "—",
        "unitPrice": unit_price or "—",
        "amount": amount or "—",
        "note": (note or "")[:500] or "—",
    }


def _material_items_from_pkg_entry(entry: Dict[str, Any], codes: "_CodeCache") -> List[Dict[str, str]]:
    mat = entry.get("material") if isinstance(entry.get("material"), dict) else entry
    if not isinstance(mat, dict):
        return []
    name = str(mat.get("name") or (mat.get("exts") or {}).get("commonName") or "").strip()
    if not name:
        return []
    qty = _qty_str(entry.get("number") if entry.get("number") is not None else mat.get("number"))
    coeff = entry.get("coefficient")
    note = f"系数 {coeff}" if coeff not in (None, "", 1, 1.0) else ""
    return [
        _detail_item(
            category="材料",
            name=name,
            spec=_spec_text(mat, codes),
            quantity=qty,
            unit=_unit_label(mat, codes),
            unit_price=_money_str(mat.get("price") or mat.get("serviceCostPrice")),
            amount=_money_str(entry.get("amount") or mat.get("totalAmount") or mat.get("amount")),
            note=note,
        )
    ]


def _procedure_items_from_pkg_entry(entry: Dict[str, Any], codes: "_CodeCache") -> List[Dict[str, str]]:
    proc = entry.get("procedure") if isinstance(entry.get("procedure"), dict) else entry
    if not isinstance(proc, dict):
        return []
    name = str(proc.get("name") or proc.get("content") or "").strip()
    if not name:
        return []
    desc = str(proc.get("desc") or "").strip()
    qty = _qty_str(proc.get("number") or entry.get("number"))
    return [
        _detail_item(
            category="工序",
            name=name,
            spec="",
            quantity=qty,
            unit=_unit_label(proc, codes),
            unit_price=_money_str(proc.get("guideUnitPrice")),
            amount=_money_str(proc.get("minimumGuideTotalPrice") or proc.get("amount")),
            note=desc,
        )
    ]


def _items_from_line_catalog_rows(
    rows: List[Any],
    *,
    category: str,
    codes: "_CodeCache",
) -> List[Dict[str, str]]:
    out: List[Dict[str, str]] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        name = str(row.get("name") or "").strip()
        if not name:
            continue
        out.append(
            _detail_item(
                category=category,
                name=name,
                spec=_spec_text(row, codes),
                quantity=_qty_str(row.get("number")),
                unit=_unit_label(row, codes),
                unit_price=_money_str(row.get("price") or row.get("guideUnitPrice")),
                amount=_money_str(row.get("amount") or row.get("totalAmount")),
                note=str(row.get("desc") or row.get("content") or "").strip(),
            )
        )
    return out


def _items_from_line_block(block: Any, *, category: str, codes: "_CodeCache") -> List[Dict[str, str]]:
    if not isinstance(block, dict):
        return []
    return _items_from_line_catalog_rows(block.get("data") or [], category=category, codes=codes)


def _parse_package(pkg: Dict[str, Any], codes: "_CodeCache") -> Dict[str, Any]:
    items: List[Dict[str, str]] = []
    for entry in pkg.get("materialList") or []:
        if isinstance(entry, dict):
            items.extend(_material_items_from_pkg_entry(entry, codes))
    for entry in pkg.get("procedureList") or []:
        if isinstance(entry, dict):
            items.extend(_procedure_items_from_pkg_entry(entry, codes))
    for entry in pkg.get("measureList") or []:
        if not isinstance(entry, dict):
            continue
        meas = entry.get("measure") if isinstance(entry.get("measure"), dict) else entry
        if isinstance(meas, dict) and meas.get("name"):
            items.extend(
                _items_from_line_catalog_rows([meas], category="措施", codes=codes)
            )
    return {
        "name": str(pkg.get("name") or "方案套餐"),
        "skuCode": str(pkg.get("skuCode") or "").strip(),
        "unit": _unit_label(pkg, codes) or str(pkg.get("unit") or "").strip(),
        "quantity": _qty_str(pkg.get("number")),
        "packageAmount": _money_str(pkg.get("totalAmount") or pkg.get("amount")),
        "items": items,
    }


def parse_bj_quote_row(item: Dict[str, Any], codes: "_CodeCache") -> Dict[str, Any]:
    """解析 orderList 单行 + 其下套餐与项目明细表。"""
    repair_ids = item.get("repairParts") or []
    if isinstance(repair_ids, str):
        repair_ids = [repair_ids]
    repair_parts = [codes.label(i) for i in repair_ids if codes.label(i)]

    packages: List[Dict[str, Any]] = []
    pp = item.get("projPackages")
    if isinstance(pp, dict):
        for pkg in pp.get("data") or []:
            if isinstance(pkg, dict):
                packages.append(_parse_package(pkg, codes))

    package_names = [p["name"] for p in packages if p.get("name")]

    line_items: List[Dict[str, str]] = []
    line_items.extend(_items_from_line_block(item.get("materials"), category="材料", codes=codes))
    line_items.extend(_items_from_line_block(item.get("procedures"), category="工序", codes=codes))
    line_items.extend(_items_from_line_block(item.get("measures"), category="措施", codes=codes))

    ag = item.get("agelimit")
    ag_max = item.get("agelimitMax")
    warranty = ""
    if ag is not None:
        warranty = f"{ag}年" if ag == ag_max or ag_max is None else f"{ag}-{ag_max}年"

    return {
        "repair_parts": repair_parts,
        "construction_location": str(item.get("constructionLocation") or ""),
        "construction_site": str(item.get("constructionSite") or "").strip(),
        "part_description": str(item.get("partDescription") or ""),
        "package_names": package_names,
        "warranty_label": warranty,
        "maintain_area": str(item.get("maintainAreaNum") or ""),
        "line_amount_yuan": _money(item.get("totalAmount")),
        "packages": packages,
        "line_items": line_items,
    }


def quote_line_to_payload(row: Dict[str, Any]) -> Dict[str, Any]:
    """Console timeline payload 单行。"""
    amt = row.get("line_amount_yuan")
    return {
        "repairParts": "、".join(row.get("repair_parts") or []) or "—",
        "constructionLocation": row.get("construction_location") or "—",
        "constructionSite": row.get("construction_site") or "—",
        "partDescription": row.get("part_description") or "—",
        "packageNames": "、".join(row.get("package_names") or []) or "—",
        "warrantyLabel": row.get("warranty_label") or "—",
        "maintainArea": row.get("maintain_area") or "—",
        "amountYuan": f"{amt:.0f}" if isinstance(amt, (int, float)) else "—",
        "packages": row.get("packages") or [],
        "lineItems": row.get("line_items") or [],
    }

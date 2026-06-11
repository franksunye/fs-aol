"""Generic record mapper: external document + binding → canonical domain object."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from ..domain import WorkOrder
from .binding import (
    get_object_binding,
    ingestion_collection,
    ingestion_system_name,
    lookup_value,
)


def get_path(doc: Dict[str, Any], path: str) -> Any:
    if not path:
        return None
    cur: Any = doc
    for part in path.split("."):
        if not isinstance(cur, dict):
            return None
        cur = cur.get(part)
    return cur


def _coalesce_paths(doc: Dict[str, Any], paths: List[str]) -> Any:
    for path in paths:
        val = get_path(doc, path) if "." in path else doc.get(path)
        if val is not None and val != "":
            return val
    return ""


def _apply_field(
    doc: Dict[str, Any],
    field: Dict[str, Any],
    *,
    binding: Dict[str, Any],
    code_tables: Dict[str, Dict[str, str]],
    wid: str,
) -> tuple[str, Any]:
    to_field = str(field["to"])
    op = str(field.get("op") or "direct")

    if op == "direct":
        return to_field, get_path(doc, str(field.get("from") or "")) or ""

    if op == "coalesce":
        paths = field.get("paths") or []
        val = _coalesce_paths(doc, [str(p) for p in paths])
        return to_field, str(val) if val is not None else ""

    if op == "lookup":
        from_path = str(field.get("from") or "")
        raw = get_path(doc, from_path) if "." in from_path else doc.get(from_path)
        table = str(field.get("table") or "")
        return to_field, lookup_value(table, raw, code_tables)

    if op == "const":
        return to_field, field.get("value")

    if op == "source_ref":
        system = ingestion_system_name(binding)
        collection = ingestion_collection(binding)
        return to_field, {"system": system, "collection": collection, "id": wid}

    raise ValueError(f"unsupported field op: {op}")


def map_record(
    doc: Dict[str, Any],
    binding: Dict[str, Any],
    object_id: str = "work-order",
) -> WorkOrder:
    obj = get_object_binding(binding, object_id)
    code_tables = binding.get("code_tables") or {}
    values: Dict[str, Any] = {}

    identity = obj.get("identity") or {}
    id_paths = identity.get("external_paths") or ["_id", "id"]
    wid = str(_coalesce_paths(doc, [str(p) for p in id_paths]) or "")

    for field in obj.get("fields") or []:
        key, val = _apply_field(doc, field, binding=binding, code_tables=code_tables, wid=wid)
        values[key] = val

    return WorkOrder(
        work_order_id=str(values.get("work_order_id") or wid),
        order_num=str(values.get("order_num") or ""),
        title=str(values.get("title") or ""),
        task_type=str(values.get("task_type") or ""),
        group=str(values.get("group") or "following"),
        city=str(values.get("city") or ""),
        customer_name=str(values.get("customer_name") or ""),
        phone=str(values.get("phone") or ""),
        assignee=str(values.get("assignee") or ""),
        summary=str(values.get("summary") or ""),
        completed_at=str(values.get("completed_at") or ""),
        event_type=str(values.get("event_type") or ""),
        housekeeper_id=str(values.get("housekeeper_id") or ""),
        source_ref=dict(values.get("source_ref") or {}),
    )


def work_order_to_dict(wo: WorkOrder) -> Dict[str, Any]:
    return {
        "work_order_id": wo.work_order_id,
        "order_num": wo.order_num,
        "title": wo.title,
        "task_type": wo.task_type,
        "group": wo.group,
        "city": wo.city,
        "customer_name": wo.customer_name,
        "phone": wo.phone,
        "assignee": wo.assignee,
        "summary": wo.summary,
        "completed_at": wo.completed_at,
        "event_type": wo.event_type,
        "housekeeper_id": wo.housekeeper_id,
        "housekeeper_name": wo.housekeeper_name,
        "stale_days": wo.stale_days,
        "source_ref": wo.source_ref,
    }

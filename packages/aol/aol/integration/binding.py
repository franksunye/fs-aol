"""Integration binding loader (SSOT: contracts/integration-bindings/)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional

_BUILTIN_DIR = Path(__file__).resolve().parent / "bindings"

_LOOKUP_FALLBACKS = {
    "status_to_task_type": lambda v: f"状态{v}",
    "status_to_group": lambda _v: "following",
    "city_code": lambda v: str(v) if v not in (None, "") else "未知",
    "status_to_event_type": lambda v: f"STATUS_{v}",
}


def _contracts_bindings_dir() -> Optional[Path]:
    here = Path(__file__).resolve()
    for parent in here.parents:
        candidate = parent / "contracts" / "integration-bindings"
        if candidate.is_dir() and (candidate / "schema.json").is_file():
            return candidate
    return None


def binding_file_path(binding_id: str, version: str = "v1") -> Path:
    name = f"{binding_id}.{version}.json"
    contracts = _contracts_bindings_dir()
    if contracts is not None:
        path = contracts / name
        if path.is_file():
            return path
    bundled = _BUILTIN_DIR / name
    if bundled.is_file():
        return bundled
    raise FileNotFoundError(f"integration binding not found: {name}")


def load_builtin_binding(binding_id: str = "xlink-fsm", version: str = "v1") -> Dict[str, Any]:
    path = binding_file_path(binding_id, version)
    with path.open(encoding="utf-8") as f:
        doc = json.load(f)
    validate_binding(doc)
    return doc


def validate_binding(doc: Dict[str, Any]) -> None:
    required = ("id", "version", "connector", "objects", "code_tables", "ingestion", "write_back")
    for key in required:
        if key not in doc:
            raise ValueError(f"binding missing required key: {key}")
    if not doc.get("objects"):
        raise ValueError("binding.objects must be non-empty")


def get_object_binding(doc: Dict[str, Any], object_id: str = "work-order") -> Dict[str, Any]:
    for obj in doc.get("objects") or []:
        if obj.get("id") == object_id:
            return obj
    raise KeyError(f"object binding not found: {object_id}")


def lookup_value(table: str, raw: Any, code_tables: Dict[str, Dict[str, str]]) -> str:
    key = str(raw) if raw is not None else ""
    entries = code_tables.get(table) or {}
    if key in entries:
        return entries[key]
    fallback = _LOOKUP_FALLBACKS.get(table)
    if fallback:
        return fallback(key)
    return key


def ingestion_collection(doc: Dict[str, Any]) -> str:
    ing = doc.get("ingestion") or {}
    return str(ing.get("collection") or "")


def ingestion_system_name(doc: Dict[str, Any]) -> str:
    ing = doc.get("ingestion") or {}
    return str(ing.get("system_name") or doc.get("id") or "")


def ingestion_state_active(doc: Dict[str, Any]) -> int:
    ing = doc.get("ingestion") or {}
    return int(ing.get("state_active", 1))


def ingestion_projection(doc: Dict[str, Any]) -> Dict[str, int]:
    ing = doc.get("ingestion") or {}
    proj = ing.get("projection") or {}
    return {str(k): int(v) for k, v in proj.items()}


def sample_documents(doc: Dict[str, Any]) -> List[Dict[str, Any]]:
    ing = doc.get("ingestion") or {}
    return list(ing.get("sample_documents") or [])

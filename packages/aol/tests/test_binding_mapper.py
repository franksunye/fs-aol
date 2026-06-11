"""Binding mapper parity: map_record vs work_order_from_sa / code_tables."""

from __future__ import annotations

from dataclasses import asdict

import pytest

from aol.domain import (
    MOCK_FOLLOW_UP_206_RECORDS,
    MOCK_SA_RECORDS,
    SA_COLLECTION,
    SYSTEM_NAME,
    _CITY_CODE_MAP,
    _STATUS_FOR_EVENT,
    _STATUS_TO_GROUP,
    _STATUS_TO_TASK_TYPE,
    work_order_from_sa,
)
from aol.integration.binding import load_builtin_binding
from aol.integration.mapper import map_record


@pytest.fixture
def binding():
    return load_builtin_binding("xlink-fsm")


def _wo_dict(doc):
    wo = work_order_from_sa(doc)
    d = asdict(wo)
    d.pop("housekeeper_name", None)
    d.pop("stale_days", None)
    return d


def _map_dict(doc, binding):
    wo = map_record(doc, binding)
    d = asdict(wo)
    d.pop("housekeeper_name", None)
    d.pop("stale_days", None)
    return d


@pytest.mark.parametrize("doc", MOCK_SA_RECORDS + MOCK_FOLLOW_UP_206_RECORDS)
def test_map_record_matches_work_order_from_sa(doc, binding):
    assert _map_dict(doc, binding) == _wo_dict(doc)


def test_binding_ingestion_matches_domain_constants(binding):
    ing = binding["ingestion"]
    assert ing["system_name"] == SYSTEM_NAME
    assert ing["collection"] == SA_COLLECTION
    assert ing["state_active"] == 1


def test_binding_code_tables_match_domain(binding):
    tables = binding["code_tables"]
    assert tables["status_to_task_type"] == _STATUS_TO_TASK_TYPE
    assert tables["status_to_group"] == _STATUS_TO_GROUP
    assert tables["city_code"] == _CITY_CODE_MAP
    assert tables["status_to_event_type"] == _STATUS_FOR_EVENT


def test_binding_projection_keys(binding):
    proj = binding["ingestion"]["projection"]
    assert set(proj.keys()) == set(
        [
            "_id",
            "orderNum",
            "city",
            "serviceType",
            "title",
            "describe",
            "name",
            "phone",
            "assignee",
            "status",
            "updateTime",
            "createTime",
            "exts",
        ]
    )

-- AOL tracking layer DDL (authoritative SSOT for Python engine + Console)
-- Substitute {{AOL_TABLE_PREFIX}} at runtime (default: aol_ via AOL_TABLE_PREFIX env)

CREATE TABLE IF NOT EXISTS {{AOL_TABLE_PREFIX}}follow_up_logs (
    dedupe_key      TEXT PRIMARY KEY,
    work_order_id   TEXT,
    event_type      TEXT,
    order_num       TEXT,
    city            TEXT,
    housekeeper_id  TEXT,
    housekeeper_name TEXT,
    suggestion      TEXT,
    status          TEXT,
    processed_at    TEXT,
    state_at        TEXT,
    inbox_bucket    TEXT,
    archive_reason  TEXT,
    reconciled_at   TEXT,
    mongo_status    TEXT,
    live_verdict    TEXT,
    analyzed_stale_days INTEGER
);

CREATE TABLE IF NOT EXISTS {{AOL_TABLE_PREFIX}}reasoning_traces (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    work_order_id     TEXT,
    event_type        TEXT,
    mode              TEXT,
    model             TEXT,
    prompt_system     TEXT,
    prompt_user       TEXT,
    raw_response      TEXT,
    parsed            TEXT,
    prompt_tokens     INTEGER,
    completion_tokens INTEGER,
    total_tokens      INTEGER,
    latency_ms        INTEGER,
    status            TEXT,
    error             TEXT,
    steps_json        TEXT,
    created_at        TEXT
);

CREATE TABLE IF NOT EXISTS {{AOL_TABLE_PREFIX}}suggestion_outcomes (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    dedupe_key          TEXT NOT NULL,
    work_order_id       TEXT,
    decision            TEXT NOT NULL,
    note                TEXT,
    operator            TEXT,
    modified_suggestion TEXT,
    created_at          TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_{{AOL_TABLE_PREFIX}}suggestion_outcomes_dedupe
    ON {{AOL_TABLE_PREFIX}}suggestion_outcomes(dedupe_key);

CREATE TABLE IF NOT EXISTS {{AOL_TABLE_PREFIX}}blocker_feedback (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    dedupe_key      TEXT NOT NULL,
    work_order_id   TEXT,
    blocker_type    TEXT NOT NULL,
    note            TEXT,
    source          TEXT NOT NULL DEFAULT 'housekeeper_selected',
    operator        TEXT,
    created_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_{{AOL_TABLE_PREFIX}}blocker_feedback_dedupe
    ON {{AOL_TABLE_PREFIX}}blocker_feedback(dedupe_key);

-- 工单时间轴（Python 跑单时物化；Console 只读）
CREATE TABLE IF NOT EXISTS {{AOL_TABLE_PREFIX}}timeline_events (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    work_order_id   TEXT NOT NULL,
    dedupe_key      TEXT,
    lane            TEXT NOT NULL,
    kind            TEXT NOT NULL,
    at              TEXT NOT NULL,
    at_ms           INTEGER NOT NULL,
    title           TEXT NOT NULL,
    summary         TEXT,
    ref_id          TEXT,
    payload_json    TEXT
);

CREATE INDEX IF NOT EXISTS idx_{{AOL_TABLE_PREFIX}}timeline_events_wo
    ON {{AOL_TABLE_PREFIX}}timeline_events(work_order_id);

-- Trusted Execution：人审批准后生成的可执行 Action（v0.4+）
CREATE TABLE IF NOT EXISTS {{AOL_TABLE_PREFIX}}actions (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    dedupe_key          TEXT NOT NULL,
    work_order_id       TEXT,
    trace_id            INTEGER,
    title               TEXT NOT NULL,
    priority            TEXT,
    assignee_id         TEXT,
    status              TEXT NOT NULL DEFAULT 'pending_dispatch',
    review_outcome_id   INTEGER,
    terminal_feedback   TEXT,
    operator            TEXT,
    created_at          TEXT NOT NULL,
    dispatched_at       TEXT,
    completed_at        TEXT
);

CREATE INDEX IF NOT EXISTS idx_{{AOL_TABLE_PREFIX}}actions_dedupe
    ON {{AOL_TABLE_PREFIX}}actions(dedupe_key);

CREATE INDEX IF NOT EXISTS idx_{{AOL_TABLE_PREFIX}}actions_status
    ON {{AOL_TABLE_PREFIX}}actions(status);

CREATE INDEX IF NOT EXISTS idx_{{AOL_TABLE_PREFIX}}reasoning_traces_created
    ON {{AOL_TABLE_PREFIX}}reasoning_traces(created_at);

-- 引擎运行时脱敏配置快照（每轮 cron 写入，Console 只读镜像 v0.4.1+）
CREATE TABLE IF NOT EXISTS {{AOL_TABLE_PREFIX}}engine_runtime_snapshots (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    run_at              TEXT NOT NULL,
    snapshot_json       TEXT NOT NULL,
    run_summary_json    TEXT
);

CREATE INDEX IF NOT EXISTS idx_{{AOL_TABLE_PREFIX}}engine_runtime_snapshots_run_at
    ON {{AOL_TABLE_PREFIX}}engine_runtime_snapshots(run_at);

-- 运行时配置平面（Console 控制面 SSOT，v0.4.2+）
CREATE TABLE IF NOT EXISTS {{AOL_TABLE_PREFIX}}runtime_config (
    scope               TEXT PRIMARY KEY,
    config_json         TEXT NOT NULL,
    secrets_ciphertext  TEXT NOT NULL,
    secrets_nonce       TEXT NOT NULL,
    version             INTEGER NOT NULL,
    updated_at          TEXT NOT NULL,
    updated_by          TEXT
);

CREATE TABLE IF NOT EXISTS {{AOL_TABLE_PREFIX}}runtime_config_revisions (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    scope               TEXT NOT NULL,
    version             INTEGER NOT NULL,
    config_json         TEXT NOT NULL,
    secrets_ciphertext  TEXT NOT NULL,
    secrets_nonce       TEXT NOT NULL,
    change_summary      TEXT,
    updated_at          TEXT NOT NULL,
    updated_by          TEXT
);

CREATE INDEX IF NOT EXISTS idx_{{AOL_TABLE_PREFIX}}runtime_config_revisions_scope
    ON {{AOL_TABLE_PREFIX}}runtime_config_revisions(scope, version);

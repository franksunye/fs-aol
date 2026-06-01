/**
 * FS-AOL Agent Cron Scheduler
 *
 * Cloudflare Cron 作为稳定心跳，通过 GitHub API 触发 workflow_dispatch。
 * 避免 GHA 原生 schedule 在免费 tier 上延迟/漏跑。
 *
 * 北京时间 08:00–22:00，每小时整点触发 agent_cron.yml
 * UTC cron: 0 0-14 * * *  (= 北京 08:00–22:00 每小时 :00)
 *
 * 手动：GET /trigger  （可选 ?secret= 若配置了 TRIGGER_SECRET）
 * 状态：GET /status
 */

const CRON_HEARTBEAT = "0 0-14 * * *";
const BEIJING_WINDOW = { startHour: 8, endHour: 22 };

export default {
  async scheduled(event, env, ctx) {
    const now = new Date();
    console.log(`⏰ Cron at ${now.toISOString()} cron=${event.cron}`);

    if (!isWithinBeijingRunWindow(now)) {
      const skip = {
        skipped: true,
        reason: "outside Beijing run window (08:00–22:00)",
        utc_time: now.toISOString(),
        shanghai: getShanghaiParts(now),
      };
      console.log("⏭️ Skipped:", skip);
      return;
    }

    const result = await triggerAgentCron(env);
    console.log("✅ Dispatch result:", result);
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/trigger") {
      const auth = authorizeTrigger(url, env);
      if (!auth.ok) {
        return json({ error: auth.error }, 401);
      }
      const result = await triggerAgentCron(env);
      return json(result);
    }

    if (url.pathname === "/status") {
      const now = new Date();
      return json({
        service: "FS-AOL Agent Cron Scheduler",
        status: "running",
        utc_time: now.toISOString(),
        shanghai: getShanghaiParts(now),
        in_run_window: isWithinBeijingRunWindow(now),
        github_repo: `${env.GITHUB_OWNER}/${env.GITHUB_REPO}`,
        workflow: getWorkflowName(env),
        schedules: {
          cron_utc: CRON_HEARTBEAT,
          beijing: "08:00–22:00 hourly",
          timezone: "Asia/Shanghai",
        },
        endpoints: {
          trigger: "/trigger",
          status: "/status",
        },
      });
    }

    return new Response(
      "FS-AOL Scheduler — use /status or /trigger",
      { status: 200 }
    );
  },
};

function getWorkflowName(env) {
  return env.GITHUB_WORKFLOW_AGENT_CRON || "agent_cron.yml";
}

function getShanghaiParts(date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour: Number(lookup.hour),
    minute: Number(lookup.minute),
  };
}

function isWithinBeijingRunWindow(date) {
  const { hour, minute } = getShanghaiParts(date);
  if (minute !== 0) return false;
  return hour >= BEIJING_WINDOW.startHour && hour <= BEIJING_WINDOW.endHour;
}

function authorizeTrigger(url, env) {
  const secret = env.TRIGGER_SECRET;
  if (!secret) return { ok: true };
  const provided = url.searchParams.get("secret");
  if (provided === secret) return { ok: true };
  return { ok: false, error: "Invalid or missing secret" };
}

async function triggerAgentCron(env) {
  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO } = env;
  const workflow = getWorkflowName(env);

  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return {
      success: false,
      error: "Missing GITHUB_TOKEN, GITHUB_OWNER, or GITHUB_REPO",
    };
  }

  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${workflow}/dispatches`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github.v3+json",
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "User-Agent": "FS-AOL-Scheduler",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ref: "main" }),
  });

  if (response.status === 204) {
    return {
      success: true,
      workflow,
      message: "agent_cron workflow_dispatch accepted",
    };
  }

  return {
    success: false,
    workflow,
    status: response.status,
    error: await response.text(),
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

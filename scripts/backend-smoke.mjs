const baseUrl = (process.env.RUNNELO_BACKEND_URL || "http://localhost:9104").replace(/\/$/, "");
const username = process.env.RUNNELO_USERNAME;
const password = process.env.RUNNELO_PASSWORD;
let token = process.env.RUNNELO_TOKEN;
let workspaceId = process.env.RUNNELO_WORKSPACE_ID;

async function request(path, init = {}) {
  const headers = { "Content-Type": "application/json", ...init.headers };
  if (token) headers["X-Token"] = token;
  if (workspaceId) headers["X-Workspace-Id"] = workspaceId;
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    signal: AbortSignal.timeout(10_000),
  });
  const body = await response.json();
  if (!response.ok || body?.code !== 0) {
    throw new Error(`${init.method || "GET"} ${path}: HTTP ${response.status}, code=${body?.code}, ${body?.desc || "unknown error"}`);
  }
  return body.data;
}

async function authenticate() {
  const config = await request("/login/config");
  if (token) return config;
  if (config.authType !== "LOCAL") {
    throw new Error(`Backend uses ${config.authType}; provide RUNNELO_TOKEN for the authenticated checks.`);
  }
  if (!username || !password) {
    throw new Error("Set RUNNELO_USERNAME and RUNNELO_PASSWORD, or provide RUNNELO_TOKEN.");
  }
  const login = await request("/login", {
    method: "POST",
    body: JSON.stringify({ username, password, workspaceId: workspaceId ? Number(workspaceId) : undefined }),
  });
  token = login.token;
  workspaceId ||= login.workspaceId == null ? undefined : String(login.workspaceId);
  return config;
}

async function main() {
  const config = await authenticate();
  const workspaces = await request("/workspace/list");
  workspaceId ||= workspaces[0]?.id == null ? undefined : String(workspaces[0].id);
  await request("/user/info");

  const checks = [
    "/dashboard/jobFlowRunStatusCount",
    "/jobFlow/page?page=1&size=1",
    "/jobInfo/page?page=1&size=1",
    "/jobFlowRun/page?page=1&size=1",
    "/resource/page?page=1&size=1",
    "/datasource/page?page=1&size=1",
    "/worker/page?page=1&size=1",
    "/alert/page?page=1&size=1",
    "/audit-logs?page=1&size=1",
  ];
  if (workspaceId) {
    for (const path of checks) await request(path);
  }
  console.log(`Runnelo backend smoke passed (${config.authType}).`);
}

main().catch((error) => {
  console.error(`Runnelo backend smoke failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});

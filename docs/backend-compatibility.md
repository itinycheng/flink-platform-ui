# Legacy backend compatibility

Runnelo UI currently targets the existing `flink-platform-backend` API. The
backend contract stays unchanged while the React UI is rolled out alongside
the legacy Vue UI.

## Boundary rules

- `src/api/*` exposes UI-oriented operations.
- `src/api/legacy/*` owns legacy DTOs and field/status conversion.
- Pages and stores must not depend directly on legacy DTOs.
- Requests use `X-Token` and `X-Workspace-Id`, matching the current backend.
- Production calls same-origin root endpoints. Development may use `/api`; the
  Vite proxy removes that development-only prefix.
- Client navigation uses hash routing so deep-link refreshes require no Spring
  MVC fallback changes.
- Existing GET mutation endpoints remain GET until both UIs can migrate
  together.
- Workspace switches remount the active route and clear workspace-scoped query
  and Studio state; they do not reload the browser page.

## Compatibility decisions

| UI capability       | Existing backend mapping                                    |
| ------------------- | ----------------------------------------------------------- |
| Definition explorer | Virtual root built from `/jobFlow/page` and `/jobInfo/page` |
| Definition folders  | Hidden; the backend has no group resource                   |
| Flow run list       | `/jobFlowRun/page`, with legacy query parameter adaptation  |
| Flow run detail     | `/jobFlowRun/get/{id}` plus `/jobRun/page?flowRunId=...`    |
| Job log             | `backInfo` from `/jobRun/get/{id}`                          |
| Kill flow           | GET `/jobFlowRun/kill/{id}`                                 |
| Dashboard totals    | `/dashboard/jobFlowRunStatusCount`                          |
| Dashboard trend     | Hidden/empty until a time-series endpoint exists            |
| SQL execution       | `/reactive/execJob`                                         |
| Schema browser      | Empty until metadata endpoints exist                        |
| Monitor page        | Redirected to existing alert-rule management                |
| System config       | Hidden until its form matches legacy polymorphic `Config`    |

## Deferred backend migration

After the React UI is stable, introduce a versioned API/OpenAPI contract and
replace the compatibility implementation without changing page components.
At that point migrate unsafe GET mutations, add the `/api` prefix, expose
time-series/schema/log-tail endpoints, and remove the virtual definition tree.

## Read-only smoke test

With the backend running, verify the contract without mutating application data:

```bash
RUNNELO_USERNAME=admin RUNNELO_PASSWORD=... npm run test:backend
```

Set `RUNNELO_BACKEND_URL` when the backend is not available at
`http://localhost:9104`. For SSO deployments, provide `RUNNELO_TOKEN` and
optionally `RUNNELO_WORKSPACE_ID` instead of a username and password.

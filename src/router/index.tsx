import { lazy, Suspense } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthGuard from "./AuthGuard";
import MainLayout from "../layouts/MainLayout";
import Loading from "@/components/Loading";

const Forbidden = lazy(() => import("../pages/Forbidden"));
const NotFound = lazy(() => import("../pages/NotFound"));
const Login = lazy(() => import("../pages/Login"));
const NoWorkspace = lazy(() => import("../pages/NoWorkspace"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const StudioPage = lazy(() => import("../pages/Studio"));
const AdminPage = lazy(() => import("../pages/Admin"));
const ResourceList = lazy(() => import("../pages/Admin/ResourceList"));
const UserList = lazy(() => import("../pages/Admin/UserList"));
const CustomParamList = lazy(() => import("../pages/Admin/CustomParamList"));
const DataSourceList = lazy(() => import("../pages/Admin/DataSourceList"));
const CatalogList = lazy(() => import("../pages/Admin/CatalogList"));
const WorkerList = lazy(() => import("../pages/Admin/WorkerList"));
const TagList = lazy(() => import("../pages/Admin/TagList"));
const SysConfigList = lazy(() => import("../pages/Admin/SysConfigList"));
const AlertRuleList = lazy(() => import("../pages/Admin/AlertRuleList"));
const WorkspaceList = lazy(() => import("../pages/Admin/WorkspaceList"));
const AuditLogList = lazy(() => import("../pages/Admin/AuditLogList"));
const QueryConsole = lazy(() => import("../pages/Query/QueryConsole"));
const RunsPage = lazy(() => import("../pages/Runs"));

/**
 * Application router configuration.
 *
 * Structure:
 * - /login: Public route (no auth required)
 * - /403: Public route (forbidden page)
 * - /: Protected routes wrapped in MainLayout and AuthGuard
 *   - /dashboard: Dashboard module
 *   - /workflow: Workflow module
 *   - /admin: Admin module
 *   - /monitor: Monitor module
 * - *: 404 catch-all
 *
 * The AuthGuard checks authentication and permissions.
 * The MainLayout provides the three-section layout (Header/Body/Footer).
 */
export default function AppRouter() {
  return (
    <HashRouter>
      <Suspense fallback={<Loading fullPage />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/no-workspace" element={<NoWorkspace />} />
          <Route path="/403" element={<Forbidden />} />

          {/* Protected routes with layout */}
          <Route
            element={
              <AuthGuard>
                <MainLayout />
              </AuthGuard>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/studio" element={<StudioPage />} />
            <Route path="/query" element={<QueryConsole />} />
            <Route path="/admin" element={<AdminPage />}>
              <Route index element={<Navigate to="/admin/resources" replace />} />
              <Route path="resources" element={<ResourceList />} />
              <Route path="users" element={<UserList />} />
              <Route path="params" element={<CustomParamList />} />
              <Route path="datasources" element={<DataSourceList />} />
              <Route path="catalogs" element={<CatalogList />} />
              <Route path="workers" element={<WorkerList />} />
              <Route path="tags" element={<TagList />} />
              <Route path="sys-configs" element={<SysConfigList />} />
              <Route path="alert-rules" element={<AlertRuleList />} />
              <Route path="workspaces" element={<WorkspaceList />} />
            </Route>
            <Route path="/audit-logs" element={<AuditLogList />} />
            <Route path="/runs" element={<RunsPage />} />
            <Route path="/monitor" element={<Navigate to="/admin/alert-rules" replace />} />
          </Route>

          {/* 404 catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}

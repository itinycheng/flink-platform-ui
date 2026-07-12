import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthGuard from "./AuthGuard";
import MainLayout from "../layouts/MainLayout";
import Forbidden from "../pages/Forbidden";
import NotFound from "../pages/NotFound";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import JobsPage from "../pages/Jobs";
import ManagePage from "../pages/Manage";
import ResourceList from "../pages/Manage/ResourceList";
import UserList from "../pages/Manage/UserList";
import CustomParamList from "../pages/Manage/CustomParamList";
import DataSourceList from "../pages/Manage/DataSourceList";
import CatalogList from "../pages/Manage/CatalogList";
import WorkerList from "../pages/Manage/WorkerList";
import TagList from "../pages/Manage/TagList";
import SysConfigList from "../pages/Manage/SysConfigList";
import AlertRuleList from "../pages/Manage/AlertRuleList";
import WorkspaceList from "../pages/Manage/WorkspaceList";
import ReactiveQuery from "../pages/Extension/ReactiveQuery";
import MonitorPage from "../pages/Monitor";
import RunsPage from "../pages/Runs";
import FlowRunList from "../pages/Runs/FlowRunList";
import JobRunList from "../pages/Runs/JobRunList";

/**
 * Application router configuration.
 *
 * Structure:
 * - /login: Public route (no auth required)
 * - /403: Public route (forbidden page)
 * - /: Protected routes wrapped in MainLayout and AuthGuard
 *   - /dashboard: Dashboard module
 *   - /workflow: Workflow module
 *   - /manage: Manage module
 *   - /monitor: Monitor module
 * - *: 404 catch-all
 *
 * The AuthGuard checks authentication and permissions.
 * The MainLayout provides the three-section layout (Header/Body/Footer).
 */
export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
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
          <Route path="/studio" element={<JobsPage />} />
          {/* Legacy paths → Studio (Jobs + Definitions were merged into the tree view) */}
          <Route path="/jobs" element={<Navigate to="/studio" replace />} />
          <Route path="/definitions" element={<Navigate to="/studio" replace />} />
          <Route path="/reactive" element={<ReactiveQuery />} />
          <Route path="/manage" element={<ManagePage />}>
            <Route index element={<Navigate to="/manage/resources" replace />} />
            <Route path="resources" element={<ResourceList />} />
            <Route path="users" element={<UserList />} />
            <Route path="configs" element={<Navigate to="/manage/sys-configs" replace />} />
            <Route path="params" element={<CustomParamList />} />
            <Route path="datasources" element={<DataSourceList />} />
            <Route path="catalogs" element={<CatalogList />} />
            <Route path="workers" element={<WorkerList />} />
            <Route path="tags" element={<TagList />} />
            <Route path="sys-configs" element={<SysConfigList />} />
            <Route path="alert-rules" element={<AlertRuleList />} />
            <Route path="workspaces" element={<WorkspaceList />} />
          </Route>
          <Route path="/runs" element={<RunsPage />}>
            <Route index element={<Navigate to="/runs/flows" replace />} />
            <Route path="flows" element={<FlowRunList />} />
            <Route path="jobs" element={<JobRunList />} />
          </Route>
          <Route path="/monitor" element={<MonitorPage />} />
        </Route>

        {/* 404 catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

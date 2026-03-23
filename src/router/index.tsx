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
import EnvConfigList from "../pages/Manage/EnvConfigList";
import CustomParamList from "../pages/Manage/CustomParamList";
import MonitorPage from "../pages/Monitor";

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
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/manage" element={<ManagePage />}>
            <Route index element={<Navigate to="/manage/resources" replace />} />
            <Route path="resources" element={<ResourceList />} />
            <Route path="users" element={<UserList />} />
            <Route path="configs" element={<EnvConfigList />} />
            <Route path="params" element={<CustomParamList />} />
          </Route>
          <Route path="/monitor" element={<MonitorPage />} />
        </Route>

        {/* 404 catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

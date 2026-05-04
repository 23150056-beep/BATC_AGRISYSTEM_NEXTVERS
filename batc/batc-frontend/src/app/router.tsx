import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { RoleRoute } from "@/routes/RoleRoute";
import { RoleRedirect } from "@/routes/RoleRedirect";
import { AdminLayout } from "@/layouts/AdminLayout";
import { StaffLayout } from "@/layouts/StaffLayout";
import { ClientLayout } from "@/layouts/ClientLayout";
import { LoginPage } from "@/pages/public/LoginPage";
import { FarmerRegisterPage } from "@/pages/public/FarmerRegisterPage";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { AdminUsersPage } from "@/pages/admin/AdminUsersPage";
import { AdminFarmersPage } from "@/pages/admin/AdminFarmersPage";
import { StaffFarmersPage } from "@/pages/staff/StaffFarmersPage";
import { StaffUsersPage } from "@/pages/staff/StaffUsersPage";
import { ClientHomePage } from "@/pages/client/ClientHomePage";
import { ClientProgramsPage } from "@/pages/client/ClientProgramsPage";
import { ClientApplicationsPage } from "@/pages/client/ClientApplicationsPage";
import { ClientClaimsPage } from "@/pages/client/ClientClaimsPage";
import { ClientProfilePage } from "@/pages/client/ClientProfilePage";
import { ClientFeedbackPage } from "@/pages/client/ClientFeedbackPage";
import AdminInventoryPage from "@/pages/admin/AdminInventoryPage";
import AdminProgramsPage from "@/pages/admin/AdminProgramsPage";
import AdminDistributionPage from "@/pages/admin/AdminDistributionPage";
import AdminAnnouncementsPage from "@/pages/admin/AdminAnnouncementsPage";
import AdminReportsPage from "@/pages/admin/AdminReportsPage";
import AdminFeedbackPage from "@/pages/admin/AdminFeedbackPage";
import StaffInventoryPage from "@/pages/staff/StaffInventoryPage";
import StaffProgramsPage from "@/pages/staff/StaffProgramsPage";
import StaffApplicationsPage from "@/pages/staff/StaffApplicationsPage";
import StaffDistributionPage from "@/pages/staff/StaffDistributionPage";
import StaffReportsPage from "@/pages/staff/StaffReportsPage";
import StaffDashboardPage from "@/pages/staff/StaffDashboardPage";
import StaffFeedbackPage from "@/pages/staff/StaffFeedbackPage";

// import.meta.env.BASE_URL is "/" in dev and "/BATC_AGRISYSTEM_NEXTVERS/" on
// GitHub Pages (set by vite.config.ts `base`). Passing it as `basename` keeps
// React Router in sync with whatever path the app is hosted under.
export const router = createBrowserRouter([
  { path: "/login",    element: <LoginPage /> },
  { path: "/register", element: <FarmerRegisterPage /> },
  { path: "/unauthorized", element: <div className="p-8 text-red-600">Unauthorized</div> },

  {
    element: <ProtectedRoute />,
    children: [
      { index: true, path: "/", element: <RoleRedirect /> },

      // Admin
      {
        element: <RoleRoute allowed={["ADMIN"]} />,
        children: [
          {
            path: "/admin",
            element: <AdminLayout />,
            children: [
              { index: true, element: <Navigate to="dashboard" replace /> },
              { path: "dashboard", element: <AdminDashboardPage /> },
              { path: "users", element: <AdminUsersPage /> },
              { path: "farmers", element: <AdminFarmersPage /> },
              { path: "inventory", element: <AdminInventoryPage /> },
              { path: "programs", element: <AdminProgramsPage /> },
              { path: "applications", element: <StaffApplicationsPage /> },
              { path: "distribution", element: <AdminDistributionPage /> },
              { path: "announcements", element: <AdminAnnouncementsPage /> },
              { path: "reports", element: <AdminReportsPage /> },
              { path: "feedback", element: <AdminFeedbackPage /> },
            ],
          },
        ],
      },

      // Staff
      {
        element: <RoleRoute allowed={["STAFF", "ADMIN"]} />,
        children: [
          {
            path: "/staff",
            element: <StaffLayout />,
            children: [
              { index: true, element: <Navigate to="dashboard" replace /> },
              { path: "dashboard", element: <StaffDashboardPage />, handle: { breadcrumb: "Dashboard" } },
              { path: "farmers", element: <StaffFarmersPage />, handle: { breadcrumb: "Farmers" } },
              { path: "users", element: <StaffUsersPage />, handle: { breadcrumb: "Users" } },
              { path: "inventory", element: <StaffInventoryPage />, handle: { breadcrumb: "Inventory" } },
              { path: "programs", element: <StaffProgramsPage />, handle: { breadcrumb: "Programs" } },
              { path: "applications", element: <StaffApplicationsPage />, handle: { breadcrumb: "Applications" } },
              { path: "distribution", element: <StaffDistributionPage />, handle: { breadcrumb: "Distribution" } },
              { path: "feedback", element: <StaffFeedbackPage />, handle: { breadcrumb: "Feedback" } },
              { path: "reports", element: <StaffReportsPage />, handle: { breadcrumb: "Reports" } },
            ],
          },
        ],
      },

      // Client / Farmer
      {
        element: <RoleRoute allowed={["CLIENT"]} />,
        children: [
          {
            path: "/app",
            element: <ClientLayout />,
            children: [
              { index: true, element: <Navigate to="home" replace /> },
              { path: "home", element: <ClientHomePage /> },
              { path: "programs", element: <ClientProgramsPage /> },
              { path: "applications", element: <ClientApplicationsPage /> },
              { path: "claims", element: <ClientClaimsPage /> },
              { path: "feedback", element: <ClientFeedbackPage /> },
              { path: "profile", element: <ClientProfilePage /> },
            ],
          },
        ],
      },
    ],
  },

  { path: "*", element: <Navigate to="/" replace /> },
], { basename: import.meta.env.BASE_URL });

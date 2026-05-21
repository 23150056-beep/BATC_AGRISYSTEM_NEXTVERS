import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { RoleRoute } from "@/routes/RoleRoute";
import { AdminLayout } from "@/layouts/AdminLayout";
import { StaffLayout } from "@/layouts/StaffLayout";
import { ClientLayout } from "@/layouts/ClientLayout";
import { LoginPage } from "@/pages/public/LoginPage";
import { FarmerRegisterPage } from "@/pages/public/FarmerRegisterPage";
import { LandingPage } from "@/pages/public/LandingPage";
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
  { path: "/",         element: <LandingPage /> },
  { path: "/landing",  element: <LandingPage /> },
  { path: "/login",    element: <LoginPage /> },
  { path: "/register", element: <FarmerRegisterPage /> },
  { path: "/unauthorized", element: <div className="p-8 text-red-600">Unauthorized</div> },

  {
    element: <ProtectedRoute />,
    children: [
      // Admin
      {
        element: <RoleRoute allowed={["ADMIN"]} />,
        children: [
          {
            path: "/admin",
            element: <AdminLayout />,
            children: [
              { index: true, element: <Navigate to="dashboard" replace /> },
              { path: "dashboard",     element: <AdminDashboardPage />,   handle: { breadcrumb: "Dashboard" } },
              { path: "users",         element: <AdminUsersPage />,       handle: { breadcrumb: "Users" } },
              { path: "farmers",       element: <AdminFarmersPage />,     handle: { breadcrumb: "Farmers" } },
              { path: "inventory",     element: <AdminInventoryPage />,   handle: { breadcrumb: "Inventory" } },
              { path: "programs",      element: <AdminProgramsPage />,    handle: { breadcrumb: "Programs" } },
              { path: "applications",  element: <StaffApplicationsPage />, handle: { breadcrumb: "Applications" } },
              { path: "distribution",  element: <AdminDistributionPage />, handle: { breadcrumb: "Distribution" } },
              { path: "announcements", element: <AdminAnnouncementsPage />, handle: { breadcrumb: "Announcements" } },
              { path: "reports",       element: <AdminReportsPage />,     handle: { breadcrumb: "Reports" } },
              { path: "feedback",      element: <AdminFeedbackPage />,    handle: { breadcrumb: "Feedback" } },
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
              { path: "home",         element: <ClientHomePage />,         handle: { breadcrumb: "Home" } },
              { path: "programs",     element: <ClientProgramsPage />,     handle: { breadcrumb: "Programs" } },
              { path: "applications", element: <ClientApplicationsPage />, handle: { breadcrumb: "My Applications" } },
              { path: "claims",       element: <ClientClaimsPage />,       handle: { breadcrumb: "My Claims" } },
              { path: "feedback",     element: <ClientFeedbackPage />,     handle: { breadcrumb: "Feedback" } },
              { path: "profile",      element: <ClientProfilePage />,      handle: { breadcrumb: "Profile" } },
            ],
          },
        ],
      },
    ],
  },

  { path: "*", element: <Navigate to="/" replace /> },
], { basename: import.meta.env.BASE_URL });

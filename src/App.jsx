import Header from "./components/Header";
import PlanCard from "./components/PlanCard";
import PromoCard from "./components/PromoCard";
import SavingsCard from "./components/SavingsCard";
import Sidebar from "./components/Sidebar";
import TransactionCard from "./components/TransactionCard";
import TransferCard from "./components/TransferCard";
import {
  connections,
  months,
  recentExpenses,
  timeOptions,
  transferCards,
} from "./data/dashboardData";
import React, { Suspense, lazy } from 'react';

// Lazy load các trang để tăng tốc độ tải ứng dụng (Code Splitting)
const Home = lazy(() => import("./pages/Home"));
const PatientManagement = lazy(() => import("./pages/PatientManagement"));
const DoctorManagement = lazy(() => import("./pages/DoctorManagement"));
const BannerManagement = lazy(() => import("./pages/BannerManagement"));
const HospitalManagement = lazy(() => import("./pages/HospitalManagement"));
const CategoryManagement = lazy(() => import("./pages/CategoryManagement"));
const PaymentManagement = lazy(() => import("./pages/PaymentManagement"));
const NewsManagement = lazy(() => import("./pages/NewsManagement"));
const SocialManagement = lazy(() => import("./pages/SocialManagement"));
const ReviewManagement = lazy(() => import("./pages/ReviewManagement"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const DoctorRequestsManagement = lazy(() => import("./pages/DoctorRequestsManagement"));
const HospitalRegistrationRequests = lazy(() => import("./pages/HospitalRegistrationRequests"));
const Profile = lazy(() => import("./pages/Profile"));
const Login = lazy(() => import("./pages/Login"));
import { NotificationProvider } from "./contexts/NotificationContext";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  Outlet,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-[#f5f7ff] text-[#262a39]">
      <Sidebar />
      <main className="ml-[280px] max-w-[1800px] flex-1 p-10 max-xl:p-8 max-lg:ml-20 max-md:p-5">
        <Header />
        <Suspense fallback={
          <div className="flex h-[50vh] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
              <p className="text-sm font-medium text-slate-500">Đang tải trang...</p>
            </div>
          </div>
        }>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};

const ProtectedAdminRoute = ({ children }) => {
  const { isAuthenticated, user, isAuthReady } = useAuth();

  if (!isAuthReady) {
    return null; // Chờ init AuthContext
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const normalizedRole = (
    user?.role ||
    user?.userRole ||
    user?.user_role ||
    user?.roles?.[0] ||
    "patient"
  ).toLowerCase();

  // Yêu cầu role admin hoặc admin_hospital
  if (!["admin", "admin_hospital"].includes(normalizedRole)) {
    // Nếu không phải admin, ép quay về Login
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRouter = () => {
  const { isAuthenticated, user, isAuthReady } = useAuth();

  if (!isAuthReady) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  const isUserAdmin =
    isAuthenticated &&
    ["admin", "admin_hospital"].includes(
      (
        user?.role ||
        user?.userRole ||
        user?.user_role ||
        user?.roles?.[0] ||
        "patient"
      ).toLowerCase(),
    );

  return (
    <Routes>
      {/* Route Login */}
      <Route
        path="/"
        element={
          <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div></div>}>
            {isUserAdmin ? <Navigate to="/dashboard" replace /> : <Login />}
          </Suspense>
        }
      />

      {/* Các route yêu cầu quyền Admin, được bao bọc bởi AdminLayout */}
      <Route
        element={
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        }
      >
        <Route path="/dashboard" element={<Home />} />
        <Route path="/patient" element={<PatientManagement />} />
        <Route path="/doctor" element={<DoctorManagement />} />
        <Route path="/banner" element={<BannerManagement />} />
        <Route path="/hospital" element={<HospitalManagement />} />
        <Route path="/category" element={<CategoryManagement />} />
        <Route path="/payment" element={<PaymentManagement />} />
        <Route path="/news" element={<NewsManagement />} />
        <Route path="/social" element={<SocialManagement />} />
        <Route path="/review" element={<ReviewManagement />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/doctor-requests" element={<DoctorRequestsManagement />} />
        <Route path="/hospital-registrations" element={<HospitalRegistrationRequests />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Tránh tự động gọi lại API khi chuyển tab trình duyệt
      retry: 1, // Chỉ thử lại 1 lần nếu lỗi
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <NotificationProvider>
          <AuthProvider>
            <BrowserRouter>
              <AppRouter />
            </BrowserRouter>
          </AuthProvider>
        </NotificationProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

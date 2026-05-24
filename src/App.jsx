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
import Home from "./pages/Home";
import PatientManagement from "./pages/PatientManagement";
import DoctorManagement from "./pages/DoctorManagement";
import BannerManagement from "./pages/BannerManagement";
import HospitalManagement from "./pages/HospitalManagement";
import CategoryManagement from "./pages/CategoryManagement";
import PaymentManagement from "./pages/PaymentManagement";
import NewsManagement from "./pages/NewsManagement";
import SocialManagement from "./pages/SocialManagement";
import ReviewManagement from "./pages/ReviewManagement";
import Login from "./pages/Login";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  Outlet,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-[#f5f7ff] text-[#262a39]">
      <Sidebar />
      <main className="ml-[280px] max-w-[1800px] flex-1 p-10 max-xl:p-8 max-lg:ml-20 max-md:p-5">
        <Header />
        <Outlet />
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
        element={isUserAdmin ? <Navigate to="/dashboard" replace /> : <Login />}
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
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </AuthProvider>
  );
}

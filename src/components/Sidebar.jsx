import Logo from "./Logo";
import { adminNavItems, hospitalAdminNavItems } from "../data/dashboardData";
import Navbar from "./Navbar";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Sidebar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); //del token và user info
    navigate("/"); // to login
  };

  const normalizedRole = (
    user?.role ||
    user?.userRole ||
    user?.user_role ||
    user?.roles?.[0] ||
    "patient"
  ).toLowerCase();

  const navItems = normalizedRole === "admin_hospital" ? hospitalAdminNavItems : adminNavItems;

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-50 flex w-[280px] flex-col overflow-hidden border-r border-[#e6e9f4] bg-white py-[35px] shadow-[5px_0_20px_rgba(0,0,0,0.03)] max-lg:w-20 max-lg:py-6">
      {/* Logo */}
      <div className="shrink-0 px-[30px] pb-[35px] max-lg:flex max-lg:justify-center max-lg:px-4 max-lg:pb-6">
        <Link to="/">
          <Logo />
        </Link>
      </div>

      {/* Nav scroll*/}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Navbar navItems={navItems} />
      </div>

      {/* Logout */}
      <div className="mt-auto px-6 max-lg:px-2 pt-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-50 text-red-600 px-4 py-3 text-[15px] font-semibold transition hover:bg-red-100 max-lg:px-0 max-lg:py-3 max-lg:text-xs"
        >
          <span className="max-lg:hidden">Logout</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 lg:hidden"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </aside>
  );
}

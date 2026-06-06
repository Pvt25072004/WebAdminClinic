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
    <aside className="fixed bottom-0 left-0 top-0 z-50 flex w-[280px] flex-col overflow-hidden bg-[#0B1120] border-r border-slate-800/50 shadow-[10px_0_30px_rgba(0,0,0,0.2)] max-lg:w-20 max-lg:py-6 transition-all duration-300">
      {/* Logo */}
      <div className="shrink-0 px-[30px] pt-[30px] pb-[35px] max-lg:flex max-lg:justify-center max-lg:px-4 max-lg:pb-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />
        <Link to="/" className="relative z-10 flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform duration-300">
            <span className="text-white font-bold text-xl">+</span>
          </div>
          <div className="max-lg:hidden">
            <h1 className="text-xl font-extrabold text-white tracking-tight">Admin<span className="text-emerald-400">Panel</span></h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">Medical System</p>
          </div>
        </Link>
      </div>

      {/* Nav scroll*/}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Navbar navItems={navItems} />
      </div>

      {/* Logout */}
      <div className="mt-auto px-6 max-lg:px-2 pt-6 pb-8 border-t border-slate-800/50 bg-gradient-to-t from-[#0B1120] to-transparent">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-3.5 text-[15px] font-medium transition-all duration-300 hover:bg-red-500 hover:text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] max-lg:px-0 max-lg:py-3 max-lg:text-xs group"
        >
          <span className="max-lg:hidden">Đăng xuất</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 max-lg:block hidden transition-transform group-hover:rotate-12"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
              clipRule="evenodd"
            />
          </svg>
          <svg className="w-5 h-5 max-lg:hidden transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </aside>
  );
}

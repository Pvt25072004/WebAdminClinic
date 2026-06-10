import { FaBell, FaSearch } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const normalizedRole = (
    user?.role ||
    user?.userRole ||
    user?.user_role ||
    user?.roles?.[0] ||
    "patient"
  ).toLowerCase();

  const workspaceTitle =
    normalizedRole === "admin_hospital"
      ? "Admin Hospital Workspace"
      : "Admin Workspace";

  return (
    <header className="sticky top-0 z-50 -mx-6 mb-8 px-8 py-5 flex items-center justify-between max-md:flex-col max-md:items-start bg-white/60 backdrop-blur-xl border-b border-white/50 shadow-[0_4px_30px_rgba(0,0,0,0.03)] transition-all supports-[backdrop-filter]:bg-white/40">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[13px] font-medium text-slate-500 uppercase tracking-wider">
            Trung tâm điều hành hệ thống
          </p>
        </div>
        <h1 className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-3xl font-extrabold text-transparent max-md:text-2xl tracking-tight">
          {workspaceTitle},{" "}
          <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            {user?.full_name}
          </span>
        </h1>
      </div>

      <div className="flex items-center gap-5 max-md:mt-6 max-md:w-full max-md:justify-between max-sm:flex-wrap max-sm:gap-4">
        <label className="group flex w-[320px] items-center rounded-2xl bg-white/50 border border-slate-200/60 px-5 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-300 hover:bg-white focus-within:-translate-y-0.5 focus-within:bg-white focus-within:shadow-[0_8px_30px_rgba(16,185,129,0.12)] focus-within:border-emerald-300 max-md:w-1/2 max-sm:w-full relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 translate-x-[-100%] group-focus-within:translate-x-[100%] transition-transform duration-1000" />
          <FaSearch className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
          <input
            type="text"
            placeholder={normalizedRole === "admin_hospital" ? "Tìm kiếm mã lịch hẹn, bệnh nhân..." : "Tìm kiếm nhanh bệnh viện..."}
            className="ml-3 w-full border-none bg-transparent text-[15px] text-slate-700 outline-none placeholder:text-slate-400 font-medium relative z-10"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target.value.trim()) {
                if (normalizedRole === "admin") {
                  navigate("/hospital", {
                    state: { search: e.target.value.trim() },
                  });
                } else {
                  navigate("/appointment", {
                    state: { search: e.target.value.trim() },
                  });
                }
              }
            }}
          />
          <div className="hidden group-focus-within:flex items-center justify-center px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-500 font-bold ml-2 relative z-10">
            ↵
          </div>
        </label>

        <div className="flex items-center gap-4 border-l border-slate-200 pl-5">
          <button 
            className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-500 border border-slate-200/50 shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:text-emerald-500 hover:border-emerald-200 hover:shadow-[0_8px_20px_rgba(16,185,129,0.15)] group"
            onClick={() => navigate(normalizedRole === "admin" ? "/hospital-registrations" : "/doctor-requests")}
          >
            <FaBell className="transition-transform group-hover:rotate-12 group-hover:scale-110" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 border-2 border-white bg-red-500"></span>
            </span>
          </button>

          <button
            className="relative flex items-center group cursor-pointer"
            onClick={() => navigate("/profile")}
          >
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="h-[48px] w-[48px] rounded-full p-[2px] bg-gradient-to-br from-emerald-400 to-teal-600 relative z-10 transition-transform duration-300 group-hover:scale-105">
              <img
                src={
                  user?.avatar_url ||
                  user?.avatar ||
                  "https://i.pravatar.cc/100?img=8"
                }
                alt={user?.full_name || "Admin"}
                className="h-full w-full rounded-full border-2 border-white object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://i.pravatar.cc/100?img=8";
                }}
              />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}

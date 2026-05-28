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
    <header className="sticky top-0 z-50 -mx-6 mb-8 px-6 py-4 flex items-center justify-between max-md:flex-col max-md:items-start bg-white/80 backdrop-blur-md border-b border-slate-100/50 shadow-[0_2px_20px_rgba(0,0,0,0.02)] transition-all">
      <div>
        <p className="mb-2.5 text-base text-[#6c7380]">
          Trung tâm điều hành hệ thống
        </p>
        <h1 className="bg-gradient-to-r from-[#262a39] to-emerald-500 bg-clip-text text-3xl font-bold text-transparent max-md:text-2xl">
          {workspaceTitle}, xin chào {user?.full_name}
        </h1>
      </div>

      <div className="flex items-center gap-6 max-md:mt-6 max-md:w-full max-md:justify-between max-sm:flex-wrap max-sm:gap-4">
        <button className="relative flex h-[45px] w-[45px] items-center justify-center rounded-full bg-white text-[#6c7380] shadow-[0_3px_10px_rgba(0,0,0,0.05)] transition duration-200 hover:-translate-y-1 hover:text-emerald-500 hover:shadow-[0_5px_15px_rgba(0,0,0,0.1)]">
          <FaBell />
          <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#f36c6c]" />
        </button>

        <button 
          className="relative flex items-center"
          onClick={() => navigate("/profile")}
        >
          <span className="absolute h-[52px] w-[52px] rounded-full border-2 border-[#e6e9f4] shadow-[0_3px_15px_rgba(0,0,0,0.08)]" />
          <img
            src={user?.avatar_url || user?.avatar || "https://i.pravatar.cc/100?img=8"}
            alt={user?.full_name || "Admin"}
            className="h-[50px] w-[50px] rounded-full border-[3px] border-white object-cover transition duration-300 hover:scale-105 cursor-pointer"
          />
        </button>

        <label className="group flex w-[300px] items-center rounded-full bg-slate-50/50 border border-slate-200/60 px-6 py-3 shadow-sm transition-all duration-300 focus-within:-translate-y-0.5 focus-within:bg-white focus-within:shadow-[0_8px_20px_rgba(16,185,129,0.12)] focus-within:border-emerald-200 max-md:w-1/2 max-sm:mt-4 max-sm:w-full">
          <FaSearch className="text-[#828795]" />
          <input
            type="text"
            placeholder="Find transactions..."
            className="ml-4 w-full border-none bg-transparent text-[15px] text-[#262a39] outline-none placeholder:text-[#828795]"
          />
        </label>
      </div>
    </header>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import signInGif from "../assets/wired-flat-1725-exit-sign-loop-cycle.gif";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  const { login, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await login({ email, password });

      const normalizedRole = (
        response.user?.role ||
        response.user?.userRole ||
        response.user?.user_role ||
        response.user?.roles?.[0] ||
        "patient"
      ).toLowerCase();

      if (["admin", "admin_hospital"].includes(normalizedRole)) {
        navigate("/dashboard");
      } else {
        logout();
        setError("Chỉ tài khoản admin mới có quyền truy cập hệ thống này.");
      }
    } catch (err) {
      setError(
        err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.",
      );
    }
  };

  return (
    <div className="min-h-screen font-serif">
      <div className="mx-auto mt-[30px] flex h-[550px] w-[1000px] overflow-hidden rounded-[10px] bg-[#d6d6d6] shadow-[5px_5px_7px_gray,-5px_-5px_7px_gray]">
        {/* Login Form */}
        <div className="w-[500px]">
          <form
            className="mx-auto my-[100px] w-[230px]"
            onSubmit={handleSubmit}
          >
            <h1 className="text-center text-3xl text-emerald-900 font-black uppercase">
              Login In
            </h1>

            <hr className="my-4 border-t-2 border-emerald-600" />

            {error && (
              <div className="mb-4 text-center text-sm font-semibold text-red-600">
                {error}
              </div>
            )}

            <label className="block p-2 text-base font-semibold">Email</label>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="my-2 w-full rounded-[5px] border border-slate-500 p-2 outline-none"
            />

            <label className="block p-2 text-base font-semibold">
              Password
            </label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="my-2 w-full rounded-[5px] border border-slate-500 p-2 outline-none"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="group my-2 w-full cursor-pointer rounded-[20px] bg-emerald-600 p-2 text-[17px] text-white outline-none transition duration-500 disabled:opacity-50"
            >
              <span className="relative inline-block transition-all duration-500 group-hover:pr-[30px]">
                {isLoading ? "Đang xử lý..." : "Sign in"}
                <span className="absolute right-[-20px] top-0 opacity-0 transition-all duration-500 group-hover:right-0 group-hover:opacity-100">
                  »
                </span>
              </span>
            </button>
          </form>
        </div>

        {/* Image */}
        <div className="w-3/4 bg-emerald-400">
          <img
            src={signInGif}
            alt="Meeting"
            className="ml-[100px] mt-[70px] w-[400px] cursor-pointer transition hover:p-[3px]"
          />
        </div>
      </div>
    </div>
  );
}

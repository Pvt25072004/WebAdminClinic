import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import fingerprintGif from "../assets/wired-flat-500-fingerprint-security-morph-correct.gif";

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

      if (normalizedRole === "admin") {
        navigate("/home");
      } else {
        // Nếu đăng nhập thành công nhưng không phải Admin
        logout();
        setError("Chỉ tài khoản admin mới có quyền truy cập hệ thống này.");
      }
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
    }
  };

  return (
    <div className="min-h-screen bg-[#d6d6d6] font-serif">
      <div className="mx-auto mt-[30px] flex h-[550px] w-[1000px] overflow-hidden rounded-[10px] bg-[#d6d6d6] shadow-[5px_5px_7px_gray,-5px_-5px_7px_gray]">
        {/* Login Form */}
        <div className="w-[500px]">
          <form className="mx-auto my-[100px] w-[230px]" onSubmit={handleSubmit}>
            <h1 className="text-center text-3xl font-black uppercase">
              Login In
            </h1>

            <hr className="my-4 border-t-2 border-purple-700" />

            <p className="text-center mb-4">Explore the World!</p>

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
              className="my-2 w-full rounded-[5px] border border-gray-500 p-2 outline-none"
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
              className="my-2 w-full rounded-[5px] border border-gray-500 p-2 outline-none"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="group my-2 w-full cursor-pointer rounded-[20px] bg-purple-700 p-2 text-[17px] text-white outline-none transition duration-500 disabled:opacity-50"
            >
              <span className="relative inline-block transition-all duration-500 group-hover:pr-[30px]">
                {isLoading ? "Đang xử lý..." : "Submit"}
                <span className="absolute right-[-20px] top-0 opacity-0 transition-all duration-500 group-hover:right-0 group-hover:opacity-100">
                  »
                </span>
              </span>
            </button>

            <p className="text-center mt-2">
              <a href="#" className="text-black no-underline">
                Forgot Password?
              </a>
            </p>
          </form>
        </div>

        {/* Image */}
        <div className="w-3/4 bg-violet-400">
          <img
            src={fingerprintGif}
            alt="Meeting"
            className="ml-[100px] mt-[70px] w-[400px] cursor-pointer transition hover:p-[3px]"
          />
        </div>
      </div>
    </div>
  );
}

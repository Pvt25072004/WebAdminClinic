import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Button from "../components/Button";
import { useNotification } from "../contexts/NotificationContext";
import { uploadUserImage, changePassword } from "../services/api";
import { updateHospital, getHospitalById } from "../services/admin.hospitals.api";
import { getCategories } from "../services/admin.categories.api";
import { Building2, UserCircle } from "lucide-react";

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.full_name || user?.fullName || "",
    phone: user?.phone || "",
    avatar_url: user?.avatar_url || user?.avatar || "",
    address: user?.address || "",
    gender: user?.gender || "",
  });
  const fileInputRef = useRef(null);

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("personal"); // personal | hospital
  const isAdminHospital = user?.role === "admin_hospital";

  const [hospitalData, setHospitalData] = useState({
    name: user?.hospital?.name || "",
    address: user?.hospital?.address || "",
    phone: user?.hospital?.phone || "",
    email: user?.hospital?.email || "",
    description: user?.hospital?.description || "",
    logo_url: user?.hospital?.logo_url || "",
    facility_fee: user?.hospital?.facility_fee || 0,
    main_specialty: user?.hospital?.main_specialty || "",
    categoryIds: user?.hospital?.categories?.map(c => c.id) || [],
  });
  const [hospitalLoading, setHospitalLoading] = useState(false);
  const hospitalLogoRef = useRef(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (isAdminHospital) {
      getCategories()
        .then((res) => {
          setCategories(Array.isArray(res) ? res : res.data || []);
        })
        .catch((e) => console.log(e));

      const hospitalId = user?.hospital_id || user?.hospital?.id;
      if (hospitalId) {
        setHospitalLoading(true);
        getHospitalById(hospitalId)
          .then((res) => {
            const data = res.data || res;
            if (data) {
              setHospitalData({
                name: data.name || "",
                address: data.address || "",
                phone: data.phone || "",
                email: data.email || user?.email || "",
                description: data.description || "",
                logo_url: data.logo_url || "",
                facility_fee: data.facility_fee || 0,
                main_specialty: data.main_specialty || "",
                categoryIds: data.categories?.map((c) => c.id) || [],
              });
            }
          })
          .catch((e) => console.log(e))
          .finally(() => setHospitalLoading(false));
      }
    }
  }, [isAdminHospital, user?.hospital_id, user?.hospital?.id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData };
      if (payload.gender === "") payload.gender = null;
      if (payload.phone === "") payload.phone = null;
      if (payload.address === "") payload.address = null;
      await updateProfile(payload);
      showSuccess("Cập nhật thông tin thành công!");
    } catch (error) {
      showError("Cập nhật thất bại: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      showSuccess("Đang tải ảnh lên...");
      const result = await uploadUserImage(file);
      if (result && result.image_url) {
        setFormData({ ...formData, avatar_url: result.image_url });
        showSuccess("Tải ảnh thành công, vui lòng bấm Lưu thay đổi!");
      }
    } catch (error) {
      showError("Lỗi tải ảnh: " + error.message);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError("Mật khẩu mới và xác nhận mật khẩu không khớp!");
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword({
        currentPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      showSuccess("Đổi mật khẩu thành công!");
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      showError(error.message || "Đổi mật khẩu thất bại");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleHospitalChange = (e) => {
    setHospitalData({ ...hospitalData, [e.target.name]: e.target.value });
  };

  const handleHospitalSubmit = async (e) => {
    e.preventDefault();
    if (!user?.hospital_id && !user?.hospital?.id) {
      showError("Không tìm thấy thông tin bệnh viện");
      return;
    }
    setHospitalLoading(true);
    try {
      const hospitalId = user?.hospital_id || user?.hospital?.id;
      const payload = { ...hospitalData };
      await updateHospital(hospitalId, payload);
      // It's ideal to update the auth context user's hospital too, but a reload or just success msg is fine
      showSuccess("Cập nhật thông tin bệnh viện thành công!");
    } catch (error) {
      showError("Cập nhật thất bại: " + error.message);
    } finally {
      setHospitalLoading(false);
    }
  };

  const handleHospitalLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      showSuccess("Đang tải logo lên...");
      const result = await uploadUserImage(file);
      if (result && result.image_url) {
        setHospitalData({ ...hospitalData, logo_url: result.image_url });
        showSuccess("Tải logo thành công!");
      }
    } catch (error) {
      showError("Lỗi tải ảnh: " + error.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {isAdminHospital && (
        <div className="flex gap-4 mb-6 border-b border-slate-200">
          <button
            className={`pb-3 px-2 flex items-center gap-2 font-medium text-sm transition-colors border-b-2 ${
              activeTab === "personal"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => setActiveTab("personal")}
          >
            <UserCircle size={18} />
            Hồ sơ cá nhân
          </button>
          <button
            className={`pb-3 px-2 flex items-center gap-2 font-medium text-sm transition-colors border-b-2 ${
              activeTab === "hospital"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => setActiveTab("hospital")}
          >
            <Building2 size={18} />
            Thông tin cơ sở y tế
          </button>
        </div>
      )}

      {activeTab === "personal" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Hồ sơ cá nhân</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-6 mb-8 max-sm:flex-col max-sm:items-start">
            <div className="shrink-0 relative group">
              <img
                src={formData.avatar_url || "https://i.pravatar.cc/150?img=8"}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 shadow-sm"
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Đổi ảnh
              </button>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-slate-700 mb-2">Đường dẫn ảnh đại diện (Tự động cập nhật khi upload)</label>
              <input
                type="text"
                name="avatar_url"
                value={formData.avatar_url}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*" 
              />
              <div className="mt-2 flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Tải ảnh lên (Cloudinary)
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Họ và tên</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Số điện thoại</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Giới tính</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white"
                >
                  <option value="">Chưa xác định</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Địa chỉ</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Email (Không thể thay đổi)</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-b border-slate-100 pb-8">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>

        <div className="mt-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Đổi mật khẩu</h2>
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={e => setPasswordData({...passwordData, oldPassword: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mật khẩu mới</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" variant="secondary" disabled={passwordLoading}>
                {passwordLoading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
              </Button>
            </div>
          </form>
        </div>
        </div>
      )}

      {activeTab === "hospital" && isAdminHospital && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Thông tin Cơ sở y tế</h2>
          <form onSubmit={handleHospitalSubmit} className="space-y-6">
            <div className="flex items-center gap-6 mb-8 max-sm:flex-col max-sm:items-start">
              <div className="shrink-0 relative group">
                <img
                  src={hospitalData.logo_url || "https://placehold.co/150x150/e2e8f0/64748b?text=Logo"}
                  alt="Logo"
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-slate-50 shadow-sm"
                />
                <button 
                  type="button"
                  onClick={() => hospitalLogoRef.current?.click()}
                  className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Đổi Logo
                </button>
              </div>
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-slate-700 mb-2">Đường dẫn Logo</label>
                <input
                  type="text"
                  name="logo_url"
                  value={hospitalData.logo_url}
                  onChange={handleHospitalChange}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
                <input 
                  type="file" 
                  ref={hospitalLogoRef} 
                  onChange={handleHospitalLogoChange} 
                  className="hidden" 
                  accept="image/*" 
                />
                <div className="mt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => hospitalLogoRef.current?.click()}>
                    Tải logo lên (Cloudinary)
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Tên cơ sở y tế</label>
                <input
                  type="text"
                  name="name"
                  value={hospitalData.name}
                  onChange={handleHospitalChange}
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Địa chỉ chi tiết</label>
                <input
                  type="text"
                  name="address"
                  value={hospitalData.address}
                  onChange={handleHospitalChange}
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email liên hệ</label>
                <input
                  type="email"
                  name="email"
                  value={hospitalData.email}
                  onChange={handleHospitalChange}
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Số điện thoại (Hotline)</label>
                <input
                  type="text"
                  name="phone"
                  value={hospitalData.phone}
                  onChange={handleHospitalChange}
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Chuyên khoa chính</label>
                <div className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white max-h-48 overflow-y-auto">
                  {categories.length === 0 && <span className="text-slate-400 text-sm">Đang tải chuyên khoa...</span>}
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500"
                          checked={hospitalData.categoryIds?.includes(cat.id)}
                          onChange={(e) => {
                            const currentIds = hospitalData.categoryIds || [];
                            const newIds = e.target.checked
                              ? [...currentIds, cat.id]
                              : currentIds.filter((id) => id !== cat.id);
                            setHospitalData({ ...hospitalData, categoryIds: newIds });
                          }}
                        />
                        <span className="text-sm text-slate-700">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phí cơ sở (VNĐ)</label>
                <input
                  type="number"
                  name="facility_fee"
                  value={hospitalData.facility_fee}
                  onChange={handleHospitalChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Giới thiệu về cơ sở</label>
                <textarea
                  name="description"
                  value={hospitalData.description}
                  onChange={handleHospitalChange}
                  rows="4"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button type="submit" variant="primary" disabled={hospitalLoading}>
                {hospitalLoading ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import Button from "../components/Button";
import { Plus, Edit3, Trash2, ToggleRight, ToggleLeft, Inbox } from "lucide-react";
import {
  getUsers,
  toggleUserActive,
  deleteUserAdmin,
  createUserAdmin,
  updateUserAdmin,
} from "../services/admin.users.api";
import { getHospitals } from "../services/admin.hospitals.api";
import { useNotification } from "../contexts/NotificationContext";

export default function UserManagement() {
  const { showSuccess, showError, confirm } = useNotification();
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);

  const [roleFilter, setRoleFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    hospital_id: "",
    role: "admin_hospital",
  });
  
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoadingUsers(true);
      setLoadingHospitals(true);
      const [usersData, hospitalsData] = await Promise.all([
        getUsers(),
        getHospitals()
      ]);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setHospitals(Array.isArray(hospitalsData) ? hospitalsData : []);
    } catch (e) {
      console.error("Load data error:", e);
    } finally {
      setLoadingUsers(false);
      setLoadingHospitals(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const visibleUsers = users.filter((u) => {
    if (u.role === "admin") return false; // Không hiển thị admin tổng
    if (roleFilter === "all") return true;
    return u.role === roleFilter;
  });

  const availableHospitals = hospitals.filter(h => 
    !users.filter(u => u.role === "admin_hospital").some(u => String(u.hospital_id) === String(h.id) && u.id !== editingUserId)
  );

  const getRoleLabel = (role) => {
    switch(role) {
      case "patient": return "Bệnh nhân";
      case "doctor": return "Bác sĩ";
      case "admin_hospital": return "Admin Bệnh viện";
      default: return role;
    }
  };

  const handleEditUser = (user) => {
    setEditingUserId(user.id);
    setFormData({
      full_name: user.full_name || "",
      email: user.email || "",
      password: "", // Leave blank unless they want to change it
      phone: user.phone || "",
      hospital_id: user.hospital_id || "",
      role: user.role || "admin_hospital",
    });
    setShowForm(true);
  };

  const handleToggleUser = async (user) => {
    try {
      await toggleUserActive(user.id, user.is_active);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_active: !u.is_active } : u
        )
      );
      showSuccess(`Đã ${user.is_active ? "tạm ngưng" : "kích hoạt"} tài khoản thành công!`);
    } catch (e) {
      showError("Lỗi khi cập nhật trạng thái");
    }
  };

  const handleDeleteUser = async (id) => {
    const isConfirm = await confirm(
      "Xác nhận xóa tài khoản",
      "Bạn có chắc muốn xóa tài khoản này? Hành động này không thể hoàn tác.",
      { variant: "danger", confirmText: "Xóa" }
    );
    if (!isConfirm) return;
    
    try {
      await deleteUserAdmin(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      showSuccess("Đã xóa tài khoản thành công!");
    } catch (e) {
      showError("Lỗi khi xóa tài khoản");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isHospitalAdmin = formData.role === "admin_hospital";
    if (!formData.full_name || !formData.email || (!editingUserId && !formData.password) || (isHospitalAdmin && !formData.hospital_id)) {
      showError("Vui lòng điền đầy đủ các thông tin bắt buộc.");
      return;
    }
    try {
      setSubmitting(true);
      const payload = { ...formData };
      if (isHospitalAdmin) {
        payload.hospital_id = Number(payload.hospital_id);
      } else {
        payload.hospital_id = null; // Reset if not hospital admin
      }
      
      if (editingUserId && !payload.password) {
        delete payload.password; // Don't send empty password if editing
      }

      if (editingUserId) {
        await updateUserAdmin(editingUserId, payload);
        showSuccess("Cập nhật tài khoản thành công!");
      } else {
        await createUserAdmin(payload);
        showSuccess("Tạo tài khoản thành công!");
      }
      
      setShowForm(false);
      setEditingUserId(null);
      setFormData({
        full_name: "",
        email: "",
        password: "",
        phone: "",
        hospital_id: "",
        role: "admin_hospital",
      });
      void loadData();
    } catch (err) {
      showError(err.message || "Không thể thực hiện yêu cầu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUserId(null);
    setFormData({
      full_name: "",
      email: "",
      password: "",
      phone: "",
      hospital_id: "",
      role: "admin_hospital",
    });
  };

  return (
    <div className="xl:col-span-2">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Quản lý Tài Khoản Người Dùng
          </h2>
          <p className="text-sm text-slate-500">
            Quản lý tất cả bác sĩ, bệnh nhân, và admin trên hệ thống
          </p>
        </div>
        <Button size="sm" icon={Plus} onClick={() => {
          if (showForm) {
            handleCancel();
          } else {
            setShowForm(true);
          }
        }}>
          {showForm ? "Đóng form" : "Thêm tài khoản"}
        </Button>
      </div>

      {showForm && (
        <div className="mb-6 border border-slate-200 rounded-lg p-6 bg-white shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">{editingUserId ? "Cập nhật tài khoản" : "Tạo tài khoản mới"}</h3>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Loại tài khoản *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white"
                disabled={!!editingUserId} // Usually changing role of an existing user is restricted
              >
                <option value="patient">Bệnh nhân</option>
                <option value="doctor">Bác sĩ</option>
                <option value="admin_hospital">Admin Bệnh viện</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên *</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email đăng nhập *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu {editingUserId ? "(Để trống nếu không đổi)" : "*"}</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required={!editingUserId}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            {formData.role === "admin_hospital" && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Cơ sở y tế (Bệnh viện) *</label>
                <select
                  value={formData.hospital_id}
                  onChange={(e) => setFormData({ ...formData, hospital_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                  required
                >
                  <option value="">-- Chọn bệnh viện quản lý --</option>
                  {availableHospitals.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="md:col-span-2 flex justify-end mt-2 gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? "Đang xử lý..." : (editingUserId ? "Lưu thay đổi" : "Xác nhận tạo")}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm font-medium text-slate-700">Lọc theo vai trò:</label>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white min-w-[200px]"
        >
          <option value="all">Tất cả</option>
          <option value="patient">Bệnh nhân</option>
          <option value="doctor">Bác sĩ</option>
          <option value="admin_hospital">Admin Bệnh viện</option>
        </select>
      </div>

      <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-100">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-medium">
            <tr className="text-left">
              <th className="py-3 px-4">Tên</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Vai trò</th>
              <th className="py-3 px-4">Bệnh viện</th>
              <th className="py-3 px-4 text-center">Trạng thái</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {loadingUsers && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mb-4"></div>
                    Đang tải người dùng...
                  </div>
                </td>
              </tr>
            )}
            {!loadingUsers && visibleUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Inbox className="w-12 h-12 mb-3 text-slate-300" />
                    <p className="font-medium">Chưa có tài khoản admin_hospital nào.</p>
                  </div>
                </td>
              </tr>
            )}
            {!loadingUsers &&
              visibleUsers.map((user) => {
                const hosp = hospitals.find(h => String(h.id) === String(user.hospital_id));
                return (
                <tr key={user.id} className="border-b border-slate-100 hover:bg-emerald-50/50 transition-colors last:border-0">
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {user.full_name}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{user.email}</td>
                  <td className="py-3 px-4 text-slate-500">
                    <span className="px-2 py-1 rounded bg-slate-100 text-xs font-medium">
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-medium">
                    {user.role === "admin_hospital" ? (hosp ? hosp.name : (user.hospital_id || 'Chưa gắn kết')) : '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-sm hover:bg-slate-100 px-3 py-1.5 rounded-full transition-colors"
                      onClick={() => handleToggleUser(user)}
                    >
                      {(user.is_active ?? true) ? (
                        <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border border-emerald-100">
                           <ToggleRight className="w-3.5 h-3.5" /> Hoạt động
                        </span>
                      ) : (
                        <span className="bg-slate-50 text-slate-500 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border border-slate-200">
                           <ToggleLeft className="w-3.5 h-3.5" /> Tạm ngưng
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditUser(user)}
                      >
                        Sửa
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Xóa
                      </Button>
                    </div>
                  </td>
                </tr>
              )})}
          </tbody>
        </table>
      </div>
    </div>
  );
}

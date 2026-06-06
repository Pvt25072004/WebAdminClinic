import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Button from "../components/Button";
import Pagination from "../components/Pagination";
import TableSkeleton from "../components/TableSkeleton";
import EmptyState from "../components/EmptyState";
import { Plus, Edit3, Trash2, ToggleRight, ToggleLeft, Inbox, Eye, X } from "lucide-react";
import {
  getUsers,
  toggleUserActive,
  deleteUserAdmin,
  createUserAdmin,
  updateUserAdmin,
} from "../services/admin.users.api";
import { getHospitals } from "../services/admin.hospitals.api";
import { useNotification } from "../contexts/NotificationContext";
import { useAuth } from "../contexts/AuthContext";

export default function UserManagement() {
  const { user } = useAuth();
  const isHospitalAdmin = user?.role === "admin_hospital" || user?.user_role === "admin_hospital";
  const queryClient = useQueryClient();
  const { showSuccess, showError, confirm, prompt } = useNotification();
  const location = useLocation();
  
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [showForm, setShowForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    date_of_birth: "",
    gender: "other",
    id_card_number: "",
    hospital_id: "",
    role: "admin_hospital",
  });
  
  // submitting state is now derived from mutation below

  // 1. Fetch Hospitals using React Query
  const { data: hospitals = [], isLoading: loadingHospitals } = useQuery({
    queryKey: ["hospitals"],
    queryFn: getHospitals,
    select: (data) => (Array.isArray(data) ? data : []),
  });

  // 1.5 Extract unique cities from hospitals for the region filter
  const uniqueRegions = Array.from(new Set(hospitals.map(h => h.city?.name || h.city).filter(Boolean)));

  // 2. Fetch Users using React Query
  const { data: usersResponse, isLoading: loadingUsers } = useQuery({
    queryKey: ["users", currentPage, limit, roleFilter, statusFilter, regionFilter, search],
    queryFn: () => getUsers(currentPage, limit, { role: roleFilter, status: statusFilter, region: regionFilter, search }),
  });

  const users = usersResponse?.data ? usersResponse.data : (Array.isArray(usersResponse) ? usersResponse : []);
  const totalItems = usersResponse?.total || 0;
  const totalPages = usersResponse?.totalPages || 1;

  useEffect(() => {
    if (location.state?.selectedUserId && users.length > 0) {
      const u = users.find(x => x.id === location.state.selectedUserId);
      if (u) {
        setViewingUser(u);
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state?.selectedUserId, users]);

  const visibleUsers = users.filter((u) => u.role !== "admin");

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
      address: user.address || "",
      date_of_birth: user.date_of_birth ? user.date_of_birth.split('T')[0] : "",
      gender: user.gender || "other",
      id_card_number: user.id_card_number || "",
      hospital_id: user.hospital_id || "",
      role: user.role || "admin_hospital",
    });
    setShowForm(true);
  };

  // Mutations
  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => toggleUserActive(id, is_active),
    onSuccess: (_, variables) => {
      showSuccess(`Đã ${variables.is_active ? "tạm ngưng" : "kích hoạt"} tài khoản thành công!`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e) => showError(e.message || "Không thể cập nhật trạng thái"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUserAdmin,
    onSuccess: () => {
      showSuccess("Đã xóa người dùng");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e) => showError(e.message || "Không thể xóa người dùng"),
  });

  const handleToggleUser = async (u) => {
    if (isHospitalAdmin) {
      const reason = await prompt(
        u.is_active ? "Tạm ngưng tài khoản" : "Kích hoạt tài khoản",
        `Nhập lý do ${u.is_active ? "tạm ngưng" : "kích hoạt"} tài khoản này (bắt buộc):`
      );
      if (!reason) {
        if (reason === "") showError("Vui lòng nhập lý do!");
        return;
      }
    } else {
      const isConfirm = await confirm(
        "Xác nhận thay đổi",
        `Bạn có chắc muốn ${u.is_active ? "tạm ngưng" : "kích hoạt"} tài khoản này?`,
        { confirmText: "Đồng ý" }
      );
      if (!isConfirm) return;
    }
    toggleMutation.mutate({ id: u.id, is_active: u.is_active });
  };

  const handleDeleteUser = async (id) => {
    if (isHospitalAdmin) {
      const reason = await prompt(
        "Xóa tài khoản",
        "Nhập lý do xóa tài khoản người dùng này (bắt buộc):"
      );
      if (!reason) {
        if (reason === "") showError("Vui lòng nhập lý do!");
        return;
      }
    } else {
      const isConfirm = await confirm(
        "Xác nhận xóa tài khoản",
        "Bạn có chắc muốn xóa tài khoản này? Hành động này không thể hoàn tác.",
        { variant: "danger", confirmText: "Xóa" }
      );
      if (!isConfirm) return;
    }
    deleteMutation.mutate(id);
  };

  const submitMutation = useMutation({
    mutationFn: ({ id, payload }) => id ? updateUserAdmin(id, payload) : createUserAdmin(payload),
    onSuccess: (_, variables) => {
      showSuccess(variables.id ? "Cập nhật tài khoản thành công!" : "Tạo tài khoản thành công!");
      setShowForm(false);
      setEditingUserId(null);
      setFormData({
        full_name: "",
        email: "",
        password: "",
        phone: "",
        address: "",
        date_of_birth: "",
        gender: "other",
        id_card_number: "",
        hospital_id: "",
        role: "admin_hospital",
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e) => showError(e.message || "Không thể thực hiện yêu cầu"),
  });

  const submitting = submitMutation.isPending;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isHospitalAdmin = formData.role === "admin_hospital";
    if (!formData.full_name || !formData.email || (!editingUserId && !formData.password) || (isHospitalAdmin && !formData.hospital_id)) {
      showError("Vui lòng điền đầy đủ các thông tin bắt buộc.");
      return;
    }
    
    if (editingUserId) {
      if (isHospitalAdmin) {
        const reason = await prompt(
          "Xác nhận cập nhật",
          "Nhập lý do cập nhật thông tin (bắt buộc):"
        );
        if (!reason) {
          if (reason === "") showError("Vui lòng nhập lý do!");
          return;
        }
      } else {
        const isConfirm = await confirm(
          "Xác nhận cập nhật",
          "Bạn có chắc muốn lưu các thay đổi cho tài khoản này?",
          { confirmText: "Lưu thay đổi" }
        );
        if (!isConfirm) return;
      }
    }
    const payload = { ...formData };
    if (isHospitalAdmin) {
      payload.hospital_id = Number(payload.hospital_id);
    } else {
      payload.hospital_id = null; // Reset if not hospital admin
    }
    if (editingUserId && !payload.password) {
      delete payload.password; // Don't send empty password if editing
    }
    if (!payload.date_of_birth) delete payload.date_of_birth;
    if (!payload.address) delete payload.address;
    if (!payload.id_card_number) delete payload.id_card_number;
    
    submitMutation.mutate({ id: editingUserId, payload });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUserId(null);
    setFormData({
      full_name: "",
      email: "",
      password: "",
      phone: "",
      address: "",
      date_of_birth: "",
      gender: "other",
      id_card_number: "",
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
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Tạo tài khoản
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu {editingUserId && "(Để trống nếu không đổi)"}</label>
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
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Giới tính</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white"
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ngày sinh</label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CCCD / CMND</label>
              <input
                type="text"
                value={formData.id_card_number}
                onChange={(e) => setFormData({ ...formData, id_card_number: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            {formData.role === "admin_hospital" && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Chọn bệnh viện quản lý *</label>
                <select
                  value={formData.hospital_id}
                  onChange={(e) => setFormData({ ...formData, hospital_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                  required
                >
                  <option value="">-- Chọn bệnh viện --</option>
                  {availableHospitals.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                  {/* If editing and the user has a hospital, it should be listed even if assigned */}
                  {editingUserId && formData.hospital_id && !availableHospitals.find(h => h.id === Number(formData.hospital_id)) && (
                     <option value={formData.hospital_id}>Bệnh viện ID: {formData.hospital_id} (Đang quản lý)</option>
                  )}
                </select>
                {availableHospitals.length === 0 && !editingUserId && (
                  <p className="text-xs text-amber-600 mt-1">Tất cả bệnh viện đã có Admin quản lý.</p>
                )}
              </div>
            )}
            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={submitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={submitting} className="flex items-center gap-2">
                {submitting ? "Đang xử lý..." : "Lưu tài khoản"}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">Tìm kiếm</label>
          <input 
            type="text" 
            placeholder="Tên, Email, SĐT..." 
            className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="flex gap-4 mb-0">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Vai trò</label>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              className="border rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 min-w-[140px]"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="patient">Bệnh nhân</option>
              <option value="doctor">Bác sĩ</option>
              <option value="admin_hospital">Admin Bệnh viện</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Khu vực</label>
            <select
              value={regionFilter}
              onChange={(e) => { setRegionFilter(e.target.value); setCurrentPage(1); }}
              className="border rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 min-w-[140px]"
            >
              <option value="all">Tất cả khu vực</option>
              {uniqueRegions.map((region, idx) => (
                <option key={idx} value={region}>{region}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="border rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 min-w-[140px]"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm ngưng</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setRoleFilter("all"); setRegionFilter("all"); setStatusFilter("all"); setCurrentPage(1); }}>
              Xóa bộ lọc
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-100">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-medium">
            <tr className="text-left">
              <th className="py-3 px-4 text-center w-12">STT</th>
              <th className="py-3 px-4">Tên</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">SĐT</th>
              <th className="py-3 px-4">Vai trò</th>
              <th className="py-3 px-4">Bệnh viện</th>
              <th className="py-3 px-4 text-center">Trạng thái</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {loadingUsers && <TableSkeleton columns={6} rows={5} />}
            {!loadingUsers && visibleUsers.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <EmptyState 
                    icon={Inbox} 
                    title="Chưa có tài khoản nào" 
                    description="Không tìm thấy dữ liệu người dùng."
                  />
                </td>
              </tr>
            )}
            {!loadingUsers &&
              visibleUsers.map((user, index) => {
                const hosp = hospitals.find(h => String(h.id) === String(user.hospital_id));
                const stt = (currentPage - 1) * limit + index + 1;
                return (
                <tr key={user.id} className="border-b border-slate-100 hover:bg-emerald-50/50 transition-colors last:border-0">
                  <td className="py-3 px-4 text-center font-medium text-slate-500">
                    {stt}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {user.full_name}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{user.email}</td>
                  <td className="py-3 px-4 text-slate-500">{user.phone || '-'}</td>
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
                        icon={Eye}
                        onClick={() => setViewingUser(user)}
                        className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                      >
                        Xem
                      </Button>
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
      
      {!loadingUsers && users.length > 0 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          itemsPerPage={limit}
        />
      )}

      {/* Modal Chi tiết người dùng */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-semibold text-slate-800">Hồ sơ chi tiết</h3>
              <button 
                onClick={() => setViewingUser(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="flex items-start gap-6 mb-8">
                <div className="w-24 h-24 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                  {viewingUser.avatar_url ? (
                    <img src={viewingUser.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-3xl font-medium">
                      {viewingUser.full_name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-slate-900 mb-1">{viewingUser.full_name}</h4>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold uppercase tracking-wide">
                      {getRoleLabel(viewingUser.role)}
                    </span>
                    {(viewingUser.is_active ?? true) ? (
                      <span className="text-emerald-600 text-sm font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Đang hoạt động
                      </span>
                    ) : (
                      <span className="text-rose-600 text-sm font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span> Bị khóa
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{viewingUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Số điện thoại</p>
                    <p className="text-slate-800 font-medium">{viewingUser.phone || 'Chưa cập nhật'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Giới tính</p>
                    <p className="text-slate-800 font-medium">
                      {viewingUser.gender === 'male' ? 'Nam' : viewingUser.gender === 'female' ? 'Nữ' : 'Chưa cập nhật'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Ngày sinh</p>
                    <p className="text-slate-800 font-medium">
                      {viewingUser.date_of_birth ? new Date(viewingUser.date_of_birth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Địa chỉ</p>
                    <p className="text-slate-800 font-medium">{viewingUser.address || 'Chưa cập nhật'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Số CCCD</p>
                    <p className="text-slate-800 font-medium">{viewingUser.id_card_number || 'Chưa cập nhật'}</p>
                  </div>
                  {viewingUser.role === 'admin_hospital' && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Cơ sở quản lý</p>
                      <p className="text-slate-800 font-medium">
                        {hospitals.find(h => String(h.id) === String(viewingUser.hospital_id))?.name || 'Không xác định'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {(viewingUser.id_card_front_url || viewingUser.id_card_back_url) && (
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">Hình ảnh CCCD</p>
                  <div className="grid grid-cols-2 gap-4">
                    {viewingUser.id_card_front_url && (
                      <div className="rounded-lg overflow-hidden border border-slate-200">
                        <img src={viewingUser.id_card_front_url} alt="CCCD Mặt trước" className="w-full object-cover" />
                      </div>
                    )}
                    {viewingUser.id_card_back_url && (
                      <div className="rounded-lg overflow-hidden border border-slate-200">
                        <img src={viewingUser.id_card_back_url} alt="CCCD Mặt sau" className="w-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <Button onClick={() => setViewingUser(null)}>Đóng</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

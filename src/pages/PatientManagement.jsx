import React, { useEffect, useState, useMemo } from "react";
import Button from "../components/Button";
import { ToggleRight, ToggleLeft, Inbox } from "lucide-react";
import {
  getUsers,
  toggleUserActive,
  deleteUserAdmin,
} from "../services/admin.users.api";
export default function PatientManagement() {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Load users error:", e);
    } finally {
      setLoadingUsers(false);
    }
  };
  useEffect(() => {
    void loadUsers();
  }, []);
  const visibleUsers = users.filter((u) => u.role !== "admin");
  return (
    <div className="xl:col-span-2">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Quản lý người dùng
          </h2>
          <p className="text-sm text-slate-500">
            Danh sách bệnh nhân đã đăng ký
          </p>
        </div>
        <Button size="sm" variant="outline">
          Xuất danh sách
        </Button>
      </div>
      <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-100">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-medium">
            <tr className="text-left">
              <th className="py-3 px-4">Tên</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Điện thoại</th>
              <th className="py-3 px-4 text-center">Lịch hẹn</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            {loadingUsers && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mb-4"></div>
                    Đang tải danh sách người dùng...
                  </div>
                </td>
              </tr>
            )}
            {!loadingUsers && visibleUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Inbox className="w-12 h-12 mb-3 text-slate-300" />
                    <p className="font-medium">Chưa có người dùng nào</p>
                  </div>
                </td>
              </tr>
            )}
            {!loadingUsers &&
              visibleUsers.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 hover:bg-emerald-50/50 transition-colors last:border-0">
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {user.full_name}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{user.email}</td>
                  <td className="py-3 px-4 text-slate-500">{user.phone}</td>
                  <td className="py-3 px-4 text-center">
                    {Array.isArray(user.appointments)
                      ? user.appointments.length
                      : "0"}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-sm text-slate-600 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors"
                      onClick={() => handleToggleUser(user)}
                    >
                      {(user.is_active ?? true) ? (
                        <>
                          <ToggleRight className="w-4 h-4 text-emerald-500" />
                          <span className="font-medium text-emerald-700">Hoạt động</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-500">Tạm ngưng</span>
                        </>
                      )}
                    </button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Xóa
                    </Button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React, { useEffect, useState, useMemo } from "react";
import Button from "../components/Button";
import { ToggleRight } from "lucide-react";
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
          <h2 className="text-xl font-semibold text-gray-900">
            Quản lý người dùng
          </h2>
          <p className="text-sm text-gray-500">
            Danh sách bệnh nhân đã đăng ký
          </p>
        </div>
        <Button size="sm" variant="outline">
          Xuất danh sách
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Tên</th>
              <th>Email</th>
              <th>Điện thoại</th>
              <th className="text-center">Lịch hẹn</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loadingUsers && (
              <tr>
                <td colSpan={5} className="py-3 text-center text-gray-500">
                  Đang tải người dùng...
                </td>
              </tr>
            )}
            {!loadingUsers && visibleUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="py-3 text-center text-gray-500">
                  Chưa có người dùng nào.
                </td>
              </tr>
            )}
            {!loadingUsers &&
              visibleUsers.map((user) => (
                <tr key={user.id} className="border-b last:border-0">
                  <td className="py-3 font-medium text-gray-900">
                    {user.full_name}
                  </td>
                  <td className="text-gray-500">{user.email}</td>
                  <td className="text-gray-500">{user.phone}</td>
                  <td className="text-center">
                    {Array.isArray(user.appointments)
                      ? user.appointments.length
                      : ""}
                  </td>
                  <td className="text-right space-x-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-sm text-gray-600"
                      onClick={() => handleToggleUser(user)}
                    >
                      {(user.is_active ?? true) ? (
                        <>
                          <ToggleRight className="w-4 h-4 text-green-500" />
                          <span>Đang hoạt động</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 text-gray-400" />
                          <span>Tạm ngưng</span>
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

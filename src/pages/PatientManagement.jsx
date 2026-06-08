import React, { useEffect, useState, useMemo } from "react";
import Button from "../components/Button";
import Pagination from "../components/Pagination";
import TableSkeleton from "../components/TableSkeleton";
import EmptyState from "../components/EmptyState";
import { ToggleRight, ToggleLeft, Inbox } from "lucide-react";
import {
  getUsers,
  toggleUserActive,
  deleteUserAdmin,
} from "../services/admin.users.api";
import { getAllAppointments } from "../services/admin.appointments.api";
import { useNotification } from "../contexts/NotificationContext";
import { useAuth } from "../contexts/AuthContext";

export default function PatientManagement() {
  const { user } = useAuth();
  const { showSuccess, showError, confirm, prompt } = useNotification();
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const responseData = await getUsers(currentPage, limit);
      const actualUsers = responseData?.data
        ? responseData.data
        : Array.isArray(responseData)
          ? responseData
          : [];
      setUsers(actualUsers);
      if (responseData?.total) setTotalItems(responseData.total);
      if (responseData?.totalPages) setTotalPages(responseData.totalPages);
    } catch (e) {
      console.error("Load users error:", e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadAppointments = async () => {
    try {
      setLoadingAppointments(true);
      const response = await getAllAppointments(1, 10000);
      const appointmentsList = response?.data || [];
      setAppointments(appointmentsList);
    } catch (e) {
      console.error("Load appointments error:", e);
    } finally {
      setLoadingAppointments(false);
    }
  };

  useEffect(() => {
    void loadUsers();
    void loadAppointments();
  }, [currentPage, limit]);

  // Tính appointment count map theo patient ID
  const appointmentCountMap = useMemo(() => {
    const map = {};
    appointments.forEach((apt) => {
      const patientId = apt.user_id;
      if (patientId) {
        map[patientId] = (map[patientId] || 0) + 1;
      }
    });
    return map;
  }, [appointments]);

  const handleToggleUser = async (patient) => {
    if (patient.is_active !== false) {
      const reason = await prompt(
        "Tạm khóa tài khoản",
        "Nhập lý do khóa tài khoản bệnh nhân (bắt buộc):",
      );
      if (!reason) return;
    } else {
      const isConfirm = await confirm(
        "Xác nhận kích hoạt",
        "Bạn có chắc muốn kích hoạt lại tài khoản này?",
        { confirmText: "Đồng ý" },
      );
      if (!isConfirm) return;
    }

    try {
      await toggleUserActive(patient.id, patient.is_active);
      showSuccess(
        `Đã ${patient.is_active !== false ? "tạm khóa" : "kích hoạt"} tài khoản thành công!`,
      );
      loadUsers();
    } catch (e) {
      showError(e.message || "Không thể cập nhật trạng thái");
    }
  };

  const handleDeleteUser = async (id) => {
    const reason = await prompt(
      "Xóa bệnh nhân",
      "Vui lòng nhập lý do xóa để gửi qua Email cho bệnh nhân:",
    );
    if (!reason) return;

    try {
      await deleteUserAdmin(id);
      showSuccess("Đã xóa bệnh nhân thành công.");
      loadUsers();
    } catch (e) {
      showError(
        e.message || "Bạn không có quyền xóa bệnh nhân, hoặc lỗi hệ thống.",
      );
    }
  };

  const handleExportCSV = () => {
    if (visibleUsers.length === 0) {
      showError("Không có dữ liệu để xuất!");
      return;
    }

    // Tạo header cho CSV
    const headers = [
      "STT",
      "Tên",
      "Email",
      "Điện thoại",
      "Số lịch hẹn",
      "Trạng thái",
      "Ngày tạo",
    ];

    // Tạo dữ liệu cho CSV
    const data = visibleUsers.map((user, index) => [
      index + 1,
      user.full_name || "",
      user.email || "",
      user.phone || "",
      appointmentCountMap[user.id] || 0,
      (user.is_active ?? true) ? "Hoạt động" : "Tạm ngưng",
      user.created_at
        ? new Date(user.created_at).toLocaleDateString("vi-VN")
        : "",
    ]);

    // Kết hợp headers và data
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        row
          .map((cell) =>
            typeof cell === "string" && cell.includes(",")
              ? `"${cell.replace(/"/g, '""')}"`
              : cell,
          )
          .join(","),
      ),
    ].join("\n");

    // Thêm BOM cho UTF-8 để hiển thị đúng tiếng Việt
    const BOM = "\uFEFF";
    const csvBlob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    // Tạo link download
    const link = document.createElement("a");
    const url = URL.createObjectURL(csvBlob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `danh-sach-benh-nhan-${new Date().toLocaleDateString("vi-VN")}.csv`,
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccess("Xuất danh sách thành công!");
  };

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
          <p className="text-sm font-medium text-emerald-600 mt-1">
            Tổng số: {totalItems} bệnh nhân
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={handleExportCSV}>
          Xuất danh sách
        </Button>
      </div>
      <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-100">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-medium">
            <tr className="text-left">
              <th className="py-3 px-4 w-16">STT</th>
              <th className="py-3 px-4">Tên</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Điện thoại</th>
              <th className="py-3 px-4 text-center">Lịch hẹn</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            {loadingUsers && <TableSkeleton columns={5} rows={5} />}
            {!loadingUsers && visibleUsers.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={Inbox}
                    title="Chưa có người dùng nào"
                    description="Danh sách bệnh nhân đang trống."
                  />
                </td>
              </tr>
            )}
            {!loadingUsers &&
              visibleUsers.map((userObj, index) => (
                <tr
                  key={userObj.id}
                  className="border-b border-slate-100 hover:bg-emerald-50/50 transition-colors last:border-0"
                >
                  <td className="py-3 px-4 text-slate-500 font-medium">
                    {(currentPage - 1) * limit + index + 1}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {userObj.full_name}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{userObj.email}</td>
                  <td className="py-3 px-4 text-slate-500">{userObj.phone}</td>
                  <td className="py-3 px-4 text-center">
                    {appointmentCountMap[userObj.id] || 0}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-sm text-slate-600 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors"
                      onClick={() => handleToggleUser(userObj)}
                    >
                      {(userObj.is_active ?? true) ? (
                        <>
                          <ToggleRight className="w-4 h-4 text-emerald-500" />
                          <span className="font-medium text-emerald-700">
                            Hoạt động
                          </span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-500">
                            Tạm ngưng
                          </span>
                        </>
                      )}
                    </button>
                    {user?.role === "admin" && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteUser(userObj.id)}
                      >
                        Xóa
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
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
    </div>
  );
}

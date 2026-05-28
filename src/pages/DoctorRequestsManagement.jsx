import React, { useEffect, useState } from "react";
import Button from "../components/Button";
import { getRequestsByHospital, updateRequestStatus } from "../services/admin.hospital.requests.api";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";
import { CheckCircle, XCircle } from "lucide-react";

export default function DoctorRequestsManagement() {
  const { user } = useAuth();
  const { showSuccess, showError, confirm } = useNotification();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadRequests = async () => {
    if (!user?.hospital_id) return;
    try {
      setLoading(true);
      const data = await getRequestsByHospital(user.hospital_id);
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Load requests error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, [user?.hospital_id]);

  const handleApprove = async (id) => {
    try {
      await updateRequestStatus(id, "approved");
      showSuccess("Đã chấp nhận yêu cầu. Bác sĩ giờ có thể đặt lịch tại bệnh viện này.");
      void loadRequests();
    } catch (e) {
      showError("Lỗi khi chấp nhận: " + e.message);
    }
  };

  const handleReject = async (id) => {
    const isConfirm = await confirm(
      "Xác nhận từ chối",
      "Bạn có chắc muốn từ chối yêu cầu này?",
      { variant: "danger", confirmText: "Từ chối" }
    );
    if (!isConfirm) return;
    
    try {
      await updateRequestStatus(id, "rejected");
      showSuccess("Đã từ chối yêu cầu.");
      void loadRequests();
    } catch (e) {
      showError("Lỗi khi từ chối: " + e.message);
    }
  };

  return (
    <div className="xl:col-span-2">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Duyệt yêu cầu bác sĩ
          </h2>
          <p className="text-sm text-slate-500">
            Quản lý các bác sĩ xin phép làm việc hoặc xin nghỉ tại cơ sở y tế của bạn
          </p>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-slate-100 p-4">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="py-3 px-2">Ngày gửi</th>
              <th className="py-3 px-2">Bác sĩ</th>
              <th className="py-3 px-2">Loại yêu cầu</th>
              <th className="py-3 px-2">Chuyên khoa</th>
              <th className="py-3 px-2">Lời nhắn</th>
              <th className="py-3 px-2 text-center">Trạng thái</th>
              <th className="py-3 px-2 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  Đang tải dữ liệu...
                </td>
              </tr>
            )}
            {!loading && requests.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  Không có yêu cầu nào.
                </td>
              </tr>
            )}
            {!loading &&
              requests.map((req) => (
                <tr key={req.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="py-3 px-2 text-slate-500">
                    {new Date(req.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-3 px-2 font-medium text-slate-900">
                    {req.doctor?.name || `BS ID: ${req.doctor_id}`}
                  </td>
                  <td className="py-3 px-2 text-slate-500">
                    {req.type === 'leave' ? (
                      <span className="text-red-600 font-medium">Hủy liên kết</span>
                    ) : (
                      <span className="text-emerald-600 font-medium">Xin việc</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-slate-500">
                    {req.doctor?.specialty || "Không xác định"}
                  </td>
                  <td className="py-3 px-2 text-slate-600 max-w-xs truncate" title={req.message}>
                    {req.message || <span className="text-slate-400 italic">Không có lời nhắn</span>}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {req.status === 'pending' && <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Đang chờ duyệt</span>}
                    {req.status === 'approved' && <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Đã chấp nhận</span>}
                    {req.status === 'rejected' && <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">Bị từ chối</span>}
                  </td>
                  <td className="py-3 px-2 text-right">
                    {req.status === 'pending' && (
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => handleApprove(req.id)}>
                          <CheckCircle className="w-4 h-4 text-emerald-500 mr-1" /> Duyệt
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleReject(req.id)}>
                          <XCircle className="w-4 h-4 text-red-500 mr-1" /> Từ chối
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

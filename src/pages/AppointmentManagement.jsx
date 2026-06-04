import React, { useEffect, useState } from "react";
import Button from "../components/Button";
import { getAllAppointments, updateAppointmentStatus, getMedicalRecord, updateAppointment } from "../services/admin.appointments.api";
import { useNotification } from "../contexts/NotificationContext";
import { CheckCircle, XCircle, Eye, Calendar, Clock, FileText, Check, X, DollarSign } from "lucide-react";
import { formatDate } from "../utils/helpers";
import Pagination from "../components/Pagination";

export default function AppointmentManagement() {
  const { showSuccess, showError, confirm } = useNotification();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [loadingRecord, setLoadingRecord] = useState(false);

  useEffect(() => {
    if (selectedAppointment && selectedAppointment.status === "completed") {
      const fetchRecord = async () => {
        setLoadingRecord(true);
        try {
          const res = await getMedicalRecord(selectedAppointment.id);
          if (res && (res.id || res.diagnosis || res.prescription)) {
            setMedicalRecord(res);
          } else {
            setMedicalRecord(null);
          }
        } catch (e) {
          setMedicalRecord(null);
        } finally {
          setLoadingRecord(false);
        }
      };
      fetchRecord();
    } else {
      setMedicalRecord(null);
    }
  }, [selectedAppointment?.id, selectedAppointment?.status]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const res = await getAllAppointments(currentPage, limit);
      if (Array.isArray(res)) {
        setAppointments(res);
        setTotalItems(res.length);
        setTotalPages(1);
      } else {
        setAppointments(res.data || []);
        setTotalItems(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (e) {
      console.error("Load appointments error:", e);
      showError("Không thể tải danh sách cuộc hẹn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAppointments();
  }, [currentPage, limit]);

  const handleUpdateStatus = async (id, status, requireReason = false) => {
    let reason = "";
    if (requireReason) {
      reason = window.prompt("Vui lòng nhập lý do (hủy/từ chối):");
      if (reason === null) return; // User cancelled prompt
      if (!reason.trim()) {
        showError("Lý do không được để trống");
        return;
      }
    } else {
      const isConfirm = await confirm(
        "Xác nhận cập nhật",
        `Bạn có chắc muốn cập nhật trạng thái cuộc hẹn thành: ${status}?`,
        { confirmText: "Đồng ý" }
      );
      if (!isConfirm) return;
    }

    try {
      await updateAppointmentStatus(id, status, reason);
      showSuccess(`Đã cập nhật trạng thái thành ${status}`);
      void loadAppointments();
      if (selectedAppointment?.id === id) {
        setSelectedAppointment((prev) => ({ ...prev, status, cancel_reason: reason }));
      }
    } catch (e) {
      showError("Lỗi khi cập nhật: " + e.message);
    }
  };

  const handleMarkRefundCompleted = async (apt) => {
    const isConfirm = await confirm(
      "Xác nhận hoàn tiền",
      `Xác nhận đã hoàn tiền cho bệnh nhân ${apt.user?.full_name}?`,
      { confirmText: "Đã hoàn tiền" }
    );
    if (!isConfirm) return;
    try {
      await updateAppointment(apt.id, { refund_status: "completed" });
      showSuccess("Đã đánh dấu hoàn tiền thành công");
      void loadAppointments();
      if (selectedAppointment?.id === apt.id) {
        setSelectedAppointment((prev) => ({ ...prev, refund_status: "completed" }));
      }
    } catch (e) {
      showError("Lỗi: " + e.message);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (filterStatus === "all") return true;
    return apt.status === filterStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Chờ xác nhận</span>;
      case "confirmed":
        return <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Đã xác nhận</span>;
      case "completed":
        return <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Hoàn thành</span>;
      case "cancelled":
        return <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">Đã hủy</span>;
      case "rejected":
        return <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">Từ chối</span>;
      case "awaiting_payment":
        return <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Chờ thanh toán</span>;
      default:
        return <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-2 py-1 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="xl:col-span-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Quản lý Lịch hẹn
          </h2>
          <p className="text-sm text-slate-500">
            Theo dõi và quản lý toàn bộ các cuộc hẹn trên hệ thống
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border-slate-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="awaiting_payment">Chờ thanh toán</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
            <option value="rejected">Từ chối</option>
          </select>
          <Button variant="outline" onClick={loadAppointments}>
            Làm mới
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-slate-100 p-4">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="py-3 px-2">ID</th>
              <th className="py-3 px-2">Bệnh nhân</th>
              <th className="py-3 px-2">Bác sĩ / Gói khám</th>
              <th className="py-3 px-2">Bệnh viện</th>
              <th className="py-3 px-2">Thời gian khám</th>
              <th className="py-3 px-2">Hình thức</th>
              <th className="py-3 px-2 text-center">Trạng thái</th>
              <th className="py-3 px-2 text-center">Hoàn tiền</th>
              <th className="py-3 px-2 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  Đang tải dữ liệu cuộc hẹn...
                </td>
              </tr>
            )}
            {!loading && filteredAppointments.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  Không tìm thấy cuộc hẹn nào.
                </td>
              </tr>
            )}
            {!loading &&
              filteredAppointments.map((apt) => (
                <tr key={apt.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="py-3 px-2 font-mono text-xs text-slate-500">
                    #{apt.id}
                  </td>
                  <td className="py-3 px-2 font-medium text-slate-900">
                    {apt.user?.full_name || "N/A"}
                  </td>
                  <td className="py-3 px-2 text-slate-700">
                    {apt.service_package ? (
                      <span className="font-medium text-indigo-600">{apt.service_package.name}</span>
                    ) : (
                      apt.doctor?.user?.full_name || apt.doctor_name_snapshot || "N/A"
                    )}
                  </td>
                  <td className="py-3 px-2 text-slate-700">
                    {apt.hospital?.name || apt.hospital_name_snapshot || "N/A"}
                  </td>
                  <td className="py-3 px-2 text-slate-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {apt.appointment_date ? formatDate(apt.appointment_date) : "N/A"}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs">
                      <Clock className="w-3 h-3" /> {apt.appointment_time || "N/A"}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-slate-500">
                    {apt.examination_type === 'online' ? (
                      <span className="text-blue-600 font-medium">Khám Online</span>
                    ) : (
                      <span>Khám Trực tiếp</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {getStatusBadge(apt.status)}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {apt.refund_status === "requested" && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                        <DollarSign className="w-3 h-3" /> Chờ hoàn tiền
                      </span>
                    )}
                    {apt.refund_status === "completed" && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                        <CheckCircle className="w-3 h-3" /> Đã hoàn tiền
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => setSelectedAppointment(apt)}>
                        <Eye className="w-4 h-4 mr-1 text-blue-500" /> Chi tiết
                      </Button>
                      {(apt.status === "pending" || apt.status === "awaiting_payment") && (
                        <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(apt.id, "cancelled", true)}>
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!loading && appointments.length > 0 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          itemsPerPage={limit}
        />
      )}

      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <h3 className="text-xl font-bold text-slate-900">Chi tiết Cuộc hẹn #{selectedAppointment.id}</h3>
              <button onClick={() => setSelectedAppointment(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Patient Info */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Thông tin bệnh nhân
                </h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-slate-500 w-24 inline-block">Họ tên:</span> <span className="font-medium">{selectedAppointment.user?.full_name || selectedAppointment.patient_name}</span></p>
                  <p><span className="text-slate-500 w-24 inline-block">SĐT:</span> <span className="font-medium">{selectedAppointment.user?.phone || selectedAppointment.patient_phone || "N/A"}</span></p>
                  <p><span className="text-slate-500 w-24 inline-block">Email:</span> <span className="font-medium">{selectedAppointment.user?.email || "N/A"}</span></p>
                </div>
              </div>

              {/* Doctor/Service Info */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Dịch vụ đăng ký
                </h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-slate-500 w-24 inline-block">Hình thức:</span> <span className="font-medium">{selectedAppointment.examination_type === 'online' ? 'Khám Online' : 'Tại Cơ sở y tế'}</span></p>
                  <p><span className="text-slate-500 w-24 inline-block">Bệnh viện:</span> <span className="font-medium">{selectedAppointment.hospital?.name || selectedAppointment.hospital_name_snapshot || "Không có dữ liệu"}</span></p>
                  <p><span className="text-slate-500 w-24 inline-block">Bác sĩ:</span> <span className="font-medium">{selectedAppointment.doctor?.user?.full_name || selectedAppointment.doctor_name_snapshot || "Không có dữ liệu"}</span></p>
                  {selectedAppointment.service_package && (
                    <p><span className="text-slate-500 w-24 inline-block">Gói khám:</span> <span className="font-medium text-indigo-600">{selectedAppointment.service_package.name}</span></p>
                  )}
                  <p><span className="text-slate-500 w-24 inline-block">Tổng phí:</span> <span className="font-bold text-emerald-600">{Number(selectedAppointment.total_fee).toLocaleString("vi-VN")} VNĐ</span></p>
                </div>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="mb-6">
              <h4 className="font-semibold text-slate-700 mb-2">Chi tiết lịch khám</h4>
              <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-lg text-sm border border-blue-100">
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Ngày: {selectedAppointment.appointment_date ? formatDate(selectedAppointment.appointment_date) : "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Giờ: {selectedAppointment.appointment_time || "N/A"}</span>
                </div>
                <div className="col-span-2 mt-2">
                  <p className="text-slate-500 mb-1">Ghi chú của bệnh nhân:</p>
                  <p className="p-2 bg-white rounded border border-slate-200 text-slate-700 min-h-[60px]">
                    {selectedAppointment.notes || selectedAppointment.symptoms || <span className="italic text-slate-400">Không có ghi chú</span>}
                  </p>
                </div>
                <div className="col-span-2 mt-2 flex items-center gap-2">
                  <span className="text-slate-500">Trạng thái hiện tại:</span>
                  {getStatusBadge(selectedAppointment.status)}
                </div>
                {selectedAppointment.cancel_reason && (
                  <div className="col-span-2 mt-2 text-red-600 bg-red-50 p-2 rounded">
                    <strong>Lý do hủy/từ chối:</strong> {selectedAppointment.cancel_reason}
                  </div>
                )}
              </div>
            </div>

            {/* Medical Record Details */}
            {selectedAppointment.status === "completed" && (
              <div className="mb-6">
                <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Hồ sơ bệnh án
                </h4>
                <div className="bg-emerald-50/50 p-4 rounded-lg text-sm border border-emerald-100">
                  {loadingRecord ? (
                    <p className="text-slate-500 text-center py-2">Đang tải hồ sơ bệnh án...</p>
                  ) : medicalRecord ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-slate-500 font-medium mb-1 uppercase text-xs">Chẩn đoán</p>
                        <p className="p-2 bg-white rounded border border-slate-200 text-slate-800 whitespace-pre-wrap">
                          {medicalRecord.diagnosis || "Không có dữ liệu"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium mb-1 uppercase text-xs">Đơn thuốc</p>
                        <p className="p-2 bg-white rounded border border-slate-200 text-slate-800 whitespace-pre-wrap">
                          {medicalRecord.prescription || "Không có dữ liệu"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium mb-1 uppercase text-xs">Ghi chú của bác sĩ</p>
                        <p className="p-2 bg-white rounded border border-slate-200 text-slate-800 whitespace-pre-wrap">
                          {medicalRecord.notes || "Không có dữ liệu"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-center py-2">Bác sĩ chưa cập nhật hồ sơ bệnh án cho buổi khám này.</p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="ghost" onClick={() => setSelectedAppointment(null)}>
                Đóng
              </Button>
              {selectedAppointment.status === "pending" && (
                <>
                  <Button variant="outline" onClick={() => handleUpdateStatus(selectedAppointment.id, "confirmed", false)}>
                    <Check className="w-4 h-4 text-blue-500 mr-1" /> Xác nhận lịch
                  </Button>
                  <Button variant="danger" onClick={() => handleUpdateStatus(selectedAppointment.id, "rejected", true)}>
                    <X className="w-4 h-4 mr-1" /> Từ chối
                  </Button>
                </>
              )}
              {selectedAppointment.status === "confirmed" && (
                <Button variant="outline" onClick={() => handleUpdateStatus(selectedAppointment.id, "completed", false)}>
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-1" /> Đánh dấu hoàn thành
                </Button>
              )}
              {["confirmed", "awaiting_payment"].includes(selectedAppointment.status) && (
                <Button variant="danger" onClick={() => handleUpdateStatus(selectedAppointment.id, "cancelled", true)}>
                  <XCircle className="w-4 h-4 mr-1" /> Hủy lịch
                </Button>
              )}
              {selectedAppointment.refund_status === "requested" && (
                <Button
                  variant="primary"
                  onClick={() => handleMarkRefundCompleted(selectedAppointment)}
                  className="bg-amber-500 hover:bg-amber-600 border-none text-white flex items-center gap-1"
                >
                  <DollarSign className="w-4 h-4" /> Xác nhận đã hoàn tiền
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

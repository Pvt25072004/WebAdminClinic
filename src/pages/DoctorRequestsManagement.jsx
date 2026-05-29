import React, { useEffect, useState } from "react";
import Button from "../components/Button";
import { getHospitalApplications as getRequestsByHospital, updateApplicationStatus as updateRequestStatus } from "../services/admin.doctors.api";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";
import { CheckCircle, XCircle, Eye, FileText, Download } from "lucide-react";

export default function DoctorRequestsManagement() {
  const { user } = useAuth();
  const { showSuccess, showError, confirm } = useNotification();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

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
      if (selectedRequest?.id === id) setSelectedRequest(null);
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
      if (selectedRequest?.id === id) setSelectedRequest(null);
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
                    {req.doctor?.user?.full_name || req.doctor?.name || `BS ID: ${req.doctor?.id}`}
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
                  <td className="py-3 px-2 text-slate-600 max-w-xs truncate" title={req.cover_letter}>
                    {req.cover_letter || <span className="text-slate-400 italic">Không có lời nhắn</span>}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {req.status === 'pending' && <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Đang chờ duyệt</span>}
                    {req.status === 'approved' && <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Đã chấp nhận</span>}
                    {req.status === 'rejected' && <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">Bị từ chối</span>}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => setSelectedRequest(req)}>
                        <Eye className="w-4 h-4 mr-1 text-blue-500" /> Chi tiết
                      </Button>
                      {req.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleApprove(req.id)}>
                            <CheckCircle className="w-4 h-4 text-emerald-500 mr-1" /> Duyệt
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleReject(req.id)}>
                            <XCircle className="w-4 h-4 text-red-500 mr-1" /> Từ chối
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <h3 className="text-xl font-bold text-slate-900">Chi tiết Hồ sơ Bác sĩ</h3>
              <button onClick={() => setSelectedRequest(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-slate-500">Họ và tên</p>
                <p className="font-semibold">{selectedRequest.doctor?.user?.full_name || 'Không xác định'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Email</p>
                <p className="font-semibold">{selectedRequest.doctor?.user?.email || 'Chưa cập nhật'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Số điện thoại</p>
                <p className="font-semibold">{selectedRequest.doctor?.user?.phone || 'Chưa cập nhật'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Chuyên khoa</p>
                <p className="font-semibold">{selectedRequest.doctor?.specialty || 'Không xác định'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Bằng cấp</p>
                <p className="font-semibold">{selectedRequest.doctor?.degree || 'Không có dữ liệu'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Kinh nghiệm</p>
                <p className="font-semibold">{selectedRequest.doctor?.experience_years ? `${selectedRequest.doctor.experience_years} năm` : 'Chưa cập nhật'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-slate-500">Số phép hành nghề</p>
                <p className="font-semibold">{selectedRequest.doctor?.license_number || 'Chưa cập nhật'}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <h4 className="font-semibold text-slate-700">Tài liệu đính kèm</h4>
              
              <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  <span className="font-medium">Giấy phép hành nghề</span>
                </div>
                {selectedRequest.doctor?.license_file ? (
                  <a href={selectedRequest.doctor.license_file} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center text-sm">
                    <Download className="w-4 h-4 mr-1" /> Xem / Tải về
                  </a>
                ) : (
                  <span className="text-sm text-slate-400 italic">Không có file</span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  <span className="font-medium">Chứng chỉ hành nghề</span>
                </div>
                {selectedRequest.doctor?.certificate_file ? (
                  <a href={selectedRequest.doctor.certificate_file} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center text-sm">
                    <Download className="w-4 h-4 mr-1" /> Xem / Tải về
                  </a>
                ) : (
                  <span className="text-sm text-slate-400 italic">Không có file</span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  <span className="font-medium">CV / Hồ sơ năng lực</span>
                </div>
                {selectedRequest.doctor?.cv_file ? (
                  <a href={selectedRequest.doctor.cv_file} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center text-sm">
                    <Download className="w-4 h-4 mr-1" /> Xem / Tải về
                  </a>
                ) : (
                  <span className="text-sm text-slate-400 italic">Không có file</span>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-slate-700 mb-2">Lời nhắn ứng tuyển</h4>
              <div className="p-3 border rounded-lg bg-slate-50 text-slate-700 whitespace-pre-wrap">
                {selectedRequest.cover_letter || <span className="italic text-slate-400">Không có lời nhắn</span>}
              </div>
            </div>

            {selectedRequest.status === 'pending' && (
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <Button variant="ghost" onClick={() => setSelectedRequest(null)}>
                  Đóng
                </Button>
                <Button variant="outline" onClick={() => handleApprove(selectedRequest.id)}>
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-1" /> Duyệt
                </Button>
                <Button variant="danger" onClick={() => handleReject(selectedRequest.id)}>
                  <XCircle className="w-4 h-4 mr-1" /> Từ chối
                </Button>
              </div>
            )}
            {selectedRequest.status !== 'pending' && (
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <Button variant="primary" onClick={() => setSelectedRequest(null)}>
                  Đóng
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

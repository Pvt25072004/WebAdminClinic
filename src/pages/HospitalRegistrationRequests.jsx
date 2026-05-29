import { useEffect, useState } from "react";
import Button from "../components/Button";
import { CheckCircle, XCircle, FileText, AlertTriangle, ChevronLeft, Flag } from "lucide-react";
import { useNotification } from "../contexts/NotificationContext";
import {
  getHospitalRegistrations,
  updateHospitalRegistrationStatus,
} from "../services/admin.hospital.registration.api";

export default function HospitalRegistrationRequests() {
  const { showSuccess, showError, confirm } = useNotification();
  const [requests, setRequests] = useState([]);
  const [selectedReq, setSelectedReq] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null); // URL of document to preview
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getHospitalRegistrations();
      setRequests(data);
    } catch (err) {
      showError("Lỗi khi tải danh sách đăng ký");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line
  }, []);

  const handleAction = async (id, status, notes = "") => {
    try {
      setActionLoading(true);
      await updateHospitalRegistrationStatus(id, {
        status,
        revision_notes: notes,
      });
      showSuccess(`Đã cập nhật trạng thái thành: ${status}`);
      setSelectedReq(null);
      setShowRejectInput(false);
      setRejectReason("");
      fetchRequests();
    } catch (error) {
      showError(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Chờ duyệt</span>;
      case "approved":
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Đã duyệt</span>;
      case "rejected":
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Từ chối</span>;
      case "needs_revision":
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">Yêu cầu sửa</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (selectedReq) {
    // Split View
    return (
      <div className="h-[calc(100vh-6rem)] flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white p-4 border-b flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedReq(null)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold">Duyệt Hồ Sơ Cơ Sở Y Tế</h2>
              <p className="text-sm text-gray-500">
                {selectedReq.hospital_name} - {getStatusBadge(selectedReq.status)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {selectedReq.status === 'pending' && (
              <>
                {!showRejectInput ? (
                  <>
                    <Button
                      variant="danger"
                      onClick={() => setShowRejectInput(true)}
                      disabled={actionLoading}
                    >
                      Từ chối / Yêu cầu sửa
                    </Button>
                    <Button
                      onClick={() => {
                        confirm({
                          title: "Phê duyệt cơ sở y tế",
                          content: "Sau khi phê duyệt, hệ thống sẽ gửi mật khẩu đăng nhập cho Bệnh viện qua email.",
                          onConfirm: () => handleAction(selectedReq.id, "approved"),
                        });
                      }}
                      disabled={actionLoading}
                    >
                      {actionLoading ? "Đang xử lý..." : "Phê duyệt ngay"}
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Nhập lý do từ chối / cần sửa..."
                      className="px-3 py-2 border rounded-lg text-sm w-64"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        if(!rejectReason) return showError("Vui lòng nhập lý do");
                        handleAction(selectedReq.id, "needs_revision", rejectReason);
                      }}
                      disabled={actionLoading}
                    >
                      Yêu cầu sửa
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        if(!rejectReason) return showError("Vui lòng nhập lý do");
                        confirm({
                          title: "Từ chối hoàn toàn?",
                          content: "Bạn có chắc chắn muốn từ chối hồ sơ này?",
                          onConfirm: () => handleAction(selectedReq.id, "rejected", rejectReason),
                        });
                      }}
                      disabled={actionLoading}
                    >
                      Từ chối
                    </Button>
                    <button onClick={() => setShowRejectInput(false)} className="text-gray-500 hover:text-gray-800 text-sm ml-2">Hủy</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Split Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Info Text */}
          <div className="w-1/3 min-w-[400px] border-r bg-white p-6 overflow-y-auto">
            <div className="space-y-6">
              <section>
                <h3 className="font-bold text-lg text-blue-800 border-b pb-2 mb-3">1. Thông tin Admin</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500 w-32 inline-block">Email:</span> <b>{selectedReq.admin_email}</b></p>
                  <p><span className="text-gray-500 w-32 inline-block">Họ tên:</span> {selectedReq.admin_name}</p>
                  <p><span className="text-gray-500 w-32 inline-block">SĐT:</span> {selectedReq.admin_phone}</p>
                  <p><span className="text-gray-500 w-32 inline-block">Chức vụ:</span> {selectedReq.admin_role}</p>
                </div>
              </section>

              <section>
                <h3 className="font-bold text-lg text-blue-800 border-b pb-2 mb-3">2. Thông tin Cơ sở</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500 w-32 inline-block">Tên cơ sở:</span> <b>{selectedReq.hospital_name}</b></p>
                  <p><span className="text-gray-500 w-32 inline-block">Loại hình:</span> {selectedReq.hospital_type}</p>
                  <p><span className="text-gray-500 w-32 inline-block">Mã số thuế:</span> {selectedReq.business_license_number}</p>
                  <p><span className="text-gray-500 w-32 inline-block">Quy mô:</span> {selectedReq.scale}</p>
                  <p><span className="text-gray-500 w-32 inline-block">Địa chỉ:</span> {selectedReq.address}, {selectedReq.ward}, {selectedReq.district}, {selectedReq.province}</p>
                  <p><span className="text-gray-500 w-32 inline-block">Hotline:</span> {selectedReq.hotline}</p>
                </div>
              </section>

              <section>
                <h3 className="font-bold text-lg text-blue-800 border-b pb-2 mb-3">3. Giấy tờ & Tài liệu</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => setPreviewDoc(selectedReq.operating_license_url)}
                    className={`w-full text-left p-3 rounded-lg border flex items-center gap-3 transition ${previewDoc === selectedReq.operating_license_url ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}
                  >
                    <FileText className="text-blue-500" />
                    <div>
                      <p className="font-medium text-sm">Giấy phép hoạt động</p>
                      <p className="text-xs text-gray-500">Nhấn để xem</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => setPreviewDoc(selectedReq.business_license_url)}
                    className={`w-full text-left p-3 rounded-lg border flex items-center gap-3 transition ${previewDoc === selectedReq.business_license_url ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}
                  >
                    <FileText className="text-blue-500" />
                    <div>
                      <p className="font-medium text-sm">Giấy phép kinh doanh</p>
                      <p className="text-xs text-gray-500">Nhấn để xem</p>
                    </div>
                  </button>
                  
                  {selectedReq.logo_url && (
                    <button 
                      onClick={() => setPreviewDoc(selectedReq.logo_url)}
                      className={`w-full text-left p-3 rounded-lg border flex items-center gap-3 transition ${previewDoc === selectedReq.logo_url ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}
                    >
                      <FileText className="text-blue-500" />
                      <div>
                        <p className="font-medium text-sm">Logo cơ sở</p>
                        <p className="text-xs text-gray-500">Nhấn để xem</p>
                      </div>
                    </button>
                  )}
                </div>
              </section>
            </div>
          </div>

          {/* Right: PDF/Image Viewer */}
          <div className="flex-1 bg-gray-200 p-4 relative">
            {previewDoc ? (
              <div className="w-full h-full bg-white rounded-lg shadow flex items-center justify-center overflow-hidden">
                {previewDoc.endsWith('.pdf') ? (
                  <iframe src={previewDoc} className="w-full h-full" title="PDF Viewer" />
                ) : (
                  <img src={previewDoc} alt="Document" className="max-w-full max-h-full object-contain" />
                )}
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <FileText className="w-16 h-16 mb-4 opacity-50" />
                <p>Chọn một tài liệu ở cột bên trái để xem trước</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Đơn Đăng Ký Đối Tác (Bệnh viện)</h1>
          <p className="text-gray-500">Quản lý và xét duyệt các cơ sở y tế muốn tham gia hệ thống.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Không có đơn đăng ký nào.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-4 font-semibold text-gray-600">ID</th>
                <th className="p-4 font-semibold text-gray-600">Ngày gửi</th>
                <th className="p-4 font-semibold text-gray-600">Cơ sở y tế</th>
                <th className="p-4 font-semibold text-gray-600">Email đại diện</th>
                <th className="p-4 font-semibold text-gray-600">Trạng thái</th>
                <th className="p-4 font-semibold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">#{req.id}</td>
                  <td className="p-4">{new Date(req.created_at).toLocaleDateString("vi-VN")}</td>
                  <td className="p-4 font-medium">{req.hospital_name || "Chưa điền"}</td>
                  <td className="p-4">{req.admin_email}</td>
                  <td className="p-4">{getStatusBadge(req.status)}</td>
                  <td className="p-4">
                    <Button variant="outline" onClick={() => {
                      setSelectedReq(req);
                      setPreviewDoc(req.operating_license_url || req.business_license_url);
                    }}>
                      Xem chi tiết
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import Button from "../components/Button";
import { CheckCircle, XCircle, FileText, AlertTriangle, ChevronLeft, Flag } from "lucide-react";
import { useNotification } from "../contexts/NotificationContext";
import {
  getHospitalRegistrations,
  updateHospitalRegistrationStatus,
  updateHospitalRegistrationDetails
} from "../services/admin.hospital.registration.api";

export default function HospitalRegistrationRequests() {
  const { showSuccess, showError, confirm } = useNotification();
  const [requests, setRequests] = useState([]);
  const [selectedReq, setSelectedReq] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null); // URL of document to preview
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState(null);

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
      setShowRejectModal(false);
      setRejectReason("");
      fetchRequests();
    } catch (error) {
      showError(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await updateHospitalRegistrationDetails(editForm.id, editForm);
      showSuccess("Cập nhật thông tin thành công");
      setShowEditModal(false);
      // Cập nhật lại list requests
      fetchRequests();
      // Update selectedReq if it's currently open
      setSelectedReq(prev => ({ ...prev, ...editForm }));
    } catch (error) {
      showError(error.response?.data?.message || "Có lỗi khi cập nhật");
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
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditForm(selectedReq);
                        setShowEditModal(true);
                      }}
                      disabled={actionLoading}
                    >
                      Sửa hồ sơ
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionLoading}
                    >
                      Từ chối / Yêu cầu sửa
                    </Button>
                    <Button
                      onClick={async () => {
                        const isConfirmed = await confirm(
                          "Phê duyệt cơ sở y tế",
                          "Sau khi phê duyệt, hệ thống sẽ gửi mật khẩu đăng nhập cho Bệnh viện qua email."
                        );
                        if (isConfirmed) {
                          handleAction(selectedReq.id, "approved");
                        }
                      }}
                      disabled={actionLoading}
                    >
                      {actionLoading ? "Đang xử lý..." : "Phê duyệt ngay"}
                    </Button>
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

        {/* Modal Reject */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-[500px] overflow-hidden">
              <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-800">Từ chối / Yêu cầu sửa đổi</h3>
                <button onClick={() => setShowRejectModal(false)}><XCircle className="text-gray-400 hover:text-gray-600" /></button>
              </div>
              <div className="p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Lý do (Sẽ được gửi qua Email)</label>
                <textarea 
                  className="w-full border rounded-lg p-3 text-sm focus:ring focus:ring-blue-200 outline-none h-32"
                  placeholder="Nhập chi tiết lý do từ chối hoặc cần sửa đổi (ví dụ: Ảnh giấy phép mờ, vui lòng chụp lại...)"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
              </div>
              <div className="p-4 border-t flex justify-end gap-3 bg-gray-50">
                <Button variant="secondary" onClick={() => setShowRejectModal(false)}>Hủy</Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    if(!rejectReason) return showError("Vui lòng nhập lý do");
                    handleAction(selectedReq.id, "needs_revision", rejectReason);
                  }}
                  disabled={actionLoading}
                >Yêu cầu sửa</Button>
                <Button 
                  variant="danger" 
                  onClick={() => {
                    if(!rejectReason) return showError("Vui lòng nhập lý do");
                    handleAction(selectedReq.id, "rejected", rejectReason);
                  }}
                  disabled={actionLoading}
                >Từ chối hoàn toàn</Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Edit Form */}
        {showEditModal && editForm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-800">Chỉnh sửa hồ sơ (Admin hỗ trợ sửa)</h3>
                <button onClick={() => setShowEditModal(false)}><XCircle className="text-gray-400 hover:text-gray-600" /></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <form id="editRegForm" onSubmit={handleUpdateDetails} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1 font-medium">Tên bệnh viện/cơ sở</label>
                      <input className="w-full border rounded p-2" value={editForm.hospital_name || ''} onChange={e => setEditForm({...editForm, hospital_name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1 font-medium">Loại hình</label>
                      <input className="w-full border rounded p-2" value={editForm.hospital_type || ''} onChange={e => setEditForm({...editForm, hospital_type: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1 font-medium">Hotline cơ sở</label>
                      <input className="w-full border rounded p-2" value={editForm.hotline || ''} onChange={e => setEditForm({...editForm, hotline: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1 font-medium">Mã số thuế / GPKD</label>
                      <input className="w-full border rounded p-2" value={editForm.business_license_number || ''} onChange={e => setEditForm({...editForm, business_license_number: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm mb-1 font-medium">Địa chỉ chi tiết (Số nhà, đường...)</label>
                      <input className="w-full border rounded p-2" value={editForm.address || ''} onChange={e => setEditForm({...editForm, address: e.target.value})} />
                    </div>
                  </div>
                  
                  {/* Có thể thêm phần upload file ở đây nếu muốn hỗ trợ Admin upload ảnh thay cho BV */}
                  <div className="p-4 bg-blue-50 text-blue-800 text-sm rounded border border-blue-200 mt-4">
                    <b>Lưu ý:</b> Lưu thông tin này sẽ thay đổi trực tiếp hồ sơ đăng ký của cơ sở.
                  </div>
                </form>
              </div>
              <div className="p-4 border-t flex justify-end gap-3 bg-gray-50">
                <Button variant="secondary" onClick={() => setShowEditModal(false)}>Hủy</Button>
                <Button type="submit" form="editRegForm" disabled={actionLoading}>Lưu thay đổi</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Đơn Đăng Ký Đối Tác</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý và xét duyệt các cơ sở y tế muốn tham gia hệ thống.</p>
          <p className="text-sm font-medium text-emerald-600 mt-1">
            Tổng số: {requests.length} đơn đăng ký
          </p>
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
                <th className="p-4 font-semibold text-gray-600 w-16">STT</th>
                <th className="p-4 font-semibold text-gray-600">ID</th>
                <th className="p-4 font-semibold text-gray-600">Ngày gửi</th>
                <th className="p-4 font-semibold text-gray-600">Cơ sở y tế</th>
                <th className="p-4 font-semibold text-gray-600">Email đại diện</th>
                <th className="p-4 font-semibold text-gray-600">Trạng thái</th>
                <th className="p-4 font-semibold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req, index) => (
                <tr key={req.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 text-slate-500 font-medium">{index + 1}</td>
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

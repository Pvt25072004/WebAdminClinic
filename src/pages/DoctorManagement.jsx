import React, { useEffect, useState, useMemo } from "react";
import Button from "../components/Button";
import Pagination from "../components/Pagination";
import CardSkeleton from "../components/CardSkeleton";
import EmptyState from "../components/EmptyState";
import { ToggleRight, ToggleLeft, Eye, X, FileText, Inbox } from "lucide-react";
import {
  getDoctors,
  createDoctor,
  toggleDoctorActive,
  deleteDoctor,
  unlinkDoctor,
} from "../services/admin.doctors.api";
import { getCategories } from "../services/admin.categories.api";
import { useNotification } from "../contexts/NotificationContext";
import { useAuth } from "../contexts/AuthContext";
import { uploadUserImage } from "../services/api";

export default function DoctorManagement() {
  const { user } = useAuth();
  const { showSuccess, showError, confirm, prompt } = useNotification();
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [doctorForm, setDoctorForm] = useState({
    name: "",
    specialty: "",
    email: "",
    phone: "",
    password: "",
    description: "",
    category_id: "",
    degree: "",
    experience_years: "",
    license_number: "",
    license_file: "",
    certificate_file: "",
    cv_file: "",
    consultation_fee: 200000,
  });
  const fileInputRef = React.useRef(null);
  const [currentUploadTarget, setCurrentUploadTarget] = useState(null);

  const handleFileUploadClick = (targetField) => {
    setCurrentUploadTarget(targetField);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !currentUploadTarget) return;

    try {
      showSuccess("Đang tải file lên...");
      const result = await uploadUserImage(file);
      if (result && result.image_url) {
        setDoctorForm((prev) => ({
          ...prev,
          [currentUploadTarget]: result.image_url,
        }));
        showSuccess("Tải file thành công!");
      }
    } catch (error) {
      showError("Lỗi tải file: " + error.message);
    }
  };

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Load categories error:", e);
    } finally {
      setLoadingCategories(false);
    }
  };
  const loadDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const currentHospitalId = user?.hospital_id || user?.hospital?.id;
      const responseData = await getDoctors(currentHospitalId, currentPage, limit);
      let actualDoctors = responseData?.data ? responseData.data : (Array.isArray(responseData) ? responseData : []);
      
      if (user?.role === 'admin_hospital' && currentHospitalId) {
        actualDoctors = actualDoctors.filter(d => 
          d.hospital_id === currentHospitalId || 
          (d.hospitals && d.hospitals.some(h => h.id === currentHospitalId))
        );
      }
      
      setDoctors(actualDoctors);
      if (responseData?.total) setTotalItems(responseData.total);
      if (responseData?.totalPages) setTotalPages(responseData.totalPages);
    } catch (e) {
      console.error("Load doctors error:", e);
    } finally {
      setLoadingDoctors(false);
    }
  };
  const handleToggleDoctor = async (doctor) => {
    const actionName = doctor.is_active ? "Tạm khóa" : "Mở khóa";
    
    if (user?.role === 'admin_hospital') {
      const reason = await prompt(
        `${actionName} tài khoản bác sĩ`,
        `Nhập lý do ${actionName.toLowerCase()} (bắt buộc):`
      );
      if (!reason) {
        if (reason === "") showError("Lý do là bắt buộc!");
        return; 
      }
    } else {
      const isConfirm = await confirm(
        `Xác nhận ${actionName.toLowerCase()}`,
        `Bạn có chắc chắn muốn ${actionName.toLowerCase()} tài khoản bác sĩ này?`
      );
      if (!isConfirm) return;
    }

    try {
      await toggleDoctorActive(doctor.id);
      showSuccess(
        `Đã ${actionName.toLowerCase()} tài khoản bác sĩ`,
      );
      void loadDoctors();
    } catch (e) {
      showError(e.message || "Không thể cập nhật trạng thái bác sĩ");
    }
  };

  const handleDeleteDoctor = async (id) => {
    if (user?.role === 'admin_hospital') {
      const reason = await prompt("Hủy liên kết bác sĩ", "Nhập lý do hủy liên kết (lý do này sẽ được gửi email thông báo cho bác sĩ):");
      if (reason === null) return; // User cancelled prompt

      try {
        await unlinkDoctor(id, reason);
        showSuccess("Đã hủy liên kết bác sĩ khỏi bệnh viện");
        void loadDoctors();
      } catch (e) {
        showError(e.message || "Không thể hủy liên kết bác sĩ");
      }
      return;
    }

    const isConfirm = await confirm(
      "Xác nhận xóa",
      "Bạn có chắc muốn xóa bác sĩ này khỏi hệ thống?",
      { variant: "danger", confirmText: "Xóa" },
    );
    if (!isConfirm) return;

    try {
      await deleteDoctor(id);
      showSuccess("Đã xóa tài khoản bác sĩ");
      void loadDoctors();
    } catch (e) {
      showError(e.message || "Không thể xóa bác sĩ");
    }
  };

  const handleSubmitDoctor = async (e) => {
    e.preventDefault();
    try {
      await createDoctor({
        ...doctorForm,
        category_id: doctorForm.category_id
          ? Number(doctorForm.category_id)
          : undefined,
        experience_years: doctorForm.experience_years
          ? Number(doctorForm.experience_years)
          : 0,
        consultation_fee: doctorForm.consultation_fee ? Number(doctorForm.consultation_fee) : 200000,
        hospital_id: user?.hospital_id || user?.hospital?.id,
      });
      setDoctorForm({
        name: "",
        specialty: "",
        email: "",
        phone: "",
        password: "",
        description: "",
        category_id: "",
        degree: "",
        experience_years: "",
        license_number: "",
        license_file: "",
        certificate_file: "",
        cv_file: "",
        consultation_fee: 200000,
      });
      showSuccess("Tạo tài khoản bác sĩ thành công");
      void loadDoctors();
    } catch (e) {
      showError(e.message || "Không thể tạo bác sĩ");
    }
  };
  const [showDoctorForm, setShowDoctorForm] = useState(false);

  useEffect(() => {
    void loadDoctors();
    void loadCategories();
  }, [user?.hospital_id, user?.hospital?.id, currentPage, limit]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Quản lý bác sĩ
          </h2>
          <p className="text-sm text-slate-500">
            Phê duyệt & khóa tài khoản bác sĩ
          </p>
          <p className="text-sm font-medium text-emerald-600 mt-1">
            Tổng số: {totalItems} bác sĩ
          </p>
        </div>
        <div className="flex gap-3">
          {showDoctorForm && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setDoctorForm({
                  name: "",
                  specialty: "",
                  email: "",
                  phone: "",
                  password: "",
                  description: "",
                  category_id: "",
                  degree: "",
                  experience_years: "",
                  license_number: "",
                  license_file: "",
                  certificate_file: "",
                  cv_file: "",
                  consultation_fee: 200000,
                })
              }
            >
              Reset Form
            </Button>
          )}
          <Button
            size="sm"
            variant={showDoctorForm ? "danger" : "primary"}
            onClick={() => setShowDoctorForm(!showDoctorForm)}
          >
            {showDoctorForm ? "Đóng Form" : "Tạo Bác Sĩ Mới"}
          </Button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,.pdf"
      />

      {/* Form tạo bác sĩ */}
      {showDoctorForm && (
        <form onSubmit={handleSubmitDoctor} className="mb-6 grid gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Họ tên bác sĩ
            </label>
            <input
              type="text"
              value={doctorForm.name}
              onChange={(e) =>
                setDoctorForm((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Chuyên khoa
            </label>
            <select
              value={doctorForm.category_id}
              onChange={(e) => {
                const categoryId = e.target.value ? Number(e.target.value) : "";
                const selected = categories.find(
                  (c) => c.id === Number(e.target.value),
                );
                setDoctorForm((prev) => ({
                  ...prev,
                  category_id: categoryId,
                  specialty: selected?.name || prev.specialty,
                }));
              }}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Chọn chuyên khoa</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={doctorForm.email}
              onChange={(e) =>
                setDoctorForm((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Số điện thoại
            </label>
            <input
              type="text"
              value={doctorForm.phone}
              onChange={(e) =>
                setDoctorForm((prev) => ({
                  ...prev,
                  phone: e.target.value,
                }))
              }
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mật khẩu đăng nhập
            </label>
            <input
              type="password"
              value={doctorForm.password}
              onChange={(e) =>
                setDoctorForm((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mô tả ngắn
            </label>
            <input
              type="text"
              value={doctorForm.description}
              onChange={(e) =>
                setDoctorForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Bằng cấp
            </label>
            <input
              type="text"
              value={doctorForm.degree}
              onChange={(e) =>
                setDoctorForm((prev) => ({ ...prev, degree: e.target.value }))
              }
              placeholder="VD: Tiến sĩ, Thạc sĩ..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Năm kinh nghiệm
            </label>
            <input
              type="number"
              value={doctorForm.experience_years}
              onChange={(e) =>
                setDoctorForm((prev) => ({
                  ...prev,
                  experience_years: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Số phép hành nghề
            </label>
            <input
              type="text"
              value={doctorForm.license_number}
              onChange={(e) =>
                setDoctorForm((prev) => ({
                  ...prev,
                  license_number: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phí khám bệnh (VNĐ)
            </label>
            <input
              type="number"
              value={doctorForm.consultation_fee}
              onChange={(e) =>
                setDoctorForm((prev) => ({
                  ...prev,
                  consultation_fee: Number(e.target.value),
                }))
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 border-t border-slate-100 pt-4 mt-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Giấy phép hành nghề (PDF/JPG) ⭐
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={doctorForm.license_file}
                readOnly
                placeholder="URL file..."
                className="flex-1 px-3 py-2 border rounded-lg bg-slate-50 text-slate-500 text-sm"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleFileUploadClick("license_file")}
              >
                Tải lên
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Chứng chỉ hành nghề (PDF/JPG) ⭐
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={doctorForm.certificate_file}
                readOnly
                placeholder="URL file..."
                className="flex-1 px-3 py-2 border rounded-lg bg-slate-50 text-slate-500 text-sm"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleFileUploadClick("certificate_file")}
              >
                Tải lên
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              CV / Hồ sơ (PDF/JPG)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={doctorForm.cv_file}
                readOnly
                placeholder="URL file..."
                className="flex-1 px-3 py-2 border rounded-lg bg-slate-50 text-slate-500 text-sm"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleFileUploadClick("cv_file")}
              >
                Tải lên
              </Button>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" size="sm" variant="primary">
            Tạo bác sĩ
          </Button>
        </div>
      </form>
      )}

      <div className="space-y-4">
        {loadingDoctors && <CardSkeleton count={4} />}
        {!loadingDoctors && doctors.length === 0 && (
          <div className="bg-white border border-slate-100 rounded-xl">
            <EmptyState 
              icon={Inbox} 
              title="Chưa có bác sĩ nào" 
              description="Không tìm thấy dữ liệu bác sĩ (hoặc API chưa trả dữ liệu)." 
            />
          </div>
        )}
        {!loadingDoctors && doctors.map((doctor, index) => {
          // Xử lý an toàn vì cấu trúc Doctor đã thay đổi (thông tin auth nằm trong doctor.user)
          const name = doctor.user?.full_name || doctor.name || "Chưa có tên";
          const email = doctor.user?.email || "Chưa có email";
          const phone = doctor.user?.phone || "Chưa có SĐT";
          const isActive = doctor.verification_status === "active";
          const stt = (currentPage - 1) * limit + index + 1;

          return (
            <div
              key={doctor.id}
              className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded">#{stt}</span>
                    <h3 className="font-semibold text-slate-900">{name}</h3>
                  </div>
                  <p className="text-sm text-slate-500">
                    {doctor.specialty}
                    {doctor.category?.name
                      ? ` · Chuyên khoa: ${doctor.category.name}`
                      : ""}
                  </p>
                  <p className="text-xs text-slate-400">
                    Email: {email} · SĐT: {phone}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    title="Xem chi tiết"
                    className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                    onClick={() => setSelectedDoctor(doctor)}
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-sm text-slate-600"
                    onClick={() => handleToggleDoctor(doctor)}
                  >
                    {isActive ? (
                      <>
                        <ToggleRight className="text-emerald-500" />
                        <span>Đang hoạt động</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="text-slate-400" />
                        <span>Tạm khóa</span>
                      </>
                    )}
                  </button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDeleteDoctor(doctor.id)}
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {!loadingDoctors && doctors.length > 0 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          itemsPerPage={limit}
        />
      )}

      {/* Modal chi tiết bác sĩ */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-semibold text-slate-900">Thông tin chi tiết Bác sĩ</h3>
              <button
                onClick={() => setSelectedDoctor(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto">
              <div className="flex flex-col sm:flex-row gap-6 mb-8">
                <div className="shrink-0 mx-auto sm:mx-0">
                  <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                    {selectedDoctor.user?.avatar_url ? (
                      <img src={selectedDoctor.user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl text-slate-300 font-medium">
                        {(selectedDoctor.user?.full_name || "BS")?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 text-center sm:text-left space-y-1">
                  <h4 className="text-xl font-bold text-slate-900">
                    {selectedDoctor.user?.full_name || "Chưa cập nhật tên"}
                  </h4>
                  <p className="text-emerald-600 font-medium">
                    {selectedDoctor.category?.name ? `Chuyên khoa: ${selectedDoctor.category.name}` : "Chưa cập nhật chuyên khoa"}
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                      Bằng cấp: <strong className="text-slate-700">{selectedDoctor.degree || "Chưa cập nhật"}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                      Kinh nghiệm: <strong className="text-slate-700">{selectedDoctor.experience_years ? `${selectedDoctor.experience_years} năm` : "Chưa cập nhật"}</strong>
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    Trạng thái: <strong className={selectedDoctor.verification_status === 'active' ? "text-emerald-600" : "text-amber-600"}>{selectedDoctor.verification_status === 'active' ? 'Đang hoạt động' : 'Tạm khóa / Chờ duyệt'}</strong>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 mb-6">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <h5 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                    Thông tin liên hệ
                  </h5>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span className="font-medium text-slate-900">{selectedDoctor.user?.email || "Chưa cập nhật"}</span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="text-slate-500">Số điện thoại:</span>
                      <span className="font-medium text-slate-900">{selectedDoctor.user?.phone || "Chưa cập nhật"}</span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="text-slate-500">Giới tính:</span>
                      <span className="font-medium text-slate-900">
                        {selectedDoctor.user?.gender === 'male' ? 'Nam' : selectedDoctor.user?.gender === 'female' ? 'Nữ' : 'Khác'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <h5 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                    Hồ sơ pháp lý
                  </h5>
                  <div className="space-y-2 text-sm">
                    <p className="flex flex-col gap-1">
                      <span className="text-slate-500">Chứng chỉ hành nghề:</span>
                      <span className="font-medium text-slate-900">{selectedDoctor.license_number || "Chưa cập nhật"}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h5 className="text-sm font-semibold text-slate-900 mb-2">Giới thiệu bản thân</h5>
                <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 min-h-[80px]">
                  {selectedDoctor.description || "Chưa có thông tin giới thiệu."}
                </p>
              </div>

              <div>
                <h5 className="text-sm font-semibold text-slate-900 mb-3">Tài liệu đính kèm</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Giấy phép", url: selectedDoctor.license_file },
                    { label: "Chứng chỉ", url: selectedDoctor.certificate_file },
                    { label: "CV / Hồ sơ", url: selectedDoctor.cv_file }
                  ].map((doc, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-lg p-3 flex items-center justify-between hover:border-emerald-200 transition-colors bg-white">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText size={16} className="text-slate-400 shrink-0" />
                        <span className="text-sm font-medium text-slate-700 truncate">{doc.label}</span>
                      </div>
                      {doc.url ? (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium shrink-0 ml-2 bg-emerald-50 px-2 py-1 rounded">
                          Xem
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 shrink-0 ml-2 italic">Trống</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <Button variant="secondary" onClick={() => setSelectedDoctor(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

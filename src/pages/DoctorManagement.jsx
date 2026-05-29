import React, { useEffect, useState, useMemo } from "react";
import Button from "../components/Button";
import { ToggleRight, ToggleLeft } from "lucide-react";
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
  const { showSuccess, showError, confirm } = useNotification();
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
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
      const data = await getDoctors(user?.hospital_id);
      setDoctors(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Load doctors error:", e);
    } finally {
      setLoadingDoctors(false);
    }
  };
  const handleToggleDoctor = async (doctor) => {
    try {
      await toggleDoctorActive(doctor.id);
      showSuccess(
        `Đã ${doctor.is_active ? "tạm khóa" : "mở khóa"} tài khoản bác sĩ`,
      );
      void loadDoctors();
    } catch (e) {
      showError(e.message || "Không thể cập nhật trạng thái bác sĩ");
    }
  };

  const handleDeleteDoctor = async (id) => {
    if (user?.role === 'admin_hospital') {
      const reason = window.prompt("Nhập lý do hủy liên kết (lý do này sẽ được gửi email thông báo cho bác sĩ):");
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
        hospital_id: user?.hospital_id,
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
      });
      showSuccess("Tạo tài khoản bác sĩ thành công");
      void loadDoctors();
    } catch (e) {
      showError(e.message || "Không thể tạo bác sĩ");
    }
  };
  useEffect(() => {
    void loadDoctors();
    void loadCategories();
  }, [user?.hospital_id]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Quản lý bác sĩ
          </h2>
          <p className="text-sm text-slate-500">
            Phê duyệt & khóa tài khoản bác sĩ
          </p>
        </div>
        <Button
          size="sm"
          variant="primary"
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
            })
          }
        >
          Reset
        </Button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,.pdf"
      />

      {/* Form tạo bác sĩ */}
      <form onSubmit={handleSubmitDoctor} className="mb-6 grid gap-4">
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

      <div className="space-y-4">
        {loadingDoctors && (
          <p className="text-sm text-slate-500">Đang tải danh sách bác sĩ...</p>
        )}
        {!loadingDoctors && doctors.length === 0 && (
          <p className="text-sm text-slate-500">
            Chưa có bác sĩ nào (hoặc API chưa trả dữ liệu).
          </p>
        )}
        {doctors.map((doctor) => {
          // Xử lý an toàn vì cấu trúc Doctor đã thay đổi (thông tin auth nằm trong doctor.user)
          const name = doctor.user?.full_name || doctor.name || "Chưa có tên";
          const email = doctor.user?.email || "Chưa có email";
          const phone = doctor.user?.phone || "Chưa có SĐT";
          const isActive = doctor.verification_status === "active";

          return (
            <div
              key={doctor.id}
              className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-900">{name}</h3>
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
    </div>
  );
}

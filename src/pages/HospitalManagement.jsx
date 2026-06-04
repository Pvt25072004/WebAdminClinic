import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Building,
  Stethoscope,
  Users,
  Layers,
  Activity,
  Shield,
  Banknote,
  Eye,
  ClipboardList,
  Search,
  Plus,
  Edit3,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Home,
  X,
  Inbox,
} from "lucide-react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import Button from "../components/Button";
import CardSkeleton from "../components/CardSkeleton";
import EmptyState from "../components/EmptyState";
import {
  getHospitals,
  updateHospital,
  deleteHospital,
} from "../services/admin.hospitals.api";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/admin.categories.api";
import { useNotification } from "../contexts/NotificationContext";
import { uploadUserImage } from "../services/api";

export default function HospitalManagement() {
  const { showSuccess, showError, confirm } = useNotification();
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
  });
  const location = useLocation();
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [editingHospital, setEditingHospital] = useState(null);
  const [viewingHospital, setViewingHospital] = useState(null);
  const [hospitalForm, setHospitalForm] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    main_specialty: "",
    categoryIds: [],
    is_active: true,
    logo_url: "",
    description: "",
  });

  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const result = await uploadUserImage(file);
      if (result && result.image_url) {
        setHospitalForm((prev) => ({
          ...prev,
          logo_url: result.image_url,
        }));
        showSuccess("Tải ảnh thành công!");
      }
    } catch (error) {
      showError("Lỗi tải ảnh: " + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const cities = Array.from(
    new Set(hospitals.map((h) => h.city?.name || h.city).filter(Boolean)),
  );

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
  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryForm({ name: "" });
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name || "" });
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, { name: categoryForm.name });
        showSuccess("Cập nhật chuyên khoa thành công");
      } else {
        await createCategory({ name: categoryForm.name });
        showSuccess("Tạo chuyên khoa thành công");
      }
      resetCategoryForm();
      void loadCategories();
    } catch (e) {
      showError(e.message || "Không thể lưu chuyên khoa");
    }
  };

  const handleDeleteCategory = async (id) => {
    const isConfirm = await confirm(
      "Xác nhận xóa",
      "Bạn có chắc muốn xóa chuyên khoa này?",
      { variant: "danger", confirmText: "Xóa" },
    );
    if (!isConfirm) return;

    try {
      await deleteCategory(id);
      showSuccess("Đã xóa chuyên khoa");
      void loadCategories();
    } catch (e) {
      showError(e.message || "Không thể xóa chuyên khoa");
    }
  };
  const loadHospitals = async () => {
    try {
      setLoadingHospitals(true);
      const data = await getHospitals();
      setHospitals(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Load hospitals error:", e);
    } finally {
      setLoadingHospitals(false);
    }
  };
  const handleEditHospital = (hospital) => {
    setEditingHospital(hospital);
    setHospitalForm({
      name: hospital.name || "",
      address: hospital.address || "",
      city: hospital.city?.name || hospital.city || "",
      phone: hospital.phone || "",
      email: hospital.email || "",
      main_specialty: hospital.main_specialty || "",
      // map categories -> ids (nếu có)
      categoryIds: Array.isArray(hospital.categories)
        ? hospital.categories.map((c) => c.id)
        : [],
      is_active: hospital.is_active ?? true,
      logo_url: hospital.logo_url || "",
      description: hospital.description || "",
    });
  };

  const handleToggleActive = async (hospital) => {
    try {
      await updateHospital(hospital.id, { is_active: !hospital.is_active });
      showSuccess(`Đã ${!hospital.is_active ? "mở khóa" : "khóa"} bệnh viện`);
      void loadHospitals();
    } catch (e) {
      showError(e.message || "Không thể cập nhật trạng thái");
    }
  };
  const handleSubmitHospital = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...hospitalForm,
        categoryIds: hospitalForm.categoryIds || [],
      };

      if (editingHospital) {
        await updateHospital(editingHospital.id, payload);
        showSuccess("Cập nhật bệnh viện thành công");
      } else {
        showError("Tính năng tạo mới bệnh viện đã được chuyển sang quy trình phê duyệt đối tác.");
      }
      resetForm();
      void loadHospitals();
    } catch (err) {
      showError(err.message || "Không thể lưu bệnh viện");
    }
  };
  const handleDeleteHospital = async (id) => {
    const isConfirm = await confirm(
      "Xác nhận xóa",
      "Bạn có chắc muốn xóa bệnh viện này?",
      { variant: "danger", confirmText: "Tiếp tục" },
    );
    if (!isConfirm) return;

    const reason = window.prompt("Vui lòng nhập lý do xóa để gửi qua Email cho bệnh viện:");
    if (reason === null) return; // User cancelled prompt

    try {
      await deleteHospital(id);
      showSuccess("Đã xóa bệnh viện. Lý do đã được gửi qua email.");
      void loadHospitals();
    } catch (e) {
      showError(e.message || "Không thể xóa bệnh viện");
    }
  };
  const resetForm = () => {
    setEditingHospital(null);
    setHospitalForm({
      name: "",
      address: "",
      city: "",
      phone: "",
      email: "",
      main_specialty: "",
      categoryIds: [],
      is_active: true,
      logo_url: "",
      description: "",
    });
  };

  useEffect(() => {
    void loadHospitals();
    void loadCategories();
  }, []);

  useEffect(() => {
    if (location.state?.selectedHospitalId && hospitals.length > 0) {
      const h = hospitals.find(x => x.id === location.state.selectedHospitalId);
      if (h) {
        setViewingHospital(h);
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state?.selectedHospitalId, hospitals]);

  const filteredHospitals = hospitals.filter((h) => {
    const matchSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase());
    const hCityName = h.city?.name || h.city;
    const matchCity = filterCity ? hCityName === filterCity : true;
    let matchStatus = true;
    if (filterStatus === "active") matchStatus = h.is_active !== false;
    if (filterStatus === "inactive") matchStatus = h.is_active === false;
    return matchSearch && matchCity && matchStatus;
  });
  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Quản lý bệnh viện
            </h2>
            <p className="text-sm text-slate-500">
              Thêm/Sửa/Xóa thông tin cơ sở y tế
            </p>
          </div>
          {editingHospital && (
            <Button
              size="sm"
              onClick={resetForm}
              variant="secondary"
            >
              Hủy chỉnh sửa
            </Button>
          )}
        </div>

        {/* Form sửa bệnh viện (Chỉ hiện khi Edit) */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
          accept="image/*"
        />

        {editingHospital && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-xl font-semibold text-slate-800">Cập nhật thông tin Bệnh viện</h3>
                <button 
                  type="button"
                  onClick={resetForm}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <form onSubmit={handleSubmitHospital} className="grid gap-4">
            <div className="flex items-center gap-4 mb-4">
            <div className="w-24 h-24 rounded-lg bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0 relative group">
              {hospitalForm.logo_url ? (
                <img
                  src={hospitalForm.logo_url}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building className="w-8 h-8 text-slate-400" />
              )}
              {uploadingImage && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <div 
                className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center cursor-pointer transition-all"
                onClick={() => !uploadingImage && fileInputRef.current?.click()}
              >
                <span className="text-white text-xs font-medium">Đổi ảnh</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-900 mb-1">Logo Bệnh viện</h3>
              <p className="text-xs text-slate-500 mb-2">Ảnh đại diện, tỷ lệ 1:1, dung lượng &lt; 2MB</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => !uploadingImage && fileInputRef.current?.click()}
                disabled={uploadingImage}
              >
                {uploadingImage ? "Đang tải..." : "Tải ảnh lên"}
              </Button>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tên bệnh viện
              </label>
              <input
                type="text"
                value={hospitalForm.name}
                onChange={(e) =>
                  setHospitalForm((prev) => ({
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
                Chuyên khoa chính
              </label>
              <input
                type="text"
                value={hospitalForm.main_specialty}
                onChange={(e) =>
                  setHospitalForm((prev) => ({
                    ...prev,
                    main_specialty: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Thành phố/Tỉnh
              </label>
              <input
                type="text"
                value={hospitalForm.city}
                onChange={(e) =>
                  setHospitalForm((prev) => ({
                    ...prev,
                    city: e.target.value,
                  }))
                }
                placeholder="Ví dụ: TP. Hồ Chí Minh, Hà Nội..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Địa chỉ cụ thể
              </label>
              <input
                type="text"
                value={hospitalForm.address}
                onChange={(e) =>
                  setHospitalForm((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
                placeholder="Số nhà, đường, phường/xã..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="text"
                value={hospitalForm.phone}
                onChange={(e) =>
                  setHospitalForm((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={hospitalForm.email}
                onChange={(e) =>
                  setHospitalForm((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          {/* Chọn nhiều chuyên khoa cho bệnh viện */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Chuyên khoa áp dụng
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const checked = hospitalForm.categoryIds?.includes(cat.id);
                return (
                  <label
                    key={cat.id}
                    className="inline-flex items-center gap-1 px-2 py-1 border rounded-full text-xs cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="rounded border-slate-300"
                      checked={!!checked}
                      onChange={(e) => {
                        setHospitalForm((prev) => {
                          const current = prev.categoryIds || [];
                          if (e.target.checked) {
                            return {
                              ...prev,
                              categoryIds: [...current, cat.id],
                            };
                          }
                          return {
                            ...prev,
                            categoryIds: current.filter((id) => id !== cat.id),
                          };
                        });
                      }}
                    />
                    <span>{cat.name}</span>
                  </label>
                );
              })}
              {!categories.length && (
                <span className="text-xs text-slate-400">
                  Chưa có dữ liệu chuyên khoa
                </span>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mô tả bệnh viện
            </label>
            <ReactQuill
              theme="snow"
              value={hospitalForm.description}
              onChange={(val) =>
                setHospitalForm((prev) => ({ ...prev, description: val }))
              }
              className="bg-white rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={resetForm}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary">
              Lưu thay đổi
            </Button>
          </div>
        </form>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Tìm kiếm
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tên bệnh viện..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
              />
            </div>
          </div>
          <div className="w-48">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Khu vực
            </label>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm bg-white"
            >
              <option value="">Tất cả khu vực</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Trạng thái
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm bg-white"
            >
              <option value="all">Tất cả</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Đã khóa</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
        <div className="space-y-4">
          {loadingHospitals && <CardSkeleton count={4} />}
          {!loadingHospitals && filteredHospitals.length === 0 && (
            <div className="bg-white border border-slate-100 rounded-xl">
              <EmptyState 
                icon={Inbox} 
                title="Chưa có cơ sở y tế nào" 
                description="Không tìm thấy cơ sở y tế nào phù hợp với bộ lọc." 
              />
            </div>
          )}
          {filteredHospitals.map((hospital) => (
            <div
              key={hospital.id}
              className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    {hospital.logo_url ? (
                      <img src={hospital.logo_url} className="w-8 h-8 rounded-md object-cover border" alt="" />
                    ) : (
                      <div className="w-8 h-8 rounded-md bg-slate-100 border flex items-center justify-center">
                        <Building className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    {hospital.name}
                  </h3>
                  {hospital.city && (
                    <p className="text-sm text-emerald-600 font-medium">
                      {hospital.city}
                    </p>
                  )}
                  <p className="text-sm text-slate-500">{hospital.address}</p>
                  <p className="text-sm text-slate-500">
                    Điện thoại: {hospital.phone} · Email: {hospital.email}
                  </p>
                  {hospital.main_specialty && (
                    <p className="text-sm text-slate-500">
                      Chuyên khoa chính: {hospital.main_specialty}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-sm hover:bg-slate-50 px-3 py-1.5 rounded-full transition-colors mb-2"
                    onClick={() => handleToggleActive(hospital)}
                  >
                    {(hospital.is_active ?? true) ? (
                      <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border border-emerald-100">
                        <ToggleRight className="w-3.5 h-3.5" /> Hoạt động
                      </span>
                    ) : (
                      <span className="bg-slate-50 text-slate-500 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border border-slate-200">
                        <ToggleLeft className="w-3.5 h-3.5" /> Khóa
                      </span>
                    )}
                  </button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Eye}
                      onClick={() => setViewingHospital(hospital)}
                    >
                      Xem
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Edit3}
                      onClick={() => handleEditHospital(hospital)}
                    >
                      Sửa
                    </Button>
                    <Button
                      variant="ghostDanger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => handleDeleteHospital(hospital.id)}
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Xem chi tiết Bệnh viện */}
        {viewingHospital && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
                <h3 className="text-xl font-semibold text-slate-800">Thông tin cơ sở y tế</h3>
                <button 
                  onClick={() => setViewingHospital(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <Eye className="w-5 h-5 hidden" />
                  <span className="text-xl font-bold leading-none">&times;</span>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <div className="flex items-start gap-6 mb-8">
                  <div className="w-24 h-24 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-sm flex items-center justify-center p-1">
                    {viewingHospital.logo_url ? (
                      <img src={viewingHospital.logo_url} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Building className="w-10 h-10 text-slate-300" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-slate-900 mb-1">{viewingHospital.name}</h4>
                    <div className="flex items-center gap-2 mb-3">
                      {(viewingHospital.is_active ?? true) ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold uppercase tracking-wide flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Đang hoạt động
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold uppercase tracking-wide flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span> Đang khóa
                        </span>
                      )}
                      {viewingHospital.main_specialty && (
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-wide">
                          {viewingHospital.main_specialty}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-2">
                      <Home className="w-4 h-4" /> {viewingHospital.address}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Liên hệ</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500 text-sm">Điện thoại:</span>
                        <span className="font-medium text-slate-900">{viewingHospital.phone || 'Chưa cập nhật'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 text-sm">Email:</span>
                        <span className="font-medium text-slate-900">{viewingHospital.email || 'Chưa cập nhật'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 text-sm">Khu vực:</span>
                        <span className="font-medium text-slate-900">{viewingHospital.city || 'Chưa cập nhật'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Chuyên khoa áp dụng</p>
                    <div className="flex flex-wrap gap-1.5">
                      {viewingHospital.categories && viewingHospital.categories.length > 0 ? (
                        viewingHospital.categories.map(cat => (
                          <span key={cat.id} className="px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs rounded-md shadow-sm">
                            {cat.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400 italic">Chưa có chuyên khoa nào</span>
                      )}
                    </div>
                  </div>
                </div>

                {viewingHospital.description && (
                  <div className="border-t border-slate-100 pt-6">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Giới thiệu Bệnh viện</p>
                    <div 
                      className="text-sm text-slate-700 prose prose-sm max-w-none bg-slate-50 p-4 rounded-xl border border-slate-100"
                      dangerouslySetInnerHTML={{ __html: viewingHospital.description }}
                    />
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleEditHospital(viewingHospital)}>Chỉnh sửa</Button>
                <Button onClick={() => setViewingHospital(null)}>Đóng</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

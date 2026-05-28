import { useState, useEffect } from "react";
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
} from "lucide-react";
import Button from "../components/Button";
import {
  getHospitals,
  createHospital,
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

export default function HospitalManagement() {
  const { showSuccess, showError, confirm } = useNotification();
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
  });
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [editingHospital, setEditingHospital] = useState(null);
  const [hospitalForm, setHospitalForm] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    main_specialty: "",
    categoryIds: [],
    is_active: true,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const cities = Array.from(
    new Set(hospitals.map((h) => h.city).filter(Boolean)),
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
      city: hospital.city || "",
      phone: hospital.phone || "",
      email: hospital.email || "",
      main_specialty: hospital.main_specialty || "",
      // map categories -> ids (nếu có)
      categoryIds: Array.isArray(hospital.categories)
        ? hospital.categories.map((c) => c.id)
        : [],
      is_active: hospital.is_active ?? true,
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
        await createHospital(payload);
        showSuccess("Tạo bệnh viện thành công");
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
      { variant: "danger", confirmText: "Xóa" },
    );
    if (!isConfirm) return;

    try {
      await deleteHospital(id);
      showSuccess("Đã xóa bệnh viện");
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
    });
  };

  useEffect(() => {
    void loadHospitals();
    void loadCategories();
  }, []);

  const filteredHospitals = hospitals.filter((h) => {
    const matchSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCity = filterCity ? h.city === filterCity : true;
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
          <Button
            size="sm"
            onClick={resetForm}
            variant={editingHospital ? "secondary" : "primary"}
            className={!editingHospital ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : ""}
          >
            {editingHospital ? "Hủy chỉnh sửa" : "Làm mới Form"}
          </Button>
        </div>

        {/* Form tạo / sửa bệnh viện */}
        <form onSubmit={handleSubmitHospital} className="mb-6 grid gap-4">
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
          <div className="flex justify-end gap-2">
            {editingHospital && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={resetForm}
              >
                Hủy
              </Button>
            )}
            <Button type="submit" variant="primary" size="sm">
              {editingHospital ? "Cập nhật bệnh viện" : "Tạo bệnh viện"}
            </Button>
          </div>
        </form>

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
          {loadingHospitals && (
            <p className="text-sm text-slate-500 text-center py-8">
              Đang tải danh sách bệnh viện...
            </p>
          )}
          {!loadingHospitals && filteredHospitals.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-8">
              Không tìm thấy bệnh viện nào.
            </p>
          )}
          {filteredHospitals.map((hospital) => (
            <div
              key={hospital.id}
              className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-900">
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
      </div>
    </>
  );
}

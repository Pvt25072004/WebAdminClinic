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
export default function HospitalManagement() {
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
  });

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
      } else {
        await createCategory({ name: categoryForm.name });
      }
      resetCategoryForm();
      void loadCategories();
    } catch (e) {
      alert(e.message || "Không thể lưu chuyên khoa");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa chuyên khoa này?")) return;
    try {
      await deleteCategory(id);
      void loadCategories();
    } catch (e) {
      alert(e.message || "Không thể xóa chuyên khoa");
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
    });
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
      } else {
        await createHospital(payload);
      }
      resetForm();
      void loadHospitals();
    } catch (err) {
      alert(err.message || "Không thể lưu bệnh viện");
    }
  };
  const handleDeleteHospital = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa bệnh viện này?")) return;
    try {
      await deleteHospital(id);
      void loadHospitals();
    } catch (e) {
      alert(e.message || "Không thể xóa bệnh viện");
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
    });
  };

  useEffect(() => {
    void loadHospitals();
    void loadCategories();
  }, []);
  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Quản lý bệnh viện
            </h2>
            <p className="text-sm text-gray-500">
              Thêm/Sửa/Xóa thông tin cơ sở y tế
            </p>
          </div>
          <Button
            size="sm"
            onClick={resetForm}
            variant={editingHospital ? "secondary" : "primary"}
          >
            {editingHospital ? "Tạo mới" : "Reset"}
          </Button>
        </div>

        {/* Form tạo / sửa bệnh viện */}
        <form onSubmit={handleSubmitHospital} className="mb-6 grid gap-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          {/* Chọn nhiều chuyên khoa cho bệnh viện */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="rounded border-gray-300"
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
                <span className="text-xs text-gray-400">
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

        <div className="space-y-4">
          {loadingHospitals && (
            <p className="text-sm text-gray-500">Đang tải bệnh viện...</p>
          )}
          {!loadingHospitals && hospitals.length === 0 && (
            <p className="text-sm text-gray-500">
              Chưa có bệnh viện nào. Hãy thêm mới.
            </p>
          )}
          {hospitals.map((hospital) => (
            <div key={hospital.id} padding="sm" shadow="none">
              <div className="flex justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {hospital.name}
                  </h3>
                  {hospital.city && (
                    <p className="text-sm text-blue-600 font-medium">
                      {hospital.city}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">{hospital.address}</p>
                  <p className="text-sm text-gray-500">
                    Điện thoại: {hospital.phone} · Email: {hospital.email}
                  </p>
                  {hospital.main_specialty && (
                    <p className="text-sm text-gray-500">
                      Chuyên khoa chính: {hospital.main_specialty}
                    </p>
                  )}
                </div>
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
                    variant="secondary"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleDeleteHospital(hospital.id)}
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

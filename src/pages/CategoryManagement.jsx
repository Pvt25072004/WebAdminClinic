import React, { useEffect, useState, useMemo } from "react";
import Button from "../components/Button";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
} from "../services/admin.categories.api";
import CardSkeleton from "../components/CardSkeleton";
import EmptyState from "../components/EmptyState";
import {
  Edit3,
  Trash2,
  Image as ImageIcon,
  Upload,
  Inbox,
  Eye,
} from "lucide-react";
import { useNotification } from "../contexts/NotificationContext";
import { generateSlug } from "../utils/helpers";

import { getHospitals } from "../services/admin.hospitals.api";
import { getAdminCharts } from "../services/admin.dashboard.api";
import { useAuth } from "../contexts/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function CategoryManagement() {
  const { user } = useAuth();
  const { showSuccess, showError, confirm } = useNotification();
  const [categories, setCategories] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [viewingCategory, setViewingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    image_url: "",
  });
  const [isUploading, setIsUploading] = useState(false);

  const [categoriesUsage, setCategoriesUsage] = useState([]);

  const loadData = async () => {
    try {
      setLoadingCategories(true);
      const promises = [
        getCategories().catch(() => []),
        getHospitals().catch(() => []),
      ];
      if (user?.role === "admin") {
        promises.push(getAdminCharts().catch(() => ({})));
      }
      const results = await Promise.all(promises);
      const cats = Array.isArray(results[0]) ? results[0] : [];
      setCategories(cats.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)));
      setHospitals(Array.isArray(results[1]) ? results[1] : []);
      if (user?.role === "admin" && results[2]?.categoriesUsage) {
        setCategoriesUsage(results[2].categoriesUsage);
      }
    } catch (e) {
      console.error("Load data error:", e);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadCategories = loadData; // To keep compatibility with existing code

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryForm({ name: "", slug: "", image_url: "" });
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name || "",
      slug: category.slug || "",
      image_url: category.image_url || "",
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      showSuccess("Đang tải ảnh lên...");
      const result = await uploadCategoryImage(file);
      setCategoryForm((prev) => ({ ...prev, image_url: result.image_url }));
      showSuccess("Tải ảnh lên thành công!");
    } catch (error) {
      showError("Lỗi tải ảnh: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: categoryForm.name,
        slug: categoryForm.slug || generateSlug(categoryForm.name),
        image_url: categoryForm.image_url,
      };
      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
        showSuccess("Cập nhật chuyên khoa thành công");
      } else {
        await createCategory(payload);
        showSuccess("Tạo chuyên khoa thành công");
      }
      resetCategoryForm();
      void loadData();
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
      void loadData();
    } catch (e) {
      showError(e.message || "Không thể xóa chuyên khoa");
    }
  };

  useEffect(() => {
    void loadData();
  }, []);
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Danh mục / Chuyên khoa
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý danh sách chuyên khoa
          </p>
          <p className="text-sm font-medium text-emerald-600 mt-1">
            Tổng số: {categories.length} chuyên khoa
          </p>
        </div>
        <Button
          size="sm"
          onClick={resetCategoryForm}
          variant={editingCategory ? "secondary" : "primary"}
        >
          {editingCategory ? "Tạo mới" : "Reset"}
        </Button>
      </div>

      {/* Form tạo / sửa chuyên khoa */}
      <form onSubmit={handleSubmitCategory} className="mb-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tên chuyên khoa
            </label>
            <input
              type="text"
              value={categoryForm.name}
              onChange={(e) => {
                const newName = e.target.value;
                setCategoryForm((prev) => ({
                  ...prev,
                  name: newName,
                  slug:
                    !editingCategory || prev.slug === generateSlug(prev.name)
                      ? generateSlug(newName)
                      : prev.slug,
                }));
              }}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="hidden">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Đường dẫn (Slug)
            </label>
            <input
              type="text"
              value={categoryForm.slug}
              onChange={(e) =>
                setCategoryForm((prev) => ({
                  ...prev,
                  slug: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-slate-50"
              placeholder="tu-dong-tao-neu-de-trong"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Ảnh đại diện chuyên khoa
            </label>
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-slate-50 overflow-hidden shrink-0">
                {categoryForm.image_url ? (
                  <img
                    src={categoryForm.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={categoryForm.image_url}
                  onChange={(e) =>
                    setCategoryForm((prev) => ({
                      ...prev,
                      image_url: e.target.value,
                    }))
                  }
                  placeholder="Nhập link ảnh hoặc chọn file tải lên..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 mb-2"
                />
                <div>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg cursor-pointer hover:bg-emerald-100 transition-colors font-medium text-sm">
                    <Upload className="w-4 h-4" />
                    {isUploading ? "Đang tải..." : "Tải ảnh từ máy lên"}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          {editingCategory && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={resetCategoryForm}
            >
              Hủy
            </Button>
          )}
          <Button type="submit" size="sm" variant="primary">
            {editingCategory ? "Cập nhật" : "Tạo chuyên khoa"}
          </Button>
        </div>
      </form>

      {user?.role === "admin" && categoriesUsage.length > 0 && (
        <div className="mb-8 p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-800">
              Mức độ phổ biến của chuyên khoa
            </h3>
            <p className="text-sm text-slate-500">
              Số lượng bệnh viện đăng ký theo từng chuyên khoa
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoriesUsage.slice(0, 15)}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="category_name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                  }}
                />
                <Bar
                  dataKey="hospital_count"
                  name="Số bệnh viện"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {loadingCategories && <CardSkeleton count={3} />}
        {!loadingCategories && categories.length === 0 && (
          <div className="bg-white border border-slate-100 rounded-xl">
            <EmptyState
              icon={Inbox}
              title="Chưa có chuyên khoa nào"
              description="Hãy thêm mới chuyên khoa đầu tiên của bạn."
            />
          </div>
        )}
        {categories.map((category, index) => {
          const hospitalCount = hospitals.filter((h) =>
            h.categories?.some((c) => c.id === category.id),
          ).length;
          return (
            <div
              key={category.id}
              className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 flex items-center gap-2">
                      <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-xs">#{index + 1}</span>
                      {category.name}
                    </p>
                    <div className="flex gap-3 text-xs mt-1">
                      <span className="text-slate-500">
                        Slug: {category.slug}
                      </span>
                      <span className="text-emerald-600 font-medium bg-emerald-50 px-2 rounded">
                        {hospitalCount} Bệnh viện áp dụng
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Eye}
                    onClick={() => setViewingCategory(category)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Edit3}
                    onClick={() => handleEditCategory(category)}
                  />
                  <Button
                    variant="ghostDanger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleDeleteCategory(category.id)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {viewingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-semibold text-slate-800">
                  Danh sách Bệnh viện
                </h3>
                <p className="text-sm text-slate-500">
                  Chuyên khoa: {viewingCategory.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingCategory(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <span className="sr-only">Đóng</span>
                &times;
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {hospitals.filter((h) =>
                h.categories?.some((c) => c.id === viewingCategory.id),
              ).length > 0 ? (
                <ul className="space-y-3">
                  {hospitals
                    .filter((h) =>
                      h.categories?.some((c) => c.id === viewingCategory.id),
                    )
                    .map((h) => (
                      <li
                        key={h.id}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"
                      >
                        <img
                          src={h.logo_url || "https://placehold.co/100x100"}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {h.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {h.city?.name || h.city || "Chưa cập nhật địa chỉ"}
                          </p>
                        </div>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-sm text-center text-slate-500 py-8">
                  Chưa có bệnh viện nào áp dụng chuyên khoa này.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

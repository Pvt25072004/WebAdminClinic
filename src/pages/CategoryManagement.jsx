import React, { useEffect, useState, useMemo } from "react";
import Button from "../components/Button";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
} from "../services/admin.categories.api";
import { Edit3, Trash2, Image as ImageIcon, Upload } from "lucide-react";
import { useNotification } from "../contexts/NotificationContext";
import { generateSlug } from "../utils/helpers";

export default function CategoryManagement() {
  const { showSuccess, showError, confirm } = useNotification();
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    image_url: "",
  });
  const [isUploading, setIsUploading] = useState(false);
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
    setCategoryForm({ name: "", slug: "", image_url: "" });
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name || "", slug: category.slug || "", image_url: category.image_url || "" });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      showSuccess("Đang tải ảnh lên...");
      const result = await uploadCategoryImage(file);
      setCategoryForm(prev => ({ ...prev, image_url: result.image_url }));
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
      void loadCategories();
    } catch (e) {
      showError(e.message || "Không thể lưu chuyên khoa");
    }
  };

  const handleDeleteCategory = async (id) => {
    const isConfirm = await confirm(
      "Xác nhận xóa",
      "Bạn có chắc muốn xóa chuyên khoa này?",
      { variant: "danger", confirmText: "Xóa" }
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
  useEffect(() => {
    void loadCategories();
  }, []);
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Danh mục / Chuyên khoa
          </h2>
          <p className="text-sm text-slate-500">Quản lý danh sách chuyên khoa</p>
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
          <div>
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
                  slug: !editingCategory || prev.slug === generateSlug(prev.name) ? generateSlug(newName) : prev.slug,
                }));
              }}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
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
                  <img src={categoryForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={categoryForm.image_url}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="Nhập link ảnh hoặc chọn file tải lên..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 mb-2"
                />
                <div>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg cursor-pointer hover:bg-emerald-100 transition-colors font-medium text-sm">
                    <Upload className="w-4 h-4" />
                    {isUploading ? "Đang tải..." : "Tải ảnh từ máy lên"}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
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

      <div className="space-y-3">
        {loadingCategories && (
          <p className="text-sm text-slate-500">Đang tải chuyên khoa...</p>
        )}
        {!loadingCategories && categories.length === 0 && (
          <p className="text-sm text-slate-500">
            Chưa có chuyên khoa nào. Hãy thêm mới.
          </p>
        )}
        {categories.map((category) => (
          <div
            key={category.id}
            className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                  {category.image_url ? (
                    <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-slate-300" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{category.name}</p>
                  <p className="text-xs text-slate-500">{category.slug}</p>
                </div>
              </div>
              <div className="flex gap-2">
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
        ))}
      </div>
    </div>
  );
}

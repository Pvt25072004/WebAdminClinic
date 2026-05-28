import React, { useEffect, useState, useMemo } from "react";
import Button from "../components/Button";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/admin.categories.api";
import { Edit3, Trash2 } from "lucide-react";
import { useNotification } from "../contexts/NotificationContext";

export default function CategoryManagement() {
  const { showSuccess, showError, confirm } = useNotification();
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
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
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Tên chuyên khoa
          </label>
          <input
            type="text"
            value={categoryForm.name}
            onChange={(e) =>
              setCategoryForm((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
            required
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
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
              <div>
                <p className="font-medium text-slate-900">{category.name}</p>
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

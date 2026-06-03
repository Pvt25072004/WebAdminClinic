import React, { useEffect, useState, useMemo } from "react";
import Button from "../components/Button";
import { Plus, Edit3, Trash2, Eye, ToggleLeft, ToggleRight, DollarSign, Clock } from "lucide-react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { getAllServicePackages, createServicePackage } from "../services/admin.servicepackages.api";
import { useNotification } from "../contexts/NotificationContext";

export default function ServicePackageManagement() {
  const { showSuccess, showError } = useNotification();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    fixed_price: 0,
    duration_minutes: 30,
    is_active: true,
    requires_fasting: false,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getAllServicePackages();
      setPackages(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Load service packages error:", e);
      showError("Không thể tải danh sách gói khám");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCreateNew = () => {
    setFormData({
      name: "",
      code: `PKG${Date.now().toString().slice(-6)}`,
      description: "",
      fixed_price: 0,
      duration_minutes: 30,
      is_active: true,
      requires_fasting: false,
    });
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleContentChange = (content) => {
    setFormData(prev => ({ ...prev, description: content }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      return showError("Vui lòng nhập tên và mã gói khám");
    }
    
    try {
      setSubmitting(true);
      await createServicePackage({
        ...formData,
        fixed_price: Number(formData.fixed_price),
        duration_minutes: Number(formData.duration_minutes),
      });
      showSuccess("Đã tạo gói khám thành công!");
      setShowForm(false);
      void loadData();
    } catch (e) {
      showError("Lỗi khi tạo gói khám: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Cấu hình thanh công cụ cho ReactQuill
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
      ],
    }
  }), []);

  return (
    <div className="xl:col-span-2">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Gói dịch vụ khám
          </h2>
          <p className="text-sm text-slate-500">
            Quản lý các gói khám sức khỏe tổng quát, tầm soát
          </p>
        </div>
        {!showForm && (
          <Button variant="primary" size="sm" icon={Plus} onClick={handleCreateNew}>
            Thêm gói khám
          </Button>
        )}
      </div>

      {showForm ? (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 mb-6">
          <h3 className="text-lg font-bold mb-4">Thêm Gói Khám Mới</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên gói khám *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:ring focus:ring-blue-200 outline-none"
                  placeholder="VD: Gói Khám Sức Khỏe Tổng Quát"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mã gói (Code) *</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className="w-full p-2 border rounded focus:ring focus:ring-blue-200 outline-none uppercase"
                  placeholder="VD: PKG001"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Giá gói (VNĐ) *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    name="fixed_price"
                    value={formData.fixed_price}
                    onChange={handleChange}
                    className="w-full pl-9 p-2 border rounded focus:ring focus:ring-blue-200 outline-none"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Thời lượng khám dự kiến (Phút)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    name="duration_minutes"
                    value={formData.duration_minutes}
                    onChange={handleChange}
                    className="w-full pl-9 p-2 border rounded focus:ring focus:ring-blue-200 outline-none"
                    placeholder="30"
                    min="15"
                    step="15"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-6 py-2 border-y border-slate-100 my-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span className="text-sm font-medium">Hoạt động</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="requires_fasting"
                  checked={formData.requires_fasting}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium">Yêu cầu nhịn ăn</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả chi tiết</label>
              <div className="bg-white rounded overflow-hidden" style={{ minHeight: '300px', paddingBottom: '40px' }}>
                <ReactQuill
                  theme="snow"
                  value={formData.description}
                  onChange={handleContentChange}
                  modules={modules}
                  style={{ height: '300px' }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? "Đang lưu..." : "Lưu gói khám"}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && <div className="col-span-3 py-10 text-center text-slate-500">Đang tải dữ liệu...</div>}
          {!loading && packages.length === 0 && (
            <div className="col-span-3 py-10 text-center bg-white rounded-lg border text-slate-500">
              Chưa có gói khám nào. Hãy tạo mới!
            </div>
          )}
          {!loading && packages.map((pkg) => (
            <div key={pkg.id} className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition">
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-slate-900 line-clamp-2">{pkg.name}</h3>
                  <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                    {pkg.code}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="text-emerald-600 font-bold text-lg">
                    {Number(pkg.fixed_price).toLocaleString("vi-VN")} đ
                  </div>
                  <div className="text-xs flex items-center text-slate-500 bg-slate-50 px-2 py-1 rounded">
                    <Clock className="w-3 h-3 mr-1" /> {pkg.duration_minutes} phút
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {pkg.is_active ? (
                    <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded flex items-center gap-1">
                      <ToggleRight className="w-3 h-3" /> Đang bán
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded flex items-center gap-1">
                      <ToggleLeft className="w-3 h-3" /> Tạm dừng
                    </span>
                  )}
                  {pkg.requires_fasting && (
                    <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                      ⚠️ Cần nhịn ăn
                    </span>
                  )}
                  <span className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">
                    {pkg.booking_count || 0} lượt đặt
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

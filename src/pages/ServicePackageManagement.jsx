import React, { useEffect, useState, useMemo, useRef } from "react";
import Button from "../components/Button";
import { Plus, Edit3, Trash2, Eye, ToggleLeft, ToggleRight, DollarSign, Clock } from "lucide-react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { getAllServicePackages, createServicePackage, updateServicePackage, deleteServicePackage } from "../services/admin.servicepackages.api";
import { getHospitals } from "../services/admin.hospitals.api";
import { useNotification } from "../contexts/NotificationContext";
import { useAuth } from "../contexts/AuthContext";
import { uploadUserImage } from "../services/api";
import { Image as ImageIcon } from "lucide-react";

export default function ServicePackageManagement() {
  const { showSuccess, showError, confirm } = useNotification();
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [hospitalsList, setHospitalsList] = useState([]);
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
    image_url: "",
    hospital_ids: user?.hospital_id ? [user.hospital_id] : [],
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
        setFormData((prev) => ({
          ...prev,
          image_url: result.image_url,
        }));
        showSuccess("Tải ảnh thành công!");
      }
    } catch (error) {
      showError("Lỗi tải ảnh: " + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [data, hospitalsData] = await Promise.all([
        getAllServicePackages(user?.hospital_id),
        getHospitals()
      ]);
      
      setPackages(Array.isArray(data) ? data : []);
      
      let finalHospitalsList = Array.isArray(hospitalsData) ? hospitalsData : [];
      if (user?.hospital_id) {
        finalHospitalsList = finalHospitalsList.filter(h => h.id === user.hospital_id);
      }
      setHospitalsList(finalHospitalsList);
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
      image_url: "",
      hospital_ids: user?.hospital_id ? [user.hospital_id] : [],
    });
    setShowForm(true);
  };

  const handleEdit = (pkg) => {
    setFormData({
      id: pkg.id,
      name: pkg.name || "",
      code: pkg.code || "",
      description: pkg.description || "",
      fixed_price: pkg.fixed_price || 0,
      duration_minutes: pkg.duration_minutes || 30,
      is_active: pkg.is_active ?? true,
      requires_fasting: pkg.requires_fasting ?? false,
      image_url: pkg.image_url || "",
      hospital_ids: pkg.hospitals?.map(h => h.id) || [],
    });
    setShowForm(true);
  };

  const handleDelete = async (pkg) => {
    const isConfirm = await confirm("Xác nhận xóa", `Bạn có chắc muốn xóa gói khám "${pkg.name}"?`);
    if (!isConfirm) return;

    try {
      await deleteServicePackage(pkg.id);
      showSuccess("Đã xóa gói khám thành công!");
      void loadData();
    } catch (error) {
      showError("Lỗi khi xóa: " + error.message);
    }
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
      const payload = {
        ...formData,
        fixed_price: Number(formData.fixed_price),
        duration_minutes: Number(formData.duration_minutes),
        hospitals: formData.hospital_ids.map(id => ({ id })),
      };
      
      if (formData.id) {
        await updateServicePackage(formData.id, payload);
        showSuccess("Đã cập nhật gói khám thành công!");
      } else {
        await createServicePackage(payload);
        showSuccess("Đã tạo gói khám thành công!");
      }
      setShowForm(false);
      void loadData();
    } catch (e) {
      showError("Lỗi khi lưu gói khám: " + e.message);
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
          <p className="text-sm font-medium text-emerald-600 mt-1">
            Tổng số: {packages.length} gói khám
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
          <h3 className="text-lg font-bold mb-4">{formData.id ? "Cập Nhật Gói Khám" : "Thêm Gói Khám Mới"}</h3>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
            accept="image/*"
          />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-24 h-24 rounded-lg bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0 relative group">
                {formData.image_url ? (
                  <img
                    src={formData.image_url}
                    alt="Package"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-400" />
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
                <h3 className="text-sm font-medium text-slate-900 mb-1">Ảnh Gói Khám</h3>
                <p className="text-xs text-slate-500 mb-2">Ảnh minh họa cho gói khám</p>
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
                    onWheel={(e) => e.target.blur()}
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
                    onWheel={(e) => e.target.blur()}
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
              <label className="block text-sm font-medium text-slate-700 mb-2">Bệnh viện / Cơ sở áp dụng</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 border rounded-lg bg-slate-50 max-h-48 overflow-y-auto">
                {hospitalsList.map((hosp) => {
                  const isHospitalAdmin = !!user?.hospital_id;
                  const isChecked = formData.hospital_ids.includes(hosp.id) || (isHospitalAdmin && hosp.id === user.hospital_id);
                  return (
                  <label key={hosp.id} className={`flex items-center gap-2 cursor-pointer bg-white p-2 rounded border transition-colors ${isHospitalAdmin ? 'border-blue-300 bg-blue-50 cursor-default' : 'border-slate-200 hover:border-blue-300'}`}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isHospitalAdmin}
                      onChange={(e) => {
                        if (isHospitalAdmin) return;
                        const { checked } = e.target;
                        setFormData(prev => ({
                          ...prev,
                          hospital_ids: checked 
                            ? [...prev.hospital_ids, hosp.id] 
                            : prev.hospital_ids.filter(id => id !== hosp.id)
                        }));
                      }}
                      className="w-4 h-4 text-blue-600 rounded disabled:opacity-70"
                    />
                    <span className="text-sm font-medium text-slate-700 line-clamp-1" title={hosp.name}>{hosp.name}</span>
                  </label>
                  );
                })}
              </div>
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
          {!loading && packages.map((pkg, index) => (
            <div key={pkg.id} className="group flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-emerald-200 transition-all duration-300">
              <div className="relative h-48 bg-slate-100 overflow-hidden shrink-0">
                {pkg.image_url ? (
                  <img src={pkg.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={pkg.name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-50">
                    <ImageIcon className="w-12 h-12 text-slate-300" />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex flex-col gap-2">
                  {pkg.is_active ? (
                    <span className="bg-emerald-500/90 backdrop-blur text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">Đang bán</span>
                  ) : (
                    <span className="bg-slate-500/90 backdrop-blur text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">Tạm dừng</span>
                  )}
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded">#{index + 1}</span>
                    <h3 className="font-bold text-lg text-slate-900 line-clamp-2 leading-tight group-hover:text-emerald-700 transition-colors">
                      {pkg.name}
                    </h3>
                  </div>
                </div>
                
                <div className="text-sm text-slate-500 mb-4 break-words" dangerouslySetInnerHTML={{ __html: pkg.description || "Chưa có mô tả" }}></div>
                
                <div className="mt-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-emerald-600 font-bold text-xl">
                      {Number(pkg.fixed_price).toLocaleString("vi-VN")} đ
                    </div>
                    <div className="flex items-center text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md text-sm font-medium border border-slate-100">
                      <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> {pkg.duration_minutes} phút
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                      Mã: {pkg.code}
                    </span>
                    {pkg.requires_fasting && (
                      <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md flex items-center">
                        ⚠️ Nhịn ăn
                      </span>
                    )}
                    <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-md flex items-center">
                      🛒 {pkg.booking_count || 0} lượt đặt
                    </span>
                  </div>
                  
                  <div className="flex gap-2 pt-4 border-t border-slate-100">
                    <Button variant="outline" className="flex-1 justify-center" onClick={() => handleEdit(pkg)}>
                      <Edit3 className="w-4 h-4 mr-2" /> Sửa
                    </Button>
                    <Button variant="danger" className="px-3" onClick={() => handleDelete(pkg)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

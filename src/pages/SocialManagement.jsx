import React, { useEffect, useState, useRef, useMemo } from "react";
import Button from "../components/Button";
import { Edit3, Image as ImageIcon, Camera, Link, Hospital } from "lucide-react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {
  getFanpages,
  getFanpagesByHospital,
  createFanpage,
  updateFanpage,
  uploadFanpageImage,
} from "../services/admin.fanpages.api";
import { getHospitals } from "../services/admin.hospitals.api";
import { useNotification } from "../contexts/NotificationContext";
import { useAuth } from "../contexts/AuthContext";

export default function SocialManagement() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  const [fanpages, setFanpages] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    hospital_id: "",
    description: "",
    cover_image_url: "",
    avatar_url: "",
  });

  const [uploadType, setUploadType] = useState(null); // 'avatar' or 'cover'
  const fileInputRef = useRef(null);

  const loadData = async () => {
    try {
      setLoading(true);
      if (user?.role === "admin_hospital" && user?.hospital_id) {
        const data = await getFanpagesByHospital(user.hospital_id);
        setFanpages(Array.isArray(data) ? data : []);
      } else {
        const [fanpagesData, hospitalsData] = await Promise.all([
          getFanpages(),
          getHospitals()
        ]);
        setFanpages(Array.isArray(fanpagesData) ? fanpagesData : []);
        setHospitals(Array.isArray(hospitalsData) ? hospitalsData : []);
      }
    } catch (e) {
      console.error("Load fanpages error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [user]);

  const handleEdit = (fanpage) => {
    setEditingId(fanpage.id);
    setFormData({
      hospital_id: fanpage.hospital_id || "",
      description: fanpage.description || "",
      cover_image_url: fanpage.cover_image_url || "",
      avatar_url: fanpage.avatar_url || "",
    });
    setShowForm(true);
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setFormData({
      hospital_id: user?.hospital_id || "",
      description: "",
      cover_image_url: "",
      avatar_url: "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.hospital_id) {
      return showError("Vui lòng chọn bệnh viện");
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await updateFanpage(editingId, formData);
        showSuccess("Cập nhật Fanpage thành công");
      } else {
        await createFanpage(formData);
        showSuccess("Tạo Fanpage thành công");
      }
      setShowForm(false);
      void loadData();
    } catch (error) {
      showError(error.message || "Có lỗi xảy ra khi lưu Fanpage");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTriggerUpload = (type) => {
    setUploadType(type);
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !uploadType) return;

    try {
      showSuccess(`Đang tải ${uploadType === 'avatar' ? 'Ảnh đại diện' : 'Ảnh bìa'} lên...`);
      const result = await uploadFanpageImage(file);
      if (result && result.image_url) {
        if (uploadType === "avatar") {
          setFormData((prev) => ({ ...prev, avatar_url: result.image_url }));
        } else {
          setFormData((prev) => ({ ...prev, cover_image_url: result.image_url }));
        }
        showSuccess("Tải ảnh thành công!");
      }
    } catch (error) {
      showError("Lỗi tải ảnh: " + error.message);
    }
  };

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link"],
          ["clean"],
        ],
      },
    }),
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Mạng Xã Hội (Fanpage)</h1>
          <p className="text-slate-500 text-sm mt-1">
            Chỉnh sửa thông tin, ảnh bìa và giới thiệu trang Fanpage Bệnh viện
          </p>
        </div>
        {!showForm && (
          <Button onClick={handleCreateNew}>
            + Thêm Fanpage
          </Button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {showForm ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-800">
              {editingId ? "Sửa Fanpage" : "Tạo Fanpage"}
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-0">
            {/* Cover Image Section */}
            <div 
              className="w-full h-64 bg-slate-200 relative group cursor-pointer"
              onClick={() => handleTriggerUpload('cover')}
            >
              {formData.cover_image_url ? (
                <img src={formData.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                  <span>Bấm để thêm Ảnh bìa (1920x1080)</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="outline" className="border-white text-white hover:bg-white/20">
                  <Camera className="w-4 h-4 mr-2" /> Đổi Ảnh Bìa
                </Button>
              </div>
            </div>

            <div className="px-6 pb-6">
              {/* Avatar Section */}
              <div className="relative flex justify-start -mt-16 mb-6 ml-6">
                <div 
                  className="w-32 h-32 rounded-full border-4 border-white bg-slate-100 relative group cursor-pointer overflow-hidden shadow-md"
                  onClick={() => handleTriggerUpload('avatar')}
                >
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Hospital className="w-10 h-10 opacity-50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="space-y-6 max-w-4xl">
                {user?.role === "admin" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Thuộc Bệnh viện <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.hospital_id}
                      onChange={(e) => setFormData({ ...formData, hospital_id: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    >
                      <option value="">-- Chọn bệnh viện --</option>
                      {hospitals.map((h) => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Bài viết giới thiệu Fanpage
                  </label>
                  <div className="bg-white border-slate-200 rounded-lg overflow-hidden [&_.ql-toolbar]:border-t-0 [&_.ql-toolbar]:border-x-0 [&_.ql-container]:border-x-0 [&_.ql-container]:border-b-0 [&_.ql-editor]:min-h-[200px] [&_.ql-editor]:text-base">
                    <ReactQuill
                      theme="snow"
                      value={formData.description}
                      onChange={(val) => setFormData({ ...formData, description: val })}
                      modules={modules}
                      placeholder="Nhập thông tin giới thiệu bệnh viện..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end p-6 border-t border-slate-200 bg-slate-50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-10 text-center text-slate-500">
              Đang tải dữ liệu Fanpage...
            </div>
          ) : fanpages.length === 0 ? (
            <div className="col-span-full py-10 text-center text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
              Chưa có Fanpage nào được tạo.
            </div>
          ) : (
            fanpages.map((page) => (
              <div key={page.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="h-32 bg-slate-200 relative">
                  {page.cover_image_url ? (
                    <img src={page.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      Chưa có Ảnh Bìa
                    </div>
                  )}
                </div>
                <div className="px-5 pb-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start">
                    <div className="-mt-10 mb-3 w-20 h-20 rounded-full border-4 border-white bg-white shadow-sm overflow-hidden relative z-10">
                      {page.avatar_url ? (
                        <img src={page.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <Hospital className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-3"
                      onClick={() => handleEdit(page)}
                    >
                      <Edit3 className="w-4 h-4 mr-2" /> Chỉnh sửa
                    </Button>
                  </div>
                  
                  <h3 className="font-bold text-lg text-slate-900 line-clamp-1">
                    {page.hospital?.name || "Fanpage Bệnh viện"}
                  </h3>
                  
                  <div className="mt-4 flex-1">
                    <p className="text-sm font-medium text-slate-500 mb-1">Giới thiệu:</p>
                    {page.description ? (
                      <div 
                        className="text-sm text-slate-700 line-clamp-4 prose prose-sm prose-emerald"
                        dangerouslySetInnerHTML={{ __html: page.description }}
                      />
                    ) : (
                      <p className="text-sm text-slate-400 italic">Chưa có bài viết giới thiệu.</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

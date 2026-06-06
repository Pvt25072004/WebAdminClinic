import React, { useEffect, useState, useRef, useMemo } from "react";
import Button from "../components/Button";
import { Plus, Edit3, Trash2, Eye, RefreshCw, AlertCircle } from "lucide-react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {
  getPosts,
  getPostsByHospital,
  createPost,
  updatePost,
  deletePost,
  uploadPostImage,
} from "../services/admin.posts.api";
import { getHospitals } from "../services/admin.hospitals.api";
import { useNotification } from "../contexts/NotificationContext";
import { useAuth } from "../contexts/AuthContext";

export default function FanpagePostManagement() {
  const { user } = useAuth();
  const { showSuccess, showError, confirm } = useNotification();
  
  const [postsList, setPostsList] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image_url: "",
  });

  const fileInputRef = useRef(null);
  const quillRef = useRef(null);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      if (user?.role === "admin") {
        const hospitalsData = await getHospitals();
        const hospitalsArray = Array.isArray(hospitalsData) ? hospitalsData : [];
        setHospitals(hospitalsArray);
        if (hospitalsArray.length > 0) {
          setSelectedHospitalId(hospitalsArray[0].id.toString());
        }
      } else if (user?.role === "admin_hospital" && user?.hospital_id) {
        setSelectedHospitalId(user.hospital_id.toString());
      }
    } catch (e) {
      console.error("Load hospitals error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInitialData();
  }, [user]);

  const loadPosts = async () => {
    if (!selectedHospitalId && user?.role !== "admin") return;
    try {
      setLoading(true);
      let data;
      if (selectedHospitalId) {
        data = await getPostsByHospital(selectedHospitalId, 1, 100);
      } else {
        data = await getPosts(1, 100);
      }
      setPostsList(data.data || data || []);
    } catch (e) {
      console.error("Load posts error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedHospitalId || user?.role === "admin") {
      void loadPosts();
    } else {
      setPostsList([]);
    }
  }, [selectedHospitalId, user?.role]);

  const handleCreateNew = () => {
    setEditingId(null);
    setFormData({
      title: "",
      content: "",
      image_url: "",
    });
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      title: item.title || "",
      content: item.content || "",
      image_url: item.image_url || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const isConfirm = await confirm(
      "Xác nhận xóa",
      "Bạn có chắc muốn xóa bài viết này không?",
      { variant: "danger", confirmText: "Xóa" }
    );
    if (!isConfirm) return;

    try {
      await deletePost(id);
      showSuccess("Đã xóa bài viết");
      void loadPosts();
    } catch (e) {
      showError(e.message || "Không thể xóa bài viết");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      return showError("Vui lòng nhập đầy đủ tiêu đề và nội dung");
    }
    if (!selectedHospitalId && user?.role !== "admin") {
      return showError("Vui lòng chọn Bệnh viện");
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await updatePost(editingId, formData);
        showSuccess("Cập nhật bài viết thành công");
      } else {
        const payload = { ...formData };
        if (selectedHospitalId) {
          payload.hospital_id = parseInt(selectedHospitalId);
        }
        await createPost(payload);
        showSuccess("Thêm bài viết thành công");
      }
      setShowForm(false);
      void loadPosts();
    } catch (error) {
      showError(error.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      showSuccess("Đang tải ảnh lên...");
      const result = await uploadPostImage(file);
      if (result && result.image_url) {
        setFormData((prev) => ({ ...prev, image_url: result.image_url }));
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
          [{ color: [] }, { background: [] }],
          ["link", "image"],
          ["clean"],
        ],
      },
    }),
    []
  );

  if (!loading && !selectedHospitalId && user?.role === "admin_hospital") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bài viết Bảng tin</h1>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
          <h2 className="text-lg font-bold text-yellow-800 mb-2">Tài khoản chưa liên kết bệnh viện</h2>
          <p className="text-yellow-700 mb-6">Bạn cần có quyền quản lý một bệnh viện cụ thể để có thể đăng bài viết.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Bảng tin</h1>
          <p className="text-slate-500 text-sm mt-1">
            Đăng thông báo, sự kiện, cập nhật tin tức cho bệnh viện
          </p>
          <p className="text-sm font-medium text-emerald-600 mt-1">
            Tổng số: {postsList.length} bài viết
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {user?.role === "admin" && (
            <select
              value={selectedHospitalId}
              onChange={(e) => setSelectedHospitalId(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-w-[200px]"
            >
              <option value="">Tin Tức Hệ Thống (Global)</option>
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>{h.name || `Bệnh viện #${h.id}`}</option>
              ))}
            </select>
          )}
          <Button
            className="flex items-center gap-2"
            onClick={handleCreateNew}
          >
            <Plus className="w-4 h-4" /> Đăng bài mới
          </Button>
        </div>
      </div>

      {showForm ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-800">
              {editingId ? "Sửa Bài Viết" : "Tạo Bài Viết Mới"}
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tiêu đề bài viết <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="VD: Cập nhật lịch làm việc dịp lễ..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nội dung bài viết <span className="text-red-500">*</span>
                    <span className="text-xs text-slate-500 ml-2 font-normal">(Sử dụng #hashtag để phân loại)</span>
                  </label>
                  <div className="bg-white border-slate-200 rounded-lg overflow-hidden [&_.ql-toolbar]:border-t-0 [&_.ql-toolbar]:border-x-0 [&_.ql-container]:border-x-0 [&_.ql-container]:border-b-0 [&_.ql-editor]:min-h-[300px] [&_.ql-editor]:text-base">
                    <ReactQuill
                      ref={quillRef}
                      theme="snow"
                      value={formData.content}
                      onChange={(val) => setFormData({ ...formData, content: val })}
                      modules={modules}
                      placeholder="Bắt đầu soạn thảo nội dung... Để tạo hashtag, hãy gõ #kham_benh"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ảnh đính kèm
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors overflow-hidden group relative"
                  >
                    {formData.image_url ? (
                      <>
                        <img
                          src={formData.image_url}
                          alt="Attachment"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white font-medium text-sm">Đổi ảnh khác</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-3">
                          <Plus className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium text-slate-700">Tải ảnh lên</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-6 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Đang lưu..." : "Đăng bài viết"}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="py-4 px-6 font-semibold w-16">STT</th>
                  <th className="py-4 px-6 font-semibold w-24">Ảnh</th>
                  <th className="py-4 px-6 font-semibold">Bài viết</th>
                  <th className="py-4 px-6 font-semibold text-center">Tương tác</th>
                  <th className="py-4 px-6 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                      Đang tải bài viết...
                    </td>
                  </tr>
                ) : postsList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-slate-500">
                      Chưa có bài viết nào
                    </td>
                  </tr>
                ) : (
                  postsList.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6 font-medium text-slate-500">
                        {index + 1}
                      </td>
                      <td className="py-4 px-6">
                        <div className="w-20 h-16 rounded bg-slate-100 overflow-hidden border border-slate-200">
                          {item.image_url ? (
                            <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Eye className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 max-w-md">
                        <p className="font-semibold text-slate-900 line-clamp-1">{item.title}</p>
                        <div 
                          className="text-xs text-slate-500 mt-1 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: item.content }}
                        />
                        <div className="text-xs text-slate-400 mt-2">
                          {new Date(item.created_at).toLocaleString('vi-VN')}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center text-slate-600">
                        <div className="flex justify-center gap-4">
                          <span title="Lượt thích">👍 {item.likes_count || item.like_count || 0}</span>
                          <span title="Bình luận">💬 {item.comments_count || item.comment_count || 0}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit3 className="w-3.5 h-3.5 mr-1" /> Sửa
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Xóa
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

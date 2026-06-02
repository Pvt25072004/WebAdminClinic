import React, { useEffect, useState, useRef, useMemo } from "react";
import Button from "../components/Button";
import { Plus, Edit3, Trash2, ToggleRight, ToggleLeft, RefreshCw, Eye } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  getNews,
  createNews,
  updateNews,
  deleteNews,
  uploadNewsImage,
  syncGoogleNews,
} from "../services/admin.news.api";
import { useNotification } from "../contexts/NotificationContext";

export default function NewsManagement() {
  const { showSuccess, showError, confirm } = useNotification();
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    content: "",
    image_url: "",
    author: "",
    is_published: true,
  });

  const fileInputRef = useRef(null);
  const quillRef = useRef(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getNews();
      setNewsList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Load news error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCreateNew = () => {
    setEditingId(null);
    setFormData({
      title: "",
      summary: "",
      content: "",
      image_url: "",
      author: "",
      is_published: true,
    });
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      title: item.title || "",
      summary: item.summary || "",
      content: item.content || "",
      image_url: item.image_url || "",
      author: item.author || "",
      is_published: item.is_published,
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
      await deleteNews(id);
      showSuccess("Đã xóa bài viết");
      void loadData();
    } catch (e) {
      showError(e.message || "Không thể xóa bài viết");
    }
  };

  const handleTogglePublish = async (item) => {
    try {
      await updateNews(item.id, { is_published: !item.is_published });
      showSuccess(`Đã ${item.is_published ? "ẩn" : "hiển thị"} bài viết`);
      void loadData();
    } catch (e) {
      showError(e.message || "Không thể cập nhật trạng thái");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      return showError("Vui lòng nhập đầy đủ tiêu đề và nội dung");
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await updateNews(editingId, formData);
        showSuccess("Cập nhật bài viết thành công");
      } else {
        await createNews(formData);
        showSuccess("Thêm bài viết thành công");
      }
      setShowForm(false);
      void loadData();
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
      const result = await uploadNewsImage(file);
      if (result && result.image_url) {
        setFormData((prev) => ({ ...prev, image_url: result.image_url }));
        showSuccess("Tải ảnh thành công!");
      }
    } catch (error) {
      showError("Lỗi tải ảnh: " + error.message);
    }
  };

  const handleSyncGoogle = async () => {
    try {
      setSyncing(true);
      showSuccess("Đang lấy tin tức tự động từ Google News...");
      const result = await syncGoogleNews();
      showSuccess(result.message || "Đồng bộ thành công!");
      void loadData();
    } catch (e) {
      showError(e.message || "Lỗi đồng bộ tin tức");
    } finally {
      setSyncing(false);
    }
  };

  // Cấu hình Toolbar cho ReactQuill
  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          ["link", "image"],
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
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Tin Tức</h1>
          <p className="text-slate-500 text-sm mt-1">
            Soạn thảo, quản lý bài viết và lấy tin tự động từ Google News
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleSyncGoogle}
            disabled={syncing}
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Đang đồng bộ..." : "Đồng bộ Google"}
          </Button>
          <Button
            className="flex items-center gap-2"
            onClick={handleCreateNew}
          >
            <Plus className="w-4 h-4" /> Viết bài mới
          </Button>
        </div>
      </div>

      {showForm ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-800">
              {editingId ? "Sửa Bài Viết" : "Viết Bài Mới"}
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tiêu đề <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    placeholder="Nhập tiêu đề bài viết..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tóm tắt (Mô tả ngắn)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    placeholder="Mô tả ngắn hiển thị ở trang chủ..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nội dung bài viết <span className="text-red-500">*</span>
                  </label>
                  <div className="bg-white border-slate-200 rounded-lg overflow-hidden [&_.ql-toolbar]:border-t-0 [&_.ql-toolbar]:border-x-0 [&_.ql-container]:border-x-0 [&_.ql-container]:border-b-0 [&_.ql-editor]:min-h-[300px] [&_.ql-editor]:text-base">
                    <ReactQuill
                      ref={quillRef}
                      theme="snow"
                      value={formData.content}
                      onChange={(val) => setFormData({ ...formData, content: val })}
                      modules={modules}
                      placeholder="Bắt đầu soạn thảo nội dung..."
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ảnh đại diện (Thumbnail)
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors overflow-hidden group relative"
                  >
                    {formData.image_url ? (
                      <>
                        <img
                          src={formData.image_url}
                          alt="Thumbnail"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white font-medium text-sm">Đổi ảnh khác</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <div className="mx-auto w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-3">
                          <Plus className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium text-slate-700">Tải ảnh lên</p>
                        <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP lên đến 5MB</p>
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

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tác giả / Nguồn
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    placeholder="VD: VnExpress, Dr. John..."
                  />
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_published}
                      onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Hiển thị công khai</span>
                  </label>
                  <p className="text-xs text-slate-500 mt-1 ml-8">
                    Nếu bỏ chọn, bài viết sẽ được lưu dưới dạng Bản nháp (Draft).
                  </p>
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
                {submitting ? "Đang lưu..." : "Lưu bài viết"}
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
                  <th className="py-4 px-6 font-semibold w-16">ID</th>
                  <th className="py-4 px-6 font-semibold w-24">Ảnh</th>
                  <th className="py-4 px-6 font-semibold">Tiêu đề</th>
                  <th className="py-4 px-6 font-semibold">Tác giả/Nguồn</th>
                  <th className="py-4 px-6 font-semibold text-center">Trạng thái</th>
                  <th className="py-4 px-6 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : newsList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-slate-500">
                      Chưa có bài viết nào
                    </td>
                  </tr>
                ) : (
                  newsList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6 font-medium text-slate-900">
                        #{item.id}
                      </td>
                      <td className="py-4 px-6">
                        <div className="w-16 h-12 rounded bg-slate-100 overflow-hidden border border-slate-200">
                          {item.image_url ? (
                            <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Eye className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-semibold text-slate-900 line-clamp-1">{item.title}</p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                           <span className="line-clamp-1">{item.summary}</span>
                        </p>
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {item.author || item.source || "Ẩn danh"}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleTogglePublish(item)}
                          className="hover:opacity-80 transition-opacity"
                        >
                          {item.is_published ? (
                            <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full text-xs font-semibold flex items-center justify-center gap-1 border border-emerald-100">
                               <ToggleRight className="w-3.5 h-3.5" /> Công khai
                            </span>
                          ) : (
                            <span className="bg-slate-50 text-slate-500 px-2 py-1 rounded-full text-xs font-semibold flex items-center justify-center gap-1 border border-slate-200">
                               <ToggleLeft className="w-3.5 h-3.5" /> Bản nháp
                            </span>
                          )}
                        </button>
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

import { Bell, Megaphone, Send, Users, Edit3, Trash2, X } from "lucide-react";
import Button from "../components/Button";
import { formatDate } from "../utils/helpers";
import React, { useEffect, useState } from "react";
import { getSystemNotifications, createNotification, updateSystemNotification, deleteSystemNotification } from "../services/admin.notifications.api";
import { useNotification } from "../contexts/NotificationContext";
import { useAuth } from "../contexts/AuthContext";
import { getUsers } from "../services/admin.users.api";
import { getDoctors } from "../services/admin.doctors.api";

export default function NotificationManagement() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { confirm, showSuccess, showError } = useNotification();
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("system");
  const [target, setTarget] = useState("all"); // "all", "all_role", or specific user_id
  const [recipients, setRecipients] = useState([]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await getSystemNotifications();
      const sortedData = (Array.isArray(data) ? data : []).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setNotifications(sortedData);
    } catch (e) {
      console.error("Load notifications error:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadRecipients = async () => {
    try {
      if (user?.role === "admin") {
        const res = await getUsers(1, 1000);
        const allUsers = res.data || res;
        const adminHos = Array.isArray(allUsers) ? allUsers.filter(u => u.role === "admin_hospital") : [];
        setRecipients(adminHos);
      } else if (user?.role === "admin_hospital" && user?.hospital_id) {
        const res = await getDoctors(user.hospital_id, 1, 1000);
        const doctors = res.data || res;
        setRecipients(Array.isArray(doctors) ? doctors : []);
      }
    } catch (e) {
      console.error("Load recipients error:", e);
    }
  };

  useEffect(() => {
    void loadNotifications();
    if (user) {
      void loadRecipients();
    }
  }, [user]);

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      showError("Vui lòng nhập đầy đủ tiêu đề và nội dung!");
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (editingId) {
        await updateSystemNotification(editingId, { title, body, type });
        showSuccess("Cập nhật thông báo thành công!");
        setEditingId(null);
      } else {
        if (target === "all") {
          // System broadcast to everyone
          await createNotification({ title, body, type });
        } else if (target === "all_role") {
          // Send to all in recipients list individually
          if (recipients.length === 0) {
            showError("Không có người nhận nào trong danh sách.");
            return;
          }
          await Promise.all(recipients.map(recipient => 
            createNotification({ title, body, type, user_id: recipient.id || recipient.user_id })
          ));
        } else {
          // Send to specific user
          await createNotification({ title, body, type, user_id: Number(target) });
        }
        showSuccess("Gửi thông báo thành công!");
      }
      
      setTitle("");
      setBody("");
      setType("system");
      setTarget("all");
      loadNotifications();
    } catch (err) {
      showError(err.message || "Đã xảy ra lỗi khi xử lý thông báo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (notif) => {
    setEditingId(notif.id);
    setTitle(notif.title);
    setBody(notif.body);
    setType(notif.type || "system");
    setTarget("all"); // editing is only for system notifications
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setBody("");
    setType("system");
    setTarget("all");
  };

  const handleDelete = async (id) => {
    const isConfirm = await confirm(
      "Xác nhận xóa",
      "Bạn có chắc muốn xóa thông báo này khỏi hệ thống không?",
      { variant: "danger", confirmText: "Xóa" }
    );
    if (!isConfirm) return;

    try {
      await deleteSystemNotification(id);
      showSuccess("Đã xóa thông báo");
      loadNotifications();
    } catch (e) {
      showError("Lỗi: " + e.message);
    }
  };

  return (
    <div className={`grid gap-8 ${isAdmin ? "grid-cols-[1fr_2fr] max-xl:grid-cols-1" : "grid-cols-1"}`}>
      {/* Cột trái: Form gửi thông báo mới */}
      {isAdmin && (
        <div className="flex flex-col gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? "Sửa thông báo" : "Gửi thông báo mới"}
              </h2>
              <p className="text-sm text-slate-500">
                {editingId ? "Cập nhật Broadcast hệ thống" : "Gửi Broadcast cho toàn hệ thống"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSendNotification} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Loại thông báo
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-slate-50"
              >
                <option value="system">Thông báo hệ thống (System)</option>
                <option value="promotion">Khuyến mãi (Promotion)</option>
                <option value="alert">Cảnh báo khẩn cấp (Alert)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Đối tượng nhận thông báo
              </label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                disabled={editingId !== null} // cannot change target when editing system broadcast
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
              >
                <option value="all">Tất cả người dùng (Global Broadcast)</option>
                <option value="all_role">
                  {user?.role === "admin" ? "Tất cả Admin Bệnh viện" : "Tất cả Bác sĩ"}
                </option>
                {recipients.map(r => (
                  <option key={r.id || r.user_id} value={r.id || r.user_id}>
                    {r.full_name || r.user?.full_name} ({r.email || r.user?.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tiêu đề
              </label>
              <input
                type="text"
                placeholder="VD: Cập nhật tính năng mới..."
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nội dung chi tiết
              </label>
              <textarea
                placeholder="Nhập nội dung thông báo muốn gửi đến mọi người..."
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 min-h-[120px] resize-y"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            <div className="flex gap-2 mt-2">
              {editingId && (
                <Button 
                  type="button" 
                  variant="outline"
                  className="flex-1 justify-center"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
              )}
              <Button 
                type="submit"
                className="flex-1 justify-center" 
                icon={editingId ? null : Send}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Đang xử lý..." : editingId ? "Cập nhật" : "Gửi thông báo"}
              </Button>
            </div>
          </form>
        </div>
      </div>
      )}

      {/* Cột phải: Lịch sử Broadcast */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Lịch sử Broadcast</h2>
            <p className="text-sm text-slate-500">Các thông báo đã gửi cho tất cả người dùng</p>
            <p className="text-sm font-medium text-emerald-600 mt-1">
              Tổng số: {notifications.length} thông báo
            </p>
          </div>
          <div className="p-2 bg-slate-50 text-slate-400 rounded-lg">
            <Bell className="w-5 h-5" />
          </div>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto bg-slate-50/50">
          {loading ? (
            <div className="text-center py-10 text-slate-500">Đang tải lịch sử...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-10 text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
              Chưa có thông báo hệ thống nào được gửi đi.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {notifications.map((notif, index) => (
                <div key={notif.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4">
                  <div className="mt-1">
                    <div className={`p-2 rounded-full ${
                      notif.type === 'alert' ? 'bg-red-50 text-red-500' :
                      notif.type === 'promotion' ? 'bg-amber-50 text-amber-500' :
                      'bg-blue-50 text-blue-500'
                    }`}>
                      <Megaphone className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                        <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-xs">#{index + 1}</span>
                        {notif.title}
                      </h4>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {notif.created_at ? formatDate(notif.created_at) : "N/A"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {notif.body}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        notif.type === 'alert' ? 'bg-red-100 text-red-700' :
                        notif.type === 'promotion' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {notif.type === 'alert' ? 'Cảnh báo khẩn cấp' :
                         notif.type === 'promotion' ? 'Khuyến mãi' : 'Hệ thống'}
                      </span>
                      <div className="flex-1"></div>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleEdit(notif)}
                            className="text-slate-400 hover:text-blue-500 p-1 rounded transition-colors"
                            title="Sửa"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(notif.id)}
                            className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

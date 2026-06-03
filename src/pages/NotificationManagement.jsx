import { Bell, Megaphone, Send } from "lucide-react";
import Button from "../components/Button";
import { formatDate } from "../utils/helpers";
import React, { useEffect, useState } from "react";
import { getSystemNotifications, createNotification } from "../services/admin.notifications.api";

export default function NotificationManagement() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("system");

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await getSystemNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Load notifications error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      alert("Vui lòng nhập đầy đủ tiêu đề và nội dung!");
      return;
    }

    try {
      setIsSubmitting(true);
      await createNotification({
        title,
        body,
        type,
        // no user_id => system broadcast
      });
      alert("Gửi thông báo thành công!");
      setTitle("");
      setBody("");
      setType("system");
      loadNotifications();
    } catch (err) {
      alert(err.message || "Đã xảy ra lỗi khi gửi thông báo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-[1fr_2fr] gap-8 max-xl:grid-cols-1">
      {/* Cột trái: Form gửi thông báo mới */}
      <div className="flex flex-col gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Gửi thông báo mới</h2>
              <p className="text-sm text-slate-500">Gửi Broadcast cho toàn hệ thống</p>
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

            <Button 
              type="submit"
              className="w-full justify-center mt-2" 
              icon={Send}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang gửi..." : "Gửi thông báo"}
            </Button>
          </form>
        </div>
      </div>

      {/* Cột phải: Lịch sử Broadcast */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Lịch sử Broadcast</h2>
            <p className="text-sm text-slate-500">Các thông báo đã gửi cho tất cả người dùng</p>
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
              {notifications.map((notif) => (
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
                      <h4 className="font-semibold text-slate-900">{notif.title}</h4>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {notif.created_at ? formatDate(notif.created_at) : "N/A"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {notif.body}
                    </p>
                    <div className="mt-2 text-xs font-medium text-slate-400 uppercase">
                      Type: {notif.type || 'system'}
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

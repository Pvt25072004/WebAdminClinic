import React, { useState, useEffect } from "react";
import { offlineQueue } from "../services/offlineQueue";
import { Clock, CheckCircle, AlertCircle, Trash2 } from "lucide-react";

export default function OfflineQueueIndicator() {
  const [queue, setQueue] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Initial state
    setQueue(offlineQueue.getAll());

    // Subscribe to changes
    const unsubscribe = offlineQueue.subscribe(setQueue);
    return unsubscribe;
  }, []);

  const pendingCount = queue.filter((item) => item.status === "pending").length;
  const failedCount = queue.filter((item) => item.status === "failed").length;

  if (queue.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-6 z-40">
      {/* Main indicator */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-amber-50 border border-amber-300 rounded-lg shadow-lg p-3 cursor-pointer hover:bg-amber-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600 animate-spin" />
          <span className="text-sm font-medium text-amber-800">
            {queue.length} thao tác offline
          </span>
          {failedCount > 0 && <AlertCircle className="w-4 h-4 text-red-600" />}
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="absolute bottom-full right-0 mb-2 w-80 bg-white border border-amber-200 rounded-lg shadow-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-amber-900">Hàng chờ offline</h3>
            <button
              onClick={() => offlineQueue.clear()}
              className="p-1 hover:bg-red-100 rounded transition-colors"
              title="Xóa hàng chờ"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {queue.map((item) => (
              <div
                key={item.id}
                className={`p-2 rounded border text-xs ${
                  item.status === "pending"
                    ? "bg-amber-50 border-amber-200"
                    : item.status === "processing"
                      ? "bg-blue-50 border-blue-200"
                      : item.status === "success"
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {item.status === "pending" && (
                    <Clock className="w-3 h-3 text-amber-600" />
                  )}
                  {item.status === "processing" && (
                    <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  )}
                  {item.status === "success" && (
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                  )}
                  {item.status === "failed" && (
                    <AlertCircle className="w-3 h-3 text-red-600" />
                  )}
                  <span className="font-mono font-semibold">
                    {item.method} {item.url.split("/").pop()}
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  {new Date(item.timestamp).toLocaleTimeString("vi-VN")}
                </p>
                {item.error && (
                  <p className="text-xs text-red-600 mt-1">Lỗi: {item.error}</p>
                )}
                {item.retries > 0 && (
                  <p className="text-xs text-amber-600">
                    Retry: {item.retries}/3
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-amber-200 flex gap-2 text-xs">
            <div className="flex-1">
              <span className="text-amber-600">⏳ Chờ: {pendingCount}</span>
            </div>
            {failedCount > 0 && (
              <div className="flex-1">
                <span className="text-red-600">❌ Lỗi: {failedCount}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

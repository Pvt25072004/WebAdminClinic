import React, { useState, useEffect } from "react";
import { networkStatus } from "../services/networkStatus";
import { Wifi, WifiOff } from "lucide-react";

export default function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Initial status
    setIsOnline(networkStatus.getStatus());

    // Subscribe to network changes
    const unsubscribe = networkStatus.subscribe((online) => {
      setIsOnline(online);
      setIsVisible(true);

      // Auto-hide success message after 3 seconds
      if (online) {
        const timer = setTimeout(() => setIsVisible(false), 3000);
        return () => clearTimeout(timer);
      }
    });

    return unsubscribe;
  }, []);

  if (!isVisible && isOnline) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 transition-all duration-300 ${
        isOnline
          ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
          : "bg-red-50 border border-red-200 text-red-700 animate-pulse"
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">Kết nối mạng bình thường</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">Mất kết nối mạng</span>
          <span className="text-xs opacity-75 ml-1">
            (Dữ liệu sẽ được cập nhật khi có kết nối)
          </span>
        </>
      )}
    </div>
  );
}

// Network Status Manager - Theo dõi trạng thái kết nối mạng
class NetworkStatusManager {
  constructor() {
    this.isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
    this.listeners = [];
    this.initListeners();
  }

  initListeners() {
    if (typeof window === "undefined") return;

    window.addEventListener("online", () => {
      this.isOnline = true;
      this.notifyListeners(true);
      console.log("✅ Network restored");
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.notifyListeners(false);
      console.log("❌ Network disconnected");
    });
  }

  subscribe(callback) {
    this.listeners.push(callback);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  notifyListeners(isOnline) {
    this.listeners.forEach((callback) => callback(isOnline));
  }

  getStatus() {
    return this.isOnline;
  }
}

export const networkStatus = new NetworkStatusManager();

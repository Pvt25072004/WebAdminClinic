// Offline Request Queue - Lưu trữ requests khi offline để sync sau
import { networkStatus } from "./networkStatus";
import { cacheService } from "./cacheService";

const QUEUE_KEY = "offline_request_queue";
const MAX_QUEUE_SIZE = 50;

export class OfflineRequestQueue {
  constructor() {
    this.queue = this.loadQueue();
    this.listeners = [];
    this.processing = false;
  }

  // Load queue từ localStorage
  loadQueue() {
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading queue:", error);
      return [];
    }
  }

  // Lưu queue vào localStorage
  saveQueue() {
    try {
      // Keep only last 50 requests
      const queue = this.queue.slice(-MAX_QUEUE_SIZE);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      this.notifyListeners();
    } catch (error) {
      console.error("Error saving queue:", error);
    }
  }

  // Thêm request vào queue
  add(request) {
    if (!request.method || !request.url) {
      console.error("Invalid request:", request);
      return false;
    }

    const item = {
      id: `${Date.now()}_${Math.random()}`,
      url: request.url,
      method: request.method,
      headers: request.headers || {},
      body: request.body,
      timestamp: Date.now(),
      retries: 0,
      status: "pending", // pending, processing, failed, success
      error: null,
    };

    this.queue.push(item);
    this.saveQueue();

    // Try to process if back online
    if (networkStatus.getStatus()) {
      this.processQueue();
    }

    return item;
  }

  // Xóa request khỏi queue
  remove(id) {
    this.queue = this.queue.filter((item) => item.id !== id);
    this.saveQueue();
  }

  // Xóa tất cả queue
  clear() {
    this.queue = [];
    localStorage.removeItem(QUEUE_KEY);
    this.notifyListeners();
  }

  // Lấy size của queue
  getSize() {
    return this.queue.length;
  }

  // Lấy toàn bộ queue
  getAll() {
    return [...this.queue];
  }

  // Xử lý queue - gửi tất cả offline requests
  async processQueue() {
    if (this.processing || !networkStatus.getStatus()) {
      return;
    }

    this.processing = true;
    const pendingRequests = this.queue.filter(
      (item) => item.status === "pending",
    );

    for (const request of pendingRequests) {
      try {
        request.status = "processing";
        this.saveQueue();

        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body,
        });

        if (response.ok) {
          request.status = "success";
          // Clear related cache
          const cacheKey = this.getCacheKeyFromUrl(request.url);
          if (cacheKey) {
            cacheService.remove(cacheKey);
          }
        } else {
          if (response.status === 401 || response.status === 403) {
            request.status = "failed";
            request.error = `Auth error: ${response.status}`;
          } else {
            request.retries++;
            if (request.retries < 3) {
              request.status = "pending";
            } else {
              request.status = "failed";
              request.error = "Max retries exceeded";
            }
          }
        }
      } catch (error) {
        request.retries++;
        if (request.retries < 3) {
          request.status = "pending";
        } else {
          request.status = "failed";
          request.error = error.message;
        }
      }

      this.saveQueue();
    }

    this.processing = false;
    this.notifyListeners();

    // Remove successful requests after a delay
    setTimeout(() => {
      this.queue = this.queue.filter((item) => item.status !== "success");
      this.saveQueue();
    }, 5000);
  }

  // Extract cache key từ URL
  getCacheKeyFromUrl(url) {
    if (url.includes("/appointments")) return "appointments_list";
    if (url.includes("/payments")) return "payments_list";
    if (url.includes("/users")) return "users_list";
    if (url.includes("/doctors")) return "doctors_list";
    if (url.includes("/hospitals")) return "hospitals_list";
    return null;
  }

  // Subscribe to queue changes
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(
        (listener) => listener !== callback,
      );
    };
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach((callback) => callback(this.queue));
  }
}

export const offlineQueue = new OfflineRequestQueue();

// Auto-process queue when back online
networkStatus.subscribe((isOnline) => {
  if (isOnline && offlineQueue.getSize() > 0) {
    console.log("🌐 Back online! Processing offline queue...");
    offlineQueue.processQueue();
  }
});

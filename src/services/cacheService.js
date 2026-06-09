// Cache Service - Lưu dữ liệu offline
const CACHE_PREFIX = "admin_cache_";
const CACHE_EXPIRY_PREFIX = "admin_cache_expiry_";
const DEFAULT_EXPIRY_MINUTES = 30;

export const cacheService = {
  // Lưu dữ liệu vào cache
  set: (key, data, expiryMinutes = DEFAULT_EXPIRY_MINUTES) => {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      const expiryKey = `${CACHE_EXPIRY_PREFIX}${key}`;
      const expiryTime = Date.now() + expiryMinutes * 60 * 1000;

      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(expiryKey, expiryTime.toString());
    } catch (error) {
      console.error("Cache set error:", error);
    }
  },

  // Lấy dữ liệu từ cache (nếu còn hiệu lực)
  get: (key) => {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      const expiryKey = `${CACHE_EXPIRY_PREFIX}${key}`;

      const expiryTime = localStorage.getItem(expiryKey);
      if (!expiryTime || Date.now() > parseInt(expiryTime)) {
        // Cache expired
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(expiryKey);
        return null;
      }

      const data = localStorage.getItem(cacheKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  },

  // Xóa cache
  remove: (key) => {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      const expiryKey = `${CACHE_EXPIRY_PREFIX}${key}`;
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(expiryKey);
    } catch (error) {
      console.error("Cache remove error:", error);
    }
  },

  // Xóa tất cả cache
  clear: () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (
          key.startsWith(CACHE_PREFIX) ||
          key.startsWith(CACHE_EXPIRY_PREFIX)
        ) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error("Cache clear error:", error);
    }
  },

  // Kiểm tra cache tồn tại và còn hiệu lực
  has: (key) => {
    return cacheService.get(key) !== null;
  },
};

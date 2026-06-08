# 📋 Error Handling & Offline Strategy

## Tổng quan

Chiến lược xử lý lỗi toàn diện cho web-admin, hỗ trợ cả 2 role: `admin` và `admin_hospital`.

---

## 🌐 1. NETWORK ERROR HANDLING (Xử lý Lỗi Mạng)

### Trường hợp 1: Mất kết nối internet

**Xử lý:**

- ✅ Hiển thị biểu tượng "Mất kết nối" ở góc phải dưới
- ✅ Cho phép xem dữ liệu được cache
- ✅ Disable nút submit/action buttons
- ✅ Lưu form data vào localStorage (draft)
- ✅ Tự động retry khi kết nối lại

**Code:**

```javascript
import { networkStatus } from "../services/networkStatus";
import { cacheService } from "../services/cacheService";

// Trong component
const [isOnline, setIsOnline] = useState(true);

useEffect(() => {
  const unsubscribe = networkStatus.subscribe(setIsOnline);
  return unsubscribe;
}, []);

// Disable button khi offline
<button disabled={!isOnline}>Lưu</button>;

// Sử dụng cache
const cachedData = cacheService.get("patients_list");
```

---

## ⏱️ 2. TIMEOUT HANDLING (Xử lý Timeout)

### Trường hợp 2: Kết nối quá lâu

**Xử lý:**

- ✅ Timeout mặc định: **15 giây**
- ✅ Retry tự động: **3 lần** (mỗi lần cách 1 giây)
- ✅ Hiển thị loading state
- ✅ Thông báo: "Kết nối quá lâu. Vui lòng thử lại."

**Code (sử dụng trong API services):**

```javascript
import { fetchWithRetry } from "../services/httpEnhanced";
import { cacheService } from "../services/cacheService";

export const getUsers = async (page = 1, limit = 10) => {
  try {
    const response = await fetchWithRetry(
      `${API_BASE_URL}/users?page=${page}&limit=${limit}`,
      {
        headers: getAuthHeaders(),
        credentials: "include",
      },
      "users_list", // Cache key
      30, // Cache duration in minutes
    );
    return response;
  } catch (error) {
    // Error đã được xử lý, throw tiếp
    throw error;
  }
};
```

---

## 💾 3. DATA VALIDATION & CACHING

### Trường hợp 3: Lỗi dữ liệu

**Xử lý:**

- ✅ Validate data trước khi render
- ✅ Cache dữ liệu thành công
- ✅ Fallback sang cached data nếu error
- ✅ Default values cho missing fields

**Code:**

```javascript
// Validate data
const validateUser = (user) => {
  return {
    id: user?.id || null,
    full_name: user?.full_name || "N/A",
    email: user?.email || "N/A",
    phone: user?.phone || "",
    is_active: user?.is_active ?? true,
  };
};

// Sử dụng cache
const cachedUsers = cacheService.get("users_list");
if (cachedUsers) {
  setUsers(cachedUsers.map(validateUser));
}
```

---

## 🔐 4. AUTHORIZATION & AUTHENTICATION ERRORS

### Trường hợp 4: Hết phiên đăng nhập (401) hoặc Không có quyền (403)

**Xử lý:**

- ✅ Auto logout & redirect `/` (login page)
- ✅ Xóa token khỏi storage
- ✅ Thông báo: "Phiên đăng nhập hết hạn"
- ✅ Không retry - ngay lập tức xử lý

**Code:**

```javascript
// Xử lý trong httpEnhanced.js
if (response.status === 401) {
  window.localStorage.removeItem("token");
  window.sessionStorage.removeItem("token");
  window.location.href = "/";
  throw new AppError(ErrorTypes.UNAUTHORIZED_ERROR, "...");
}
```

---

## 🔄 5. RETRY STRATEGY

### Trường hợp 5: Lỗi tạm thời (Server hiện tại busy)

**Xử lý:**

- ✅ **Không retry:** 401, 403, 404, 400 (validation errors)
- ✅ **Retry 3 lần:** Network errors, timeouts, 500+
- ✅ Backoff: 1 giây × số lần retry
- ✅ Log retry attempts: "🔄 Retry attempt 1/3"

**Retry flow:**

```
Request → [Fail] → Wait 1s → Retry 1 → [Fail] → Wait 1s →
Retry 2 → [Fail] → Wait 1s → Retry 3 → [Fail] → Throw Error
```

---

## 🎯 6. ERROR MESSAGES BY ROLE

### Admin (System Admin)

| Error Type    | Message                     | Action          |
| ------------- | --------------------------- | --------------- |
| Network Error | "Mất kết nối mạng"          | Cache fallback  |
| Timeout       | "Kết nối quá lâu. Thử lại?" | Retry button    |
| Server Error  | "Lỗi máy chủ (500)"         | Contact support |
| Unauthorized  | "Hết phiên. Đăng nhập lại?" | Redirect login  |

### Admin Hospital (Hospital Admin)

| Error Type    | Message                                         | Action                  |
| ------------- | ----------------------------------------------- | ----------------------- |
| Network Error | "Mất kết nối mạng"                              | Cache fallback          |
| Forbidden     | "Bạn không có quyền xem dữ liệu bệnh viện khác" | Show toast              |
| Timeout       | "Kết nối quá lâu"                               | Retry + form save draft |
| Validation    | "Dữ liệu không hợp lệ"                          | Highlight fields        |

---

## 📱 7. USER INTERFACE FEEDBACK

### Loading States

```jsx
<div className="flex items-center justify-center">
  <div className="animate-spin h-6 w-6 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
  <span className="ml-2">Đang tải...</span>
</div>
```

### Error States

```jsx
<div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
  <h3 className="font-semibold">Lỗi</h3>
  <p>{error.getUserMessage()}</p>
  <button onClick={retry}>Thử lại</button>
</div>
```

### Offline States

```jsx
<div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
  <p>🌐 Hiện đang offline. Dữ liệu sẽ cập nhật khi có kết nối.</p>
  <p className="text-sm text-amber-600">
    Dữ liệu hiển thị là từ cache (cập nhật lúc: {lastUpdate})
  </p>
</div>
```

---

## 🛠️ 8. IMPLEMENTATION CHECKLIST

### Trong App.jsx

- [ ] Import NetworkStatusIndicator
- [ ] Thêm vào App root

```jsx
import NetworkStatusIndicator from "./components/NetworkStatusIndicator";

export default function App() {
  return (
    <div>
      <NetworkStatusIndicator />
      {/* Rest of app */}
    </div>
  );
}
```

### Trong mỗi API Service

- [ ] Sử dụng `fetchWithRetry` thay vì `fetch`
- [ ] Thêm cache key & duration
- [ ] Xử lý AppError

```javascript
export const getPayments = async (filters) => {
  try {
    const response = await fetchWithRetry(
      `${API_BASE_URL}/payments?${new URLSearchParams(filters)}`,
      { headers: getAuthHeaders() },
      "payments_data", // Cache key
      15, // 15 minutes
    );
    return response;
  } catch (error) {
    console.error("Payments API error:", error);
    throw error;
  }
};
```

### Trong mỗi Page Component

- [ ] Xử lý loading state
- [ ] Xử lý error state
- [ ] Disable actions khi offline
- [ ] Save form draft to localStorage

```jsx
const [isOnline, setIsOnline] = useState(true);
const [error, setError] = useState(null);
const [loading, setLoading] = useState(false);

useEffect(() => {
  networkStatus.subscribe(setIsOnline);
}, []);

const handleSubmit = async (formData) => {
  if (!isOnline) {
    // Save as draft
    localStorage.setItem("form_draft", JSON.stringify(formData));
    showInfo("Lưu nháp. Sẽ gửi khi có kết nối.");
    return;
  }

  try {
    setLoading(true);
    await submitData(formData);
    showSuccess("Cập nhật thành công!");
  } catch (err) {
    setError(err);
    showError(err.getUserMessage());
  } finally {
    setLoading(false);
  }
};
```

---

## 🧪 9. TESTING ERROR SCENARIOS

### Chrome DevTools

1. **Simulate offline:** DevTools → Network tab → Throttling → Offline
2. **Simulate slow network:** DevTools → Network tab → Throttling → Slow 3G
3. **Simulate timeout:** DevTools → Network tab → Throttling → Custom (15s latency)

### Local Testing

```javascript
// Disable network temporarily
networkStatus.isOnline = false;
networkStatus.notifyListeners(false);

// Re-enable
networkStatus.isOnline = true;
networkStatus.notifyListeners(true);
```

---

## 📊 10. ERROR METRICS & LOGGING

### Log Errors to Backend

```javascript
// Giới hạn: Chỉ log critical errors
const logError = async (error) => {
  if (error.type === ErrorTypes.NETWORK_ERROR) return; // Skip

  try {
    await fetch(`${API_BASE_URL}/logs/errors`, {
      method: "POST",
      body: JSON.stringify({
        type: error.type,
        message: error.message,
        url: window.location.href,
        timestamp: error.timestamp,
        userAgent: navigator.userAgent,
      }),
    });
  } catch (e) {
    console.error("Failed to log error");
  }
};
```

---

## ✅ TÓNG TẮT CHIẾN LƯỢC

| Scenario       | Xử lý                                | Kết quả                      |
| -------------- | ------------------------------------ | ---------------------------- |
| Mất mạng       | Show offline banner + Cache fallback | User vẫn xem được dữ liệu cũ |
| Timeout        | Retry 3 lần + Show loading           | Tự động recover              |
| Server error   | Use cached data + Show error         | Graceful degradation         |
| Not authorized | Auto logout                          | Redirect login               |
| Bad data       | Validate + Use defaults              | Prevent crash                |

---

## 🚀 DEPLOYMENT NOTES

- Cache TTL (Time To Live): **30 phút** (adjustable per API)
- Retry timeout: **15 giây** (adjustable)
- Max retries: **3 lần** (adjustable)
- Offline indicator: **Always visible** khi offline
- Draft save: **Auto save** mỗi 30 giây

---

**Last Updated:** 2026-06-09  
**Version:** 1.0

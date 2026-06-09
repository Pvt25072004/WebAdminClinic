# 🚀 Quick Start: Offline & Error Handling

## TL;DR - Tóm tắt nhanh

Đã setup:

- ✅ Network monitoring (online/offline indicator)
- ✅ Auto-retry (3x) với 1s backoff
- ✅ Data caching (localStorage)
- ✅ Offline request queue (lưu mutations khi offline)
- ✅ Vietnamese error messages

Hiện tại chạy được:

- ✅ PatientManagement - view appointments từ cache
- ✅ PaymentManagement - view payments từ cache
- ❌ Mutations (POST/PATCH/DELETE) - chưa cập nhật API services

---

## 🧪 Test Ngay (Quick Test)

### 1. Simulate Offline

```
Chrome DevTools → Network → Throttling → Offline
```

### Expected Behavior

- ✅ Trang vẫn load (từ cache)
- ✅ Red "Mất kết nối mạng" banner ở bottom-right
- ✅ Yellow "N thao tác offline" indicator (empty nếu chưa có)
- ✅ Tables hiển thị cached data
- ✅ Action buttons disabled (không click được)

### 2. Go Back Online

```
Chrome DevTools → Network → Throttling → No throttling
```

### Expected Behavior

- ✅ Red banner disappear (sau 3s)
- ✅ Có thể request dữ liệu mới
- ✅ Các queue requests auto-sync (nếu có)

### 3. Slow Network (Timeout test)

```
Chrome DevTools → Network → Throttling → Slow 3G
```

### Expected Behavior

- ✅ Console log: "🔄 Retry attempt 1/3"
- ✅ Sau ~15s: either success hoặc error message
- ✅ Page không bị freeze

---

## 🔧 Thêm Offline Support vào API Service

### Pattern: Standard Implementation

```javascript
// src/services/admin.users.api.js
import { getAuthHeaders, handleResponse } from "./httpEnhanced";
import { API_BASE_URL } from "../utils/constants";

export const getAllUsers = async (page = 1, limit = 20) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/users?page=${page}&limit=${limit}`,
      {
        headers: getAuthHeaders(),
        credentials: "include",
      },
    );

    // handleResponse sẽ:
    // 1. Cache dữ liệu thành công
    // 2. Fallback sang cache nếu error
    // 3. 401 → auto-logout
    // 4. Throw AppError với Vietnamese message
    return await handleResponse(
      response,
      "Không thể lấy danh sách người dùng",
      "users_list", // Cache key
      30, // Cache duration (minutes)
    );
  } catch (error) {
    console.error("Get users error:", error);
    throw error;
  }
};
```

### Pattern: Mutation with Queue Support

```javascript
import { offlineQueue } from "./offlineQueue";
import { networkStatus } from "./networkStatus";

export const updateUser = async (userId, data) => {
  const url = `${API_BASE_URL}/users/${userId}`;
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };

  // Nếu offline - thêm vào queue
  if (!networkStatus.getStatus()) {
    offlineQueue.add({
      method: "PATCH",
      url,
      headers,
      body: JSON.stringify(data),
    });

    return {
      offline: true,
      message: "Thao tác sẽ được gửi khi có kết nối",
    };
  }

  // Nếu online - gửi ngay
  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify(data),
    });

    if (response.ok) {
      return await response.json();
    }

    // Nếu error (non-auth) - queue lại
    if (response.status !== 401 && response.status !== 403) {
      offlineQueue.add({
        method: "PATCH",
        url,
        headers,
        body: JSON.stringify(data),
      });
      return { offline: true, message: "Lỗi tạm thời, thử lại sau" };
    }

    throw new Error("Update failed");
  } catch (error) {
    // Network error - queue
    offlineQueue.add({
      method: "PATCH",
      url,
      headers,
      body: JSON.stringify(data),
    });
    throw error;
  }
};
```

---

## 📱 Sử dụng trong Component

### Read Operations (Fetching Data)

```jsx
import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "../services/admin.users.api";
import { useNotification } from "../contexts/NotificationContext";

export default function UserList() {
  const { showError } = useNotification();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: () => getAllUsers(1, 20),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Already handled in httpEnhanced
  });

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded border border-red-200">
        <p className="text-red-700">{error.message}</p>
        <button
          onClick={() => refetch()}
          className="mt-2 text-emerald-600 underline"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (isLoading) return <div className="text-center">Đang tải...</div>;

  return (
    <table>
      <tbody>
        {data?.data?.map((user) => (
          <tr key={user.id}>
            <td>{user.name}</td>
            <td>{user.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Write Operations (Mutations)

```jsx
import { useMutation } from "@tanstack/react-query";
import { updateUser } from "../services/admin.users.api";
import { useNotification } from "../contexts/NotificationContext";
import { networkStatus } from "../services/networkStatus";

export default function EditUser({ userId }) {
  const [formData, setFormData] = React.useState({});
  const [isOnline, setIsOnline] = React.useState(true);
  const { showSuccess, showError, showInfo } = useNotification();

  // Subscribe to network status
  React.useEffect(() => {
    const unsubscribe = networkStatus.subscribe(setIsOnline);
    return unsubscribe;
  }, []);

  const mutation = useMutation({
    mutationFn: (data) => updateUser(userId, data),
    onSuccess: (result) => {
      if (result.offline) {
        showInfo(result.message);
      } else {
        showSuccess("Cập nhật thành công!");
      }
    },
    onError: (error) => {
      showError(error.message || "Cập nhật thất bại");
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={formData.name || ""}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Tên"
      />

      <button
        type="submit"
        disabled={!isOnline || mutation.isPending}
        className={`px-4 py-2 rounded ${
          isOnline
            ? "bg-emerald-500 text-white hover:bg-emerald-600"
            : "bg-gray-300 text-gray-600 cursor-not-allowed"
        }`}
      >
        {mutation.isPending ? "Đang lưu..." : "Lưu"}
      </button>

      {!isOnline && (
        <p className="text-amber-600">Đang offline, sẽ lưu khi có kết nối</p>
      )}
    </form>
  );
}
```

---

## 🎯 Cache Configuration

### Default TTL (Time To Live) by Data Type

```javascript
// Recommended cache durations
const CACHE_DURATION = {
  appointments: 5, // Hay thay đổi
  payments: 15, // Trung bình
  users: 30, // Ít thay đổi
  doctors: 30,
  hospitals: 60, // Very static
  categories: 120, // Rarely changed
  schedules: 5, // Hay cập nhật
};
```

### Customize per API

```javascript
// Trong admin.*.api.js
return await handleResponse(
  response,
  "Error message",
  "cache_key",
  45, // 45 minutes instead of default 30
);
```

---

## 🐛 Debugging Tips

### Check Cache Contents

```javascript
// In Browser Console
localStorage.getItem("admin_cache_users_list");
// Shows cached data as JSON

// Clear all cache
Object.keys(localStorage).forEach((key) => {
  if (key.includes("admin_cache_")) localStorage.removeItem(key);
});
```

### Check Offline Queue

```javascript
// In Browser Console
import { offlineQueue } from "src/services/offlineQueue.js";
offlineQueue.getAll(); // Shows all queued requests

// Clear queue
offlineQueue.clear();
```

### Monitor Network Status

```javascript
// In Browser Console
import { networkStatus } from "src/services/networkStatus.js";
networkStatus.getStatus(); // true = online, false = offline

// Manually toggle (for testing)
networkStatus.isOnline = false;
networkStatus.notifyListeners(false);
```

### Monitor Retries

```
Chrome Console → Filter "🔄"
Shows all retry attempts
```

---

## ❌ Common Issues & Fixes

### Issue 1: Cache not working

**Symptom:** Offline mode shows no data
**Fix:**

- Check browser localStorage isn't full
- Verify cache key in `handleResponse()`
- Clear storage and retry

### Issue 2: Mutation stuck in queue

**Symptom:** Can't delete queued request from UI
**Fix:**

- Click "Clear Queue" button in OfflineQueueIndicator
- Or: `offlineQueue.clear()` in console

### Issue 3: 401 error not logging out

**Symptom:** Still seeing error instead of redirect
**Fix:**

- Check `httpEnhanced.js` - should have 401 check
- Verify token is stored in localStorage/sessionStorage
- Clear storage: `localStorage.clear()`

### Issue 4: Timeout after 15s always

**Symptom:** All requests timeout on slow network
**Fix:**

- This is expected on Slow 3G - normal behavior
- Change timeout in `httpEnhanced.js` line ~20: `const TIMEOUT_MS = 30000`
- Also increase `RETRY_DELAY_MS` if needed

---

## 📚 Architecture Diagram

```
User opens app
    ↓
App.jsx renders
    ├─ NetworkStatusIndicator (subscribes to online/offline)
    ├─ OfflineQueueIndicator (subscribes to mutation queue)
    └─ Router & Pages
        ↓
    Page calls API: getAllUsers()
        ↓
    admin.users.api.js → fetch()
        ↓
    httpEnhanced.js:handleResponse()
        ├─ ✅ Success → Cache data → Return
        ├─ ⏱️ Timeout/Error → Retry (3x) → Cache fallback → Return/Throw
        └─ 🔐 401 → Auto-logout → Redirect login

    Page calls API: updateUser()
        ├─ 🌐 Online → fetch() → Success
        ├─ ⏳ Offline → offlineQueue.add() → UI message
        └─ 🔌 Network error → offlineQueue.add() → Retry later
```

---

## 🚀 Deployment Checklist

- [ ] Test offline mode thoroughly
- [ ] Test slow network (3G) scenarios
- [ ] Verify all API services have caching
- [ ] Test mutations in offline queue
- [ ] Check Vietnamese error messages display
- [ ] Verify no console errors
- [ ] Test both admin & admin_hospital roles
- [ ] Monitor localStorage size
- [ ] Setup error logging to backend
- [ ] Update user documentation

---

**Last Updated:** 2026-06-09  
**For more info:** See ERROR_HANDLING_GUIDE.md

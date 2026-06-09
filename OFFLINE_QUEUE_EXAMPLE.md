// Example: Cách sử dụng Offline Queue cho mutations
// Thêm vào admin.\*.api.js files để hỗ trợ offline operations

import { getAuthHeaders } from "./httpEnhanced";
import { API_BASE_URL } from "../utils/constants";
import { offlineQueue } from "./offlineQueue";
import { networkStatus } from "./networkStatus";

// ❌ CÁCH CŨ (không xử lý offline)
/_
export const updateUser = async (userId, data) => {
const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
method: "PATCH",
headers: {
"Content-Type": "application/json",
...getAuthHeaders(),
},
body: JSON.stringify(data),
});
return response.json();
};
_/

// ✅ CÁCH MỚI (hỗ trợ offline + queue)
export const updateUserOfflineEnabled = async (userId, data) => {
const url = `${API_BASE_URL}/users/${userId}`;
const headers = {
"Content-Type": "application/json",
...getAuthHeaders(),
};

// Nếu offline, thêm vào queue
if (!networkStatus.getStatus()) {
offlineQueue.add({
method: "PATCH",
url,
headers,
body: JSON.stringify(data),
});

    // Show message to user
    return {
      success: false,
      queued: true,
      message: "Thao tác đã được lưu. Sẽ gửi khi có kết nối.",
    };

}

// Nếu online, thực hiện ngay
try {
const response = await fetch(url, {
method: "PATCH",
headers,
body: JSON.stringify(data),
});

    if (response.ok) {
      return await response.json();
    }

    // Nếu lỗi nhưng không phải auth error, thêm vào queue để retry sau
    if (response.status !== 401 && response.status !== 403) {
      offlineQueue.add({
        method: "PATCH",
        url,
        headers,
        body: JSON.stringify(data),
      });

      return {
        success: false,
        queued: true,
        message: "Lỗi tạm thời. Sẽ thử lại sau.",
      };
    }

    throw new Error(`Error ${response.status}`);

} catch (error) {
// Network error - queue for later
offlineQueue.add({
method: "PATCH",
url,
headers,
body: JSON.stringify(data),
});

    throw error;

}
};

// ✅ CÁCH KHÁC: Async function wrapper
export const withOfflineSupport = (asyncFn) => {
return async (...args) => {
if (!networkStatus.getStatus()) {
// In offline mode, function may return gracefully or throw
try {
return await asyncFn(...args);
} catch (error) {
return {
offline: true,
error: error.message,
};
}
}
return await asyncFn(...args);
};
};

// ✅ CÁCH TIÊU CHUẨN: Cho DELETE operations
export const deleteUserWithOfflineQueue = async (userId) => {
const url = `${API_BASE_URL}/users/${userId}`;
const headers = getAuthHeaders();

if (!networkStatus.getStatus()) {
offlineQueue.add({
method: "DELETE",
url,
headers,
});

    return {
      success: false,
      queued: true,
      message: "Xóa đã được lưu vào hàng chờ",
    };

}

try {
const response = await fetch(url, {
method: "DELETE",
headers,
});

    if (!response.ok) {
      throw new Error("Delete failed");
    }

    return { success: true };

} catch (error) {
offlineQueue.add({
method: "DELETE",
url,
headers,
});
throw error;
}
};

// ✅ TRONG COMPONENT: Xử lý response từ mutation
/\*
const handleUpdate = async () => {
try {
const result = await updateUserOfflineEnabled(userId, formData);

    if (result.queued) {
      showInfo(result.message); // "Sẽ gửi khi có kết nối"
    } else {
      showSuccess("Cập nhật thành công!");
      // Refetch data
      await refetchUsers();
    }

} catch (error) {
showError("Lỗi: " + error.message);
}
};
\*/

// ✅ MUTATION with tanstack-query + offline support
/\*
export const useUpdateUser = () => {
const queryClient = useQueryClient();
const { showSuccess, showInfo } = useNotification();

return useMutation({
mutationFn: (data) => updateUserOfflineEnabled(data.id, data),
onSuccess: (result) => {
if (result.queued) {
showInfo(result.message);
} else {
showSuccess("Cập nhật thành công!");
queryClient.invalidateQueries({ queryKey: ["users"] });
}
},
});
};
\*/

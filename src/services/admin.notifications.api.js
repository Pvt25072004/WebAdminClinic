import { getAuthHeaders, handleResponse } from "./http";
import { API_BASE_URL } from "../utils/constants";
const NOTIFICATIONS_ENDPOINT = `${API_BASE_URL}/notifications`;

export const getSystemNotifications = async () => {
  const response = await fetch(`${NOTIFICATIONS_ENDPOINT}/system`, {
    headers: { ...getAuthHeaders() },
    credentials: "include",
  });
  return handleResponse(response, "Không thể tải danh sách thông báo");
};

export const createNotification = async (payload) => {
  const response = await fetch(`${NOTIFICATIONS_ENDPOINT}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Không thể gửi thông báo");
  }
  return await response.json();
};

export const updateSystemNotification = async (id, payload) => {
  const response = await fetch(`${NOTIFICATIONS_ENDPOINT}/system/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Không thể cập nhật thông báo");
  }
  return await response.json();
};

export const deleteSystemNotification = async (id) => {
  const response = await fetch(`${NOTIFICATIONS_ENDPOINT}/system/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
    credentials: "include",
  });
  return handleResponse(response, "Không thể xóa thông báo");
};

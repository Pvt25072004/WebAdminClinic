import { getAuthHeaders, handleResponse } from "./http";
import { API_BASE_URL } from "../utils/constants";
const SCHEDULES_ENDPOINT = `${API_BASE_URL}/schedules`;

export const getAllSchedules = async () => {
  const response = await fetch(SCHEDULES_ENDPOINT, {
    headers: { ...getAuthHeaders() },
    credentials: "include",
  });
  return handleResponse(response, "Không thể tải danh sách lịch biểu");
};

export const createSchedule = async (payload) => {
  const response = await fetch(SCHEDULES_ENDPOINT, {
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
    throw new Error(errorData.message || "Không thể tạo lịch biểu");
  }
  return await response.json();
};

export const approveSchedule = async (id) => {
  const response = await fetch(`${SCHEDULES_ENDPOINT}/${id}/approve`, {
    method: "PATCH",
    headers: {
      ...getAuthHeaders(),
    },
    credentials: "include",
  });
  return handleResponse(response, "Không thể duyệt lịch biểu");
};

export const updateScheduleStatus = async (id, isAvailable) => {
  const response = await fetch(`${SCHEDULES_ENDPOINT}/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify({ is_available: isAvailable }),
  });
  return handleResponse(response, "Không thể cập nhật trạng thái lịch biểu");
};

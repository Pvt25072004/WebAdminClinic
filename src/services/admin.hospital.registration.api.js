import { getAuthHeaders } from "./http";
import { API_BASE_URL } from "../utils/constants";

const BASE_URL = `${API_BASE_URL}/hospital-registrations`;

const handleResponse = async (response, defaultErrorMessage) => {
  if (response.ok) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  let message = defaultErrorMessage;
  try {
    const errorBody = await response.json();
    if (errorBody?.message) {
      message =
        typeof errorBody.message === "string"
          ? errorBody.message
          : errorBody.message.join?.(", ");
    }
  } catch {
    // ignore parse error
  }
  throw new Error(message);
};

export const getHospitalRegistrations = async () => {
  const response = await fetch(BASE_URL, {
    headers: {
      ...getAuthHeaders(),
    },
    credentials: "include",
  });
  return handleResponse(response, "Lỗi tải danh sách đăng ký");
};

export const getHospitalRegistrationDetails = async (id) => {
  const response = await fetch(`${BASE_URL}/${id}`, {
    headers: {
      ...getAuthHeaders(),
    },
    credentials: "include",
  });
  return handleResponse(response, "Lỗi tải chi tiết");
};

export const updateHospitalRegistrationStatus = async (id, payload) => {
  const response = await fetch(`${BASE_URL}/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  return handleResponse(response, "Lỗi cập nhật trạng thái");
};

// Admin Doctors API
import { getAuthHeaders } from "./http";

import { API_BASE_URL } from "../utils/constants";
const DOCTORS_ENDPOINT = `${API_BASE_URL}/doctors`;

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
  } catch {}
  throw new Error(message);
};

export const getDoctors = async (hospitalId = null) => {
  const url = hospitalId ? `${DOCTORS_ENDPOINT}?hospitalId=${hospitalId}` : DOCTORS_ENDPOINT;
  const response = await fetch(url, {
    headers: {
      ...getAuthHeaders(),
    },
    credentials: "include",
  });
  return handleResponse(response, "Không thể tải danh sách bác sĩ");
};

export const createDoctor = async (payload) => {
  const response = await fetch(DOCTORS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  return handleResponse(response, "Không thể tạo bác sĩ");
};

export const toggleDoctorActive = async (id) => {
  const response = await fetch(`${DOCTORS_ENDPOINT}/${id}/toggle-active`, {
    method: "PATCH",
    headers: {
      ...getAuthHeaders(),
    },
    credentials: "include",
  });
  return handleResponse(response, "Không thể cập nhật trạng thái bác sĩ");
};

export const deleteDoctor = async (id) => {
  const response = await fetch(`${DOCTORS_ENDPOINT}/${id}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
    },
    credentials: "include",
  });
  return handleResponse(response, "Không thể xóa bác sĩ");
};

// --- API Xử lý Đơn ứng tuyển ---

export const getHospitalApplications = async (hospitalId) => {
  const response = await fetch(`${DOCTORS_ENDPOINT}/hospitals/${hospitalId}/applications`, {
    headers: {
      ...getAuthHeaders(),
    },
    credentials: "include",
  });
  return handleResponse(response, "Không thể tải danh sách yêu cầu");
};

export const updateApplicationStatus = async (id, status, rejection_reason = "") => {
  const response = await fetch(`${DOCTORS_ENDPOINT}/applications/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ status, rejection_reason }),
    credentials: "include",
  });
  return handleResponse(response, "Không thể cập nhật trạng thái yêu cầu");
};

export const unlinkDoctor = async (id, reason = "") => {
  const response = await fetch(`${DOCTORS_ENDPOINT}/${id}/unlink`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ reason }),
    credentials: "include",
  });
  return handleResponse(response, "Không thể hủy liên kết bác sĩ");
};

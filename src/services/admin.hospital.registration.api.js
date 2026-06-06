import { getAuthHeaders, handleResponse } from "./http";
import { API_BASE_URL } from "../utils/constants";

const BASE_URL = `${API_BASE_URL}/hospital-registrations`;

export const getHospitalRegistrations = async () => {
  const response = await fetch(BASE_URL, {
    headers: {
      ...getAuthHeaders(),
    },
    credentials: "include",
  });
  return handleResponse(response, "Lỗi tải danh sách đăng ký");
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

export const updateHospitalRegistrationDetails = async (id, payload) => {
  const response = await fetch(`${BASE_URL}/${id}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  return handleResponse(response, "Lỗi cập nhật hồ sơ");
};

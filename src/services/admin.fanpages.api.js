import { getAuthHeaders, handleResponse } from "./http";
import { API_BASE_URL } from "../utils/constants";

const FANPAGES_ENDPOINT = `${API_BASE_URL}/fanpages`;

export const getFanpages = async () => {
  const response = await fetch(FANPAGES_ENDPOINT, {
    headers: { ...getAuthHeaders() },
    credentials: "include",
  });
  return handleResponse(response, "Không thể tải danh sách fanpage");
};

export const getFanpagesByHospital = async (hospitalId) => {
  const response = await fetch(`${FANPAGES_ENDPOINT}/hospital/${hospitalId}`, {
    headers: { ...getAuthHeaders() },
    credentials: "include",
  });
  return handleResponse(response, "Không thể tải danh sách fanpage bệnh viện");
};

export const createFanpage = async (payload) => {
  const response = await fetch(FANPAGES_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  return handleResponse(response, "Không thể tạo fanpage");
};

export const updateFanpage = async (id, payload) => {
  const response = await fetch(`${FANPAGES_ENDPOINT}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  return handleResponse(response, "Không thể cập nhật fanpage");
};

export const deleteFanpage = async (id) => {
  const response = await fetch(`${FANPAGES_ENDPOINT}/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
    credentials: "include",
  });
  return handleResponse(response, "Không thể xóa fanpage");
};

export const uploadFanpageImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${FANPAGES_ENDPOINT}/upload`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
    body: formData,
    credentials: "include",
  });
  return handleResponse(response, "Tải ảnh lên thất bại");
};

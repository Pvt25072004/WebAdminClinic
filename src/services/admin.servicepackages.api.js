import { getAuthHeaders, handleResponse } from "./http";
import { API_BASE_URL } from "../utils/constants";
const SERVICE_PACKAGES_ENDPOINT = `${API_BASE_URL}/service-packages`;

export const getAllServicePackages = async () => {
  const response = await fetch(SERVICE_PACKAGES_ENDPOINT, {
    headers: {
      ...getAuthHeaders(),
    },
    credentials: "include",
  });
  if (response.ok) {
    try {
      const data = await response.json();
      return Array.isArray(data) ? data : (data.data || data.items || []);
    } catch {
      return [];
    }
  }
  return [];
};

export const createServicePackage = async (payload) => {
  const response = await fetch(SERVICE_PACKAGES_ENDPOINT, {
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
    throw new Error(errorData.message || "Không thể tạo gói dịch vụ");
  }
  
  return await response.json();
};

export const updateServicePackage = async (id, payload) => {
  const response = await fetch(`${SERVICE_PACKAGES_ENDPOINT}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Không thể cập nhật gói dịch vụ");
  }
  
  return await response.json();
};

export const deleteServicePackage = async (id) => {
  const response = await fetch(`${SERVICE_PACKAGES_ENDPOINT}/${id}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
    },
    credentials: "include",
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Không thể xóa gói dịch vụ");
  }
  
  return await response.json();
};
